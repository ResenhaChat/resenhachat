import { Conversation, Member, PublicChannel } from '@models/ChatService';
import { BaseService } from '../base';

export interface ListingService extends BaseService<Conversation> {
    applyConversations(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void>;
    applyMembers(UserId: string, Rows: Member | Member[] | undefined): Promise<void>;
    applyChannels(UserId: string, Rows: PublicChannel | PublicChannel[] | undefined): Promise<void>;
}
