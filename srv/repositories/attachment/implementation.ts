import cds from '@sap/cds';
import { MessageAttachments } from '@models/apps/dflc/resenha/entities';
import { AttachmentModel } from '@/models/attachment';
import { AttachmentRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class AttachmentRepositoryImplementation extends BaseRepositoryImplementation<AttachmentModel> implements AttachmentRepository {

    public async create(Attachment: AttachmentModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(Attachment.toEntityObject()));

    }


    public async linkToMessage(Id: string, MessageId: string): Promise<number> {

        return cds.run(UPDATE(this.getEntity()).set({ Message_ID: MessageId }).where({ ID: Id, Message_ID: null }));

    }


    public async countPendingByUploader(UserId: string): Promise<number> {

        const oRow: { Total: number } | undefined = await cds.run(
            SELECT.one.from(this.getEntity()).columns('count(*) as Total').where({ Uploader_ID: UserId, Message_ID: null })
        );

        return Number(oRow?.Total ?? 0);

    }


    public async findByMessageId(MessageId: string): Promise<AttachmentModel | null> {

        const oRows = await cds.run(SELECT.from(this.getEntity()).columns(...this.columns()).where({ Message_ID: MessageId }));

        return this.mapResult(oRows)[0] ?? null;

    }


    protected columns(): string[] {

        return ['ID', 'Conversation_ID', 'Uploader_ID', 'Message_ID', 'Kind', 'MimeType', 'FileName', 'Size', 'Width', 'Height', 'DurationSeconds', 'ThumbnailMimeType', 'UploadedAt', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'];

    }


    protected entityName(): string {

        return 'MessageAttachments';

    }


    protected mapResult(Rows: unknown[]): AttachmentModel[] {

        return AttachmentModel.mapModel(Rows as MessageAttachments);

    }

}
