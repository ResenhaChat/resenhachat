import { Conversation, Member, PublicChannel } from '@models/ChatService';
import { ListingService } from '@/services/listing';
import { ListingController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class ListingControllerImplementation extends BaseControllerImplementation<Conversation> implements ListingController {

    constructor(protected readonly Service: ListingService) {

        super();

    }


    public async applyConversations(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void> {

        await this.Service.applyConversations(UserId, Rows);

    }


    public async applyMembers(UserId: string, Rows: Member | Member[] | undefined): Promise<void> {

        await this.Service.applyMembers(UserId, Rows);

    }


    public async applyChannels(UserId: string, Rows: PublicChannel | PublicChannel[] | undefined): Promise<void> {

        await this.Service.applyChannels(UserId, Rows);

    }

}
