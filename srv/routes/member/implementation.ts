import { ApplicationService } from '@sap/cds';
import { Member } from '@models/ChatService';
import { MemberController } from '@/controllers/member';
import { MemberRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class MemberRouteImplementation extends BaseRouteImplementation<Member> implements MemberRoute {

    constructor(protected readonly Controller: MemberController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.before('UPDATE', Service.entities.Members, this.beforeUpdate.bind(this));

    }

}
