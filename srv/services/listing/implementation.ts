import { Conversation, Member, Message, PublicChannel } from '@models/ChatService';
import { ConversationModel } from '@/models/conversation';
import { MessageModel } from '@/models/message';
import { SystemText } from '@/infrastructure/SystemText';
import { ConversationRepository } from '@/repositories/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { MessageRepository } from '@/repositories/message';
import { UserRepository } from '@/repositories/user';
import { ListingService } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

type ConversationSummary = {
    Title: string;
    DirectPeer_ID: string | null;
    MemberCount: number;
    MyRole: string | null;
};

const EMPTY_SUMMARY: ConversationSummary = { Title: '', DirectPeer_ID: null, MemberCount: 0, MyRole: null };

type LastMessageHolder = { LastMessage?: string | null };

type LastMessageTarget = { Id: string; Target: LastMessageHolder };

export class ListingServiceImplementation extends BaseServiceImplementation<Conversation> implements ListingService {

    constructor(
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Users: UserRepository,
        private readonly MessageItems: MessageRepository
    ) {

        super();

    }


    public async applyConversations(UserId: string, Rows: Conversation | Conversation[] | undefined): Promise<void> {

        const aRows = this.toArray(Rows).filter((oRow) => !!oRow.ID);
        const aIds = aRows.map((oRow) => oRow.ID as string);
        const oSummaries = await this.summarize(UserId, aIds);
        const oUnread = await this.Conversations.countUnread(UserId, aIds);

        aRows.forEach((oRow) => {

            const sId = oRow.ID as string;

            Object.assign(oRow, this.summaryOf(oSummaries, sId), { UnreadCount: oUnread.get(sId) ?? 0 });

        });

    }


    public async applyMembers(UserId: string, Rows: Member | Member[] | undefined): Promise<void> {

        const aRows = this.toArray(Rows).filter((oRow) => !!oRow.Conversation_ID);
        const aIds = aRows.map((oRow) => oRow.Conversation_ID as string);
        const oSummaries = await this.summarize(UserId, aIds);
        const oUnread = await this.Conversations.countUnread(UserId, aIds);

        aRows.forEach((oRow) => {

            const sId = oRow.Conversation_ID as string;
            const oSummary = this.summaryOf(oSummaries, sId);

            Object.assign(oRow, {
                Title: oSummary.Title,
                DirectPeer_ID: oSummary.DirectPeer_ID,
                UnreadCount: oUnread.get(sId) ?? 0
            });

            if (oRow.Conversation) {
                Object.assign(oRow.Conversation, oSummary);
            }

        });

    }


    public async applyChannels(UserId: string, Rows: PublicChannel | PublicChannel[] | undefined): Promise<void> {

        const aRows = this.toArray(Rows).filter((oRow) => !!oRow.ID);
        const oSummaries = await this.summarize(UserId, aRows.map((oRow) => oRow.ID as string));

        aRows.forEach((oRow) => {

            const oSummary = this.summaryOf(oSummaries, oRow.ID as string);

            oRow.MemberCount = oSummary.MemberCount;
            oRow.IsMember = oSummary.MyRole !== null;

        });

    }


    public async translateMessages(Locale: string | undefined, Rows: Message | Message[] | undefined): Promise<void> {

        const aRows = this.toArray(Rows).filter((oRow) => !!oRow.ID && (!oRow.Kind || oRow.Kind === 'System'));

        if (!aRows.length) {
            return;
        }

        const aMessages = await this.MessageItems.findByIds(aRows.map((oRow) => oRow.ID as string));
        const oSystem = new Map<string, MessageModel>(aMessages
            .filter((oMessage) => !!oMessage.SystemKey)
            .map((oMessage): [string, MessageModel] => [oMessage.Id, oMessage]));

        aRows.forEach((oRow) => {

            const oMessage = oSystem.get(oRow.ID as string);

            if (oMessage?.SystemKey) {
                oRow.Text = SystemText.translate(oMessage.SystemKey, Locale, oMessage.SystemArgs);
            }

        });

    }


