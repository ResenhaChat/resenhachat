import { MembershipController } from '@/controllers/membership';
import { MembershipControllerImplementation } from '@/controllers/membership/implementation';
import { oMembershipServiceFactory } from '../services/membership';

const makeMembershipController = (): MembershipController => {

    return new MembershipControllerImplementation(oMembershipServiceFactory);

};

export const oMembershipControllerFactory = makeMembershipController();
