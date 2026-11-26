import { AbstractError, MessageArgs } from './abstract';

export class UnauthorizedError extends AbstractError {

    constructor(message: string, args?: MessageArgs) {
        super(message, 401, args);
    }

}
