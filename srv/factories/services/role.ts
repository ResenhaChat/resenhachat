import { RoleService } from '@/services/role';
import { RoleServiceImplementation } from '@/services/role/implementation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oAccessServiceFactory } from './access';
import { oSystemMessageServiceFactory } from './system-message';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeRoleService = (): RoleService => {

    return new RoleServiceImplementation(
        oConversationMemberRepositoryFactory,
        oAccessServiceFactory,
        oSystemMessageServiceFactory,
        oRealtimeHubFactory
    );

};

export const oRoleServiceFactory = makeRoleService();
