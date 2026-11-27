import cds from '@sap/cds';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Either, left, right } from '@sweet-monads/either';
import { AbstractError, ConflictError, TooManyRequestsError, UnauthorizedError, ValidationError } from '@/errors';
import { AUTH_LIMITS, EMAIL_PATTERN, USERNAME_PATTERN } from '@/constants/auth-limits';
import { GENERAL_CONVERSATION_ID } from '@/constants/conversations';
import { JwtTokens } from '@/infrastructure/JwtTokens';
import { RateLimiter } from '@/infrastructure/RateLimiter';
import { ConversationMemberModel } from '@/models/conversation-member';
import { RefreshTokenModel } from '@/models/refresh-token';
import { UserModel } from '@/models/user';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { RefreshTokenRepository } from '@/repositories/refresh-token';
import { UserRepository } from '@/repositories/user';
import { AuthContext, AuthResult, AuthService, LoginInput, RefreshInput, RegisterInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

type ValidRegistration = {
    Email: string;
    Password: string;
    DisplayName: string;
    Username: string;
};

export class AuthServiceImplementation extends BaseServiceImplementation<unknown> implements AuthService {

    private readonly limiter = new RateLimiter(AUTH_LIMITS.maxAttemptsPerWindow, AUTH_LIMITS.windowInMinutes);

    private readonly accountLimiter = new RateLimiter(AUTH_LIMITS.maxLoginAttemptsPerAccount, AUTH_LIMITS.windowInMinutes);

    private readonly decoyHash = bcrypt.hashSync(randomBytes(8).toString('hex'), AUTH_LIMITS.bcryptCost);


    constructor(
        private readonly Users: UserRepository,
        private readonly RefreshTokens: RefreshTokenRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository
    ) {

        super();

    }


    public async register(Input: RegisterInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>> {

        const oValidation = this.validateRegistration(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        if (!this.limiter.tryConsume(Context.ClientIp)) {
            return left(new TooManyRequestsError());
        }

        return this.execute(async () => {

            const oData = oValidation.value;
            const oConflict = await this.checkUnique(oData);

            if (oConflict) {
                return left(oConflict);
            }

            const oUser = UserModel.with({
                Id: this.generateUUID(),
                Email: oData.Email,
                PasswordHash: await bcrypt.hash(oData.Password, AUTH_LIMITS.bcryptCost),
                DisplayName: oData.DisplayName,
                Username: oData.Username
            });

            const oRaceConflict = await this.persistAccount(oUser, oData);

            if (oRaceConflict) {
                return left(oRaceConflict);
            }

            return right(await this.issueTokens(oUser, Context));

        });

    }


    public async login(Input: LoginInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>> {

        const { Login, Password } = Input;

        if (!this.isCredential(Login) || !this.isCredential(Password)) {
            return left(new ValidationError('error.credentialsRequired'));
        }

        const sLogin = Login.trim().toLowerCase();

        if (!this.limiter.tryConsume(Context.ClientIp) || !this.accountLimiter.tryConsume(`login:${sLogin}`)) {
            return left(new TooManyRequestsError());
        }

        return this.execute(async () => {

            const oUser = await this.Users.findByLogin(sLogin);
            const bValid = await bcrypt.compare(Password, oUser?.PasswordHash ?? this.decoyHash);

            if (!oUser || !bValid) {

                cds.log('auth').warn('Login rejected from', Context.ClientIp);

                return left(new UnauthorizedError('error.invalidCredentials'));

            }

            return right(await this.issueTokens(oUser, Context));

        });

    }


    public async refresh(Input: RefreshInput, Context: AuthContext): Promise<Either<AbstractError, AuthResult>> {

        const { RefreshToken } = Input;

        if (!this.isCredential(RefreshToken)) {
            return left(new ValidationError('error.refreshTokenRequired'));
        }

        return this.execute(async () => {

            const oToken = await this.RefreshTokens.findByHash(this.hash(RefreshToken));

            if (!oToken) {
                return left(new UnauthorizedError('error.invalidRefreshToken'));
            }

            if (oToken.IsRevoked) {

                await this.RefreshTokens.revokeAllForUser(oToken.UserId);

                return left(new UnauthorizedError('error.invalidRefreshToken'));

            }

            const oUser = oToken.IsActive ? await this.Users.findById(oToken.UserId) : null;

            if (!oUser) {
                return left(new UnauthorizedError('error.invalidRefreshToken'));
            }

            return cds.tx(() => this.rotate(oToken, oUser, Context));

        });

    }


    public async logout(Input: RefreshInput): Promise<Either<AbstractError, boolean>> {

        const { RefreshToken } = Input;

        if (!this.isCredential(RefreshToken)) {
            return left(new ValidationError('error.refreshTokenRequired'));
        }

        return this.execute(async () => {

            const oToken = await this.RefreshTokens.findByHash(this.hash(RefreshToken));

            if (oToken?.IsActive) {
                await this.RefreshTokens.revoke(oToken.Id, new Date().toISOString());
            }

            return right(true);

        });

    }


    private validateRegistration(Input: RegisterInput): Either<AbstractError, ValidRegistration> {

        const sEmail = typeof Input.Email === 'string' ? Input.Email.trim().toLowerCase() : '';
        const sUsername = typeof Input.Username === 'string' ? Input.Username.trim().toLowerCase() : '';
        const sDisplayName = typeof Input.DisplayName === 'string' ? Input.DisplayName.trim() : '';
        const sPassword = typeof Input.Password === 'string' ? Input.Password : '';

        if (!EMAIL_PATTERN.test(sEmail) || sEmail.length > AUTH_LIMITS.maxEmailLength) {
            return left(new ValidationError('error.emailInvalid'));
        }

        if (sPassword.length < AUTH_LIMITS.minPasswordLength || sPassword.length > AUTH_LIMITS.maxPasswordLength) {
            return left(new ValidationError('error.passwordLength', {
                min: AUTH_LIMITS.minPasswordLength,
                max: AUTH_LIMITS.maxPasswordLength
            }));
        }

        if (!sDisplayName || sDisplayName.length > AUTH_LIMITS.maxDisplayNameLength) {
            return left(new ValidationError('error.displayNameRequired'));
        }

        if (!USERNAME_PATTERN.test(sUsername)) {
            return left(new ValidationError('error.usernameInvalid'));
        }

        return right({ Email: sEmail, Password: sPassword, DisplayName: sDisplayName, Username: sUsername });

    }


    private async checkUnique(Data: ValidRegistration): Promise<AbstractError | null> {

        if (await this.Users.existsByEmail(Data.Email)) {
            return new ConflictError('error.emailInUse');
        }

        if (await this.Users.existsByUsername(Data.Username)) {
            return new ConflictError('error.usernameInUse');
        }

        return null;

    }


    private async persistAccount(User: UserModel, Data: ValidRegistration): Promise<AbstractError | null> {

        try {

            await cds.tx(() => this.createAccount(User));

            return null;

        } catch (oError) {

            const oRaceConflict = await this.checkUnique(Data);

            if (oRaceConflict) {
                return oRaceConflict;
            }

            throw oError;

        }

    }


    private async createAccount(User: UserModel): Promise<void> {

        const sNow = new Date().toISOString();

        await this.Conversations.ensureGeneral();
        await this.Users.createWithSettings(User);
        await this.Members.create(ConversationMemberModel.with({
            Id: this.generateUUID(),
            ConversationId: GENERAL_CONVERSATION_ID,
            UserId: User.Id,
            Role: 'Member',
            JoinedAt: sNow,
            LastReadAt: sNow
        }));

    }


    private async rotate(Token: RefreshTokenModel, User: UserModel, Context: AuthContext): Promise<Either<AbstractError, AuthResult>> {

        const iRevoked = await this.RefreshTokens.revoke(Token.Id, new Date().toISOString());

        if (iRevoked === 0) {
            return left(new UnauthorizedError('error.invalidRefreshToken'));
        }

        return right(await this.issueTokens(User, Context));

    }


    private async issueTokens(User: UserModel, Context: AuthContext): Promise<AuthResult> {

        const sRefreshToken = randomBytes(AUTH_LIMITS.refreshTokenBytes).toString('base64url');
        const iExpiresAt = Date.now() + AUTH_LIMITS.refreshTokenDays * 24 * 60 * 60 * 1000;

        await this.RefreshTokens.create(RefreshTokenModel.with({
            Id: this.generateUUID(),
            UserId: User.Id,
            TokenHash: this.hash(sRefreshToken),
            ExpiresAt: new Date(iExpiresAt).toISOString(),
            UserAgent: Context.UserAgent?.slice(0, 255)
        }));

        return {
            AccessToken: JwtTokens.sign(User.Id),
            RefreshToken: sRefreshToken,
            ExpiresIn: AUTH_LIMITS.accessTokenSeconds,
            MediaToken: JwtTokens.signMedia(User.Id),
            MediaTokenExpiresAt: Date.now() + AUTH_LIMITS.mediaTokenSeconds * 1000,
            User: { ID: User.Id, DisplayName: User.DisplayName, Username: User.Username, Email: User.Email }
        };

    }


    private hash(Token: string): string {

        return createHash('sha256').update(Token).digest('hex');

    }


    private isCredential(Value: unknown): Value is string {

        return typeof Value === 'string' && Value.trim().length > 0 && Value.length <= AUTH_LIMITS.maxCredentialLength;

    }

}
