import cds from '@sap/cds';
import { PushSubscriptions } from '@models/apps/dflc/resenha/entities';
import { PushSubscriptionModel } from '@/models/push-subscription';
import { PushSubscriptionRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class PushSubscriptionRepositoryImplementation extends BaseRepositoryImplementation<PushSubscriptionModel> implements PushSubscriptionRepository {

    public async findByEndpoint(Endpoint: string): Promise<PushSubscriptionModel | null> {

        const oRows = await cds.run(SELECT.from(this.getEntity()).where({ Endpoint }));

        return this.mapResult(oRows)[0] ?? null;

    }


    public async findByUserIds(UserIds: string[]): Promise<PushSubscriptionModel[]> {

        if (!UserIds.length) {
            return [];
        }

        const oRows = await cds.run(SELECT.from(this.getEntity()).where({ User_ID: { in: UserIds } }));

        return this.mapResult(oRows);

    }


    public async upsert(Subscription: PushSubscriptionModel): Promise<void> {

        await cds.run(UPSERT.into(this.getEntity()).entries(Subscription.toEntityObject()));

    }


    public async removeByEndpoint(Endpoint: string): Promise<void> {

        await cds.run(DELETE.from(this.getEntity()).where({ Endpoint }));

    }


    public async removeByEndpointOfUser(Endpoint: string, UserId: string): Promise<void> {

        await cds.run(DELETE.from(this.getEntity()).where({ Endpoint, User_ID: UserId }));

    }


    public async touchLastUsed(Ids: string[], UsedAt: string): Promise<void> {

        if (!Ids.length) {
            return;
        }

        await cds.run(UPDATE(this.getEntity()).set({ LastUsedAt: UsedAt }).where({ ID: { in: Ids } }));

    }


    protected entityName(): string {

        return 'PushSubscriptions';

    }


    protected mapResult(Rows: unknown[]): PushSubscriptionModel[] {

        return PushSubscriptionModel.mapModel(Rows as PushSubscriptions);

    }

}
