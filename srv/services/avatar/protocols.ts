import { Request } from '@sap/cds';
import { Either } from '@sweet-monads/either';
import { AbstractError } from '@/errors';
import { MediaPayload } from '@/services/media/payload';
import { BaseService } from '../base';
import { UserModel } from '@/models/user';

export type AvatarChange = {
    Avatar: Buffer | null;
    AvatarMimeType: string | null;
};

export interface AvatarService extends BaseService<UserModel> {
    setUserAvatar(UserId: string, Payload: MediaPayload, Request: Request): Promise<Either<AbstractError, AvatarChange>>;
    clearUserAvatar(UserId: string, Request: Request): Promise<Either<AbstractError, AvatarChange>>;
    setConversationAvatar(UserId: string, ConversationId: string, Payload: MediaPayload, Request: Request): Promise<Either<AbstractError, AvatarChange>>;
    clearConversationAvatar(UserId: string, ConversationId: string, Request: Request): Promise<Either<AbstractError, AvatarChange>>;
}
