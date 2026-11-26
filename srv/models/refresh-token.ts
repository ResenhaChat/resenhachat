import { RefreshToken, RefreshTokens } from '@models/apps/dflc/resenha/entities';
import { BaseModel } from './base';

export type RefreshTokenProperties = {
    Id: string;
    UserId: string;
    TokenHash: string;
    ExpiresAt: string;
    RevokedAt?: string;
    UserAgent?: string;
};

export class RefreshTokenModel extends BaseModel {

    constructor(private readonly properties: RefreshTokenProperties) { super(); }

    public static with(properties: RefreshTokenProperties): RefreshTokenModel {
        return new RefreshTokenModel(properties);
    }

    public static mapModel(RefreshTokens: RefreshTokens): RefreshTokenModel[] {

        return RefreshTokens.map((Token: RefreshToken) => RefreshTokenModel.with({
            Id: Token.ID as string,
            UserId: Token.User_ID as string,
            TokenHash: Token.TokenHash as string,
            ExpiresAt: Token.ExpiresAt as string,
            RevokedAt: Token.RevokedAt ?? undefined,
            UserAgent: Token.UserAgent ?? undefined
        }));

    }

    public get Id() { return this.properties.Id; }

    public get UserId() { return this.properties.UserId; }

    public get IsRevoked() {

        return !!this.properties.RevokedAt;

    }


    public get IsActive() {

        return !this.properties.RevokedAt && new Date(this.properties.ExpiresAt).getTime() > Date.now();

    }

    public toEntityObject(): RefreshToken {

        return this.cleanEntity({
            ID: this.properties.Id,
            User_ID: this.properties.UserId,
            TokenHash: this.properties.TokenHash,
            ExpiresAt: this.properties.ExpiresAt,
            RevokedAt: this.properties.RevokedAt,
            UserAgent: this.properties.UserAgent
        });

    }

}
