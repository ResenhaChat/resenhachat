import { Request } from '@sap/cds';
import { Message } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { MessageService, SendMessageInput } from '@/services/message';
import { MessageController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class MessageControllerImplementation extends BaseControllerImplementation<Message> implements MessageController {

    constructor(protected readonly Service: MessageService) {

        super();

    }


    public async sendMessage(UserId: string, Input: SendMessageInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.sendMessage(UserId, Input, Request), 201);

    }

}
