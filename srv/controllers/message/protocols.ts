import { Request } from '@sap/cds';
import { Message } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { SendMessageInput } from '@/services/message';

export interface MessageController extends BaseController<Message> {
    sendMessage(UserId: string, Input: SendMessageInput, Request: Request): Promise<BaseControllerResponse>;
}
