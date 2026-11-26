import { ConversationRepository } from '@/repositories/conversation';
import { ConversationRepositoryImplementation } from '@/repositories/conversation/implementation';

const makeConversationRepository = (): ConversationRepository => {

    return new ConversationRepositoryImplementation();

};

export const oConversationRepositoryFactory = makeConversationRepository();
