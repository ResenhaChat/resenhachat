import { BaseRepository } from '../base';
import { ConversationModel } from '@/models/conversation';

export interface ConversationRepository extends BaseRepository<ConversationModel> {
    ensureGeneral(): Promise<void>;
    updateLastMessage(Id: string, LastMessageAt: string, LastMessage: string): Promise<void>;
    countUnread(UserId: string, ConversationIds: string[]): Promise<Map<string, number>>;
}
