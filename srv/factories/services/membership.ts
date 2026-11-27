import { MembershipService } from '@/services/membership';
import { MembershipServiceImplementation } from '@/services/membership/implementation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oAccessServiceFactory } from './access';
import { oSystemMessageServiceFactory } from './system-message';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeMembershipService = (): MembershipService => {

    return new MembershipServiceImplementation(
        oConversationMemberRepositoryFactory,
        oAccessServiceFactory,
        oSystemMessageServiceFactory,
        oRealtimeHubFactory
    );

};

export const oMembershipServiceFactory = makeMembershipService();
