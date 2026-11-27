import cds from '@sap/cds';

export type DeliveredRow = Record<string, unknown>;

export type DeliveryPlan = {
    MimeType: string;
    Inline: boolean;
};

type HttpRequest = {
    query?: Record<string, unknown>;
    originalUrl?: string;
    url?: string;
};

type HttpPair = {
    req: HttpRequest;
    res: { setHeader(Name: string, Value: string): unknown };
};

type QueryColumn = { as?: string; ref?: string[] };

const STREAM_MARKER = '$mediaContentType';

const DISPOSITION_MARKER = '$mediaContentDispositionType';

const FILE_NAME_MARKER = '$mediaContentDispositionFilename';

const BATCH_SUFFIX = '/$batch';

export class MediaDelivery {

    public static requireKind(Query: unknown): void {

        const oSelect = (Query as { SELECT?: { columns?: QueryColumn[] } } | undefined)?.SELECT;
        const aColumns = oSelect?.columns;

        if (!aColumns?.some((oColumn) => oColumn.as === STREAM_MARKER)) {
            return;
        }

        if (!aColumns.some((oColumn) => oColumn.ref?.[0] === 'Kind')) {
            aColumns.push({ ref: ['Kind'] });
        }

    }


    public static apply(Rows: unknown, planOf: (Row: DeliveredRow, Download: boolean) => DeliveryPlan): void {

        const oHttp = cds.context?.http as HttpPair | undefined;
        const aRows = (Array.isArray(Rows) ? Rows : [Rows]) as DeliveredRow[];
        const bDownload = oHttp?.req.query?.download === '1';

        aRows
            .filter((oRow) => oRow && STREAM_MARKER in oRow)
            .forEach((oRow) => this.deliver(oRow, planOf(oRow, bDownload), oHttp));

    }


    private static deliver(Row: DeliveredRow, Plan: DeliveryPlan, Http: HttpPair | undefined): void {

        const sDisposition = Plan.Inline ? 'inline' : 'attachment';

        Row[STREAM_MARKER] = Plan.MimeType;
        Row[DISPOSITION_MARKER] = sDisposition;

        if (!Http || this.isBatch(Http.req)) {
            return;
        }

        Http.res.setHeader('Content-Type', Plan.MimeType);
        Http.res.setHeader('Content-Disposition', this.dispositionOf(sDisposition, Row[FILE_NAME_MARKER]));

    }


    private static isBatch(Request: HttpRequest): boolean {

        return (Request.originalUrl ?? Request.url ?? '').split('?')[0].endsWith(BATCH_SUFFIX);

    }


    private static dispositionOf(Disposition: string, FileName: unknown): string {

        if (typeof FileName !== 'string' || !FileName) {
            return Disposition;
        }

        return `${Disposition}; filename*=UTF-8''${this.encodeRfc5987(FileName)}`;

    }


    private static encodeRfc5987(Value: string): string {

        return encodeURIComponent(Value).replace(/['()*]/g, (sChar) => `%${sChar.charCodeAt(0).toString(16).toUpperCase()}`);

    }

}
