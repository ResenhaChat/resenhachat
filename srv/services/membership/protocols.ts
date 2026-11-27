import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type AddMembersInput = {
    Conversation_ID?: string;
    UserIds?: string[];
};

export type RemoveMemberInput = {
    Conversation_ID?: string;
    User_ID?: string;
};

export type LeaveConversationInput = {
    Conversation_ID?: string;
};

export type JoinChannelInput = {
    Conversation_ID?: string;
};

export interface MembershipService extends BaseService<Conversation> {
    addMembers(UserId: string, Input: AddMembersInput, Request: Request): Promise<Either<AbstractError, boolean>>;
    removeMember(UserId: string, Input: RemoveMemberInput, Request: Request): Promise<Either<AbstractError, boolean>>;
    leaveConversation(UserId: string, Input: LeaveConversationInput, Request: Request): Promise<Either<AbstractError, boolean>>;
    joinChannel(UserId: string, Input: JoinChannelInput, Request: Request): Promise<Either<AbstractError, Conversation>>;
}
