import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError, PermissionDenied, ValidationError } from '@/errors';
import { CONVERSATION_EDITABLE_FIELDS, CONVERSATION_LIMITS, GROUP_KINDS } from '@/constants/conversations';
import { MEMBER_ROLES } from '@/constants/members';
import { ConversationModel } from '@/models/conversation';
import { ConversationMemberModel } from '@/models/conversation-member';
import { ConversationRepository } from '@/repositories/conversation';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { AccessService, ConversationAccess } from '@/services/access';
import { SystemMessageKey, SystemMessageService } from '@/services/system-message';
import { RealtimeHub } from '@/realtime/hub';
import { CreateConversationInput, GroupService } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

type NewConversation = {
    Kind: string;
    Name: string;
    Description?: string;
    IsPublic: boolean;
    OnlyAdminsCanPost: boolean;
};

const GENERAL_EDITABLE_FIELDS: readonly string[] = ['ID', 'Description'];

export class GroupServiceImplementation extends BaseServiceImplementation<Conversation> implements GroupService {

    constructor(
        private readonly Conversations: ConversationRepository,
        private readonly Members: ConversationMemberRepository,
        private readonly Access: AccessService,
        private readonly SystemMessages: SystemMessageService,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async createConversation(UserId: string, Input: CreateConversationInput, Request: Request): Promise<Either<AbstractError, Conversation>> {

        const oValidation = this.validateNew(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const oNew = oValidation.value;
            const aMemberIds = (await this.Access.existingUserIds(Input.MemberIds ?? [])).filter((sId) => sId !== UserId);
            const aAllIds = [UserId, ...aMemberIds];
            const oConversation = ConversationModel.with({
                Id: this.generateUUID(),
                Kind: oNew.Kind,
                Name: oNew.Name,
                Description: oNew.Description,
                IsPublic: oNew.IsPublic,
                OnlyAdminsCanPost: oNew.OnlyAdminsCanPost
            });
            const sNow = new Date().toISOString();

            await this.Conversations.create(oConversation);
            await this.Members.createMany(aAllIds.map((sMemberId) => ConversationMemberModel.joining(
                this.generateUUID(),
                oConversation.Id,
                sMemberId,
                sMemberId === UserId ? MEMBER_ROLES.Owner : MEMBER_ROLES.Member,
                sNow
            )));
            await this.SystemMessages.announce(Request, oConversation.Id, {
                Key: this.creationKey(oNew.Kind),
                ActorId: UserId,
                Name: oNew.Name
            });

            Request.on('succeeded', () => this.Hub.publish(aAllIds, {
                type: 'conversation.created',
                payload: { ConversationId: oConversation.Id }
            }));

            return right(oConversation.toResponse() as Conversation);

        });

    }


    public async updateConversation(UserId: string, Entity: Conversation, Request: Request): Promise<Either<AbstractError, boolean>> {

        const oValidation = this.validateChanges(Entity);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sConversationId = Entity.ID as string;
            const oAccess = await this.Access.requireMember(sConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            const oPermission = this.checkPermission(oAccess.value, Entity);

            if (oPermission.isLeft()) {
                return left(oPermission.value);
            }

            await this.announceChanges(Request, UserId, oAccess.value.Conversation, Entity);

            const aUserIds = await this.Members.findUserIds(sConversationId);

            Request.on('succeeded', () => this.Hub.publish(aUserIds, {
                type: 'conversation.updated',
                payload: { ConversationId: sConversationId }
            }));

            return right(true);

        });

    }


    private validateNew(Input: CreateConversationInput): Either<AbstractError, NewConversation> {

        if (!GROUP_KINDS.includes(Input.Kind ?? '')) {
            return left(new ValidationError('error.conversationKindInvalid'));
        }

        if ((Input.MemberIds ?? []).length > CONVERSATION_LIMITS.maxMembersPerAction) {
            return left(new ValidationError('error.tooManyMembers', { max: CONVERSATION_LIMITS.maxMembersPerAction }));
        }

        const sName = (Input.Name ?? '').trim();
        const sDescription = (Input.Description ?? '').trim();

        if (!sName) {
            return left(new ValidationError('error.conversationNameRequired'));
        }

        if (sName.length > CONVERSATION_LIMITS.maxNameLength) {
            return left(new ValidationError('error.conversationNameTooLong', { max: CONVERSATION_LIMITS.maxNameLength }));
        }

        if (sDescription.length > CONVERSATION_LIMITS.maxDescriptionLength) {
            return left(new ValidationError('error.descriptionTooLong', { max: CONVERSATION_LIMITS.maxDescriptionLength }));
        }

        return right({
            Kind: Input.Kind as string,
            Name: sName,
            Description: sDescription || undefined,
            IsPublic: Input.Kind === 'Channel' && Input.IsPublic !== false,
            OnlyAdminsCanPost: Input.OnlyAdminsCanPost === true
        });

    }


    private validateChanges(Entity: Conversation): Either<AbstractError, boolean> {

        if (Object.keys(Entity).some((sKey) => !CONVERSATION_EDITABLE_FIELDS.includes(sKey))) {
            return left(new ValidationError('error.conversationFieldNotEditable'));
        }

        if (Entity.Name !== undefined && !(Entity.Name ?? '').trim()) {
            return left(new ValidationError('error.conversationNameRequired'));
        }

        if ((Entity.Name ?? '').length > CONVERSATION_LIMITS.maxNameLength) {
            return left(new ValidationError('error.conversationNameTooLong', { max: CONVERSATION_LIMITS.maxNameLength }));
        }

        if ((Entity.Description ?? '').length > CONVERSATION_LIMITS.maxDescriptionLength) {
            return left(new ValidationError('error.descriptionTooLong', { max: CONVERSATION_LIMITS.maxDescriptionLength }));
        }

        return right(true);

    }


    private checkPermission(Access: ConversationAccess, Entity: Conversation): Either<AbstractError, boolean> {

        if (Access.Conversation.IsDirect) {
            return left(new PermissionDenied('error.conversationNotEditable'));
        }

        if (Access.Conversation.Kind === 'General') {
            return this.checkGeneral(Access, Entity);
        }

        if (!Access.Actor.CanManage) {
            return left(new PermissionDenied('error.onlyAdminsCanManage'));
        }

        return right(true);

    }


    private checkGeneral(Access: ConversationAccess, Entity: Conversation): Either<AbstractError, boolean> {

        if (!Access.Actor.IsOwner) {
            return left(new PermissionDenied('error.conversationNotEditable'));
        }

        if (!Object.keys(Entity).every((sKey) => GENERAL_EDITABLE_FIELDS.includes(sKey))) {
            return left(new ValidationError('error.generalNotEditable'));
        }

        return right(true);

    }


    private async announceChanges(Request: Request, UserId: string, Current: ConversationModel, Entity: Conversation): Promise<void> {

        if (Entity.Name !== undefined && Entity.Name !== Current.Name) {
            await this.SystemMessages.announce(Request, Current.Id, { Key: 'system.nameChanged', ActorId: UserId, Name: Entity.Name ?? '' });
        }

        if (Entity.Description !== undefined && (Entity.Description ?? '') !== (Current.Description ?? '')) {
            await this.SystemMessages.announce(Request, Current.Id, { Key: 'system.descriptionChanged', ActorId: UserId });
        }

    }


    private creationKey(Kind: string): SystemMessageKey {

        return Kind === 'Channel' ? 'system.channelCreated' : 'system.groupCreated';

    }

}
