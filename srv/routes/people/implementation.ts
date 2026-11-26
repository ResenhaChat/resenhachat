import { ApplicationService } from '@sap/cds';
import { People } from '@models/ChatService';
import { PresenceController } from '@/controllers/presence';
import { PeopleRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class PeopleRouteImplementation extends BaseRouteImplementation<People> implements PeopleRoute {

    constructor(protected readonly Controller: PresenceController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.after('READ', Service.entities.People, (Rows: unknown) => {

            this.Controller.applyOnlineStatus(Rows as People | People[] | undefined);

        });

    }

}
