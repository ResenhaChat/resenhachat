import { Readable } from 'stream';
import { Either, left, right } from '@sweet-monads/either';
import { AbstractError, PayloadTooLargeError, ValidationError } from '@/errors';
import { MediaStream } from '@/infrastructure/MediaStream';

export type MediaPayload = {
    Stream: Readable;
    ContentType: string;
    ContentLength?: number;
};

export type SizeLimit = {
    Bytes: number;
    Key: string;
    Unit: number;
};

const BYTES_PER_MEGABYTE = 1024 * 1024;

export class MediaPayloadRules {

    public static checkMimeType(Payload: MediaPayload, MimeTypes: readonly string[]): Either<AbstractError, MediaPayload> {

        if (!MimeTypes.includes(Payload.ContentType)) {
            return left(new ValidationError('error.mimeNotAllowed'));
        }

        return right(Payload);

    }


    public static checkLength(Payload: MediaPayload, Limit: SizeLimit): Either<AbstractError, MediaPayload> {

        if (Payload.ContentLength === undefined) {
            return left(new ValidationError('error.contentLengthRequired'));
        }

        if (Payload.ContentLength > Limit.Bytes) {
            return left(this.tooLarge(Limit));
        }

        return right(Payload);

    }


    public static async read(Payload: MediaPayload, Limit: SizeLimit): Promise<Either<AbstractError, Buffer>> {

        const oContent = await MediaStream.readWithin(Payload.Stream, Limit.Bytes);

        return oContent ? right(oContent) : left(this.tooLarge(Limit));

    }


    public static tooLarge(Limit: SizeLimit): PayloadTooLargeError {

        const iMax = Math.round((Limit.Bytes / Limit.Unit) * 10) / 10;

        return new PayloadTooLargeError(Limit.Key, { max: iMax });

    }


    public static megabytes(Bytes: number): SizeLimit {

        return { Bytes, Key: 'error.fileTooLarge', Unit: BYTES_PER_MEGABYTE };

    }

}
