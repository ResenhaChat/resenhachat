import { AvatarController } from '@/controllers/avatar';
import { AvatarControllerImplementation } from '@/controllers/avatar/implementation';
import { oAvatarServiceFactory } from '../services/avatar';

const makeAvatarController = (): AvatarController => {

    return new AvatarControllerImplementation(oAvatarServiceFactory);

};

export const oAvatarControllerFactory = makeAvatarController();
