import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type MarkAsReadInput = {
    Conversation_ID?: string;
};

export interface ConversationService extends BaseService<Conversation> {
    markAsRead(UserId: string, Input: MarkAsReadInput, Request: Request): Promise<Either<AbstractError, boolean>>;
}
