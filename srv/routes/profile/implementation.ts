import { ApplicationService } from '@sap/cds';
import { Me } from '@models/ChatService';
import { ProfileController } from '@/controllers/profile';
import { ProfileRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class ProfileRouteImplementation extends BaseRouteImplementation<Me> implements ProfileRoute {

    constructor(protected readonly Controller: ProfileController) {

        super();

    }


    public main(Service: ApplicationService): void {

        this.mainBase(Service, Service.entities.Me);

    }

}
