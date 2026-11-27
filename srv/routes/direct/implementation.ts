import { ApplicationService, Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { DirectController } from '@/controllers/direct';
import { StartDirectInput } from '@/services/direct';
import { DirectRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class DirectRouteImplementation extends BaseRouteImplementation<Conversation> implements DirectRoute {

    constructor(protected readonly Controller: DirectController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('StartDirect', this.startDirect.bind(this));

    }


    private async startDirect(Request: Request): Promise<unknown> {

        return this.resultOf(Request, await this.Controller.startDirect(Request.user.id, Request.data as StartDirectInput, Request));

    }

}
