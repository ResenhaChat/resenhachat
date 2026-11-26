import { ProfileRoute } from '@/routes/profile/index';
import { ProfileRouteImplementation } from '@/routes/profile/implementation';
import { oProfileControllerFactory } from '../controllers/profile';

const makeProfileRoute = (): ProfileRoute => {

    return new ProfileRouteImplementation(oProfileControllerFactory);

};

export const oProfileRouteFactory = makeProfileRoute();
