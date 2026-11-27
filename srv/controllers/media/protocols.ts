import { AttachmentModel } from '@/models/attachment';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { CreateUploadInput, MediaDeliveryPlan } from '@/services/media';
import { MediaPayload } from '@/services/media/payload';

export interface MediaController extends BaseController<AttachmentModel> {
    createUpload(UserId: string, Input: CreateUploadInput): Promise<BaseControllerResponse>;
    prepareContent(UserId: string, UploadId: string, Payload: MediaPayload): Promise<BaseControllerResponse>;
    prepareThumbnail(UserId: string, UploadId: string, Payload: MediaPayload): Promise<BaseControllerResponse>;
    deliveryOf(Kind: string, MimeType: string, Download: boolean, Property: string): MediaDeliveryPlan;
}
