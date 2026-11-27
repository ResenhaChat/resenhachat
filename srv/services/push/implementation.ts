import webpush from 'web-push';
import cds from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { PushSubscription } from '@models/apps/dflc/resenha/entities';
import { AbstractError, ValidationError } from '@/errors';
import { PUSH_DEFAULT_APP_URL, PUSH_DEFAULT_VAPID_SUBJECT, PUSH_LIMITS, PUSH_LOCALE, PUSH_SEND_OPTIONS, PUSH_UNUSABLE_STATUSES } from '@/constants/push';
import { Messages } from '@/infrastructure/Messages';
import { MessageModel } from '@/models/message';
import { PushSubscriptionModel } from '@/models/push-subscription';
import { RealtimeHub } from '@/realtime/hub';
import { ConversationRepository } from '@/repositories/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { PushSubscriptionRepository } from '@/repositories/push-subscription';
import { UserRepository } from '@/repositories/user';
import { PushService, PushSubscriptionInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

type PushPayload = {
    title: string;
    body: string;
    tag: string;
    url: string;
};

type NormalizedSubscription = {
    Endpoint: string;
    P256dh: string;
    Auth: string;
    UserAgent: string;
};

const DIRECT_KIND = 'Direct';
const TEXT_KIND = 'Text';
const SYSTEM_KIND = 'System';
const TEST_TAG = 'resenha-test';

export class PushServiceImplementation extends BaseServiceImplementation<PushSubscription> implements PushService {

    private vapidConfigured = false;

    constructor(
        private readonly Repository: PushSubscriptionRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Users: UserRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();
        this.configure();

    }


    private configure(): void {

        const sPublicKey = process.env.VAPID_PUBLIC_KEY;
        const sPrivateKey = process.env.VAPID_PRIVATE_KEY;

        if (!sPublicKey || !sPrivateKey) {
            return;
        }

        try {

            webpush.setVapidDetails(process.env.VAPID_SUBJECT || PUSH_DEFAULT_VAPID_SUBJECT, sPublicKey, sPrivateKey);
            this.vapidConfigured = true;

        } catch (oError) {

            cds.log('push').error('Chaves VAPID inválidas; Web Push desativado.', oError);

        }

    }


    public publicKey(): string | null {

        return this.vapidConfigured ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;

    }


    public async subscribe(UserId: string, Input: PushSubscriptionInput): Promise<Either<AbstractError, boolean>> {

        const oSubscription = this.normalize(Input);

        if (!this.isValid(oSubscription)) {
            return left(new ValidationError('error.pushSubscriptionInvalid'));
        }

        if (!this.vapidConfigured) {
            return left(new ValidationError('error.pushNotConfigured'));
        }

        return this.execute<boolean>(async () => {

            const oExisting = await this.Repository.findByEndpoint(oSubscription.Endpoint);

            await this.Repository.upsert(PushSubscriptionModel.with({
                Id: oExisting?.Id ?? this.generateUUID(),
                UserId,
                Endpoint: oSubscription.Endpoint,
                P256dh: oSubscription.P256dh,
                Auth: oSubscription.Auth,
                UserAgent: oSubscription.UserAgent || undefined
            }));

            return right(true);

        });

    }


    public async unsubscribe(UserId: string, Endpoint?: string | null): Promise<Either<AbstractError, boolean>> {

        const sEndpoint = this.trimmed(Endpoint);

        if (!sEndpoint) {
            return left(new ValidationError('error.pushSubscriptionInvalid'));
        }

        return this.execute<boolean>(async () => {

            await this.Repository.removeByEndpointOfUser(sEndpoint, UserId);

            return right(true);

        });

    }


    public async sendTest(UserId: string): Promise<Either<AbstractError, boolean>> {

        if (!this.vapidConfigured) {
            return left(new ValidationError('error.pushNotConfigured'));
        }

        return this.execute<boolean>(async () => {

            const aSubscriptions = await this.Repository.findByUserIds([UserId]);

            await this.deliver(aSubscriptions, {
                title: Messages.text('push.test.title', PUSH_LOCALE),
                body: Messages.text('push.test.body', PUSH_LOCALE),
                tag: TEST_TAG,
                url: this.appUrl()
            });

            return right(true);

        });

    }


    public async notifyNewMessage(Message: MessageModel): Promise<void> {

        if (!this.vapidConfigured || Message.Kind === SYSTEM_KIND) {
            return;
        }

        try {

            await cds.tx(() => this.deliverNewMessage(Message));

        } catch (oError) {

            cds.log('push').error('Falha ao enviar notificações de nova mensagem.', oError);

        }

    }


    private async deliverNewMessage(Message: MessageModel): Promise<void> {

        const aRecipientIds = await this.recipientIds(Message);
        const aSubscriptions = await this.Repository.findByUserIds(aRecipientIds);

        if (!aSubscriptions.length) {
            return;
        }

        await this.deliver(aSubscriptions, await this.newMessagePayload(Message));

    }


    /** Membros da conversa, exceto remetente, quem está online no hub, mutados e com notificações desligadas. */
    private async recipientIds(Message: MessageModel): Promise<string[]> {

        const sNow = new Date().toISOString();
        const aMemberIds = await this.Members.findUserIds(Message.ConversationId);
        const aMutedIds = await this.Members.findMutedUserIds(Message.ConversationId, sNow);
        const aCandidateIds = aMemberIds.filter((sUserId) => sUserId !== Message.SenderId
            && !aMutedIds.includes(sUserId)
            && !this.Hub.isOnline(sUserId));
        const aDisabledIds = await this.Users.findNotificationsDisabled(aCandidateIds);

        return aCandidateIds.filter((sUserId) => !aDisabledIds.includes(sUserId));

    }


    private async newMessagePayload(Message: MessageModel): Promise<PushPayload> {

        const oSender = await this.Users.findById(Message.SenderId as string);
        const oConversation = await this.Conversations.findById(Message.ConversationId);
        const sSenderName = oSender?.DisplayName ?? '';
        const bDirect = oConversation?.Kind === DIRECT_KIND || !oConversation?.Name;

        return {
            title: bDirect ? sSenderName : `${sSenderName} · ${oConversation?.Name}`,
            body: this.messageBody(Message),
            tag: Message.ConversationId,
            url: `${this.appUrl()}#/c/${Message.ConversationId}`
        };

    }


    private messageBody(Message: MessageModel): string {

        if (Message.IsViewOnce) {
            return Messages.text('push.viewOnce', PUSH_LOCALE);
        }

        if (Message.Kind !== TEXT_KIND) {
            return Messages.text('push.media', PUSH_LOCALE);
        }

        return (Message.Text ?? '').slice(0, PUSH_LIMITS.bodyText);

    }


    private async deliver(Subscriptions: PushSubscriptionModel[], Payload: PushPayload): Promise<void> {

        const sBody = JSON.stringify(Payload);
        const aResults = await Promise.allSettled(Subscriptions.map((oSubscription) => this.sendOne(oSubscription, sBody)));
        const aSentIds = aResults.flatMap((oResult) => (oResult.status === 'fulfilled' && oResult.value ? [oResult.value] : []));

        await this.Repository.touchLastUsed(aSentIds, new Date().toISOString());

    }


    private async sendOne(Subscription: PushSubscriptionModel, Body: string): Promise<string | null> {

        try {

            await webpush.sendNotification(Subscription.toWebPushSubscription(), Body, PUSH_SEND_OPTIONS);

            return Subscription.Id;

        } catch (oError: unknown) {

            await this.handleSendError(Subscription, oError);

            return null;

        }

    }


    private async handleSendError(Subscription: PushSubscriptionModel, oError: unknown): Promise<void> {

        const iStatus = (oError as { statusCode?: number })?.statusCode;

        if (iStatus !== undefined && PUSH_UNUSABLE_STATUSES.includes(iStatus)) {

            await this.Repository.removeByEndpoint(Subscription.Endpoint);

            return;

        }

        cds.log('push').warn(`Falha ao enviar push (${iStatus ?? 'sem status'}).`, oError);

    }


    private appUrl(): string {

        return process.env.APP_URL || PUSH_DEFAULT_APP_URL;

    }


    private normalize(Input: PushSubscriptionInput): NormalizedSubscription {

        return {
            Endpoint: this.trimmed(Input?.Endpoint),
            P256dh: this.trimmed(Input?.P256dh),
            Auth: this.trimmed(Input?.Auth),
            UserAgent: this.trimmed(Input?.UserAgent)
        };

    }


    private isValid(Subscription: NormalizedSubscription): boolean {

        return this.fits(Subscription.Endpoint, PUSH_LIMITS.endpoint)
            && this.isHttpsUrl(Subscription.Endpoint)
            && this.fits(Subscription.P256dh, PUSH_LIMITS.p256dh)
            && this.fits(Subscription.Auth, PUSH_LIMITS.auth)
            && Subscription.UserAgent.length <= PUSH_LIMITS.userAgent;

    }


    private fits(Value: string, Max: number): boolean {

        return Value.length > 0 && Value.length <= Max;

    }


    private isHttpsUrl(Value: string): boolean {

        try {

            return new URL(Value).protocol === 'https:';

        } catch {

            return false;

        }

    }


    private trimmed(Value: unknown): string {

        return typeof Value === 'string' ? Value.trim() : '';

    }

}
