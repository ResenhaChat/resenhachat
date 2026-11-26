import { ApplicationService, Request } from '@sap/cds';
import { Message } from '@models/ChatService';
import { MessageController } from '@/controllers/message';
import { SendMessageInput } from '@/services/message';
import { MessageRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class MessageRouteImplementation extends BaseRouteImplementation<Message> implements MessageRoute {

    constructor(protected readonly Controller: MessageController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('SendMessage', this.sendMessage.bind(this));

    }


    private async sendMessage(Request: Request): Promise<unknown> {

        return this.resultOf(Request, await this.Controller.sendMessage(Request.user.id, Request.data as SendMessageInput, Request));

    }

}
