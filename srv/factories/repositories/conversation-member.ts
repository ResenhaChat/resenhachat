import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationMemberRepositoryImplementation } from '@/repositories/conversation-member/implementation';

const makeConversationMemberRepository = (): ConversationMemberRepository => {

    return new ConversationMemberRepositoryImplementation();

};

export const oConversationMemberRepositoryFactory = makeConversationMemberRepository();
