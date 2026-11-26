import { ConversationService } from '@/services/conversation';
import { ConversationServiceImplementation } from '@/services/conversation/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeConversationService = (): ConversationService => {

    return new ConversationServiceImplementation(oConversationRepositoryFactory, oConversationMemberRepositoryFactory, oRealtimeHubFactory);

};

export const oConversationServiceFactory = makeConversationService();
