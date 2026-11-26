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
            Settings : redirected to MySettings
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
            User : redirected to Me
        };

    @readonly
    @restrict: [{
        grant: 'READ',
        where: 'exists Members[User.ID = $user]'
    }]
    entity Conversations as
        projection on entities.Conversations {
            *,
            Members  : redirected to Members,
            Messages : redirected to Messages,
            virtual UnreadCount : Integer
        } excluding {
            DirectKey
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
            IsArchived
        };

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

    function PushPublicKey() returns String(500);
    action   SubscribePush(Endpoint: String(500), P256dh: String(200), Auth: String(100), UserAgent: String(255));
    action   UnsubscribePush(Endpoint: String(500));
    action   SendPushTest();

}
