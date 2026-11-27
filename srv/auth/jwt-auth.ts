import '../configs/module-alias';
import cds, { User } from '@sap/cds';
import type { NextFunction, Request, Response } from 'express';
import { MEDIA_READ_PATH_PATTERN, MEDIA_TOKEN_PARAM_PATTERN } from '@/constants/media';
import { JwtTokens, VerifiedToken } from '@/infrastructure/JwtTokens';
import { Messages } from '@/infrastructure/Messages';

type AuthRequest = Request & { user?: User };

type Credential = { Verified: VerifiedToken | null };

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

JwtTokens.assertConfigured();

function jwtAuth(req: AuthRequest, res: Response, next: NextFunction): void {

    const oCredential = credentialOf(req);

    if (!oCredential) {

        next();

        return;

    }

    if (!oCredential.Verified) {

        res.status(401).json({ error: { message: Messages.text('error.invalidToken', undefined) } });

        return;

    }

    const oUser = new cds.User({ id: oCredential.Verified.UserId, attr: {}, roles: [] });

    const oContext = cds.context;

    if (oContext) {
        oContext.user = oUser;
    }

    req.user = oUser;

    next();

}


function credentialOf(req: AuthRequest): Credential | undefined {

    const sHeader = req.headers.authorization;

    if (sHeader) {

        const sToken = BEARER_PATTERN.exec(sHeader)?.[1];

        return { Verified: sToken ? JwtTokens.verify(sToken) : null };

    }

    return mediaCredentialOf(req);

}


function mediaCredentialOf(req: AuthRequest): Credential | undefined {

    const sMediaToken = req.query.mt;

    if (req.method !== 'GET' || !MEDIA_READ_PATH_PATTERN.test(pathOf(req)) || typeof sMediaToken !== 'string') {
        return undefined;
    }

    const oVerified = JwtTokens.verifyMedia(sMediaToken);

    removeMediaToken(req);

    return { Verified: oVerified };

}


function removeMediaToken(req: AuthRequest): void {

    req.url = req.url.replace(MEDIA_TOKEN_PARAM_PATTERN, (_sMatch: string, sSeparator: string, sEnd: string) => (sEnd ? sSeparator : ''));

    if (req.originalUrl) {
        req.originalUrl = req.originalUrl.replace(MEDIA_TOKEN_PARAM_PATTERN, (_sMatch: string, sSeparator: string, sEnd: string) => (sEnd ? sSeparator : ''));
    }

}


function pathOf(req: AuthRequest): string {

    return (req.originalUrl ?? req.url).split('?')[0];

}


export default jwtAuth;
