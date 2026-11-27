import { MediaController } from '@/controllers/media';
import { MediaControllerImplementation } from '@/controllers/media/implementation';
import { oMediaServiceFactory } from '../services/media';

const makeMediaController = (): MediaController => {

    return new MediaControllerImplementation(oMediaServiceFactory);

};

export const oMediaControllerFactory = makeMediaController();
