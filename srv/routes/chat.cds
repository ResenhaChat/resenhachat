using {apps.dflc.resenha.entities as entities} from '../../db/entities';

@path    : '/service/Chat'
@requires: 'authenticated-user'
service ChatService {

    @readonly
    entity People        as
        projection on entities.Users {
            ID,
            DisplayName,
            Username,
            About,
            Avatar,
            AvatarMimeType,
            LastSeenAt,
            virtual IsOnline : Boolean
        };

    @restrict: [{
        grant: [
            'READ',
            'UPDATE'
        ],
        where: 'ID = $user'
    }]
    entity Me            as
        projection on entities.Users {
            ID,
            Email @readonly,
            DisplayName,
            Username @readonly,
            About,
            Avatar,
            AvatarMimeType,
            LastSeenAt @readonly,
            Settings @(readonly) : redirected to MySettings
        };

    @restrict: [{
        grant: [
            'READ',
            'UPDATE'
        ],
        where: 'User.ID = $user'
    }]
    entity MySettings    as
        projection on entities.UserSettings {
            *,
            User @(readonly) : redirected to Me
        };

    @restrict: [
        {
            grant: 'READ',
            where: 'exists Members[User.ID = $user]'
        },
        {
            grant: 'UPDATE',
            where: 'exists Members[User.ID = $user and (Role = ''Owner'' or Role = ''Admin'')]'
        }
    ]
    entity Conversations as
        projection on entities.Conversations {
            ID,
            Kind @readonly,
            Name,
            Description,
            Avatar @readonly,
            AvatarMimeType @readonly,
            IsPublic,
            OnlyAdminsCanPost,
            LastMessageAt @readonly,
            LastMessage @readonly,
            createdAt @readonly,
            createdBy @readonly,
            modifiedAt @readonly,
            modifiedBy @readonly,
            Members @(readonly) : redirected to Members,
            Messages @(readonly) : redirected to Messages,
            virtual UnreadCount : Integer,
            virtual Title : String(80),
            virtual DirectPeer_ID : UUID,
            virtual MemberCount : Integer,
            virtual MyRole : String(10)
        };

    @restrict: [
        {
            grant: 'READ',
            where: 'exists Conversation.Members[User.ID = $user]'
        },
        {
            grant: 'UPDATE',
            where: 'User.ID = $user'
        }
    ]
    entity Members       as
        projection on entities.ConversationMembers {
            ID @readonly,
            Conversation : redirected to Conversations,
            User : redirected to People,
            Role @readonly,
            JoinedAt @readonly,
            LastReadAt @readonly,
            MutedUntil,
            IsPinned,
            IsArchived,
            virtual UnreadCount : Integer,
            virtual Title : String(80),
            virtual DirectPeer_ID : UUID
        };

    @readonly
    entity PublicChannels as
        projection on entities.Conversations {
            ID,
            Name,
            Description,
            LastMessageAt,
            virtual MemberCount : Integer,
            virtual IsMember : Boolean
        }
        where Kind = 'Channel' and IsPublic = true;

    @readonly
    @restrict: [{
        grant: 'READ',
        where: 'exists Conversation.Members[User.ID = $user]'
    }]
    entity Messages      as
        projection on entities.Messages {
            *,
            Conversation : redirected to Conversations,
            Sender       : redirected to People,
            ReplyTo      : redirected to Messages
        } excluding {
            Attachment,
            Reactions,
            Views
        };

    action SendMessage(Conversation_ID: UUID, Text: String(4000), ReplyTo_ID: UUID) returns Messages;
    action MarkAsRead(Conversation_ID: UUID);
    action StartDirect(User_ID: UUID) returns Conversations;
    action CreateConversation(Kind: String(10), Name: String(80), Description: String(500), MemberIds: many UUID, IsPublic: Boolean, OnlyAdminsCanPost: Boolean) returns Conversations;
    action AddMembers(Conversation_ID: UUID, UserIds: many UUID);
    action RemoveMember(Conversation_ID: UUID, User_ID: UUID);
    action SetMemberRole(Conversation_ID: UUID, User_ID: UUID, Role: String(10));
    action LeaveConversation(Conversation_ID: UUID);
    action JoinChannel(Conversation_ID: UUID) returns Conversations;

    function PushPublicKey() returns String(500);
    action   SubscribePush(Endpoint: String(500), P256dh: String(200), Auth: String(100), UserAgent: String(255));
    action   UnsubscribePush(Endpoint: String(500));
    action   SendPushTest();

}
