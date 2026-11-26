import { People } from '@models/ChatService';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { UserRepository } from '@/repositories/user';
import { RealtimeHub } from '@/realtime/hub';
import { PresenceService } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class PresenceServiceImplementation extends BaseServiceImplementation<People> implements PresenceService {

    constructor(
        private readonly Users: UserRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public applyOnlineStatus(Rows: People | People[] | undefined): void {

        const aRows = Array.isArray(Rows) ? Rows : [Rows];

        aRows.forEach((oRow) => {

            if (oRow?.ID) {
                oRow.IsOnline = this.Hub.isOnline(oRow.ID);
            }

        });

    }


    public async recordDisconnect(UserId: string): Promise<string> {

        const sLastSeenAt = new Date().toISOString();

        await this.Users.updateLastSeen(UserId, sLastSeenAt);

        return sLastSeenAt;

    }


    public async typingRecipients(UserId: string, ConversationId: string): Promise<string[]> {

        const aUserIds = await this.Members.findUserIds(ConversationId);

        if (!aUserIds.includes(UserId)) {
            return [];
        }

        return aUserIds.filter((sUserId) => sUserId !== UserId);

    }

}
