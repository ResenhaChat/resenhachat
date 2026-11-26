import { Member } from '@models/ChatService';
import { MemberService } from '@/services/member';
import { MemberController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class MemberControllerImplementation extends BaseControllerImplementation<Member> implements MemberController {

    constructor(protected readonly Service: MemberService) {

        super();

    }

}
