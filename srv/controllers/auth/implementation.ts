import { BaseControllerResponse } from '@/controllers/base';
import { AuthContext, AuthService, LoginInput, RefreshInput, RegisterInput } from '@/services/auth';
import { AuthController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class AuthControllerImplementation extends BaseControllerImplementation<unknown> implements AuthController {

    constructor(protected readonly Service: AuthService) {

        super();

    }


    public async register(Input: RegisterInput, Context: AuthContext): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.register(Input, Context), 201);

    }


    public async login(Input: LoginInput, Context: AuthContext): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.login(Input, Context), 200);

    }


    public async refresh(Input: RefreshInput, Context: AuthContext): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.refresh(Input, Context), 200);

    }


    public async logout(Input: RefreshInput): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.logout(Input), 204);

    }

}
