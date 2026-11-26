import { ApplicationService, Request } from '@sap/cds';
import { PushSubscription } from '@models/apps/dflc/resenha/entities';
import { PushController } from '@/controllers/push';
import { PushSubscriptionInput } from '@/services/push';
import { PushRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class PushRouteImplementation extends BaseRouteImplementation<PushSubscription> implements PushRoute {

    constructor(protected readonly Controller: PushController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('PushPublicKey', this.publicKey.bind(this));
        Service.on('SubscribePush', this.subscribe.bind(this));
        Service.on('UnsubscribePush', this.unsubscribe.bind(this));
        Service.on('SendPushTest', this.sendTest.bind(this));

    }


    private publicKey(Request: Request): unknown {

        return this.resultOf(Request, this.Controller.publicKey());

    }


    private async subscribe(Request: Request): Promise<void> {

        const oData = Request.data as PushSubscriptionInput;

        this.resultOf(Request, await this.Controller.subscribe(Request.user.id, {
            Endpoint: oData.Endpoint,
            P256dh: oData.P256dh,
            Auth: oData.Auth,
            UserAgent: oData.UserAgent
        }));

    }


    private async unsubscribe(Request: Request): Promise<void> {

        this.resultOf(Request, await this.Controller.unsubscribe(Request.user.id, (Request.data as PushSubscriptionInput).Endpoint));

    }


    private async sendTest(Request: Request): Promise<void> {

        this.resultOf(Request, await this.Controller.sendTest(Request.user.id));

    }

}
