import { ConversationService } from '@/services/conversation';
import { ConversationServiceImplementation } from '@/services/conversation/implementation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeConversationService = (): ConversationService => {

    return new ConversationServiceImplementation(oConversationMemberRepositoryFactory, oRealtimeHubFactory);

};

export const oConversationServiceFactory = makeConversationService();
