import { AccessService } from '@/services/access';
import { AccessServiceImplementation } from '@/services/access/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oUserRepositoryFactory } from '../repositories/user';

const makeAccessService = (): AccessService => {

    return new AccessServiceImplementation(oConversationRepositoryFactory, oConversationMemberRepositoryFactory, oUserRepositoryFactory);

};

export const oAccessServiceFactory = makeAccessService();
