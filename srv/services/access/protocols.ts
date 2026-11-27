import { Either } from '@sweet-monads/either';
import { AbstractError } from '@/errors';
import { ConversationModel } from '@/models/conversation';
import { ConversationMemberModel } from '@/models/conversation-member';
import { BaseService } from '../base';

export type ConversationAccess = {
    Conversation: ConversationModel;
    Actor: ConversationMemberModel;
};

export interface AccessService extends BaseService<ConversationModel> {
    findConversation(ConversationId: string): Promise<Either<AbstractError, ConversationModel>>;
    requireMember(ConversationId: string, UserId: string): Promise<Either<AbstractError, ConversationAccess>>;
    requireGroupMember(ConversationId: string, UserId: string): Promise<Either<AbstractError, ConversationAccess>>;
    existingUserIds(UserIds: string[]): Promise<string[]>;
}
