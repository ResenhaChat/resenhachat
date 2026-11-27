import { Request } from '@sap/cds';
import { Conversation } from '@models/ChatService';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { AddMembersInput, JoinChannelInput, LeaveConversationInput, RemoveMemberInput } from '@/services/membership';

export interface MembershipController extends BaseController<Conversation> {
    addMembers(UserId: string, Input: AddMembersInput, Request: Request): Promise<BaseControllerResponse>;
    removeMember(UserId: string, Input: RemoveMemberInput, Request: Request): Promise<BaseControllerResponse>;
    leaveConversation(UserId: string, Input: LeaveConversationInput, Request: Request): Promise<BaseControllerResponse>;
    joinChannel(UserId: string, Input: JoinChannelInput, Request: Request): Promise<BaseControllerResponse>;
}
