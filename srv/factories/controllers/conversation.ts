import { ConversationController } from '@/controllers/conversation';
import { ConversationControllerImplementation } from '@/controllers/conversation/implementation';
import { oConversationServiceFactory } from '../services/conversation';

const makeConversationController = (): ConversationController => {

    return new ConversationControllerImplementation(oConversationServiceFactory);

};

export const oConversationControllerFactory = makeConversationController();
