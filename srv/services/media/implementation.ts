import { Either, left, right } from '@sweet-monads/either';
import { AbstractError, ConflictError, NotFoundError, PermissionDenied, TooManyRequestsError, ValidationError } from '@/errors';
import { UUID_PATTERN } from '@/constants/ids';
import { BLOCKED_FILE_EXTENSIONS, FILE_NAME_CONTROL_PATTERN, FILE_NAME_MAX_LENGTH, FILE_NAME_TRAILING_PATTERN, IMAGE_MIME_TYPES, MEDIA_LIMITS, MIME_TYPE_PATTERN, PDF_MIME_TYPE, THUMBNAIL_MIME_TYPES, UPLOAD_KINDS, VIDEO_MIME_TYPES } from '@/constants/media';
import { ImageProcessor } from '@/infrastructure/ImageProcessor';
import { MediaSignature } from '@/infrastructure/MediaSignature';
import { AttachmentModel } from '@/models/attachment';
import { AttachmentRepository } from '@/repositories/attachment';
import { AccessService } from '@/services/access';
import { BaseServiceImplementation } from '../base/implementation';
import { CreateUploadInput, MediaDeliveryPlan, MediaService, UploadContent, UploadThumbnail } from './protocols';
import { MediaPayload, MediaPayloadRules, SizeLimit } from './payload';

type ValidMeasures = {
    Width?: number;
    Height?: number;
    DurationSeconds?: number;
};

type ValidUpload = ValidMeasures & {
    ConversationId: string;
    Kind: string;
    MimeType: string;
    FileName: string;
    Size: number;
};

const THUMBNAIL_LIMIT: SizeLimit = { Bytes: MEDIA_LIMITS.thumbnailMaxBytes, Key: 'error.thumbnailTooLarge', Unit: 1024 };

const KIND_VALUES: readonly string[] = Object.values(UPLOAD_KINDS);

const INLINE_MIME_PATTERN = /^(image|video)\//;

const OCTET_STREAM = 'application/octet-stream';

const THUMBNAIL_PROPERTY = 'Thumbnail';

export class MediaServiceImplementation extends BaseServiceImplementation<AttachmentModel> implements MediaService {

    private activeWrites = 0;

    constructor(
        private readonly Repository: AttachmentRepository,
        private readonly Access: AccessService
    ) {

        super();

    }


    public async createUpload(UserId: string, Input: CreateUploadInput): Promise<Either<AbstractError, AttachmentModel>> {

        const oValidation = this.validate(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const oUpload = oValidation.value;
            const oAccess = await this.Access.requirePoster(oUpload.ConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            if (await this.Repository.countPendingByUploader(UserId) >= MEDIA_LIMITS.maxPendingUploads) {
                return left(new TooManyRequestsError('error.tooManyPendingUploads'));
            }

            const oAttachment = AttachmentModel.with({ ...oUpload, Id: this.generateUUID(), UploaderId: UserId });

            await this.Repository.create(oAttachment);

            return right(oAttachment);

        });

    }


    public async prepareContent(UserId: string, UploadId: string, Payload: MediaPayload): Promise<Either<AbstractError, UploadContent>> {

        return this.withWriteSlot(() => this.execute(async () => {

            const oLoaded = await this.requireOwnUnlinked(UserId, UploadId);

            if (oLoaded.isLeft()) {
                return left(oLoaded.value);
            }

            const oUpload = oLoaded.value;

            if (Payload.ContentType !== oUpload.MimeType) {
                return left(new ValidationError('error.mimeMismatch'));
            }

            const oDeclared = this.checkDeclaredSize(Payload, oUpload);

            if (oDeclared.isLeft()) {
                return left(oDeclared.value);
            }

            const oRead = await MediaPayloadRules.read(Payload, this.declaredLimit(oUpload));

            if (oRead.isLeft()) {
                return left(oRead.value);
            }

            return this.processContent(oUpload, oRead.value);

        }));

    }


    public async prepareThumbnail(UserId: string, UploadId: string, Payload: MediaPayload): Promise<Either<AbstractError, UploadThumbnail>> {

        return this.withWriteSlot(() => this.execute(async () => {

            const oLoaded = await this.requireOwnUnlinked(UserId, UploadId);

            if (oLoaded.isLeft()) {
                return left(oLoaded.value);
            }

            if (!this.acceptsThumbnail(oLoaded.value)) {
                return left(new ValidationError('error.thumbnailNotAllowed'));
            }

            const oType = MediaPayloadRules.checkMimeType(Payload, THUMBNAIL_MIME_TYPES);
            const oLength = oType.isLeft() ? oType : MediaPayloadRules.checkLength(Payload, THUMBNAIL_LIMIT);

            if (oLength.isLeft()) {
                return left(oLength.value);
            }

            const oRead = await MediaPayloadRules.read(Payload, THUMBNAIL_LIMIT);

            if (oRead.isLeft()) {
                return left(oRead.value);
            }

            const oThumbnail = await ImageProcessor.thumbnail(oRead.value, Payload.ContentType);

            return oThumbnail ? right({ Thumbnail: oThumbnail, ThumbnailMimeType: 'image/webp' }) : left(new ValidationError('error.invalidImage'));

        }));

    }


