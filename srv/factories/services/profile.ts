import { ProfileService } from '@/services/profile';
import { ProfileServiceImplementation } from '@/services/profile/implementation';
import { oRealtimeHubFactory } from '../realtime/hub';

const makeProfileService = (): ProfileService => {

    return new ProfileServiceImplementation(oRealtimeHubFactory);

};

export const oProfileServiceFactory = makeProfileService();
