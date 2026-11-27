import { ApplicationService, Request } from '@sap/cds';
import { Member } from '@models/ChatService';
import { RoleController } from '@/controllers/role';
import { SetMemberRoleInput } from '@/services/role';
import { RoleRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class RoleRouteImplementation extends BaseRouteImplementation<Member> implements RoleRoute {

    constructor(protected readonly Controller: RoleController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('SetMemberRole', this.setMemberRole.bind(this));

    }


    private async setMemberRole(Request: Request): Promise<void> {

        this.rejectOnError(Request, await this.Controller.setMemberRole(Request.user.id, Request.data as SetMemberRoleInput, Request));

    }

}
