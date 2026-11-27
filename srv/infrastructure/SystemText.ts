import { MessageArgs } from '@/errors';
import { LAST_MESSAGE_PREVIEW_LENGTH } from '@/constants/conversations';
import { Messages } from './Messages';

export class SystemText {

    public static serialize(Args: MessageArgs): string {

        return JSON.stringify(Args);

    }


    public static translate(Key: string, Locale: string | undefined, Args: string | null | undefined): string {

        return Messages.text(Key, Locale, SystemText.parse(Args));

    }


    public static preview(Text: string): string {

        return Text.replace(/\s+/g, ' ').slice(0, LAST_MESSAGE_PREVIEW_LENGTH);

    }


    private static parse(Json: string | null | undefined): MessageArgs {

        if (!Json) {
            return {};
        }

        try {

            const oParsed: unknown = JSON.parse(Json);

            return typeof oParsed === 'object' && oParsed !== null ? oParsed as MessageArgs : {};

        } catch {

            return {};

        }

    }

}
