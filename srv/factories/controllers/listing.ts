import { ListingController } from '@/controllers/listing';
import { ListingControllerImplementation } from '@/controllers/listing/implementation';
import { oListingServiceFactory } from '../services/listing';

const makeListingController = (): ListingController => {

    return new ListingControllerImplementation(oListingServiceFactory);

};

export const oListingControllerFactory = makeListingController();
