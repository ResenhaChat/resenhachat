import { PushSubscription } from '@models/apps/dflc/resenha/entities';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { PushSubscriptionInput } from '@/services/push';

export interface PushController extends BaseController<PushSubscription> {
    publicKey(): BaseControllerResponse;
    subscribe(UserId: string, Input: PushSubscriptionInput): Promise<BaseControllerResponse>;
    unsubscribe(UserId: string, Endpoint?: string | null): Promise<BaseControllerResponse>;
    sendTest(UserId: string): Promise<BaseControllerResponse>;
}
