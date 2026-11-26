import { PushSubscription, PushSubscriptions } from '@models/apps/dflc/resenha/entities';
import { AuditProperties, BaseModel } from './base';

export type PushSubscriptionProperties = AuditProperties & {
    Id: string;
    UserId: string;
    Endpoint: string;
    P256dh: string;
    Auth: string;
    UserAgent?: string;
    LastUsedAt?: string;
};

export class PushSubscriptionModel extends BaseModel {

    constructor(private readonly properties: PushSubscriptionProperties) { super(); }


    public static with(properties: PushSubscriptionProperties): PushSubscriptionModel {
        return new PushSubscriptionModel(properties);
    }


    public static mapModel(Subscriptions: PushSubscriptions): PushSubscriptionModel[] {

        return Subscriptions.map((Subscription: PushSubscription) => PushSubscriptionModel.with({
            Id: Subscription.ID as string,
            UserId: Subscription.User_ID as string,
            Endpoint: Subscription.Endpoint as string,
            P256dh: Subscription.P256dh as string,
            Auth: Subscription.Auth as string,
            UserAgent: Subscription.UserAgent ?? undefined,
            LastUsedAt: Subscription.LastUsedAt ?? undefined,
            ...this.retrieveAudit(Subscription)
        }));

    }


    public get Id() { return this.properties.Id; }

    public get UserId() { return this.properties.UserId; }

    public get Endpoint() { return this.properties.Endpoint; }


    /** Formato aceito pelo web-push. */
    public toWebPushSubscription(): { endpoint: string; keys: { p256dh: string; auth: string } } {

        return {
            endpoint: this.properties.Endpoint,
            keys: {
                p256dh: this.properties.P256dh,
                auth: this.properties.Auth
            }
        };

    }


    public toEntityObject(): PushSubscription {

        return this.cleanEntity({
            ID: this.properties.Id,
            User_ID: this.properties.UserId,
            Endpoint: this.properties.Endpoint,
            P256dh: this.properties.P256dh,
            Auth: this.properties.Auth,
            UserAgent: this.properties.UserAgent,
            LastUsedAt: this.properties.LastUsedAt,
            ...this.auditEntityObject(this.properties)
        });

    }

}
