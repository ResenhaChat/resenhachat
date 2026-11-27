import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { CreateConversationInput } from '@/services/group';

export interface GroupController extends BaseController<Conversation> {
    createConversation(UserId: string, Input: CreateConversationInput, Request: Request): Promise<BaseControllerResponse>;
    updateConversation(UserId: string, Entity: Conversation, Request: Request): Promise<BaseControllerResponse>;
}
