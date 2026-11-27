import { GroupRoute } from '@/routes/group/index';
import { GroupRouteImplementation } from '@/routes/group/implementation';
import { oGroupControllerFactory } from '../controllers/group';

const makeGroupRoute = (): GroupRoute => {

    return new GroupRouteImplementation(oGroupControllerFactory);

};

export const oGroupRouteFactory = makeGroupRoute();
