import { AuthService } from '@/services/auth';
import { AuthServiceImplementation } from '@/services/auth/implementation';
import { oUserRepositoryFactory } from '../repositories/user';
import { oRefreshTokenRepositoryFactory } from '../repositories/refresh-token';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';

const makeAuthService = (): AuthService => {

    return new AuthServiceImplementation(oUserRepositoryFactory, oRefreshTokenRepositoryFactory, oConversationRepositoryFactory, oConversationMemberRepositoryFactory);

};

export const oAuthServiceFactory = makeAuthService();
