import { Message, Messages } from '@models/apps/dflc/resenha/entities';
import { AuditProperties, BaseModel } from './base';

export type MessageProperties = AuditProperties & {
    Id: string;
    ConversationId: string;
    SenderId: string;
    Kind: string;
    Text?: string;
    ReplyToId?: string;
    IsViewOnce: boolean;
    EditedAt?: string;
    DeletedAt?: string;
};

export class MessageModel extends BaseModel {

    constructor(private readonly properties: MessageProperties) { super(); }

    public static with(properties: MessageProperties): MessageModel {
        return new MessageModel(properties);
    }

    public static mapModel(Messages: Messages): MessageModel[] {

        return Messages.map((Message: Message) => MessageModel.with({
            Id: Message.ID as string,
            ConversationId: Message.Conversation_ID as string,
            SenderId: Message.Sender_ID as string,
            Kind: Message.Kind as string,
            Text: Message.Text ?? undefined,
            ReplyToId: Message.ReplyTo_ID ?? undefined,
            IsViewOnce: Message.IsViewOnce === true,
            EditedAt: Message.EditedAt ?? undefined,
            DeletedAt: Message.DeletedAt ?? undefined,
            ...this.retrieveAudit(Message)
        }));

    }

    public get Id() { return this.properties.Id; }

    public get ConversationId() { return this.properties.ConversationId; }

    public get SenderId() { return this.properties.SenderId; }

    public get Text() { return this.properties.Text; }

    public get CreatedAt() { return this.properties.CreatedAt; }

    public toEntityObject(): Message {

        return this.cleanEntity({
            ID: this.properties.Id,
            Conversation_ID: this.properties.ConversationId,
            Sender_ID: this.properties.SenderId,
            Kind: this.properties.Kind as Message['Kind'],
            Text: this.properties.Text,
            ReplyTo_ID: this.properties.ReplyToId,
            IsViewOnce: this.properties.IsViewOnce,
            EditedAt: this.properties.EditedAt,
            DeletedAt: this.properties.DeletedAt,
            ...this.auditEntityObject(this.properties)
        });

    }

}
