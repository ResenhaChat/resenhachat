import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { ConversationService, MarkAsReadInput } from '@/services/conversation';
import { ConversationController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class ConversationControllerImplementation extends BaseControllerImplementation<Conversation> implements ConversationController {

    constructor(protected readonly Service: ConversationService) {

        super();

    }


    public async applyUnreadCount(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void> {

        await this.Service.applyUnreadCount(UserId, Rows);

    }


    public async markAsRead(UserId: string, Input: MarkAsReadInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.markAsRead(UserId, Input, Request), 200);

    }

}
