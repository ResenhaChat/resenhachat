import { Request } from '@sap/cds';
import { Me } from '@models/ChatService';
import { ProfileService } from '@/services/profile';
import { ProfileController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class ProfileControllerImplementation extends BaseControllerImplementation<Me> implements ProfileController {

    constructor(protected readonly Service: ProfileService) {

        super();

    }


    public announceUpdate(UserId: string, ChangedFields: string[], Request: Request): void {

        this.Service.announceUpdate(UserId, ChangedFields, Request);

    }

}
