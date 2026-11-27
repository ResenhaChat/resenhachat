import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError, NotFoundError, ValidationError } from '@/errors';
import { DIRECT_KEY_SEPARATOR } from '@/constants/conversations';
import { UUID_PATTERN } from '@/constants/ids';
import { MEMBER_ROLES } from '@/constants/members';
import { ConversationModel } from '@/models/conversation';
import { ConversationMemberModel } from '@/models/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { UserRepository } from '@/repositories/user';
import { RealtimeHub } from '@/realtime/hub';
import { DirectService, StartDirectInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class DirectServiceImplementation extends BaseServiceImplementation<Conversation> implements DirectService {

    constructor(
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Users: UserRepository,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async startDirect(UserId: string, Input: StartDirectInput, Request: Request): Promise<Either<AbstractError, Conversation>> {

        const oValidation = this.validate(UserId, Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sPeerId = Input.User_ID as string;
            const oPeer = await this.Users.findById(sPeerId);

            if (!oPeer) {
                return left(new NotFoundError('error.userNotFound'));
            }

            const sKey = this.directKey(UserId, sPeerId);
            const oConversation = await this.Conversations.findByDirectKey(sKey) ?? await this.create(UserId, sPeerId, sKey, Request);

            if (!oConversation) {
                return left(new NotFoundError('error.conversationNotFound'));
            }

            return right(oConversation.toResponse() as Conversation);

        });

    }


    private validate(UserId: string, Input: StartDirectInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.User_ID)) {
            return left(new ValidationError('error.userRequired'));
        }

        if (!UUID_PATTERN.test(Input.User_ID as string)) {
            return left(new NotFoundError('error.userNotFound'));
        }

        if (Input.User_ID === UserId) {
            return left(new ValidationError('error.directSelf'));
        }

        return right(true);

    }


    private directKey(UserA: string, UserB: string): string {

        return [UserA, UserB].sort().join(DIRECT_KEY_SEPARATOR);

    }


    private async create(UserId: string, PeerId: string, DirectKey: string, Request: Request): Promise<ConversationModel | null> {

        const oConversation = ConversationModel.with({
            Id: this.generateUUID(),
            Kind: 'Direct',
            IsPublic: false,
            OnlyAdminsCanPost: false,
            DirectKey
        });

        if (!await this.Conversations.createDirect(oConversation)) {
            return this.Conversations.findByDirectKey(DirectKey);
        }

        const sNow = new Date().toISOString();
        const aUserIds = [UserId, PeerId];

        await this.Members.createMany(aUserIds.map((sUserId) => ConversationMemberModel.joining(
            this.generateUUID(), oConversation.Id, sUserId, MEMBER_ROLES.Member, sNow
        )));

        Request.on('succeeded', () => this.Hub.publish(aUserIds, {
            type: 'conversation.created',
            payload: { ConversationId: oConversation.Id }
        }));

        return oConversation;

    }

}
