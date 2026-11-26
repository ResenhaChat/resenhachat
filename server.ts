import './srv/configs/module-alias';
import cds from '@sap/cds';
import { oAuthRouter } from './srv/auth/authRouter';
import { corsMiddleware } from './srv/middlewares/cors';
import { JwtTokens } from './srv/infrastructure/JwtTokens';
import { oRealtimeServerFactory } from './srv/factories/realtime/server';

cds.on('bootstrap', (app) => {

    JwtTokens.assertConfigured();

    app.set('trust proxy', 1);
    app.use(corsMiddleware);
    app.use('/auth', oAuthRouter);

});

cds.on('listening', ({ server }) => {

    oRealtimeServerFactory.attach(server);

});

module.exports = cds.server;
