import { Conversation, Member, PublicChannel } from '@models/ChatService';
import { BaseController } from '@/controllers/base';

export interface ListingController extends BaseController<Conversation> {
    applyConversations(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void>;
    applyMembers(UserId: string, Rows: Member | Member[] | undefined): Promise<void>;
    applyChannels(UserId: string, Rows: PublicChannel | PublicChannel[] | undefined): Promise<void>;
}
