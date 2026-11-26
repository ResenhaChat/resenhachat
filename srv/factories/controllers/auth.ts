import { AuthController } from '@/controllers/auth';
import { AuthControllerImplementation } from '@/controllers/auth/implementation';
import { oAuthServiceFactory } from '../services/auth';

const makeAuthController = (): AuthController => {

    return new AuthControllerImplementation(oAuthServiceFactory);

};

export const oAuthControllerFactory = makeAuthController();
