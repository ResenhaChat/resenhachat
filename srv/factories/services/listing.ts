import { ListingService } from '@/services/listing';
import { ListingServiceImplementation } from '@/services/listing/implementation';
import { oConversationRepositoryFactory } from '../repositories/conversation';
import { oConversationMemberRepositoryFactory } from '../repositories/conversation-member';
import { oUserRepositoryFactory } from '../repositories/user';

const makeListingService = (): ListingService => {

    return new ListingServiceImplementation(oConversationRepositoryFactory, oConversationMemberRepositoryFactory, oUserRepositoryFactory);

};

export const oListingServiceFactory = makeListingService();
