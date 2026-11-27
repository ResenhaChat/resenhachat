import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type CreateConversationInput = {
    Kind?: string;
    Name?: string;
    Description?: string;
    MemberIds?: string[];
    IsPublic?: boolean;
    OnlyAdminsCanPost?: boolean;
};

export interface GroupService extends BaseService<Conversation> {
    createConversation(UserId: string, Input: CreateConversationInput, Request: Request): Promise<Either<AbstractError, Conversation>>;
    updateConversation(UserId: string, Entity: Conversation, Request: Request): Promise<Either<AbstractError, boolean>>;
}
