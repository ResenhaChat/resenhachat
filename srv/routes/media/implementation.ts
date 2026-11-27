import { ApplicationService, Request } from '@sap/cds';
import { MediaController } from '@/controllers/media';
import { MediaDelivery, DeliveredRow } from '@/infrastructure/MediaDelivery';
import { MediaStream } from '@/infrastructure/MediaStream';
import { AttachmentModel } from '@/models/attachment';
import { CreateUploadInput } from '@/services/media';
import { MediaRoute } from './protocols';
import { BaseRouteImplementation } from '../base/implementation';

const MEDIA_FIELDS: readonly string[] = ['Content', 'Thumbnail'];

export class MediaRouteImplementation extends BaseRouteImplementation<AttachmentModel> implements MediaRoute {

    constructor(protected readonly Controller: MediaController) {

        super();

    }


    public main(Service: ApplicationService): void {

        Service.on('CreateUpload', this.createUpload.bind(this));
        Service.before('UPDATE', Service.entities.Uploads, this.beforeUpdate.bind(this));
        Service.before('READ', Service.entities.Attachments, (Request: Request) => MediaDelivery.requireStreamColumns(Request.query));
        Service.after('READ', Service.entities.Attachments, (Rows: unknown) => this.applyDelivery(Rows));

    }


    private async createUpload(Request: Request): Promise<unknown> {

        return this.resultOf(Request, await this.Controller.createUpload(Request.user.id, Request.data as CreateUploadInput));

    }


    protected async beforeUpdate(Request: Request): Promise<void> {

        const sUploadId = this.keyOf(Request);
        const oData = Request.data as Record<string, unknown>;

        if (MEDIA_FIELDS.some((sField) => sField in oData && oData[sField] === null)) {
            this.rejectOnError(Request, { status: 400, data: 'error.mediaFieldNotEditable' });
        }

        if (MediaStream.isStream(oData.Content)) {

            const oResult = await this.Controller.prepareContent(Request.user.id, sUploadId, this.mediaPayloadOf(Request, oData.Content));

            this.assignResult(Request, oResult);

        } else if (MediaStream.isStream(oData.Thumbnail)) {

            const oResult = await this.Controller.prepareThumbnail(Request.user.id, sUploadId, this.mediaPayloadOf(Request, oData.Thumbnail));

            this.assignResult(Request, oResult);

        }

    }


    private applyDelivery(Rows: unknown): void {

        MediaDelivery.apply(Rows, (oRow: DeliveredRow, bDownload: boolean) => this.Controller.deliveryOf(
            String(oRow.Kind),
            String(oRow.$mediaContentType ?? ''),
            bDownload,
            String(oRow.$mediaProperty ?? '')
        ));

    }

}
