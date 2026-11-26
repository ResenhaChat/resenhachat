import { PresenceController } from '@/controllers/presence';
import { PresenceControllerImplementation } from '@/controllers/presence/implementation';
import { oPresenceServiceFactory } from '../services/presence';

const makePresenceController = (): PresenceController => {

    return new PresenceControllerImplementation(oPresenceServiceFactory);

};

export const oPresenceControllerFactory = makePresenceController();
