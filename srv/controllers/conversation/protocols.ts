import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { MarkAsReadInput } from '@/services/conversation';

export interface ConversationController extends BaseController<Conversation> {
    markAsRead(UserId: string, Input: MarkAsReadInput, Request: Request): Promise<BaseControllerResponse>;
}
