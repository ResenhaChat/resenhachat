import { RealtimeHub } from '@/realtime/hub';
import { RealtimeHubImplementation } from '@/realtime/hub/implementation';

const makeRealtimeHub = (): RealtimeHub => {

    return new RealtimeHubImplementation();

};

export const oRealtimeHubFactory = makeRealtimeHub();
