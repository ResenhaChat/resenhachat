import cds, { ApplicationService, entity, Request } from '@sap/cds';
import { Readable } from 'stream';
import { BaseController, BaseControllerResponse } from '@/controllers/base';
import { Messages } from '@/infrastructure/Messages';
import { MediaStream } from '@/infrastructure/MediaStream';
import { ServiceLocator } from '@/infrastructure/ServiceLocator';
import { MediaPayload } from '@/services/media/payload';
import { BaseRoute } from './protocols';

export abstract class BaseRouteImplementation<Entity> implements BaseRoute {

    protected abstract Controller: BaseController<Entity>;


    public abstract main(Service: ApplicationService): void;


    protected registerRequestContext(Service: ApplicationService): void {

        Service.before('*', (Request: Request) => ServiceLocator.setRequest(Request));

    }


    protected mainBase(Service: ApplicationService, EntityDB: entity): void {

        Service.before('CREATE', EntityDB, this.beforeCreate.bind(this));
        Service.before('UPDATE', EntityDB, this.beforeUpdate.bind(this));
        Service.before('DELETE', EntityDB, this.beforeDelete.bind(this));

    }


    protected async beforeCreate(Request: Request): Promise<void> {

        const oResult = await this.Controller.beforeCreate(this.entityFrom(Request), Request.user);

        this.rejectOnError(Request, oResult);

    }


    protected async beforeUpdate(Request: Request): Promise<void> {

        const oResult = await this.Controller.beforeUpdate(this.entityFrom(Request), Request.user);

        this.rejectOnError(Request, oResult);

    }


    protected async beforeDelete(Request: Request): Promise<void> {

        const oResult = await this.Controller.beforeDelete(this.entityFrom(Request), Request.user);

        this.rejectOnError(Request, oResult);

    }


    protected entityFrom(Request: Request): Entity {

        const oParams = Request.params?.[0] as { ID?: string } | string | undefined;
        const sKey = typeof oParams === 'object' ? oParams?.ID : oParams;

        return { ...Request.data, ID: Request.data?.ID ?? sKey } as Entity;

    }


    protected keyOf(Request: Request): string {

        const oParams = Request.params?.[0] as { ID?: string } | string | undefined;

        return (typeof oParams === 'object' ? oParams?.ID : oParams) as string;

    }


    protected rejectOnError(Request: Request, Result: BaseControllerResponse): void {

        if (Result.status >= 400) {

            Request.reject(Result.status, Messages.text(Result.data as string, Request.locale, Result.args));

        }

    }


    protected resultOf(Request: Request, Result: BaseControllerResponse): unknown {

        this.rejectOnError(Request, Result);

        return Result.data;

    }


    protected assignResult(Request: Request, Result: BaseControllerResponse): void {

        this.rejectOnError(Request, Result);

        Object.assign(Request.data as object, Result.data as object);

    }


    protected isAvatarChange(Data: Record<string, unknown>): boolean {

        return MediaStream.isStream(Data.Avatar) || (Data.Avatar === null && this.isDeleteRequest());

    }


    protected isDeleteRequest(): boolean {

        return (cds.context?.http?.req as { method?: string } | undefined)?.method === 'DELETE';

    }


    protected mediaPayloadOf(Request: Request, Stream: Readable): MediaPayload {

        const sLength = Request.headers['content-length'];
        const iLength = Number(sLength);

        return {
            Stream,
            ContentType: String(Request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase(),
            ContentLength: sLength !== undefined && Number.isInteger(iLength) ? iLength : undefined
        };

    }

}
