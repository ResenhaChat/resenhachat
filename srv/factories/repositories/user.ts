import { UserRepository } from '@/repositories/user';
import { UserRepositoryImplementation } from '@/repositories/user/implementation';

const makeUserRepository = (): UserRepository => {

    return new UserRepositoryImplementation();

};

export const oUserRepositoryFactory = makeUserRepository();
