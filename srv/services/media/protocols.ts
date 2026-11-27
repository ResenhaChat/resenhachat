import { Either } from '@sweet-monads/either';
import { AbstractError } from '@/errors';
import { AttachmentModel } from '@/models/attachment';
import { BaseService } from '../base';
import { MediaPayload } from './payload';

export type CreateUploadInput = {
    Conversation_ID?: string;
    Kind?: string;
    MimeType?: string;
    FileName?: string;
    Size?: number;
    Width?: number;
    Height?: number;
    DurationSeconds?: number;
};

export type UploadContent = {
    Content: Buffer;
    MimeType: string;
    Size: number;
    Width?: number;
    Height?: number;
    Thumbnail?: Buffer;
    ThumbnailMimeType?: string;
    UploadedAt: string;
};

export type UploadThumbnail = {
    Thumbnail: Buffer;
    ThumbnailMimeType: string;
};

export type MediaDeliveryPlan = {
    MimeType: string;
    Inline: boolean;
};

export interface MediaService extends BaseService<AttachmentModel> {
    createUpload(UserId: string, Input: CreateUploadInput): Promise<Either<AbstractError, AttachmentModel>>;
    prepareContent(UserId: string, UploadId: string, Payload: MediaPayload): Promise<Either<AbstractError, UploadContent>>;
    prepareThumbnail(UserId: string, UploadId: string, Payload: MediaPayload): Promise<Either<AbstractError, UploadThumbnail>>;
    requireReadyUpload(UserId: string, ConversationId: string, UploadId: string): Promise<Either<AbstractError, AttachmentModel>>;
    linkToMessage(UploadId: string, MessageId: string): Promise<Either<AbstractError, boolean>>;
    deliveryOf(Kind: string, MimeType: string, Download: boolean, Property: string): MediaDeliveryPlan;
}
