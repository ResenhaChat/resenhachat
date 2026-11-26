import { User } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Me } from '@models/ChatService';
import { AbstractError, ValidationError } from '@/errors';
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/constants/avatar';
import { BaseServiceImplementation } from '../base/implementation';
import { ProfileService } from './protocols';

export class ProfileServiceImplementation extends BaseServiceImplementation<Me> implements ProfileService {

    public async beforeUpdate(Profile: Me, LoggedUser: User): Promise<Either<AbstractError, boolean>> {

        if ('DisplayName' in Profile && this.isBlank(Profile.DisplayName)) {
            return left(new ValidationError('error.displayNameRequired'));
        }

        if ('AvatarMimeType' in Profile && !this.isAllowedMimeType(Profile.AvatarMimeType)) {
            return left(new ValidationError('error.avatarMimeType'));
        }

        if ('Avatar' in Profile && this.byteSizeOf(Profile.Avatar) > AVATAR_MAX_BYTES) {
            return left(new ValidationError('error.avatarTooLarge', { max: AVATAR_MAX_BYTES }));
        }

        return right(true);

    }


    private isAllowedMimeType(MimeType: unknown): boolean {

        return MimeType === null || (typeof MimeType === 'string' && AVATAR_MIME_TYPES.includes(MimeType));

    }


    private byteSizeOf(Avatar: unknown): number {

        if (typeof Avatar === 'string') {
            return Buffer.byteLength(Avatar, 'base64');
        }

        if (Buffer.isBuffer(Avatar)) {
            return Avatar.length;
        }

        return 0;

    }

}
