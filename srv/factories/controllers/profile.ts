import { ProfileController } from '@/controllers/profile';
import { ProfileControllerImplementation } from '@/controllers/profile/implementation';
import { oProfileServiceFactory } from '../services/profile';

const makeProfileController = (): ProfileController => {

    return new ProfileControllerImplementation(oProfileServiceFactory);

};

export const oProfileControllerFactory = makeProfileController();
