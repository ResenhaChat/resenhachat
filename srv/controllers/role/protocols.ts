import { Request } from '@sap/cds';
import { Member } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { SetMemberRoleInput } from '@/services/role';

export interface RoleController extends BaseController<Member> {
    setMemberRole(UserId: string, Input: SetMemberRoleInput, Request: Request): Promise<BaseControllerResponse>;
}
