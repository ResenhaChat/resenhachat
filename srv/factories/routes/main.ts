import { MainRoute } from '@/routes/main/index';
import { MainRouteImplementation } from '@/routes/main/implementation';
import { oPeopleRouteFactory } from './people';
import { oProfileRouteFactory } from './profile';
import { oConversationRouteFactory } from './conversation';
import { oMessageRouteFactory } from './message';
import { oMemberRouteFactory } from './member';

const makeMainRoute = (): MainRoute => {

    return new MainRouteImplementation([
        oPeopleRouteFactory,
        oProfileRouteFactory,
        oConversationRouteFactory,
        oMessageRouteFactory,
        oMemberRouteFactory
    ]);

};

export const oMainRouteFactory = makeMainRoute();
