import { ApplicationService, Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { AvatarController } from '@/controllers/avatar';
import { GroupController } from '@/controllers/group';
import { MediaStream } from '@/infrastructure/MediaStream';
import { CreateConversationInput } from '@/services/group';
import { GroupRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

const TEXT_FIELDS: readonly string[] = ['Name', 'Description'];

export class GroupRouteImplementation extends BaseRouteImplementation<Conversation> implements GroupRoute {

    constructor(
        protected readonly Controller: GroupController,
        private readonly Avatar: AvatarController
    ) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('CreateConversation', this.createConversation.bind(this));
        Service.before('UPDATE', Service.entities.Conversations, this.updateConversation.bind(this));

    }


    private async createConversation(Request: Request): Promise<unknown> {

        return this.resultOf(Request, await this.Controller.createConversation(Request.user.id, Request.data as CreateConversationInput, Request));

    }


    private async updateConversation(Request: Request): Promise<void> {

        const oData = Request.data as Record<string, unknown>;

        if (this.isAvatarChange(oData)) {

            this.assignResult(Request, await this.changeAvatar(Request, oData.Avatar));

            return;

        }

        this.trimTexts(Request);

        const oResult = await this.Controller.updateConversation(Request.user.id, this.entityFrom(Request), Request);

        this.rejectOnError(Request, oResult);

    }


    private changeAvatar(Request: Request, Avatar: unknown) {

        const sConversationId = this.entityFrom(Request).ID as string;

        if (MediaStream.isStream(Avatar)) {
            return this.Avatar.setConversationAvatar(Request.user.id, sConversationId, this.mediaPayloadOf(Request, Avatar), Request);
        }

        return this.Avatar.clearConversationAvatar(Request.user.id, sConversationId, Request);

    }


    private trimTexts(Request: Request): void {

        const oData = Request.data as Record<string, unknown>;

        TEXT_FIELDS.forEach((sField) => {

            if (typeof oData[sField] === 'string') {
                oData[sField] = (oData[sField] as string).trim();
            }

        });

    }

}
