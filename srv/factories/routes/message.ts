import { MessageRoute } from '@/routes/message/index';
import { MessageRouteImplementation } from '@/routes/message/implementation';
import { oMessageControllerFactory } from '../controllers/message';

const makeMessageRoute = (): MessageRoute => {

    return new MessageRouteImplementation(oMessageControllerFactory);

};

export const oMessageRouteFactory = makeMessageRoute();
