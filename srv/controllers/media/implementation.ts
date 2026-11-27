import { AttachmentModel } from '@/models/attachment';
import { BaseControllerResponse } from '@/controllers/base';
import { CreateUploadInput, MediaDeliveryPlan, MediaService } from '@/services/media';
import { MediaPayload } from '@/services/media/payload';
import { MediaController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class MediaControllerImplementation extends BaseControllerImplementation<AttachmentModel> implements MediaController {

    constructor(protected readonly Service: MediaService) {

        super();

    }


    public async createUpload(UserId: string, Input: CreateUploadInput): Promise<BaseControllerResponse> {

        const oResult = await this.Service.createUpload(UserId, Input);

        return this.respond(oResult.map((oUpload) => oUpload.toUpload()), 201);

    }


    public async prepareContent(UserId: string, UploadId: string, Payload: MediaPayload): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.prepareContent(UserId, UploadId, Payload), 200);

    }


    public async prepareThumbnail(UserId: string, UploadId: string, Payload: MediaPayload): Promise<BaseControllerResponse> {

        return this.respond(await this.Service.prepareThumbnail(UserId, UploadId, Payload), 200);

    }


    public deliveryOf(Kind: string, MimeType: string, Download: boolean, Property: string): MediaDeliveryPlan {

        return this.Service.deliveryOf(Kind, MimeType, Download, Property);

    }

}
