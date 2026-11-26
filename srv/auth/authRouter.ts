import '../configs/module-alias';
import express, { Router, type Request, type Response } from 'express';
import { BaseControllerResponse } from '@/controllers/base';
import { oAuthControllerFactory } from '@/factories/controllers/auth';
import { Messages } from '@/infrastructure/Messages';
import { AuthContext } from '@/services/auth';

const authRouter = Router();

authRouter.use(express.json());

function localeOf(req: Request): string | undefined {

    return req.headers['accept-language']?.split(',')[0]?.trim().slice(0, 2).toLowerCase() || undefined;

}


function contextOf(req: Request): AuthContext {

    return {
        ClientIp: req.ip || 'unknown',
        UserAgent: req.headers['user-agent']
    };

}


function bodyOf<Body extends object>(req: Request): Body {

    return (req.body && typeof req.body === 'object' ? req.body : {}) as Body;

}


function reply(req: Request, res: Response, Result: BaseControllerResponse): void {

    if (Result.status >= 400) {

        res.status(Result.status).json({ error: { message: Messages.text(Result.data as string, localeOf(req), Result.args) } });

        return;

    }

    if (Result.status === 204) {

        res.status(204).end();

        return;

    }

    res.status(Result.status).json(Result.data);

}


authRouter.post('/register', async (req, res) => {

    reply(req, res, await oAuthControllerFactory.register(bodyOf(req), contextOf(req)));

});


authRouter.post('/login', async (req, res) => {

    reply(req, res, await oAuthControllerFactory.login(bodyOf(req), contextOf(req)));

});


authRouter.post('/refresh', async (req, res) => {

    reply(req, res, await oAuthControllerFactory.refresh(bodyOf(req), contextOf(req)));

});


authRouter.post('/logout', async (req, res) => {

    reply(req, res, await oAuthControllerFactory.logout(bodyOf(req)));

});


authRouter.use((error: Error, req: Request, res: Response, _next: unknown) => {

    res.status(400).json({ error: { message: Messages.text('error.invalidRequest', localeOf(req)) } });

});

export const oAuthRouter = authRouter;
