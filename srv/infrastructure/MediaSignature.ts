const WEBM_SIGNATURE = [0x1a, 0x45, 0xdf, 0xa3];

export class MediaSignature {

    public static isVideo(Content: Buffer, MimeType: string): boolean {

        if (MimeType === 'video/webm') {
            return Content.subarray(0, WEBM_SIGNATURE.length).equals(Buffer.from(WEBM_SIGNATURE));
        }

        return Content.subarray(4, 8).toString('ascii') === 'ftyp';

    }

}
