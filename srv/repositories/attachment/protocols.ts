import { AttachmentModel } from '@/models/attachment';
import { BaseRepository } from '../base';

export interface AttachmentRepository extends BaseRepository<AttachmentModel> {
    create(Attachment: AttachmentModel): Promise<void>;
    linkToMessage(Id: string, MessageId: string): Promise<number>;
    countPendingByUploader(UserId: string): Promise<number>;
    findByMessageId(MessageId: string): Promise<AttachmentModel | null>;
}
