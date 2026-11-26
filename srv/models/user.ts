import { User, Users } from '@models/apps/dflc/resenha/entities';
import { AuditProperties, BaseModel } from './base';

export type UserProperties = AuditProperties & {
    Id: string;
    Email: string;
    PasswordHash: string;
    DisplayName: string;
    Username: string;
    About?: string;
    LastSeenAt?: string;
};

export class UserModel extends BaseModel {

    constructor(private readonly properties: UserProperties) { super(); }

    public static with(properties: UserProperties): UserModel {
        return new UserModel(properties);
    }

    public static mapModel(Users: Users): UserModel[] {

        return Users.map((User: User) => UserModel.with({
            Id: User.ID as string,
            Email: User.Email as string,
            PasswordHash: User.PasswordHash as string,
            DisplayName: User.DisplayName as string,
            Username: User.Username as string,
            About: User.About ?? undefined,
            LastSeenAt: User.LastSeenAt ?? undefined,
            ...this.retrieveAudit(User)
        }));

    }

    public get Id() { return this.properties.Id; }

    public get Email() { return this.properties.Email; }

    public get PasswordHash() { return this.properties.PasswordHash; }

    public get DisplayName() { return this.properties.DisplayName; }

    public get Username() { return this.properties.Username; }

    public toEntityObject(): User {

        return this.cleanEntity({
            ID: this.properties.Id,
            Email: this.properties.Email,
            PasswordHash: this.properties.PasswordHash,
            DisplayName: this.properties.DisplayName,
            Username: this.properties.Username,
            About: this.properties.About,
            LastSeenAt: this.properties.LastSeenAt,
            ...this.auditEntityObject(this.properties)
        });

    }

}
