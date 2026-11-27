import cds from '@sap/cds';
import jwt from 'jsonwebtoken';
import { AUTH_LIMITS } from '@/constants/auth-limits';

const DEV_SECRET = 'resenha-dev-secret-nao-usar-em-producao';

const MIN_SECRET_LENGTH = 32;

const MEDIA_AUDIENCE = 'media';

export type VerifiedToken = {
    UserId: string;
    ExpiresAt: number;
};

export class JwtTokens {

    private static secretValue?: string;


    public static assertConfigured(): void {

        this.secret();

    }


    public static sign(UserId: string): string {

        return jwt.sign({}, this.secret(), {
            algorithm: 'HS256',
            subject: UserId,
            expiresIn: AUTH_LIMITS.accessTokenSeconds
        });

    }


    public static signMedia(UserId: string): string {

        return jwt.sign({ aud: MEDIA_AUDIENCE }, this.secret(), {
            algorithm: 'HS256',
            subject: UserId,
            expiresIn: AUTH_LIMITS.mediaTokenSeconds
        });

    }


    public static verify(Token: string): VerifiedToken | null {

        return this.decode(Token, undefined);

    }


    public static verifyMedia(Token: string): VerifiedToken | null {

        return this.decode(Token, MEDIA_AUDIENCE);

    }


    private static decode(Token: string, Audience: string | undefined): VerifiedToken | null {

        try {

            const oPayload = jwt.verify(Token, this.secret(), { algorithms: ['HS256'] });

            if (typeof oPayload !== 'object' || typeof oPayload.sub !== 'string' || typeof oPayload.exp !== 'number') {
                return null;
            }

            if (oPayload.aud !== Audience) {
                return null;
            }

            return { UserId: oPayload.sub, ExpiresAt: oPayload.exp * 1000 };

        } catch {

            return null;

        }

    }


    private static secret(): string {

        if (this.secretValue) {
            return this.secretValue;
        }

        const sSecret = process.env.JWT_SECRET ?? '';

        if (cds.env.production) {

            if (!this.isStrong(sSecret)) {
                throw new Error(`JWT_SECRET must be set in production, with at least ${MIN_SECRET_LENGTH} characters and no unresolved placeholder`);
            }

            return this.remember(sSecret);

        }

        if (sSecret) {
            return this.remember(sSecret);
        }

        cds.log('auth').warn('JWT_SECRET not set: using the fixed development secret');

        return this.remember(DEV_SECRET);

    }


    private static isStrong(Secret: string): boolean {

        return Secret.length >= MIN_SECRET_LENGTH && !Secret.startsWith('${');

    }


    private static remember(Secret: string): string {

        this.secretValue = Secret;

        return Secret;

    }

}
