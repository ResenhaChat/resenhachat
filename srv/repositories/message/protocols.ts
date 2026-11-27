import { MessageModel } from '@/models/message';
import { BaseRepository } from '../base';

export interface MessageRepository extends BaseRepository<MessageModel> {
    create(Message: MessageModel): Promise<void>;
    createMany(Batch: MessageModel[]): Promise<void>;
}
