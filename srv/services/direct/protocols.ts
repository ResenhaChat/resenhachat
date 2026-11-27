import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type StartDirectInput = {
    User_ID?: string;
};

export interface DirectService extends BaseService<Conversation> {
    startDirect(UserId: string, Input: StartDirectInput, Request: Request): Promise<Either<AbstractError, Conversation>>;
}
