import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Message } from '@models/ChatService';
import { AbstractError, NotFoundError, PermissionDenied, ValidationError } from '@/errors';
import { LAST_MESSAGE_PREVIEW_LENGTH } from '@/constants/conversations';
import { MESSAGE_LIMITS } from '@/constants/message-limits';
import { MessageModel } from '@/models/message';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { MessageRepository } from '@/repositories/message';
import { RealtimeHub } from '@/realtime/hub';
import { MessageService, SendMessageInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class MessageServiceImplementation extends BaseServiceImplementation<Message> implements MessageService {

    constructor(
        private readonly Repository: MessageRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async sendMessage(UserId: string, Input: SendMessageInput, Request: Request): Promise<Either<AbstractError, Message>> {

        const oValidation = this.validate(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const oPermission = await this.checkCanPost(sConversationId, UserId);

            if (oPermission.isLeft()) {
                return left(oPermission.value);
            }

            const oReply = await this.checkReplyTo(sConversationId, Input.ReplyTo_ID);

            if (oReply.isLeft()) {
                return left(oReply.value);
            }

            const oMessage = await this.store(sConversationId, UserId, Input);

            await this.publishCreated(Request, oMessage);

            return right(oMessage.toEntityObject() as Message);

        });

    }


    private validate(Input: SendMessageInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        if (this.isBlank(Input.Text)) {
            return left(new ValidationError('error.messageTextRequired'));
        }

        if ((Input.Text as string).trim().length > MESSAGE_LIMITS.maxTextLength) {
            return left(new ValidationError('error.messageTextTooLong', { max: MESSAGE_LIMITS.maxTextLength }));
        }

        return right(true);

    }


    private async checkCanPost(ConversationId: string, UserId: string): Promise<Either<AbstractError, boolean>> {

        const oMember = await this.Members.findMembership(ConversationId, UserId);

        if (!oMember) {
            return left(new PermissionDenied('error.notConversationMember'));
        }

        const oConversation = await this.Conversations.findById(ConversationId);

        if (!oConversation) {
            return left(new NotFoundError('error.conversationNotFound'));
        }

        if (oConversation.OnlyAdminsCanPost && !oMember.CanManage) {
            return left(new PermissionDenied('error.onlyAdminsCanPost'));
        }

        return right(true);

    }


    private async checkReplyTo(ConversationId: string, ReplyToId?: string | null): Promise<Either<AbstractError, boolean>> {

        if (!ReplyToId) {
            return right(true);
        }

        const oReplied = await this.Repository.findById(ReplyToId);

        if (!oReplied || oReplied.ConversationId !== ConversationId) {
            return left(new ValidationError('error.replyToInvalid'));
        }

        return right(true);

    }


    private async store(ConversationId: string, UserId: string, Input: SendMessageInput): Promise<MessageModel> {

        const sText = (Input.Text as string).trim();
        const oNew = MessageModel.with({
            Id: this.generateUUID(),
            ConversationId,
            SenderId: UserId,
            Kind: 'Text',
            Text: sText,
            ReplyToId: Input.ReplyTo_ID ?? undefined,
            IsViewOnce: false
        });

        await this.Repository.create(oNew);

        const oSaved = await this.Repository.findById(oNew.Id) as MessageModel;
        const sCreatedAt = oSaved.CreatedAt as string;

        await this.Conversations.updateLastMessage(ConversationId, sCreatedAt, this.preview(sText));
        await this.Members.markRead(ConversationId, UserId, sCreatedAt);

        return oSaved;

    }


    private async publishCreated(Request: Request, Message: MessageModel): Promise<void> {

        const aUserIds = await this.Members.findUserIds(Message.ConversationId);

        Request.on('succeeded', () => this.Hub.publish(aUserIds, {
            type: 'message.created',
            payload: { ConversationId: Message.ConversationId, MessageId: Message.Id, SenderId: Message.SenderId }
        }));

    }


    private preview(Text: string): string {

        return Text.replace(/\s+/g, ' ').slice(0, LAST_MESSAGE_PREVIEW_LENGTH);

    }

}