    public async requireReadyUpload(UserId: string, ConversationId: string, UploadId: string): Promise<Either<AbstractError, AttachmentModel>> {

        return this.execute(async () => {

            const oLoaded = await this.requireOwner(UserId, UploadId);

            if (oLoaded.isLeft()) {
                return left(oLoaded.value);
            }

            const oUpload = oLoaded.value;

            if (oUpload.ConversationId !== ConversationId) {
                return left(new PermissionDenied('error.uploadOtherConversation'));
            }

            if (oUpload.IsLinked) {
                return left(new ConflictError('error.uploadAlreadyUsed'));
            }

            if (!oUpload.IsUploaded) {
                return left(new ValidationError('error.uploadNotReady'));
            }

            return right(oUpload);

        });

    }


    public async linkToMessage(UploadId: string, MessageId: string): Promise<Either<AbstractError, boolean>> {

        const iLinked = await this.Repository.linkToMessage(UploadId, MessageId);

        return iLinked === 1 ? right(true) : left(new ConflictError('error.uploadAlreadyUsed'));

    }


    public deliveryOf(Kind: string, MimeType: string, Download: boolean, Property: string): MediaDeliveryPlan {

        if (Property === THUMBNAIL_PROPERTY) {
            return { MimeType, Inline: true };
        }

        const bInline = !Download && Kind !== UPLOAD_KINDS.File && INLINE_MIME_PATTERN.test(MimeType);

        return { MimeType: bInline ? MimeType : OCTET_STREAM, Inline: bInline };

    }


    private validate(Input: CreateUploadInput): Either<AbstractError, ValidUpload> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        const sKind = Input.Kind ?? '';

        if (!KIND_VALUES.includes(sKind)) {
            return left(new ValidationError('error.kindInvalid'));
        }

        const sMimeType = typeof Input.MimeType === 'string' ? Input.MimeType.trim().toLowerCase() : '';

        if (!MIME_TYPE_PATTERN.test(sMimeType) || !this.isMimeAllowed(sKind, sMimeType)) {
            return left(new ValidationError('error.mimeNotAllowed'));
        }

        const oName = this.validateFileName(Input.FileName);

        if (oName.isLeft()) {
            return left(oName.value);
        }

