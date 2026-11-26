import cds from '@sap/cds';
import { ConversationMembers } from '@models/apps/dflc/resenha/entities';
import { ConversationMemberModel } from '@/models/conversation-member';
import { ConversationMemberRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class ConversationMemberRepositoryImplementation extends BaseRepositoryImplementation<ConversationMemberModel> implements ConversationMemberRepository {

    public async findMembership(ConversationId: string, UserId: string): Promise<ConversationMemberModel | null> {

        const oRows = await cds.run(
            SELECT.from(this.getEntity()).where({ Conversation_ID: ConversationId, User_ID: UserId })
        );

        return this.mapResult(oRows)[0] ?? null;

    }


    public async findUserIds(ConversationId: string): Promise<string[]> {

        const oRows: { User_ID: string }[] = await cds.run(
            SELECT.from(this.getEntity()).columns('User_ID').where({ Conversation_ID: ConversationId })
        );

        return oRows.map((oRow) => oRow.User_ID);

    }


    public async findMutedUserIds(ConversationId: string, Now: string): Promise<string[]> {

        const oRows: { User_ID: string }[] = await cds.run(
            SELECT.from(this.getEntity()).columns('User_ID').where({ Conversation_ID: ConversationId }).and({ MutedUntil: { '>': Now } })
        );

        return oRows.map((oRow) => oRow.User_ID);

    }


    public async create(Member: ConversationMemberModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(Member.toEntityObject()));

    }


    public async markRead(ConversationId: string, UserId: string, ReadAt: string): Promise<void> {

        await cds.run(
            UPDATE(this.getEntity()).set({ LastReadAt: ReadAt }).where({ Conversation_ID: ConversationId, User_ID: UserId })
        );

    }


    protected entityName(): string {

        return 'ConversationMembers';

    }


    protected mapResult(Rows: unknown[]): ConversationMemberModel[] {

        return ConversationMemberModel.mapModel(Rows as ConversationMembers);

    }

}
