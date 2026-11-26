import { MessageService } from '@/services/message';
import { MessageServiceImplementation } from '@/services/message/implementation';
import { oMessageRepositoryFactory } from '../repositories/message';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeMessageService = (): MessageService => {

    return new MessageServiceImplementation(oMessageRepositoryFactory, oConversationRepositoryFactory, oConversationMemberRepositoryFactory, oRealtimeHubFactory);

};

export const oMessageServiceFactory = makeMessageService();
