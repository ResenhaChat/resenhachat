import { ConversationMember, ConversationMembers } from '@models/apps/dflc/resenha/entities';
import { MEMBER_ROLES } from '@/constants/members';
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

    public static joining(Id: string, ConversationId: string, UserId: string, Role: string, JoinedAt: string): ConversationMemberModel {
        return new ConversationMemberModel({ Id, ConversationId, UserId, Role, JoinedAt });
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

    public get JoinedAt() { return this.properties.JoinedAt ?? ''; }

    public get IsOwner() { return this.properties.Role === MEMBER_ROLES.Owner; }

    public get IsAdmin() { return this.properties.Role === MEMBER_ROLES.Admin; }

    public get CanManage() { return this.IsOwner || this.IsAdmin; }

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
