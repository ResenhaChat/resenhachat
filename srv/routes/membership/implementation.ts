import { ApplicationService, Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { MembershipController } from '@/controllers/membership';
import { AddMembersInput, JoinChannelInput, LeaveConversationInput, RemoveMemberInput } from '@/services/membership';
import { MembershipRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

export class MembershipRouteImplementation extends BaseRouteImplementation<Conversation> implements MembershipRoute {

    constructor(protected readonly Controller: MembershipController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('AddMembers', this.addMembers.bind(this));
        Service.on('RemoveMember', this.removeMember.bind(this));
        Service.on('LeaveConversation', this.leaveConversation.bind(this));
        Service.on('JoinChannel', this.joinChannel.bind(this));

    }


    private async addMembers(Request: Request): Promise<void> {

        this.rejectOnError(Request, await this.Controller.addMembers(Request.user.id, Request.data as AddMembersInput, Request));

    }


    private async removeMember(Request: Request): Promise<void> {

        this.rejectOnError(Request, await this.Controller.removeMember(Request.user.id, Request.data as RemoveMemberInput, Request));

    }


    private async leaveConversation(Request: Request): Promise<void> {

        this.rejectOnError(Request, await this.Controller.leaveConversation(Request.user.id, Request.data as LeaveConversationInput, Request));

    }


    private async joinChannel(Request: Request): Promise<unknown> {

        return this.resultOf(Request, await this.Controller.joinChannel(Request.user.id, Request.data as JoinChannelInput, Request));

    }

}
