import { Request } from '@sap/cds';
import { Me } from '@models/ChatService';
import { BaseController } from '@/controllers/base';

export interface ProfileController extends BaseController<Me> {
    announceUpdate(UserId: string, ChangedFields: string[], Request: Request): void;
}
