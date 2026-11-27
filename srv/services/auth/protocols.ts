import { Either } from '@sweet-monads/either';
import { AbstractError } from '@/errors';
import { BaseService } from '../base';

export type RegisterInput = {
    Email?: unknown;
    Password?: unknown;
    DisplayName?: unknown;
    Username?: unknown;
};

export type LoginInput = {
    Login?: unknown;
    Password?: unknown;
};

export type RefreshInput = {
    RefreshToken?: unknown;
};

export type AuthContext = {
    ClientIp: string;
    UserAgent?: string;
};

export type AuthUser = {
    ID: string;
    DisplayName: string;
    Username: string;
    Email: string;
};

export type AuthResult = {
    AccessToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    MediaToken: string;
    MediaTokenExpiresAt: number;
    User: AuthUser;
};

export interface AuthService extends BaseService<unknown> {
    register(Input: RegisterInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>>;
    login(Input: LoginInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>>;
    refresh(Input: RefreshInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>>;
    logout(Input: RefreshInput): Promise<Either<AbstractError, boolean>>;
}
