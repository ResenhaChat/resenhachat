import { MessageRepository } from '@/repositories/message';
import { MessageRepositoryImplementation } from '@/repositories/message/implementation';

const makeMessageRepository = (): MessageRepository => {

    return new MessageRepositoryImplementation();

};

export const oMessageRepositoryFactory = makeMessageRepository();
