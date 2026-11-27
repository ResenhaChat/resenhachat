import { ListingRoute } from '@/routes/listing/index';
import { ListingRouteImplementation } from '@/routes/listing/implementation';
import { oListingControllerFactory } from '../controllers/listing';

const makeListingRoute = (): ListingRoute => {

    return new ListingRouteImplementation(oListingControllerFactory);

};

export const oListingRouteFactory = makeListingRoute();
