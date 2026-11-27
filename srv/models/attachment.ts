import { MessageAttachment, MessageAttachments } from '@models/apps/dflc/resenha/entities';
import { Upload } from '@models/ChatService';
import { MessageArgs } from '@/errors';
import { LAST_MESSAGE_PREVIEW_LENGTH } from '@/constants/conversations';
import { UPLOAD_KINDS } from '@/constants/media';
import { AuditProperties, BaseModel } from './base';

export type MediaPreview = {
    Key: string;
    Args: MessageArgs;
};

export type AttachmentProperties = AuditProperties & {
    Id: string;
    ConversationId: string;
    UploaderId: string;
    MessageId?: string;
    Kind: string;
    MimeType: string;
    FileName?: string;
    Size?: number;
    Width?: number;
    Height?: number;
    DurationSeconds?: number;
    ThumbnailMimeType?: string;
    UploadedAt?: string;
};

export class AttachmentModel extends BaseModel {

    constructor(private readonly properties: AttachmentProperties) { super(); }

    public static with(properties: AttachmentProperties): AttachmentModel {
        return new AttachmentModel(properties);
    }

    public static mapModel(Rows: MessageAttachments): AttachmentModel[] {

        return Rows.map((Row: MessageAttachment) => AttachmentModel.with({
            Id: Row.ID as string,
            ConversationId: Row.Conversation_ID as string,
            UploaderId: Row.Uploader_ID as string,
            MessageId: Row.Message_ID ?? undefined,
            Kind: Row.Kind as string,
            MimeType: Row.MimeType as string,
            FileName: Row.FileName ?? undefined,
            Size: Row.Size ?? undefined,
            Width: Row.Width ?? undefined,
            Height: Row.Height ?? undefined,
            DurationSeconds: Row.DurationSeconds ?? undefined,
            ThumbnailMimeType: Row.ThumbnailMimeType ?? undefined,
            UploadedAt: Row.UploadedAt ?? undefined,
            ...this.retrieveAudit(Row)
        }));

    }

    public get Id() { return this.properties.Id; }

    public get ConversationId() { return this.properties.ConversationId; }

    public get UploaderId() { return this.properties.UploaderId; }

    public get MessageId() { return this.properties.MessageId; }

    public get Kind() { return this.properties.Kind; }

    public get MimeType() { return this.properties.MimeType; }

    public get FileName() { return this.properties.FileName ?? ''; }

    public get Size() { return this.properties.Size ?? 0; }

    public get IsLinked(): boolean { return !!this.properties.MessageId; }

    public get IsUploaded(): boolean { return !!this.properties.UploadedAt; }

    public isOwnedBy(UserId: string): boolean {

        return this.properties.UploaderId === UserId;

    }


    public previewFor(Caption?: string): MediaPreview {

        const sCaption = (Caption ?? '').slice(0, LAST_MESSAGE_PREVIEW_LENGTH);

        if (sCaption) {
            return { Key: `preview.${this.previewPrefix()}Caption`, Args: { caption: sCaption } };
        }

        if (this.properties.Kind === UPLOAD_KINDS.File) {
            return { Key: 'preview.file', Args: { name: this.FileName } };
        }

        return { Key: `preview.${this.previewPrefix()}`, Args: {} };

    }


    public toEntityObject(): MessageAttachment {

        return this.cleanEntity({
            ID: this.properties.Id,
            Conversation_ID: this.properties.ConversationId,
            Uploader_ID: this.properties.UploaderId,
            Kind: this.properties.Kind as MessageAttachment['Kind'],
            MimeType: this.properties.MimeType,
            FileName: this.properties.FileName,
            Size: this.properties.Size,
            Width: this.properties.Width,
            Height: this.properties.Height,
            DurationSeconds: this.properties.DurationSeconds
        });

    }


    public toUpload(): Upload {

        return this.cleanEntity({
            ID: this.properties.Id,
            Kind: this.properties.Kind as Upload['Kind'],
            MimeType: this.properties.MimeType,
            FileName: this.properties.FileName,
            Size: this.properties.Size,
            Width: this.properties.Width,
            Height: this.properties.Height,
            DurationSeconds: this.properties.DurationSeconds,
            ThumbnailMimeType: this.properties.ThumbnailMimeType,
            UploadedAt: this.properties.UploadedAt
        });

    }


    private previewPrefix(): string {

        return this.properties.Kind.toLowerCase();

    }

}
