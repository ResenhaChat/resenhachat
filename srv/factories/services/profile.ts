import { ProfileService } from '@/services/profile';
import { ProfileServiceImplementation } from '@/services/profile/implementation';


const makeProfileService = (): ProfileService => {

    return new ProfileServiceImplementation();

};

export const oProfileServiceFactory = makeProfileService();
