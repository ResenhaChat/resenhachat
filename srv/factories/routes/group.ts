import { GroupRoute } from '@/routes/group/index';
import { GroupRouteImplementation } from '@/routes/group/implementation';
import { oGroupControllerFactory } from '../controllers/group';
import { oAvatarControllerFactory } from '../controllers/avatar';

const makeGroupRoute = (): GroupRoute => {

    return new GroupRouteImplementation(oGroupControllerFactory, oAvatarControllerFactory);

};

export const oGroupRouteFactory = makeGroupRoute();
