import { GroupController } from '@/controllers/group';
import { GroupControllerImplementation } from '@/controllers/group/implementation';
import { oGroupServiceFactory } from '../services/group';

const makeGroupController = (): GroupController => {

    return new GroupControllerImplementation(oGroupServiceFactory);

};

export const oGroupControllerFactory = makeGroupController();
