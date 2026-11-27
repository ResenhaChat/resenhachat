import { DirectService } from '@/services/direct';
import { DirectServiceImplementation } from '@/services/direct/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oUserRepositoryFactory } from '../repositories/user';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeDirectService = (): DirectService => {

    return new DirectServiceImplementation(
        oConversationRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oUserRepositoryFactory,
        oRealtimeHubFactory
    );

};

export const oDirectServiceFactory = makeDirectService();
