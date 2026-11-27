import sharp, { Metadata, Sharp } from 'sharp';
import { AVATAR_QUALITY, IMAGE_FORMATS, IMAGE_OUTPUT_MIME, IMAGE_OUTPUT_QUALITY, MEDIA_LIMITS, THUMBNAIL_QUALITY } from '@/constants/media';

sharp.cache(false);
sharp.concurrency(1);

export type ProcessedImage = {
    Content: Buffer;
    MimeType: string;
    Width: number;
    Height: number;
    Thumbnail: Buffer;
};

type OpenedImage = {
    Image: Sharp;
    Metadata: Metadata;
};

type Content = Omit<ProcessedImage, 'Thumbnail'>;

export class ImageProcessor {

    public static async process(Source: Buffer, MimeType: string): Promise<ProcessedImage | null> {

        try {

            const oOpened = await this.open(Source, MimeType);

            if (!oOpened) {
                return null;
            }

            const oContent = await this.contentOf(oOpened, MimeType);
            const oThumbnail = await this.thumbnailOf(oOpened.Image.clone());

            return { ...oContent, Thumbnail: oThumbnail };

        } catch {

            return null;

        }

    }


    public static async thumbnail(Source: Buffer, MimeType: string): Promise<Buffer | null> {

        try {

            const oOpened = await this.open(Source, MimeType);

            return oOpened ? await this.thumbnailOf(oOpened.Image.clone()) : null;

        } catch {

            return null;

        }

    }


    public static async avatar(Source: Buffer, MimeType: string): Promise<Buffer | null> {

        try {

            const oOpened = await this.open(Source, MimeType);

            if (!oOpened) {
                return null;
            }

            return await oOpened.Image.clone()
                .rotate()
                .resize(MEDIA_LIMITS.avatarDimension, MEDIA_LIMITS.avatarDimension, { fit: 'cover' })
                .webp({ quality: AVATAR_QUALITY })
                .toBuffer();

        } catch {

            return null;

        }

    }


    private static async open(Source: Buffer, MimeType: string): Promise<OpenedImage | null> {

        const sFormat = IMAGE_FORMATS[MimeType];

        if (!sFormat) {
            return null;
        }

        const oImage = sharp(Source, {
            animated: sFormat === 'gif',
            failOn: 'error',
            limitInputPixels: MEDIA_LIMITS.maxInputPixels
        });
        const oMetadata = await oImage.metadata();

        if (oMetadata.format !== sFormat || !oMetadata.width || !oMetadata.height) {
            return null;
        }

        if (sFormat === 'gif' && !this.isGifAllowed(oMetadata)) {
            return null;
        }

        return { Image: oImage, Metadata: oMetadata };

    }


    private static isGifAllowed(Metadata: Metadata): boolean {

        return (Metadata.width ?? 0) <= MEDIA_LIMITS.maxPixelDimension
            && (Metadata.height ?? 0) <= MEDIA_LIMITS.maxPixelDimension
            && (Metadata.pages ?? 1) <= MEDIA_LIMITS.maxGifPages;

    }


    private static async contentOf(Opened: OpenedImage, MimeType: string): Promise<Content> {

        if (MimeType === 'image/gif') {

            return {
                Content: await Opened.Image.clone().gif().toBuffer(),
                MimeType: 'image/gif',
                Width: Opened.Metadata.width ?? 0,
                Height: Opened.Metadata.height ?? 0
            };

        }

        const { data, info } = await Opened.Image.clone()
            .rotate()
            .resize({
                width: MEDIA_LIMITS.imageMaxDimension,
                height: MEDIA_LIMITS.imageMaxDimension,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: IMAGE_OUTPUT_QUALITY })
            .toBuffer({ resolveWithObject: true });

        return { Content: data, MimeType: IMAGE_OUTPUT_MIME, Width: info.width, Height: info.height };

    }


    private static async thumbnailOf(Image: Sharp): Promise<Buffer> {

        return Image
            .rotate()
            .resize({ width: MEDIA_LIMITS.thumbnailDimension, height: MEDIA_LIMITS.thumbnailDimension, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: THUMBNAIL_QUALITY })
            .toBuffer();

    }

}
