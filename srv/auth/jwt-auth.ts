import '../configs/module-alias';
import cds, { User } from '@sap/cds';
import type { NextFunction, Request, Response } from 'express';
import { JwtTokens } from '@/infrastructure/JwtTokens';
import { Messages } from '@/infrastructure/Messages';

type AuthRequest = Request & { user?: User };

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

JwtTokens.assertConfigured();

function jwtAuth(req: AuthRequest, res: Response, next: NextFunction): void {

    const sHeader = req.headers.authorization;

    if (!sHeader) {

        next();

        return;

    }

    const sToken = BEARER_PATTERN.exec(sHeader)?.[1];
    const oVerified = sToken ? JwtTokens.verify(sToken) : null;

    if (!oVerified) {

        res.status(401).json({ error: { message: Messages.text('error.invalidToken', undefined) } });

        return;

    }

    const oUser = new cds.User({ id: oVerified.UserId, attr: {}, roles: [] });

    const oContext = cds.context;

    if (oContext) {
        oContext.user = oUser;
    }

    req.user = oUser;

    next();

}

export default jwtAuth;
