import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Message } from '@models/ChatService';
import { AbstractError, ValidationError } from '@/errors';
import { LAST_MESSAGE_PREVIEW_LENGTH, SYSTEM_MESSAGE_LOCALE } from '@/constants/conversations';
import { MESSAGE_LIMITS } from '@/constants/message-limits';
import { Messages } from '@/infrastructure/Messages';
import { SystemText } from '@/infrastructure/SystemText';
import { AttachmentModel } from '@/models/attachment';
import { MessageModel } from '@/models/message';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { MessageRepository } from '@/repositories/message';
import { RealtimeHub } from '@/realtime/hub';
import { AccessService } from '@/services/access';
import { MediaService } from '@/services/media';
import { PushService } from '@/services/push';
import { MessageService, SendMessageInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

type LastMessage = {
    Text: string;
    Key?: string;
    Args?: string;
};

export class MessageServiceImplementation extends BaseServiceImplementation<Message> implements MessageService {

    constructor(
        private readonly Repository: MessageRepository,
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Hub: RealtimeHub,
        private readonly Push: PushService,
        private readonly Media: MediaService,
        private readonly Access: AccessService
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
            const oPermission = await this.Access.requirePoster(sConversationId, UserId);

            if (oPermission.isLeft()) {
                return left(oPermission.value);
            }

            const oReply = await this.checkReplyTo(sConversationId, Input.ReplyTo_ID);

            if (oReply.isLeft()) {
                return left(oReply.value);
            }

            const oUpload = await this.uploadOf(UserId, Input);

            if (oUpload.isLeft()) {
                return left(oUpload.value);
            }

            const oMessage = await this.store(sConversationId, UserId, Input, oUpload.value);

            if (oUpload.value) {

                const oLinked = await this.Media.linkToMessage(oUpload.value.Id, oMessage.Id);

                if (oLinked.isLeft()) {
                    return left(oLinked.value);
                }

            }

            await this.publishCreated(Request, oMessage);

            return right(oMessage.toEntityObject() as Message);

        });

    }


    private validate(Input: SendMessageInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        if (!Input.Upload_ID && this.isBlank(Input.Text)) {
            return left(new ValidationError('error.messageTextRequired'));
        }

        if (this.textOf(Input).length > MESSAGE_LIMITS.maxTextLength) {
            return left(new ValidationError('error.messageTextTooLong', { max: MESSAGE_LIMITS.maxTextLength }));
        }

        return right(true);

    }


    private textOf(Input: SendMessageInput): string {

        return typeof Input.Text === 'string' ? Input.Text.trim() : '';

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


    private async uploadOf(UserId: string, Input: SendMessageInput): Promise<Either<AbstractError, AttachmentModel | null>> {

        if (!Input.Upload_ID) {
            return right(null);
        }

        const oUpload = await this.Media.requireReadyUpload(UserId, Input.Conversation_ID as string, Input.Upload_ID);

        return oUpload.isLeft() ? left(oUpload.value) : right(oUpload.value);

    }


    private async store(ConversationId: string, UserId: string, Input: SendMessageInput, Upload: AttachmentModel | null): Promise<MessageModel> {

        const sText = this.textOf(Input);
        const oLast = this.lastMessageOf(sText, Upload);
        const oNew = MessageModel.with({
            Id: this.generateUUID(),
            ConversationId,
            SenderId: UserId,
            Kind: Upload?.Kind ?? 'Text',
            Text: sText || undefined,
            ReplyToId: Input.ReplyTo_ID ?? undefined,
            IsViewOnce: false
        });

        await this.Repository.create(oNew);

        const oSaved = await this.Repository.findById(oNew.Id) as MessageModel;
        const sCreatedAt = oSaved.CreatedAt as string;

        await this.Conversations.updateLastMessage(ConversationId, sCreatedAt, oLast.Text, oLast.Key, oLast.Args);
        await this.Members.markRead(ConversationId, UserId, sCreatedAt);

        return oSaved;

    }


    private lastMessageOf(Text: string, Upload: AttachmentModel | null): LastMessage {

        if (!Upload) {
            return { Text: this.preview(Text) };
        }

        const oPreview = Upload.previewFor(Text);

        return {
            Text: this.preview(Messages.text(oPreview.Key, SYSTEM_MESSAGE_LOCALE, oPreview.Args)),
            Key: oPreview.Key,
            Args: SystemText.serialize(oPreview.Args)
        };

    }


    private async publishCreated(Request: Request, Message: MessageModel): Promise<void> {

        const aUserIds = await this.Members.findUserIds(Message.ConversationId);

        Request.on('succeeded', () => {

            this.Hub.publish(aUserIds, {
                type: 'message.created',
                payload: { ConversationId: Message.ConversationId, MessageId: Message.Id, SenderId: Message.SenderId ?? null }
            });
            this.Push.notifyNewMessage(Message);

        });

    }


    private preview(Text: string): string {

        return Text.replace(/\s+/g, ' ').slice(0, LAST_MESSAGE_PREVIEW_LENGTH);

    }

}
