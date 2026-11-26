import { PushSubscriptionModel } from '@/models/push-subscription';
import { BaseRepository } from '../base';

export interface PushSubscriptionRepository extends BaseRepository<PushSubscriptionModel> {
    findByEndpoint(Endpoint: string): Promise<PushSubscriptionModel | null>;
    findByUserIds(UserIds: string[]): Promise<PushSubscriptionModel[]>;
    upsert(Subscription: PushSubscriptionModel): Promise<void>;
    removeByEndpoint(Endpoint: string): Promise<void>;
    removeByEndpointOfUser(Endpoint: string, UserId: string): Promise<void>;
    touchLastUsed(Ids: string[], UsedAt: string): Promise<void>;
}
