import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseControllerResponse } from '@/controllers/base';
import { AddMembersInput, JoinChannelInput, LeaveConversationInput, MembershipService, RemoveMemberInput } from '@/services/membership';
import { MembershipController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class MembershipControllerImplementation extends BaseControllerImplementation<Conversation> implements MembershipController {

    constructor(protected readonly Service: MembershipService) {

        super();

    }


    public async addMembers(UserId: string, Input: AddMembersInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.addMembers(UserId, Input, Request), 204);

    }


    public async removeMember(UserId: string, Input: RemoveMemberInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.removeMember(UserId, Input, Request), 204);

    }


    public async leaveConversation(UserId: string, Input: LeaveConversationInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.leaveConversation(UserId, Input, Request), 204);

    }


    public async joinChannel(UserId: string, Input: JoinChannelInput, Request: Request): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.joinChannel(UserId, Input, Request), 200);

    }

}
