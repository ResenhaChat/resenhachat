import { AttachmentRepository } from '@/repositories/attachment';
import { AttachmentRepositoryImplementation } from '@/repositories/attachment/implementation';

const makeAttachmentRepository = (): AttachmentRepository => {

    return new AttachmentRepositoryImplementation();

};

export const oAttachmentRepositoryFactory = makeAttachmentRepository();
