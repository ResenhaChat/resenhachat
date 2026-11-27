import { RoleRoute } from '@/routes/role/index';
import { RoleRouteImplementation } from '@/routes/role/implementation';
import { oRoleControllerFactory } from '../controllers/role';

const makeRoleRoute = (): RoleRoute => {

    return new RoleRouteImplementation(oRoleControllerFactory);

};

export const oRoleRouteFactory = makeRoleRoute();
