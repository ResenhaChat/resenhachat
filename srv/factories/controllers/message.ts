import { MessageController } from '@/controllers/message';
import { MessageControllerImplementation } from '@/controllers/message/implementation';
import { oMessageServiceFactory } from '../services/message';

const makeMessageController = (): MessageController => {

    return new MessageControllerImplementation(oMessageServiceFactory);

};

export const oMessageControllerFactory = makeMessageController();
