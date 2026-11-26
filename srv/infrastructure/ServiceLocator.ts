import cds, { entity, Request } from '@sap/cds';
import { ENTITIES_NAMESPACE } from '@/constants/entities';

type RequestContext = { _request?: Request };

export class ServiceLocator {

    public static setRequest(Request: Request): void {

        (cds.context as RequestContext)._request = Request;

    }


    public static getRequest(): Request | undefined {

        return (cds.context as RequestContext | undefined)?._request;

    }


    public static getEntity(EntityName: string): entity {

        return cds.entities(ENTITIES_NAMESPACE)[EntityName] as entity;

    }

}
