import { BaseRepository } from '../base';
import { ConversationModel } from '@/models/conversation';

export interface ConversationRepository extends BaseRepository<ConversationModel> {
    ensureGeneral(): Promise<void>;
    create(Conversation: ConversationModel): Promise<void>;
    createDirect(Conversation: ConversationModel): Promise<boolean>;
    findByDirectKey(DirectKey: string): Promise<ConversationModel | null>;
    updateLastMessage(Id: string, LastMessageAt: string, LastMessage: string, LastMessageKey?: string, LastMessageArgs?: string): Promise<void>;
    countUnread(UserId: string, ConversationIds: string[]): Promise<Map<string, number>>;
}
