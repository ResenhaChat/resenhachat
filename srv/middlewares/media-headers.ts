import type { NextFunction, Request, Response } from 'express';
import { MEDIA_CACHE_CONTROL, MEDIA_READ_PATH_PATTERN } from '@/constants/media';

const HTTP_ERROR_STATUS = 400;

export function mediaHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {

    if (req.method !== 'GET' || !MEDIA_READ_PATH_PATTERN.test(req.path)) {
        next();
        return;
    }

    res.set('X-Content-Type-Options', 'nosniff');

    const fWriteHead = res.writeHead;

    res.writeHead = function writeHeadWithCache(this: Response, ...aArgs: unknown[]) {

        res.set('Cache-Control', res.statusCode < HTTP_ERROR_STATUS ? MEDIA_CACHE_CONTROL : 'no-store');

        return Reflect.apply(fWriteHead, this, aArgs);

    } as typeof res.writeHead;

    next();

}
