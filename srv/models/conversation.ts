import { Conversation, Conversations } from '@models/apps/dflc/resenha/entities';
import { GROUP_KINDS } from '@/constants/conversations';
import { AuditProperties, BaseModel } from './base';

export type ConversationProperties = AuditProperties & {
    Id: string;
    Kind: string;
    Name?: string;
    Description?: string;
    IsPublic?: boolean;
    OnlyAdminsCanPost: boolean;
    DirectKey?: string;
    LastMessageAt?: string;
    LastMessage?: string;
};

export class ConversationModel extends BaseModel {

    constructor(private readonly properties: ConversationProperties) { super(); }

    public static with(properties: ConversationProperties): ConversationModel {
        return new ConversationModel(properties);
    }

    public static mapModel(Conversations: Conversations): ConversationModel[] {

        return Conversations.map((Conversation: Conversation) => ConversationModel.with({
            Id: Conversation.ID as string,
            Kind: Conversation.Kind as string,
            Name: Conversation.Name ?? undefined,
            Description: Conversation.Description ?? undefined,
            IsPublic: Conversation.IsPublic === true,
            OnlyAdminsCanPost: Conversation.OnlyAdminsCanPost === true,
            DirectKey: Conversation.DirectKey ?? undefined,
            LastMessageAt: Conversation.LastMessageAt ?? undefined,
            LastMessage: Conversation.LastMessage ?? undefined,
            ...this.retrieveAudit(Conversation)
        }));

    }

    public get Id() { return this.properties.Id; }

    public get Kind() { return this.properties.Kind; }

    public get Name() { return this.properties.Name; }

    public get Description() { return this.properties.Description; }

    public get IsPublic() { return this.properties.IsPublic === true; }

    public get OnlyAdminsCanPost() { return this.properties.OnlyAdminsCanPost; }

    public get DirectKey() { return this.properties.DirectKey; }

    public get IsDirect() { return this.properties.Kind === 'Direct'; }

    public get IsGroupOrChannel() { return GROUP_KINDS.includes(this.properties.Kind); }

    public get IsPublicChannel() { return this.properties.Kind === 'Channel' && this.IsPublic; }

    public toEntityObject(): Conversation {

        return this.cleanEntity({
            ID: this.properties.Id,
            Kind: this.properties.Kind as Conversation['Kind'],
            Name: this.properties.Name,
            Description: this.properties.Description,
            IsPublic: this.properties.IsPublic,
            OnlyAdminsCanPost: this.properties.OnlyAdminsCanPost,
            DirectKey: this.properties.DirectKey,
            LastMessageAt: this.properties.LastMessageAt,
            LastMessage: this.properties.LastMessage,
            ...this.auditEntityObject(this.properties)
        });

    }


    public toResponse(): Conversation {

        return this.cleanEntity({
            ID: this.properties.Id,
            Kind: this.properties.Kind as Conversation['Kind'],
            Name: this.properties.Name,
            Description: this.properties.Description,
            IsPublic: this.IsPublic,
            OnlyAdminsCanPost: this.properties.OnlyAdminsCanPost,
            LastMessageAt: this.properties.LastMessageAt,
            LastMessage: this.properties.LastMessage
        });

    }

}
