const UNIQUE_MESSAGE_PATTERN = /UNIQUE|unique constraint/i;

const UNIQUE_CODES: readonly unknown[] = ['SQLITE_CONSTRAINT_UNIQUE', 301, '301'];

export class UniqueViolation {

    public static isError(oError: unknown): boolean {

        if (typeof oError !== 'object' || oError === null) {
            return false;
        }

        const { code, message } = oError as { code?: unknown; message?: unknown };

        return UNIQUE_CODES.includes(code) || (typeof message === 'string' && UNIQUE_MESSAGE_PATTERN.test(message));

    }

}
