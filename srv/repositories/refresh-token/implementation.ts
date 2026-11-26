import cds from '@sap/cds';
import { RefreshTokens } from '@models/apps/dflc/resenha/entities';
import { RefreshTokenModel } from '@/models/refresh-token';
import { RefreshTokenRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class RefreshTokenRepositoryImplementation extends BaseRepositoryImplementation<RefreshTokenModel> implements RefreshTokenRepository {

    public async findByHash(TokenHash: string): Promise<RefreshTokenModel | null> {

        const oRows = await cds.run(SELECT.from(this.getEntity()).where({ TokenHash }));

        return this.mapResult(oRows)[0] ?? null;

    }


    public async create(Token: RefreshTokenModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(Token.toEntityObject()));

    }


    public async revoke(Id: string, RevokedAt: string): Promise<number> {

        const iAffected: number = await cds.run(
            UPDATE(this.getEntity()).set({ RevokedAt }).where('ID =', Id, 'and RevokedAt is null')
        );

        return iAffected;

    }


    public async revokeAllForUser(UserId: string): Promise<void> {

        await cds.run(
            UPDATE(this.getEntity())
                .set({ RevokedAt: new Date().toISOString() })
                .where('User_ID =', UserId, 'and RevokedAt is null')
        );

    }


    protected entityName(): string {

        return 'RefreshTokens';

    }


    protected mapResult(Rows: unknown[]): RefreshTokenModel[] {

        return RefreshTokenModel.mapModel(Rows as RefreshTokens);

    }

}
