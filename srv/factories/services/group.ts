import { GroupService } from '@/services/group';
import { GroupServiceImplementation } from '@/services/group/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oAccessServiceFactory } from './access';
import { oSystemMessageServiceFactory } from './system-message';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeGroupService = (): GroupService => {

    return new GroupServiceImplementation(
        oConversationRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oAccessServiceFactory,
        oSystemMessageServiceFactory,
        oRealtimeHubFactory
    );

};

export const oGroupServiceFactory = makeGroupService();
