import { UserModel } from '@/models/user';
import { BaseRepository } from '../base';

export interface UserRepository extends BaseRepository<UserModel> {
    findByLogin(Login: string): Promise<UserModel | null>;
    existsByEmail(Email: string): Promise<boolean>;
    existsByUsername(Username: string): Promise<boolean>;
    createWithSettings(User: UserModel): Promise<void>;
    updateLastSeen(UserId: string, LastSeenAt: string): Promise<void>;
    findNotificationsDisabled(UserIds: string[]): Promise<string[]>;
}
