import { MainRoute } from '@/routes/main/index';
import { MainRouteImplementation } from '@/routes/main/implementation';
import { oPeopleRouteFactory } from './people';
import { oProfileRouteFactory } from './profile';
import { oConversationRouteFactory } from './conversation';
import { oMessageRouteFactory } from './message';
import { oMemberRouteFactory } from './member';
import { oPushRouteFactory } from './push';
import { oListingRouteFactory } from './listing';
import { oDirectRouteFactory } from './direct';
import { oGroupRouteFactory } from './group';
import { oMembershipRouteFactory } from './membership';
import { oRoleRouteFactory } from './role';
import { oMediaRouteFactory } from './media';

const makeMainRoute = (): MainRoute => {

    return new MainRouteImplementation([
        oPeopleRouteFactory,
        oProfileRouteFactory,
        oConversationRouteFactory,
        oMessageRouteFactory,
        oMemberRouteFactory,
        oPushRouteFactory,
        oListingRouteFactory,
        oDirectRouteFactory,
        oGroupRouteFactory,
        oMembershipRouteFactory,
        oRoleRouteFactory,
        oMediaRouteFactory
    ]);

};

export const oMainRouteFactory = makeMainRoute();
