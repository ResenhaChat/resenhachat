import { ConversationMemberModel } from '@/models/conversation-member';
import { BaseRepository } from '../base';

export interface ConversationMemberRepository extends BaseRepository<ConversationMemberModel> {
    findMembership(ConversationId: string, UserId: string): Promise<ConversationMemberModel | null>;
    findByConversationIds(ConversationIds: string[]): Promise<ConversationMemberModel[]>;
    countByConversationIds(ConversationIds: string[]): Promise<Map<string, number>>;
    findRoles(UserId: string, ConversationIds: string[]): Promise<Map<string, string>>;
    findDirectPeers(UserId: string, ConversationIds: string[]): Promise<Map<string, string>>;
    findUserIds(ConversationId: string): Promise<string[]>;
    findMutedUserIds(ConversationId: string, Now: string): Promise<string[]>;
    create(Member: ConversationMemberModel): Promise<void>;
    createMany(Members: ConversationMemberModel[]): Promise<void>;
    addMissing(Members: ConversationMemberModel[]): Promise<ConversationMemberModel[]>;
    remove(ConversationId: string, UserId: string): Promise<void>;
    setRole(ConversationId: string, UserId: string, Role: string): Promise<void>;
    markRead(ConversationId: string, UserId: string, ReadAt: string): Promise<void>;
}
