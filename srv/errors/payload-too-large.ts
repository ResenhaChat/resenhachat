import { AbstractError, MessageArgs } from './abstract';

export class PayloadTooLargeError extends AbstractError {

    constructor(message: string, args?: MessageArgs) {
        super(message, 413, args);
    }

}