    public async translateLastMessages(Locale: string | undefined, Rows: Conversation | Conversation[] | undefined): Promise<void> {

        const aTargets = this.toArray(Rows)
            .filter((oRow) => !!oRow.ID)
            .map((oRow) => ({ Id: oRow.ID as string, Target: oRow }));

        await this.applyLastMessages(Locale, aTargets);

    }


    public async translateMemberLastMessages(Locale: string | undefined, Rows: Member | Member[] | undefined): Promise<void> {

        const aTargets = this.toArray(Rows)
            .filter((oRow) => !!oRow.Conversation?.ID)
            .map((oRow) => ({ Id: oRow.Conversation?.ID as string, Target: oRow.Conversation as LastMessageHolder }));

        await this.applyLastMessages(Locale, aTargets);

    }


    private async applyLastMessages(Locale: string | undefined, Targets: LastMessageTarget[]): Promise<void> {

        if (!Targets.length) {
            return;
        }

        const aConversations = await this.Conversations.findByIds(Targets.map((oTarget) => oTarget.Id));
        const oSystem = new Map<string, ConversationModel>(aConversations
            .filter((oConversation) => !!oConversation.LastMessageKey)
            .map((oConversation): [string, ConversationModel] => [oConversation.Id, oConversation]));

        Targets.forEach(({ Id, Target }) => {

            const oConversation = oSystem.get(Id);

            if (oConversation?.LastMessageKey) {
                Target.LastMessage = SystemText.preview(SystemText.translate(oConversation.LastMessageKey, Locale, oConversation.LastMessageArgs));
            }

        });

    }


    private toArray<Row>(Rows: Row | Row[] | undefined): Row[] {

        if (!Rows) {
            return [];
        }

        return Array.isArray(Rows) ? Rows : [Rows];

    }


    private summaryOf(oSummaries: Map<string, ConversationSummary>, ConversationId: string): ConversationSummary {

        return oSummaries.get(ConversationId) ?? EMPTY_SUMMARY;

    }


    private async summarize(UserId: string, ConversationIds: string[]): Promise<Map<string, ConversationSummary>> {

        const aIds = [...new Set(ConversationIds)];
        const oSummaries = new Map<string, ConversationSummary>();

        if (!aIds.length) {
            return oSummaries;
        }

        const aConversations = await this.Conversations.findByIds(aIds);
        const aDirectIds = aConversations.filter((oConversation) => oConversation.IsDirect).map((oConversation) => oConversation.Id);
        const oCounts = await this.Members.countByConversationIds(aIds);
        const oRoles = await this.Members.findRoles(UserId, aIds);
        const oPeers = await this.Members.findDirectPeers(UserId, aDirectIds);
        const oNames = await this.namesOf([...oPeers.values()]);

        aConversations.forEach((oConversation) => {

            const sPeerId = oPeers.get(oConversation.Id);

            oSummaries.set(oConversation.Id, {
                Title: this.titleOf(oConversation, sPeerId, oNames),
                DirectPeer_ID: sPeerId ?? null,
                MemberCount: oCounts.get(oConversation.Id) ?? 0,
                MyRole: oRoles.get(oConversation.Id) ?? null
            });

        });

        return oSummaries;

    }


    private async namesOf(UserIds: string[]): Promise<Map<string, string>> {

        if (!UserIds.length) {
            return new Map<string, string>();
        }

        const aUsers = await this.Users.findByIds(UserIds);

        return new Map<string, string>(aUsers.map((oUser): [string, string] => [oUser.Id, oUser.DisplayName]));

    }


    private titleOf(Conversation: ConversationModel, PeerId: string | undefined, Names: Map<string, string>): string {

        if (Conversation.IsDirect) {
            return Names.get(PeerId ?? '') ?? '';
        }

        return Conversation.Name ?? '';

    }

}
