import { ProfileRoute } from '@/routes/profile/index';
import { ProfileRouteImplementation } from '@/routes/profile/implementation';
import { oProfileControllerFactory } from '../controllers/profile';
import { oAvatarControllerFactory } from '../controllers/avatar';

const makeProfileRoute = (): ProfileRoute => {

    return new ProfileRouteImplementation(oProfileControllerFactory, oAvatarControllerFactory);

};

export const oProfileRouteFactory = makeProfileRoute();
