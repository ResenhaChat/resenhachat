import { RoleController } from '@/controllers/role';
import { RoleControllerImplementation } from '@/controllers/role/implementation';
import { oRoleServiceFactory } from '../services/role';

const makeRoleController = (): RoleController => {

    return new RoleControllerImplementation(oRoleServiceFactory);

};

export const oRoleControllerFactory = makeRoleController();
