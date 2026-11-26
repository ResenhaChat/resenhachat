import { RefreshTokenModel } from '@/models/refresh-token';
import { BaseRepository } from '../base';

export interface RefreshTokenRepository extends BaseRepository<RefreshTokenModel> {
    findByHash(TokenHash: string): Promise<RefreshTokenModel | null>;
    create(Token: RefreshTokenModel): Promise<void>;
    revoke(Id: string, RevokedAt: string): Promise<number>;
    revokeAllForUser(UserId: string): Promise<void>;
}
