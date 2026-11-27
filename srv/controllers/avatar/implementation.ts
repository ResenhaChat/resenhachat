import { Request } from '@sap/cds';
import { BaseControllerResponse } from '@/controllers/base';
import { UserModel } from '@/models/user';
import { AvatarService } from '@/services/avatar';
import { MediaPayload } from '@/services/media/payload';
import { AvatarController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class AvatarControllerImplementation extends BaseControllerImplementation<UserModel> implements AvatarController {

    constructor(protected readonly Service: AvatarService) {

        super();

    }


    public async setUserAvatar(UserId: string, Payload: MediaPayload, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.setUserAvatar(UserId, Payload, Request), 200);

    }


    public async clearUserAvatar(UserId: string, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.clearUserAvatar(UserId, Request), 200);

    }


    public async setConversationAvatar(UserId: string, ConversationId: string, Payload: MediaPayload, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.setConversationAvatar(UserId, ConversationId, Payload, Request), 200);

    }


    public async clearConversationAvatar(UserId: string, ConversationId: string, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.clearConversationAvatar(UserId, ConversationId, Request), 200);

    }

}
