import { People } from '@models/ChatService';
import { PresenceService } from '@/services/presence';
import { PresenceController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class PresenceControllerImplementation extends BaseControllerImplementation<People> implements PresenceController {

    constructor(protected readonly Service: PresenceService) {

        super();

    }


    public applyOnlineStatus(Rows: People | People[] | undefined): void {

        this.Service.applyOnlineStatus(Rows);

    }

}
