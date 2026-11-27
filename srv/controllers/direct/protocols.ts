import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { StartDirectInput } from '@/services/direct';

export interface DirectController extends BaseController<Conversation> {
    startDirect(UserId: string, Input: StartDirectInput, Request: Request): Promise<BaseControllerResponse>;
}
