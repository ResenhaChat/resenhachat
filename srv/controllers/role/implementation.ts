import { Request } from '@sap/cds';
import { Member } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { RoleService, SetMemberRoleInput } from '@/services/role';
import { RoleController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class RoleControllerImplementation extends BaseControllerImplementation<Member> implements RoleController {

    constructor(protected readonly Service: RoleService) {

        super();

    }


    public async setMemberRole(UserId: string, Input: SetMemberRoleInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.setMemberRole(UserId, Input, Request), 204);

    }

}
