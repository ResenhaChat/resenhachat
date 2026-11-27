import cds from '@sap/cds';
import { ConversationMembers } from '@models/apps/dflc/resenha/entities';
import { ConversationMemberModel } from '@/models/conversation-member';
import { UniqueViolation } from '@/infrastructure/UniqueViolation';
import { ConversationMemberRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

type ConversationCount = { Conversation_ID: string; Total: number };
type ConversationRole = { Conversation_ID: string; Role: string };
type ConversationPeer = { Conversation_ID: string; User_ID: string };

export class ConversationMemberRepositoryImplementation extends BaseRepositoryImplementation<ConversationMemberModel> implements ConversationMemberRepository {

    public async findMembership(ConversationId: string, UserId: string): Promise<ConversationMemberModel | null> {

        const oRows = await cds.run(
            SELECT.from(this.getEntity()).where({ Conversation_ID: ConversationId, User_ID: UserId })
        );

        return this.mapResult(oRows)[0] ?? null;

    }


    public async findByConversationIds(ConversationIds: string[]): Promise<ConversationMemberModel[]> {

        if (!ConversationIds.length) {
            return [];
        }

        const oRows = await cds.run(SELECT.from(this.getEntity()).where({ Conversation_ID: { in: ConversationIds } }));

        return this.mapResult(oRows);

    }


    public async countByConversationIds(ConversationIds: string[]): Promise<Map<string, number>> {

        const oCounts = new Map<string, number>();

        if (!ConversationIds.length) {
            return oCounts;
        }

        const oRows: ConversationCount[] = await cds.run(
            SELECT.from(this.getEntity())
                .columns('Conversation_ID', 'count(*) as Total')
                .where({ Conversation_ID: { in: ConversationIds } })
                .groupBy('Conversation_ID')
        );

        oRows.forEach((oRow) => oCounts.set(oRow.Conversation_ID, Number(oRow.Total)));

        return oCounts;

    }


    public async findRoles(UserId: string, ConversationIds: string[]): Promise<Map<string, string>> {

        if (!ConversationIds.length) {
            return new Map<string, string>();
        }

        const oRows: ConversationRole[] = await cds.run(
            SELECT.from(this.getEntity())
                .columns('Conversation_ID', 'Role')
                .where({ User_ID: UserId, Conversation_ID: { in: ConversationIds } })
        );

        return new Map<string, string>(oRows.map((oRow): [string, string] => [oRow.Conversation_ID, oRow.Role]));

    }


    public async findDirectPeers(UserId: string, ConversationIds: string[]): Promise<Map<string, string>> {

        if (!ConversationIds.length) {
            return new Map<string, string>();
        }

        const oRows: ConversationPeer[] = await cds.run(
            SELECT.from(this.getEntity())
                .columns('Conversation_ID', 'User_ID')
                .where({ Conversation_ID: { in: ConversationIds }, User_ID: { '!=': UserId } })
        );

        return new Map<string, string>(oRows.map((oRow): [string, string] => [oRow.Conversation_ID, oRow.User_ID]));

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


    public async createMany(Members: ConversationMemberModel[]): Promise<void> {

        if (!Members.length) {
            return;
        }

        await cds.run(INSERT.into(this.getEntity()).entries(Members.map((oMember) => oMember.toEntityObject())));

    }


    public async addMissing(Members: ConversationMemberModel[]): Promise<ConversationMemberModel[]> {

        const aAdded: ConversationMemberModel[] = [];

        for (const oMember of Members) {

            try {

                await this.create(oMember);

                aAdded.push(oMember);

            } catch (oError) {

                if (!UniqueViolation.isError(oError)) {
                    throw oError;
                }

            }

        }

        return aAdded;

    }


    public async remove(ConversationId: string, UserId: string): Promise<void> {

        await cds.run(DELETE.from(this.getEntity()).where({ Conversation_ID: ConversationId, User_ID: UserId }));

    }


    public async setRole(ConversationId: string, UserId: string, Role: string): Promise<void> {

        await cds.run(UPDATE(this.getEntity()).set({ Role }).where({ Conversation_ID: ConversationId, User_ID: UserId }));

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