        return this.validateSize(Input.Size, sKind).chain((iSize) => this.validateMeasures(Input).map((oMeasures) => ({
            ...oMeasures,
            ConversationId: Input.Conversation_ID as string,
            Kind: sKind,
            MimeType: sMimeType,
            FileName: oName.value,
            Size: iSize
        })));

    }


    private validateFileName(FileName: string | undefined): Either<AbstractError, string> {

        const sName = (FileName ?? '').replace(FILE_NAME_CONTROL_PATTERN, '').trim().replace(FILE_NAME_TRAILING_PATTERN, '');

        if (!sName) {
            return left(new ValidationError('error.fileNameRequired'));
        }

        if (sName.length > FILE_NAME_MAX_LENGTH) {
            return left(new ValidationError('error.fileNameTooLong', { max: FILE_NAME_MAX_LENGTH }));
        }

        if (BLOCKED_FILE_EXTENSIONS.includes(this.extensionOf(sName))) {
            return left(new ValidationError('error.fileExtensionNotAllowed'));
        }

        return right(sName);

    }


    private validateSize(Size: number | undefined, Kind: string): Either<AbstractError, number> {

        if (!Number.isInteger(Size) || (Size as number) <= 0) {
            return left(new ValidationError('error.fileSizeInvalid'));
        }

        const iMaxBytes = this.maxBytesOf(Kind);

        if ((Size as number) > iMaxBytes) {
            return left(MediaPayloadRules.tooLarge(MediaPayloadRules.megabytes(iMaxBytes)));
        }

        return right(Size as number);

    }


    private validateMeasures(Input: CreateUploadInput): Either<AbstractError, ValidMeasures> {

        const bDimensionsValid = [Input.Width, Input.Height].every((iValue) => iValue === undefined || this.isInRange(iValue, MEDIA_LIMITS.maxPixelDimension));

        if (!bDimensionsValid) {
            return left(new ValidationError('error.dimensionInvalid', { max: MEDIA_LIMITS.maxPixelDimension }));
        }

        if (Input.DurationSeconds !== undefined && !this.isInRange(Input.DurationSeconds, MEDIA_LIMITS.maxDurationSeconds)) {
            return left(new ValidationError('error.durationInvalid', { max: MEDIA_LIMITS.maxDurationSeconds }));
        }

        return right({ Width: Input.Width, Height: Input.Height, DurationSeconds: Input.DurationSeconds });

    }


    private isInRange(Value: unknown, Max: number): boolean {

        return Number.isInteger(Value) && (Value as number) > 0 && (Value as number) <= Max;

    }


    private async requireOwner(UserId: string, UploadId: string): Promise<Either<AbstractError, AttachmentModel>> {

        if (!UUID_PATTERN.test(UploadId)) {
            return left(new NotFoundError('error.uploadNotFound'));
        }

        const oUpload = await this.Repository.findById(UploadId);

        if (!oUpload || !oUpload.isOwnedBy(UserId)) {
            return left(new NotFoundError('error.uploadNotFound'));
        }

        return right(oUpload);

    }


    private async requireOwnUnlinked(UserId: string, UploadId: string): Promise<Either<AbstractError, AttachmentModel>> {

        const oLoaded = await this.requireOwner(UserId, UploadId);

        if (oLoaded.isLeft()) {
            return oLoaded;
        }

        if (oLoaded.value.IsLinked) {
            return left(new ConflictError('error.uploadAlreadyUsed'));
        }

        return oLoaded;

    }


    private checkDeclaredSize(Payload: MediaPayload, Upload: AttachmentModel): Either<AbstractError, MediaPayload> {

        const oLength = MediaPayloadRules.checkLength(Payload, this.declaredLimit(Upload));

        if (oLength.isLeft()) {
            return oLength;
        }

        if ((Payload.ContentLength as number) > this.maxBytesOf(Upload.Kind)) {
            return left(MediaPayloadRules.tooLarge(MediaPayloadRules.megabytes(this.maxBytesOf(Upload.Kind))));
        }

        return right(Payload);

    }


    private declaredLimit(Upload: AttachmentModel): SizeLimit {

        return { Bytes: Upload.Size, Key: 'error.uploadSizeMismatch', Unit: 1 };

    }


    private async processContent(Upload: AttachmentModel, Content: Buffer): Promise<Either<AbstractError, UploadContent>> {

        const sUploadedAt = new Date().toISOString();

        if (Upload.Kind === UPLOAD_KINDS.Image) {
            return this.processImage(Upload, Content, sUploadedAt);
        }

        if (Upload.Kind === UPLOAD_KINDS.Video && !MediaSignature.isVideo(Content, Upload.MimeType)) {
            return left(new ValidationError('error.invalidVideo'));
        }

        return right({ Content, MimeType: Upload.MimeType, Size: Content.length, UploadedAt: sUploadedAt });

    }


    private async processImage(Upload: AttachmentModel, Source: Buffer, UploadedAt: string): Promise<Either<AbstractError, UploadContent>> {

        const oImage = await ImageProcessor.process(Source, Upload.MimeType);

        if (!oImage) {
            return left(new ValidationError('error.invalidImage'));
        }

        return right({
            Content: oImage.Content,
            MimeType: oImage.MimeType,
            Size: oImage.Content.length,
            Width: oImage.Width,
            Height: oImage.Height,
            Thumbnail: oImage.Thumbnail,
            ThumbnailMimeType: 'image/webp',
            UploadedAt
        });

    }


    private async withWriteSlot<Result>(Operation: () => Promise<Either<AbstractError, Result>>): Promise<Either<AbstractError, Result>> {

        if (this.activeWrites >= MEDIA_LIMITS.maxConcurrentWrites) {
            return left(new TooManyRequestsError('error.tooManyUploads'));
        }

        this.activeWrites += 1;

        try {

            return await Operation();

        } finally {

            this.activeWrites -= 1;

        }

    }


    private acceptsThumbnail(Upload: AttachmentModel): boolean {

        if (Upload.Kind === UPLOAD_KINDS.Video) {
            return true;
        }

        return Upload.Kind === UPLOAD_KINDS.File && Upload.MimeType === PDF_MIME_TYPE;

    }


    private maxBytesOf(Kind: string): number {

        if (Kind === UPLOAD_KINDS.Image) {
            return MEDIA_LIMITS.imageMaxBytes;
        }

        return Kind === UPLOAD_KINDS.Video ? MEDIA_LIMITS.videoMaxBytes : MEDIA_LIMITS.fileMaxBytes;

    }


    private isMimeAllowed(Kind: string, MimeType: string): boolean {

        if (Kind === UPLOAD_KINDS.Image) {
            return IMAGE_MIME_TYPES.includes(MimeType);
        }

        return Kind !== UPLOAD_KINDS.Video || VIDEO_MIME_TYPES.includes(MimeType);

    }


    private extensionOf(FileName: string): string {

        const iDot = FileName.lastIndexOf('.');

        return iDot < 0 ? '' : FileName.slice(iDot + 1).toLowerCase();

    }

}
