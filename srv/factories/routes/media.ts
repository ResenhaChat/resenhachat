import { MediaRoute } from '@/routes/media/index';
import { MediaRouteImplementation } from '@/routes/media/implementation';
import { oMediaControllerFactory } from '../controllers/media';

const makeMediaRoute = (): MediaRoute => {

    return new MediaRouteImplementation(oMediaControllerFactory);

};

export const oMediaRouteFactory = makeMediaRoute();
