import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError, PermissionDenied, ValidationError } from '@/errors';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { RealtimeHub } from '@/realtime/hub';
import { ConversationService, MarkAsReadInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class ConversationServiceImplementation extends BaseServiceImplementation<Conversation> implements ConversationService {

    constructor(
        private readonly Repository: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async applyUnreadCount(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void> {

        const aRows = (Array.isArray(Rows) ? Rows : [Rows]).filter((oRow): oRow is Conversation => !!oRow?.ID);

        if (!aRows.length) {
            return;
        }

        const oCounts = await this.Repository.countUnread(UserId, aRows.map((oRow) => oRow.ID as string));

        aRows.forEach((oRow) => {
            oRow.UnreadCount = oCounts.get(oRow.ID as string) ?? 0;
        });

    }


    public async markAsRead(UserId: string, Input: MarkAsReadInput, Request: Request): Promise<Either<AbstractError, boolean>> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const oMember = await this.Members.findMembership(sConversationId, UserId);

            if (!oMember) {
                return left(new PermissionDenied('error.notConversationMember'));
            }

            const sReadAt = new Date().toISOString();

            await this.Members.markRead(sConversationId, UserId, sReadAt);

            const aUserIds = await this.Members.findUserIds(sConversationId);

            Request.on('succeeded', () => this.Hub.publish(aUserIds, {
                type: 'conversation.read',
                payload: { ConversationId: sConversationId, UserId, LastReadAt: sReadAt }
            }));

            return right(true);

        });

    }

}
