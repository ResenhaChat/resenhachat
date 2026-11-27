import { ApplicationService, Request } from '@sap/cds';
import { Conversation, Member, PublicChannel } from '@models/ChatService';
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

    }


    private async applyConversations(Rows: unknown, Request: Request): Promise<void> {

        await this.Controller.applyConversations(Request.user.id, Rows as Conversation | Conversation[] | undefined);

    }


    private async applyMembers(Rows: unknown, Request: Request): Promise<void> {

        await this.Controller.applyMembers(Request.user.id, Rows as Member | Member[] | undefined);

    }


    private async applyChannels(Rows: unknown, Request: Request): Promise<void> {

        await this.Controller.applyChannels(Request.user.id, Rows as PublicChannel | PublicChannel[] | undefined);

    }

}
