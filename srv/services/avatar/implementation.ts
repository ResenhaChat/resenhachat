import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { AbstractError, NotFoundError, PermissionDenied, ValidationError } from '@/errors';
import { AVATAR_MIME_TYPES, MEDIA_LIMITS } from '@/constants/media';
import { ImageProcessor } from '@/infrastructure/ImageProcessor';
import { RealtimeHub } from '@/realtime/hub';
import { ConversationAccess, AccessService } from '@/services/access';
import { SystemMessageKey, SystemMessageService } from '@/services/system-message';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { UserRepository } from '@/repositories/user';
import { MediaPayload, MediaPayloadRules } from '@/services/media/payload';
import { UserModel } from '@/models/user';
import { AvatarChange, AvatarService } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

const AVATAR_OUTPUT_MIME = 'image/webp';

const AVATAR_LIMIT = MediaPayloadRules.megabytes(MEDIA_LIMITS.avatarMaxBytes);

type PhotoEvent = {
    Key: SystemMessageKey;
    Change: AvatarChange;
};

export class AvatarServiceImplementation extends BaseServiceImplementation<UserModel> implements AvatarService {

    constructor(
        private readonly Users: UserRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Access: AccessService,
        private readonly SystemMessages: SystemMessageService,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async setUserAvatar(UserId: string, Payload: MediaPayload, Request: Request): Promise<Either<AbstractError, AvatarChange>> {

        return this.execute(async () => {

            const oImage = await this.readAvatar(Payload);

            if (oImage.isLeft()) {
                return left(oImage.value);
            }

            if (!await this.Users.findById(UserId)) {
                return left(new NotFoundError('error.userNotFound'));
            }

            await this.Users.bumpAvatarVersion(UserId);
            this.publishUserUpdated(Request, UserId);

            return right({ Avatar: oImage.value, AvatarMimeType: AVATAR_OUTPUT_MIME });

        });

    }


    public async clearUserAvatar(UserId: string, Request: Request): Promise<Either<AbstractError, AvatarChange>> {

        return this.execute(async () => {

            if (!await this.Users.findById(UserId)) {
                return left(new NotFoundError('error.userNotFound'));
            }

            await this.Users.bumpAvatarVersion(UserId);
            this.publishUserUpdated(Request, UserId);

            return right({ Avatar: null, AvatarMimeType: null });

        });

    }


    public async setConversationAvatar(UserId: string, ConversationId: string, Payload: MediaPayload, Request: Request): Promise<Either<AbstractError, AvatarChange>> {

        return this.execute(async () => {

            const oAccess = await this.requireManager(UserId, ConversationId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            const oImage = await this.readAvatar(Payload);

            if (oImage.isLeft()) {
                return left(oImage.value);
            }

            return this.applyConversation(oAccess.value, UserId, Request, { Key: 'system.photoChanged', Change: { Avatar: oImage.value, AvatarMimeType: AVATAR_OUTPUT_MIME } });

        });

    }


    public async clearConversationAvatar(UserId: string, ConversationId: string, Request: Request): Promise<Either<AbstractError, AvatarChange>> {

        return this.execute(async () => {

            const oAccess = await this.requireManager(UserId, ConversationId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            return this.applyConversation(oAccess.value, UserId, Request, { Key: 'system.photoRemoved', Change: { Avatar: null, AvatarMimeType: null } });

        });

    }


    private async requireManager(UserId: string, ConversationId: string): Promise<Either<AbstractError, ConversationAccess>> {

        const oAccess = await this.Access.requireMember(ConversationId, UserId);

        if (oAccess.isLeft()) {
            return oAccess;
        }

        const { Conversation, Actor } = oAccess.value;

        if (Conversation.IsDirect) {
            return left(new PermissionDenied('error.avatarNotAllowed'));
        }

        if (Conversation.IsGeneral) {
            return Actor.IsOwner ? oAccess : left(new PermissionDenied('error.avatarNotAllowed'));
        }

        return Actor.CanManage ? oAccess : left(new PermissionDenied('error.onlyAdminsCanManage'));

    }


    private async applyConversation(Access: ConversationAccess, UserId: string, Request: Request, Event: PhotoEvent): Promise<Either<AbstractError, AvatarChange>> {

        const sConversationId = Access.Conversation.Id;

        await this.SystemMessages.announce(Request, sConversationId, { Key: Event.Key, ActorId: UserId });
        await this.Conversations.bumpAvatarVersion(sConversationId);

        const aUserIds = await this.Members.findUserIds(sConversationId);

        Request.on('succeeded', () => this.Hub.publish(aUserIds, {
            type: 'conversation.updated',
            payload: { ConversationId: sConversationId }
        }));

        return right(Event.Change);

    }


    private async readAvatar(Payload: MediaPayload): Promise<Either<AbstractError, Buffer>> {

        if (!AVATAR_MIME_TYPES.includes(Payload.ContentType)) {
            return left(new ValidationError('error.avatarMimeType'));
        }

        const oLength = MediaPayloadRules.checkLength(Payload, AVATAR_LIMIT);

        if (oLength.isLeft()) {
            return left(oLength.value);
        }

        const oRead = await MediaPayloadRules.read(Payload, AVATAR_LIMIT);

        if (oRead.isLeft()) {
            return left(oRead.value);
        }

        const oAvatar = await ImageProcessor.avatar(oRead.value, Payload.ContentType);

        return oAvatar ? right(oAvatar) : left(new ValidationError('error.invalidImage'));

    }


    private publishUserUpdated(Request: Request, UserId: string): void {

        Request.on('succeeded', () => this.Hub.publish(this.Hub.onlineUserIds(), {
            type: 'user.updated',
            payload: { UserId }
        }));

    }

}
