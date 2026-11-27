import { SystemMessageService } from '@/services/system-message';
import { SystemMessageServiceImplementation } from '@/services/system-message/implementation';
import { oMessageRepositoryFactory } from '../repositories/message';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oUserRepositoryFactory } from '../repositories/user';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeSystemMessageService = (): SystemMessageService => {

    return new SystemMessageServiceImplementation(
        oMessageRepositoryFactory,
        oConversationRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oUserRepositoryFactory,
        oRealtimeHubFactory
    );

};

export const oSystemMessageServiceFactory = makeSystemMessageService();
