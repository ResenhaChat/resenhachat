import { AvatarService } from '@/services/avatar';
import { AvatarServiceImplementation } from '@/services/avatar/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oUserRepositoryFactory } from '../repositories/user';
import { oRealtimeHubFactory } from '../realtime/hub';
import { oAccessServiceFactory } from './access';
import { oSystemMessageServiceFactory } from './system-message';

const makeAvatarService = (): AvatarService => {

    return new AvatarServiceImplementation(
        oUserRepositoryFactory,
        oConversationRepositoryFactory,
        oConversationMemberRepositoryFactory,
        oAccessServiceFactory,
        oSystemMessageServiceFactory,
        oRealtimeHubFactory
    );

};

export const oAvatarServiceFactory = makeAvatarService();
