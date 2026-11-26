export type AuditProperties = {
    CreatedAt?: string;
    CreatedBy?: string;
    ModifiedAt?: string;
    ModifiedBy?: string;
};

type AuditedRow = {
    createdAt?: string | null;
    createdBy?: string | null;
    modifiedAt?: string | null;
    modifiedBy?: string | null;
};

export abstract class BaseModel {

    protected static retrieveAudit(row: AuditedRow): AuditProperties {

        return {
            CreatedAt: row.createdAt ?? undefined,
            CreatedBy: row.createdBy ?? undefined,
            ModifiedAt: row.modifiedAt ?? undefined,
            ModifiedBy: row.modifiedBy ?? undefined
        };

    }


    protected auditEntityObject(audit: AuditProperties): AuditedRow {

        return {
            createdAt: audit.CreatedAt,
            createdBy: audit.CreatedBy,
            modifiedAt: audit.ModifiedAt,
            modifiedBy: audit.ModifiedBy
        };

    }


    protected cleanEntity<T extends object>(entity: T): T {

        return Object.fromEntries(
            Object.entries(entity).filter(([, value]) => value !== undefined && value !== null)
        ) as T;

    }

}
