import { Request } from '@sap/cds';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { UserModel } from '@/models/user';
import { MediaPayload } from '@/services/media/payload';

export interface AvatarController extends BaseController<UserModel> {
    setUserAvatar(UserId: string, Payload: MediaPayload, Request: Request): Promise<BaseControllerResponse>;
    clearUserAvatar(UserId: string, Request: Request): Promise<BaseControllerResponse>;
    setConversationAvatar(UserId: string, ConversationId: string, Payload: MediaPayload, Request: Request): Promise<BaseControllerResponse>;
    clearConversationAvatar(UserId: string, ConversationId: string, Request: Request): Promise<BaseControllerResponse>;
}
