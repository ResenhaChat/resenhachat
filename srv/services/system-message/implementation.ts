import { Request } from '@sap/cds';
import { MessageArgs } from '@/errors';
import { SYSTEM_MESSAGE_LOCALE } from '@/constants/conversations';
import { Messages } from '@/infrastructure/Messages';
import { SystemText } from '@/infrastructure/SystemText';
import { MessageModel } from '@/models/message';
import { ConversationRepository } from '@/repositories/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { MessageRepository } from '@/repositories/message';
import { UserRepository } from '@/repositories/user';
import { RealtimeHub } from '@/realtime/hub';
import { SystemEvent, SystemMessageService } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class SystemMessageServiceImplementation extends BaseServiceImplementation<MessageModel> implements SystemMessageService {

    constructor(
        private readonly Repository: MessageRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Users: UserRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async announce(Request: Request, ConversationId: string, Event: SystemEvent): Promise<void> {

        await this.announceMany(Request, ConversationId, [Event]);

    }


    public async announceMany(Request: Request, ConversationId: string, Events: SystemEvent[]): Promise<void> {

        if (!Events.length) {
            return;
        }

        const oNames = await this.namesOf(Events);
        const aMessages = Events.map((oEvent) => this.build(ConversationId, oEvent, oNames));
        const oLast = aMessages[aMessages.length - 1];

        await this.Repository.createMany(aMessages);

        const oSaved = await this.Repository.findById(oLast.Id) as MessageModel;
        const sCreatedAt = oSaved.CreatedAt as string;

        await this.Conversations.updateLastMessage(
            ConversationId,
            sCreatedAt,
            SystemText.preview(oSaved.Text ?? ''),
            oLast.SystemKey,
            oLast.SystemArgs
        );
        await this.markActorsRead(ConversationId, Events, sCreatedAt);

        const aUserIds = await this.Members.findUserIds(ConversationId);

        Request.on('succeeded', () => this.Hub.publish(aUserIds, {
            type: 'message.created',
            payload: { ConversationId, MessageId: oSaved.Id, SenderId: null }
        }));

    }


    private async namesOf(Events: SystemEvent[]): Promise<Map<string, string>> {

        const aUserIds = [...new Set(Events.flatMap((oEvent) => [oEvent.ActorId, oEvent.TargetId]))]
            .filter((sUserId): sUserId is string => !!sUserId);
        const aUsers = await this.Users.findByIds(aUserIds);

        return new Map<string, string>(aUsers.map((oUser): [string, string] => [oUser.Id, oUser.DisplayName]));

    }


    private build(ConversationId: string, Event: SystemEvent, Names: Map<string, string>): MessageModel {

        const oArgs: MessageArgs = {
            actor: Names.get(Event.ActorId) ?? '',
            target: Names.get(Event.TargetId ?? '') ?? '',
            name: Event.Name ?? ''
        };

        return MessageModel.with({
            Id: this.generateUUID(),
            ConversationId,
            Kind: 'System',
            Text: Messages.text(Event.Key, SYSTEM_MESSAGE_LOCALE, oArgs),
            SystemKey: Event.Key,
            SystemArgs: SystemText.serialize(oArgs),
            IsViewOnce: false
        });

    }


    private async markActorsRead(ConversationId: string, Events: SystemEvent[], ReadAt: string): Promise<void> {

        const aActorIds = [...new Set(Events.map((oEvent) => oEvent.ActorId))];

        for (const sActorId of aActorIds) {
            await this.Members.markRead(ConversationId, sActorId, ReadAt);
        }

    }

}
