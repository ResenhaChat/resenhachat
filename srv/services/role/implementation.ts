import { Request } from '@sap/cds';
import { Either, left, right } from '@sweet-monads/either';
import { Member } from '@models/ChatService';
import { AbstractError, NotFoundError, PermissionDenied, ValidationError } from '@/errors';
import { ASSIGNABLE_ROLES, MEMBER_ROLES } from '@/constants/members';
import { ConversationMemberRepository } from '@/repositories/conversation-member';
import { AccessService } from '@/services/access';
import { SystemMessageKey, SystemMessageService } from '@/services/system-message';
import { RealtimeHub } from '@/realtime/hub';
import { RoleService, SetMemberRoleInput } from './protocols';
import { BaseServiceImplementation } from '../base/implementation';

export class RoleServiceImplementation extends BaseServiceImplementation<Member> implements RoleService {

    constructor(
        private readonly Members: ConversationMemberRepository,
        private readonly Access: AccessService,
        private readonly SystemMessages: SystemMessageService,
        private readonly Hub: RealtimeHub
    ) {

        super();

    }


    public async setMemberRole(UserId: string, Input: SetMemberRoleInput, Request: Request): Promise<Either<AbstractError, boolean>> {

        const oValidation = this.validate(Input);

        if (oValidation.isLeft()) {
            return left(oValidation.value);
        }

        return this.execute(async () => {

            const sConversationId = Input.Conversation_ID as string;
            const sTargetId = Input.User_ID as string;
            const sRole = Input.Role as string;
            const oAccess = await this.Access.requireGroupMember(sConversationId, UserId);

            if (oAccess.isLeft()) {
                return left(oAccess.value);
            }

            if (!oAccess.value.Actor.IsOwner) {
                return left(new PermissionDenied('error.onlyOwnerCanChangeRoles'));
            }

            const oTarget = await this.Members.findMembership(sConversationId, sTargetId);

            if (!oTarget) {
                return left(new NotFoundError('error.memberNotFound'));
            }

            if (oTarget.IsOwner) {
                return left(new ValidationError('error.ownerRoleLocked'));
            }

            if (oTarget.Role === sRole) {
                return right(true);
            }

            await this.Members.setRole(sConversationId, sTargetId, sRole);
            await this.SystemMessages.announce(Request, sConversationId, {
                Key: this.announcementKey(sRole),
                ActorId: UserId,
                TargetId: sTargetId
            });

            const aUserIds = await this.Members.findUserIds(sConversationId);

            Request.on('succeeded', () => this.Hub.publish(aUserIds, {
                type: 'members.changed',
                payload: { ConversationId: sConversationId }
            }));

            return right(true);

        });

    }


    private validate(Input: SetMemberRoleInput): Either<AbstractError, boolean> {

        if (this.isBlank(Input.Conversation_ID)) {
            return left(new ValidationError('error.conversationRequired'));
        }

        if (this.isBlank(Input.User_ID)) {
            return left(new ValidationError('error.userRequired'));
        }

        if (!ASSIGNABLE_ROLES.includes(Input.Role ?? '')) {
            return left(new ValidationError('error.roleInvalid'));
        }

        return right(true);

    }


    private announcementKey(Role: string): SystemMessageKey {

        return Role === MEMBER_ROLES.Admin ? 'system.becameAdmin' : 'system.leftAdmin';

    }

}
