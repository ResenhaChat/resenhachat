import { MemberController } from '@/controllers/member';
import { MemberControllerImplementation } from '@/controllers/member/implementation';
import { oMemberServiceFactory } from '../services/member';

const makeMemberController = (): MemberController => {

    return new MemberControllerImplementation(oMemberServiceFactory);

};

export const oMemberControllerFactory = makeMemberController();
