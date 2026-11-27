import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Member } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type SetMemberRoleInput = {
    Conversation_ID?: string;
    User_ID?: string;
    Role?: string;
};

export interface RoleService extends BaseService<Member> {
    setMemberRole(UserId: string, Input: SetMemberRoleInput, Request: Request): Promise<Either<AbstractError, boolean>>;
}
