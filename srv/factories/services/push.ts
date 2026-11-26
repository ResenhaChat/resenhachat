import { PushService } from '@/services/push';
import { PushServiceImplementation } from '@/services/push/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oPushSubscriptionRepositoryFactory } from '../repositories/push-subscription';
import { oUserRepositoryFactory } from '../repositories/user';
import { oRealtimeHubFactory } from '../realtime/hub';

const makePushService = (): PushService => {

    return new PushServiceImplementation(
        oPushSubscriptionRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oUserRepositoryFactory,
        oConversationRepositoryFactory,
        oRealtimeHubFactory
    );

};

export const oPushServiceFactory = makePushService();
