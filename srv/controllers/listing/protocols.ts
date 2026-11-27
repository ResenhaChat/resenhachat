import { Conversation, Member, Message, PublicChannel } from '@models/ChatService';
import { BaseController } from '@/controllers/base';

export interface ListingController extends BaseController<Conversation> {
    applyConversations(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void>;
    applyMembers(UserId: string, Rows: Member | Member[] | undefined): Promise<void>;
    applyChannels(UserId: string, Rows: PublicChannel | PublicChannel[] | undefined): Promise<void>;
    translateMessages(Locale: string | undefined, Rows: Message | Message[] | undefined): Promise<void>;
    translateLastMessages(Locale: string | undefined, Rows: Conversation | Conversation[] | undefined): Promise<void>;
    translateMemberLastMessages(Locale: string | undefined, Rows: Member | Member[] | undefined): Promise<void>;
}
