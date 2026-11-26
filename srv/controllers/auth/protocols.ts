import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { AuthContext, LoginInput, RefreshInput, RegisterInput } from '@/services/auth';

export interface AuthController extends BaseController<unknown> {
    register(Input: RegisterInput, Context: AuthContext): Promise<BaseControllerResponse>;
    login(Input: LoginInput, Context: AuthContext): Promise<BaseControllerResponse>;
    refresh(Input: RefreshInput, Context: AuthContext): Promise<BaseControllerResponse>;
    logout(Input: RefreshInput): Promise<BaseControllerResponse>;
}
