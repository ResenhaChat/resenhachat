import { MemberService } from '@/services/member';
import { MemberServiceImplementation } from '@/services/member/implementation';

const makeMemberService = (): MemberService => {

    return new MemberServiceImplementation();

};

export const oMemberServiceFactory = makeMemberService();
