import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Message } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type SendMessageInput = {
    Conversation_ID?: string;
    Text?: string;
    ReplyTo_ID?: string;
};

export interface MessageService extends BaseService<Message> {
    sendMessage(UserId: string, Input: SendMessageInput, Request: Request): Promise<Either<AbstractError, Message>>;
}
