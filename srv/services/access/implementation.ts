import { Either, left, right } from '@sweet-monads/either';
import { AbstractError, NotFoundError, PermissionDenied, ValidationError } from '@/errors';
import { UUID_PATTERN } from '@/constants/ids';
import { ConversationModel } from '@/models/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { UserRepository } from '@/repositories/user';
import { AccessService, ConversationAccess } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class AccessServiceImplementation extends BaseServiceImplementation<ConversationModel> implements AccessService {

    constructor(
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Users: UserRepository
    ) {

        super();

    }


    public async findConversation(ConversationId: string): Promise<Either<AbstractError, ConversationModel>> {

        if (!UUID_PATTERN.test(ConversationId)) {
            return left(new NotFoundError('error.conversationNotFound'));
        }

        const oConversation = await this.Conversations.findById(ConversationId);

        if (!oConversation) {
            return left(new NotFoundError('error.conversationNotFound'));
        }

        return right(oConversation);

    }


    public async requireMember(ConversationId: string, UserId: string): Promise<Either<AbstractError, ConversationAccess>> {

        const oConversation = await this.findConversation(ConversationId);

        if (oConversation.isLeft()) {
            return left(oConversation.value);
        }

        const oActor = await this.Members.findMembership(ConversationId, UserId);

        if (!oActor) {
            return left(new PermissionDenied('error.notConversationMember'));
        }

        return right({ Conversation: oConversation.value, Actor: oActor });

    }


    public async requireGroupMember(ConversationId: string, UserId: string): Promise<Either<AbstractError, ConversationAccess>> {

        const oAccess = await this.requireMember(ConversationId, UserId);

        if (oAccess.isLeft()) {
            return oAccess;
        }

        if (!oAccess.value.Conversation.IsGroupOrChannel) {
            return left(new ValidationError('error.onlyGroupsOrChannels'));
        }

        return oAccess;

    }


    public async existingUserIds(UserIds: string[]): Promise<string[]> {

        const aCandidates = [...new Set(UserIds)].filter((sUserId) => UUID_PATTERN.test(sUserId));

        return this.Users.findExistingIds(aCandidates);

    }

}
