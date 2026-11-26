import { People } from '@models/ChatService';
import { BaseService } from '../base';

export interface PresenceService extends BaseService<People> {
    applyOnlineStatus(Rows: People | People[] | undefined): void;
    recordDisconnect(UserId: string): Promise<string>;
    typingRecipients(UserId: string, ConversationId: string): Promise<string[]>;
}
