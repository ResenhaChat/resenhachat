import { DirectController } from '@/controllers/direct';
import { DirectControllerImplementation } from '@/controllers/direct/implementation';
import { oDirectServiceFactory } from '../services/direct';

const makeDirectController = (): DirectController => {

    return new DirectControllerImplementation(oDirectServiceFactory);

};

export const oDirectControllerFactory = makeDirectController();
