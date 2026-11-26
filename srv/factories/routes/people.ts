import { PeopleRoute } from '@/routes/people/index';
import { PeopleRouteImplementation } from '@/routes/people/implementation';
import { oPresenceControllerFactory } from '../controllers/presence';

const makePeopleRoute = (): PeopleRoute => {

    return new PeopleRouteImplementation(oPresenceControllerFactory);

};

export const oPeopleRouteFactory = makePeopleRoute();
