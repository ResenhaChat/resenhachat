import { MembershipRoute } from '@/routes/membership/index';
import { MembershipRouteImplementation } from '@/routes/membership/implementation';
import { oMembershipControllerFactory } from '../controllers/membership';

const makeMembershipRoute = (): MembershipRoute => {

    return new MembershipRouteImplementation(oMembershipControllerFactory);

};

export const oMembershipRouteFactory = makeMembershipRoute();
