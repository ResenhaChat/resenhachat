import { RefreshTokenRepository } from '@/repositories/refresh-token';
import { RefreshTokenRepositoryImplementation } from '@/repositories/refresh-token/implementation';

const makeRefreshTokenRepository = (): RefreshTokenRepository => {

    return new RefreshTokenRepositoryImplementation();

};

export const oRefreshTokenRepositoryFactory = makeRefreshTokenRepository();
