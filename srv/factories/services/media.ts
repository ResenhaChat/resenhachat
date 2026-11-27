import { MediaService } from '@/services/media';
import { MediaServiceImplementation } from '@/services/media/implementation';
import { oAttachmentRepositoryFactory } from '../repositories/attachment';
import { oAccessServiceFactory } from './access';

const makeMediaService = (): MediaService => {

    return new MediaServiceImplementation(oAttachmentRepositoryFactory, oAccessServiceFactory);

};

export const oMediaServiceFactory = makeMediaService();
