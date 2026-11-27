import { ApplicationService, Request } from '@sap/cds';
import { Conversation, Member, Message, PublicChannel } from '@models/ChatService';
import { ListingController } from '@/controllers/listing';
import { ListingRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class ListingRouteImplementation extends BaseRouteImplementation<Conversation> implements ListingRoute {

    constructor(protected readonly Controller: ListingController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.after('READ', Service.entities.Conversations, this.applyConversations.bind(this));
        Service.after('READ', Service.entities.Members, this.applyMembers.bind(this));
        Service.after('READ', Service.entities.PublicChannels, this.applyChannels.bind(this));
        Service.after('READ', Service.entities.Messages, this.translateMessages.bind(this));

    }


    private async applyConversations(Rows: unknown, Request: Request): Promise<void> {

        const oRows = Rows as Conversation | Conversation[] | undefined;

        await this.Controller.applyConversations(Request.user.id, oRows);
        await this.Controller.translateLastMessages(Request.locale, oRows);

    }


    private async applyMembers(Rows: unknown, Request: Request): Promise<void> {

        const oRows = Rows as Member | Member[] | undefined;

        await this.Controller.applyMembers(Request.user.id, oRows);
        await this.Controller.translateMemberLastMessages(Request.locale, oRows);

    }


    private async applyChannels(Rows: unknown, Request: Request): Promise<void> {

        await this.Controller.applyChannels(Request.user.id, Rows as PublicChannel | PublicChannel[] | undefined);

    }


    private async translateMessages(Rows: unknown, Request: Request): Promise<void> {

        await this.Controller.translateMessages(Request.locale, Rows as Message | Message[] | undefined);

    }

}
