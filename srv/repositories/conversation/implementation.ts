import cds, { Query } from '@sap/cds';
import { Conversations } from '@models/apps/dflc/resenha/entities';
import { ConversationModel } from '@/models/conversation';
import { ServiceLocator } from '@/infrastructure/ServiceLocator';
import { UniqueViolation } from '@/infrastructure/UniqueViolation';
import { GENERAL_CONVERSATION_ID, GENERAL_CONVERSATION_NAME } from '@/constants/conversations';
import { ConversationRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

type JoinableSelect = {
    join(Target: string): JoinableSelect;
    on(Condition: string): JoinableSelect;
    columns(...Columns: string[]): JoinableSelect;
    where(...Conditions: unknown[]): JoinableSelect;
    groupBy(...Columns: string[]): JoinableSelect;
};

export class ConversationRepositoryImplementation extends BaseRepositoryImplementation<ConversationModel> implements ConversationRepository {

    public async ensureGeneral(): Promise<void> {

        const oExisting = await this.findById(GENERAL_CONVERSATION_ID);

        if (oExisting) {
            return;
        }

        const oGeneral = ConversationModel.with({
            Id: GENERAL_CONVERSATION_ID,
            Kind: 'General',
            Name: GENERAL_CONVERSATION_NAME,
            OnlyAdminsCanPost: false
        });

        try {

            await this.create(oGeneral);

        } catch (oError) {

            const oCreated = await this.findById(GENERAL_CONVERSATION_ID);

            if (!oCreated) {
                throw oError;
            }

        }

    }


    public async create(Conversation: ConversationModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(Conversation.toEntityObject()));

    }


    public async createDirect(Conversation: ConversationModel): Promise<boolean> {

        try {

            await this.create(Conversation);

            return true;

        } catch (oError) {

            if (UniqueViolation.isError(oError)) {
                return false;
            }

            throw oError;

        }

    }


    public async findByDirectKey(DirectKey: string): Promise<ConversationModel | null> {

        const oRows = await cds.run(SELECT.from(this.getEntity()).columns(...this.columns()).where({ DirectKey }));

        return this.mapResult(oRows)[0] ?? null;

    }


    public async updateLastMessage(Id: string, LastMessageAt: string, LastMessage: string, LastMessageKey?: string, LastMessageArgs?: string): Promise<void> {

        await cds.run(UPDATE(this.getEntity()).set({
            LastMessageAt,
            LastMessage,
            LastMessageKey: LastMessageKey ?? null,
            LastMessageArgs: LastMessageArgs ?? null
        }).where({ ID: Id }));

    }


    public async countUnread(UserId: string, ConversationIds: string[]): Promise<Map<string, number>> {

        const oCounts = new Map<string, number>();

        if (!ConversationIds.length) {
            return oCounts;
        }

        const sMessages = ServiceLocator.getEntity('Messages').name;
        const sMembers = ServiceLocator.getEntity('ConversationMembers').name;

        const oQuery = (SELECT.from(`${sMessages} as m`) as unknown as JoinableSelect)
            .join(`${sMembers} as cm`)
            .on('cm.Conversation_ID = m.Conversation_ID')
            .columns('m.Conversation_ID', 'count(*) as Total')
            .where(
                'cm.User_ID =', UserId,
                'and m.Conversation_ID in', ConversationIds,
                "and coalesce(m.Sender_ID, '') <>", UserId,
                'and m.DeletedAt is null and m.createdAt > coalesce(cm.LastReadAt, cm.JoinedAt)'
            )
            .groupBy('m.Conversation_ID');

        const oRows: { Conversation_ID: string; Total: number }[] = await cds.run(oQuery as unknown as Query);

        oRows.forEach((oRow) => oCounts.set(oRow.Conversation_ID, Number(oRow.Total)));

        return oCounts;

    }


    protected columns(): string[] {

        return ['ID', 'Kind', 'Name', 'Description', 'IsPublic', 'OnlyAdminsCanPost', 'DirectKey', 'LastMessageAt', 'LastMessage', 'LastMessageKey', 'LastMessageArgs'];

    }


    protected entityName(): string {

        return 'Conversations';

    }


    protected mapResult(Rows: unknown[]): ConversationModel[] {

        return ConversationModel.mapModel(Rows as Conversations);

    }

}
