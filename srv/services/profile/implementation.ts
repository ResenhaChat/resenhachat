import { Request, User } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Me } from '@models/ChatService';
import { AbstractError, ValidationError } from '@/errors';
import { RealtimeHub } from '@/realtime/hub';
import { BaseServiceImplementation } from '../base/implementation';
import { ProfileService } from './protocols';

const PUBLIC_PROFILE_FIELDS: readonly string[] = ['DisplayName', 'About'];

export class ProfileServiceImplementation extends BaseServiceImplementation<Me> implements ProfileService {

    constructor(private readonly Hub: RealtimeHub) {

        super();

    }


    public async beforeUpdate(Profile: Me, LoggedUser: User): Promise<Either<AbstractError, boolean>> {

        if ('DisplayName' in Profile && this.isBlank(Profile.DisplayName)) {
            return left(new ValidationError('error.displayNameRequired'));
        }

        if ('Avatar' in Profile || 'AvatarMimeType' in Profile) {
            return left(new ValidationError('error.avatarFieldNotEditable'));
        }

        return right(true);

    }


    public announceUpdate(UserId: string, ChangedFields: string[], Request: Request): void {

        if (!ChangedFields.some((sField) => PUBLIC_PROFILE_FIELDS.includes(sField))) {
            return;
        }

        Request.on('succeeded', () => this.Hub.publish(this.Hub.onlineUserIds(), {
            type: 'user.updated',
            payload: { UserId }
        }));

    }

}
