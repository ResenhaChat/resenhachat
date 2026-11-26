import { RealtimeServer } from '@/realtime/server';
import { RealtimeServerImplementation } from '@/realtime/server/implementation';
import { oPresenceServiceFactory } from '../services/presence';
import { oRealtimeHubFactory } from './hub';

const makeRealtimeServer = (): RealtimeServer => {

    return new RealtimeServerImplementation(oRealtimeHubFactory, oPresenceServiceFactory);

};

export const oRealtimeServerFactory = makeRealtimeServer();
