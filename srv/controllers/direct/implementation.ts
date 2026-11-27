import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { DirectService, StartDirectInput } from '@/services/direct';
import { DirectController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class DirectControllerImplementation extends BaseControllerImplementation<Conversation> implements DirectController {

    constructor(protected readonly Service: DirectService) {

        super();

    }


    public async startDirect(UserId: string, Input: StartDirectInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.startDirect(UserId, Input, Request), 200);

    }

}
