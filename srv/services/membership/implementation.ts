import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Conversation } from '@models/ChatService';
import { AbstractError, NotFoundError, PermissionDenied, ValidationError } from '@/errors';
import { CONVERSATION_LIMITS } from '@/constants/conversations';
import { MEMBER_ROLES } from '@/constants/members';
import { ConversationMemberModel } from '@/models/conversation-member';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { AccessService } from '@/services/access';
import { SystemEvent, SystemMessageService } from '@/services/system-message';
import { RealtimeHub } from '@/realtime/hub';
import { AddMembersInput, JoinChannelInput, LeaveConversationInput, MembershipService, RemoveMemberInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class MembershipServiceImplementation extends BaseServiceImplementation<Conversation> implements MembershipService {

    constructor(
        private readonly Members: ConversationMemberRepository,
        private readonly Access: AccessService,
        private readonly SystemMessages: SystemMessageService,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async addMembers(UserId: string, Input: AddMembersInput, Request: Request): Promise<Either<AbstractError, boolean>> {

        const oValidation = this.validateAdd(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const oAccess = await this.Access.requireGroupMember(sConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            if (!oAccess.value.Actor.CanManage) {
                return left(new PermissionDenied('error.onlyAdminsCanManage'));
            }

            const aCurrentIds = await this.Members.findUserIds(sConversationId);
            const aNewIds = (await this.Access.existingUserIds(Input.UserIds ?? [])).filter((sId) => !aCurrentIds.includes(sId));
            const aAdded = await this.Members.addMissing(this.joining(sConversationId, aNewIds, MEMBER_ROLES.Member));

            if (!aAdded.length) {
                return right(true);
            }

            await this.SystemMessages.announceMany(Request, sConversationId, aAdded.map((oMember): SystemEvent => ({
                Key: 'system.memberAdded',
                ActorId: UserId,
                TargetId: oMember.UserId
            })));
            await this.publishMembersChanged(Request, sConversationId);

            return right(true);

        });

    }


    public async removeMember(UserId: string, Input: RemoveMemberInput, Request: Request): Promise<Either<AbstractError, boolean>> {

        const oValidation = this.validateRemove(UserId, Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const sTargetId = Input.User_ID as string;
            const oAccess = await this.Access.requireGroupMember(sConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            const oTarget = await this.Members.findMembership(sConversationId, sTargetId);

            if (!oTarget) {
                return left(new NotFoundError('error.memberNotFound'));
            }

            if (!this.canRemove(oAccess.value.Actor, oTarget)) {
                return left(new PermissionDenied('error.onlyAdminsCanManage'));
            }

            const aUserIds = await this.Members.findUserIds(sConversationId);

            await this.Members.remove(sConversationId, sTargetId);
            await this.SystemMessages.announce(Request, sConversationId, { Key: 'system.memberRemoved', ActorId: UserId, TargetId: sTargetId });

            Request.on('succeeded', () => this.Hub.publish(aUserIds, {
                type: 'members.changed',
                payload: { ConversationId: sConversationId }
            }));

            return right(true);

        });

    }


    public async leaveConversation(UserId: string, Input: LeaveConversationInput, Request: Request): Promise<Either<AbstractError, boolean>> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const oAccess = await this.Access.requireMember(sConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            if (!oAccess.value.Conversation.IsGroupOrChannel) {
                return left(new ValidationError('error.cannotLeaveConversation'));
            }

            const aMembers = await this.Members.findByConversationIds([sConversationId]);
            const aUserIds = aMembers.map((oMember) => oMember.UserId);
            const oSuccessor = oAccess.value.Actor.IsOwner ? this.successorOf(aMembers, UserId) : undefined;

            if (oSuccessor) {
                await this.Members.setRole(sConversationId, oSuccessor.UserId, MEMBER_ROLES.Owner);
            }

            await this.Members.remove(sConversationId, UserId);
            await this.SystemMessages.announce(Request, sConversationId, { Key: 'system.memberLeft', ActorId: UserId });

            if (oSuccessor) {
                await this.SystemMessages.announce(Request, sConversationId, { Key: 'system.becameOwner', ActorId: UserId, TargetId: oSuccessor.UserId });
            }

            Request.on('succeeded', () => this.Hub.publish(aUserIds, {
                type: 'members.changed',
                payload: { ConversationId: sConversationId }
            }));

            return right(true);

        });

    }


    public async joinChannel(UserId: string, Input: JoinChannelInput, Request: Request): Promise<Either<AbstractError, Conversation>> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const oConversation = await this.Access.findConversation(sConversationId);

            if (oConversation.isLeft()) {
                return left(oConversation.value);
            }

            if (!oConversation.value.IsPublicChannel) {
                return left(new PermissionDenied('error.channelNotJoinable'));
            }

            const aAdded = await this.Members.addMissing(this.joining(sConversationId, [UserId], MEMBER_ROLES.Member));

            if (aAdded.length) {
                await this.SystemMessages.announce(Request, sConversationId, { Key: 'system.channelJoined', ActorId: UserId });
                await this.publishJoined(Request, sConversationId, UserId);
            }

            return right(oConversation.value.toResponse() as Conversation);

        });

    }


    private validateAdd(Input: AddMembersInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        const aUserIds = Input.UserIds ?? [];

        if (!aUserIds.length) {
            return left(new ValidationError('error.membersRequired'));
        }

        if (aUserIds.length > CONVERSATION_LIMITS.maxMembersPerAction) {
            return left(new ValidationError('error.tooManyMembers', { max: CONVERSATION_LIMITS.maxMembersPerAction }));
        }

        return right(true);

    }


    private validateRemove(UserId: string, Input: RemoveMemberInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        if (this.isBlank(Input.User_ID)) {
            return left(new ValidationError('error.userRequired'));
        }

        if (Input.User_ID === UserId) {
            return left(new ValidationError('error.useLeaveConversation'));
        }

        return right(true);

    }


    private canRemove(Actor: ConversationMemberModel, Target: ConversationMemberModel): boolean {

        if (Actor.IsOwner) {
            return true;
        }

        return Actor.IsAdmin && !Target.CanManage;

    }


    private successorOf(Members: ConversationMemberModel[], LeaverId: string): ConversationMemberModel | undefined {

        const aCandidates = Members
            .filter((oMember) => oMember.UserId !== LeaverId)
            .sort((oFirst, oSecond) => oFirst.JoinedAt.localeCompare(oSecond.JoinedAt));

        return aCandidates.find((oMember) => oMember.IsAdmin) ?? aCandidates[0];

    }


    private joining(ConversationId: string, UserIds: string[], Role: string): ConversationMemberModel[] {

        const sNow = new Date().toISOString();

        return UserIds.map((sUserId) => ConversationMemberModel.joining(this.generateUUID(), ConversationId, sUserId, Role, sNow));

    }


    private async publishJoined(Request: Request, ConversationId: string, UserId: string): Promise<void> {

        const aOtherIds = (await this.Members.findUserIds(ConversationId)).filter((sId) => sId !== UserId);

        Request.on('succeeded', () => {

            this.Hub.publish([UserId], { type: 'conversation.created', payload: { ConversationId } });
            this.Hub.publish(aOtherIds, { type: 'members.changed', payload: { ConversationId } });

        });

    }


    private async publishMembersChanged(Request: Request, ConversationId: string): Promise<void> {

        const aUserIds = await this.Members.findUserIds(ConversationId);

        Request.on('succeeded', () => this.Hub.publish(aUserIds, {
            type: 'members.changed',
            payload: { ConversationId }
        }));

    }

}
