import { ConversationMember, ConversationMembers } from '@models/apps/dflc/resenha/entities';
import { BaseModel } from './base';

export type ConversationMemberProperties = {
    Id: string;
    ConversationId: string;
    UserId: string;
    Role: string;
    JoinedAt?: string;
    LastReadAt?: string;
};

export class ConversationMemberModel extends BaseModel {

    constructor(private readonly properties: ConversationMemberProperties) { super(); }

    public static with(properties: ConversationMemberProperties): ConversationMemberModel {
        return new ConversationMemberModel(properties);
    }

    public static mapModel(Members: ConversationMembers): ConversationMemberModel[] {

        return Members.map((Member: ConversationMember) => ConversationMemberModel.with({
            Id: Member.ID as string,
            ConversationId: Member.Conversation_ID as string,
            UserId: Member.User_ID as string,
            Role: Member.Role as string,
            JoinedAt: Member.JoinedAt ?? undefined,
            LastReadAt: Member.LastReadAt ?? undefined
        }));

    }

    public get Id() { return this.properties.Id; }

    public get ConversationId() { return this.properties.ConversationId; }

    public get UserId() { return this.properties.UserId; }

    public get Role() { return this.properties.Role; }

    public get CanManage() { return this.properties.Role === 'Owner' || this.properties.Role === 'Admin'; }

    public toEntityObject(): ConversationMember {

        return this.cleanEntity({
            ID: this.properties.Id,
            Conversation_ID: this.properties.ConversationId,
            User_ID: this.properties.UserId,
            Role: this.properties.Role as ConversationMember['Role'],
            JoinedAt: this.properties.JoinedAt,
            LastReadAt: this.properties.LastReadAt
        });

    }

}
