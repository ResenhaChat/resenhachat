import { PresenceService } from '@/services/presence';
import { PresenceServiceImplementation } from '@/services/presence/implementation';
import { oUserRepositoryFactory } from '../repositories/user';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oRealtimeHubFactory } from '../realtime/hub';

const makePresenceService = (): PresenceService => {

    return new PresenceServiceImplementation(oUserRepositoryFactory, oConversationMemberRepositoryFactory, oRealtimeHubFactory);

};

export const oPresenceServiceFactory = makePresenceService();
