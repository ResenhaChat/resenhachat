import { PushSubscription } from '@models/apps/dflc/resenha/entities';
import { BaseControllerResponse } from '@/controllers/base';
import { PushService, PushSubscriptionInput } from '@/services/push';
import { PushController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class PushControllerImplementation extends BaseControllerImplementation<PushSubscription> implements PushController {

    constructor(protected readonly Service: PushService) {

        super();

    }


    public publicKey(): BaseControllerResponse {

        return this.success(200, this.Service.publicKey());

    }


    public async subscribe(UserId: string, Input: PushSubscriptionInput): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.subscribe(UserId, Input), 204);

    }


    public async unsubscribe(UserId: string, Endpoint?: string | null): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.unsubscribe(UserId, Endpoint), 204);

    }


    public async sendTest(UserId: string): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.sendTest(UserId), 204);

    }

}
