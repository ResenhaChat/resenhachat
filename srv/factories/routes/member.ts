import { MemberRoute } from '@/routes/member/index';
import { MemberRouteImplementation } from '@/routes/member/implementation';
import { oMemberControllerFactory } from '../controllers/member';

const makeMemberRoute = (): MemberRoute => {

    return new MemberRouteImplementation(oMemberControllerFactory);

};

export const oMemberRouteFactory = makeMemberRoute();
