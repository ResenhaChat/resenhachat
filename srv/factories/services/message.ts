import { MessageService } from '@/services/message';
import { MessageServiceImplementation } from '@/services/message/implementation';
import { oMessageRepositoryFactory } from '../repositories/message';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oRealtimeHubFactory } from '../realtime/hub';
import { oAccessServiceFactory } from './access';
import { oMediaServiceFactory } from './media';
import { oPushServiceFactory } from './push';

const makeMessageService = (): MessageService => {

    return new MessageServiceImplementation(
        oMessageRepositoryFactory,
        oConversationRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oRealtimeHubFactory,
        oPushServiceFactory,
        oMediaServiceFactory,
        oAccessServiceFactory
    );

};

export const oMessageServiceFactory = makeMessageService();
