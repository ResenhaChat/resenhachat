import { ConversationRoute } from '@/routes/conversation/index';
import { ConversationRouteImplementation } from '@/routes/conversation/implementation';
import { oConversationControllerFactory } from '../controllers/conversation';

const makeConversationRoute = (): ConversationRoute => {

    return new ConversationRouteImplementation(oConversationControllerFactory);

};

export const oConversationRouteFactory = makeConversationRoute();
