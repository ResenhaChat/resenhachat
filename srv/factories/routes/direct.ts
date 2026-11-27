import { DirectRoute } from '@/routes/direct/index';
import { DirectRouteImplementation } from '@/routes/direct/implementation';
import { oDirectControllerFactory } from '../controllers/direct';

const makeDirectRoute = (): DirectRoute => {

    return new DirectRouteImplementation(oDirectControllerFactory);

};

export const oDirectRouteFactory = makeDirectRoute();
