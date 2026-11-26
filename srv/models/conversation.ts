import { Conversation, Conversations } from '@models/apps/dflc/resenha/entities';
import { AuditProperties, BaseModel } from './base';

export type ConversationProperties = AuditProperties & {
    Id: string;
    Kind: string;
    Name?: string;
    Description?: string;
    OnlyAdminsCanPost: boolean;
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
            OnlyAdminsCanPost: Conversation.OnlyAdminsCanPost === true,
            LastMessageAt: Conversation.LastMessageAt ?? undefined,
            LastMessage: Conversation.LastMessage ?? undefined,
            ...this.retrieveAudit(Conversation)
        }));

    }

    public get Id() { return this.properties.Id; }

    public get Kind() { return this.properties.Kind; }

    public get Name() { return this.properties.Name; }

    public get OnlyAdminsCanPost() { return this.properties.OnlyAdminsCanPost; }

    public toEntityObject(): Conversation {

        return this.cleanEntity({
            ID: this.properties.Id,
            Kind: this.properties.Kind as Conversation['Kind'],
            Name: this.properties.Name,
            Description: this.properties.Description,
            OnlyAdminsCanPost: this.properties.OnlyAdminsCanPost,
            LastMessageAt: this.properties.LastMessageAt,
            LastMessage: this.properties.LastMessage,
            ...this.auditEntityObject(this.properties)
        });

    }

}
