import { Readable } from 'stream';

export class MediaStream {

    public static isStream(Value: unknown): Value is Readable {

        return Value instanceof Readable;

    }


    public static async readWithin(Stream: Readable, MaxBytes: number): Promise<Buffer | null> {

        const aChunks: Buffer[] = [];
        let iTotal = 0;

        for await (const oChunk of Stream) {

            const oBuffer = Buffer.from(oChunk as Uint8Array);

            iTotal += oBuffer.length;

            if (iTotal > MaxBytes) {
                Stream.destroy();
                return null;
            }

            aChunks.push(oBuffer);

        }

        return Buffer.concat(aChunks);

    }

}
