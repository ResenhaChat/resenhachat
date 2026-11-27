import { ApplicationService, Request } from '@sap/cds';
import { Me } from '@models/ChatService';
import { AvatarController } from '@/controllers/avatar';
import { ProfileController } from '@/controllers/profile';
import { MediaStream } from '@/infrastructure/MediaStream';
import { ProfileRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class ProfileRouteImplementation extends BaseRouteImplementation<Me> implements ProfileRoute {

    constructor(
        protected readonly Controller: ProfileController,
        private readonly Avatar: AvatarController
    ) {

        super();

    }


    public main(Service: ApplicationService): void {

        this.mainBase(Service, Service.entities.Me);

    }


    protected async beforeUpdate(Request: Request): Promise<void> {

        const oData = Request.data as Record<string, unknown>;

        if (this.isAvatarChange(oData)) {

            this.assignResult(Request, await this.changeAvatar(Request, oData.Avatar));

            return;

        }

        await super.beforeUpdate(Request);

        this.Controller.announceUpdate(Request.user.id, Object.keys(oData), Request);

    }


    private changeAvatar(Request: Request, Avatar: unknown) {

        if (MediaStream.isStream(Avatar)) {
            return this.Avatar.setUserAvatar(Request.user.id, this.mediaPayloadOf(Request, Avatar), Request);
        }

        return this.Avatar.clearUserAvatar(Request.user.id, Request);

    }

}
