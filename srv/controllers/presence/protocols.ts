import { People } from '@models/ChatService';
import { BaseController } from '@/controllers/base';

export interface PresenceController extends BaseController<People> {
    applyOnlineStatus(Rows: People | People[] | undefined): void;
}
