import { Request } from '@sap/cds';
import { Me } from '@models/ChatService';
import { BaseService } from '../base';

export interface ProfileService extends BaseService<Me> {
    announceUpdate(UserId: string, ChangedFields: string[], Request: Request): void;
}
