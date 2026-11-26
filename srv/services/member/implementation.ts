import { User } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Member } from '@models/ChatService';
import { AbstractError, ValidationError } from '@/errors';
import { MEMBER_EDITABLE_FIELDS } from '@/constants/members';
import { BaseServiceImplementation } from '../base/implementation';
import { MemberService } from './protocols';

export class MemberServiceImplementation extends BaseServiceImplementation<Member> implements MemberService {

    public async beforeUpdate(Membership: Member, LoggedUser: User): Promise<Either<AbstractError, boolean>> {

        const aNotEditable = Object.keys(Membership).filter((sKey) => !MEMBER_EDITABLE_FIELDS.includes(sKey));

        if (aNotEditable.length) {
            return left(new ValidationError('error.memberFieldNotEditable'));
        }

        return right(true);

    }

}
