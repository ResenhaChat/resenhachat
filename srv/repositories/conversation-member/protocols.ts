import { ConversationMemberModel } from '@/models/conversation-member';
import { BaseRepository } from '../base';

export interface ConversationMemberRepository extends BaseRepository<ConversationMemberModel> {
    findMembership(ConversationId: string, UserId: string): Promise<ConversationMemberModel | null>;
    findUserIds(ConversationId: string): Promise<string[]>;
    findMutedUserIds(ConversationId: string, Now: string): Promise<string[]>;
    create(Member: ConversationMemberModel): Promise<void>;
    markRead(ConversationId: string, UserId: string, ReadAt: string): Promise<void>;
}
