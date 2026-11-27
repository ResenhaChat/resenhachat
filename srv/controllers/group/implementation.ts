import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { CreateConversationInput, GroupService } from '@/services/group';
import { GroupController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class GroupControllerImplementation extends BaseControllerImplementation<Conversation> implements GroupController {

    constructor(protected readonly Service: GroupService) {

        super();

    }


    public async createConversation(UserId: string, Input: CreateConversationInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.createConversation(UserId, Input, Request), 201);

    }


    public async updateConversation(UserId: string, Entity: Conversation, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.updateConversation(UserId, Entity, Request), 204);

    }

}
