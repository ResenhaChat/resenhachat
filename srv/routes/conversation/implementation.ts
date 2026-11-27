import { ApplicationService, Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { ConversationController } from '@/controllers/conversation';
import { MarkAsReadInput } from '@/services/conversation';
import { ConversationRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class ConversationRouteImplementation extends BaseRouteImplementation<Conversation> implements ConversationRoute {

    constructor(protected readonly Controller: ConversationController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('MarkAsRead', this.markAsRead.bind(this));

    }


    private async markAsRead(Request: Request): Promise<void> {

        const oResult = await this.Controller.markAsRead(Request.user.id, Request.data as MarkAsReadInput, Request);

        this.rejectOnError(Request, oResult);

    }

}
