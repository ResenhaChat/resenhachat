import cds from '@sap/cds';
import { Users } from '@models/apps/dflc/resenha/entities';
import { UserModel } from '@/models/user';
import { ServiceLocator } from '@/infrastructure/ServiceLocator';
import { UserRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class UserRepositoryImplementation extends BaseRepositoryImplementation<UserModel> implements UserRepository {

    public async findByLogin(Login: string): Promise<UserModel | null> {

        const oRows = await cds.run(
            SELECT.from(this.getEntity())
                .columns(...this.columns())
                .where('Email =', Login, 'or Username =', Login)
        );

        return this.mapResult(oRows)[0] ?? null;

    }


    public async existsByEmail(Email: string): Promise<boolean> {

        return this.exists({ Email });

    }


    public async existsByUsername(Username: string): Promise<boolean> {

        return this.exists({ Username });

    }


    public async createWithSettings(User: UserModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(User.toEntityObject()));
        await cds.run(INSERT.into(ServiceLocator.getEntity('UserSettings')).entries({ User_ID: User.Id }));

    }


    public async findNotificationsDisabled(UserIds: string[]): Promise<string[]> {

        if (!UserIds.length) {
            return [];
        }

        const oRows: { User_ID: string }[] = await cds.run(
            SELECT.from(ServiceLocator.getEntity('UserSettings')).columns('User_ID').where({ User_ID: { in: UserIds }, NotificationsEnabled: false })
        );

        return oRows.map((oRow) => oRow.User_ID);

    }


    public async updateLastSeen(UserId: string, LastSeenAt: string): Promise<void> {

        await cds.run(UPDATE(this.getEntity()).set({ LastSeenAt }).where({ ID: UserId }));

    }


    protected columns(): string[] {

        return ['ID', 'Email', 'PasswordHash', 'DisplayName', 'Username', 'About', 'LastSeenAt'];

    }


    protected entityName(): string {

        return 'Users';

    }


    protected mapResult(Rows: unknown[]): UserModel[] {

        return UserModel.mapModel(Rows as Users);

    }


    private async exists(Where: Record<string, string>): Promise<boolean> {

        const oRow = await cds.run(SELECT.one.from(this.getEntity()).columns('ID').where(Where));

        return !!oRow;

    }

}
