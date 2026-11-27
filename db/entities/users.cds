namespace apps.dflc.resenha.entities;

using {
    cuid,
    managed
} from '@sap/cds/common';
using { apps.dflc.resenha.entities.Visibility, apps.dflc.resenha.entities.ThemeMode } from '../types/enums';

@assert.unique: {
    Email   : [Email],
    Username: [Username]
}
entity Users : cuid, managed {
    Email          : String(120) @mandatory;
    PasswordHash   : String(100) @mandatory;
    DisplayName    : String(80) @mandatory;
    Username       : String(30) @mandatory  @assert.format: '^[a-z0-9_.]{3,30}$';
    About          : String(200);
    Avatar         : LargeBinary @Core.MediaType: AvatarMimeType;
    AvatarMimeType : String(100) @Core.IsMediaType;
    AvatarVersion  : Integer default 0;
    LastSeenAt     : Timestamp;
    Settings       : Composition of one UserSettings
                         on Settings.User = $self;
}

entity UserSettings {
    key User               : Association to Users;
        LastSeenVisibility : Visibility default 'Everyone';
        OnlineVisibility   : Visibility default 'Everyone';
        AvatarVisibility   : Visibility default 'Everyone';
        AboutVisibility    : Visibility default 'Everyone';
        DirectMessagesFrom : Visibility default 'Everyone';
        ReadReceipts       : Boolean default true;
        NotificationsEnabled : Boolean default true;
        NotificationSound  : Boolean default true;
        EnterToSend        : Boolean default true;
        Theme              : ThemeMode default 'Auto';
}

entity RefreshTokens : cuid {
    User      : Association to Users @mandatory;
    TokenHash : String(64) @mandatory;
    ExpiresAt : Timestamp @mandatory;
    RevokedAt : Timestamp;
    UserAgent : String(255);
    createdAt : Timestamp @cds.on.insert: $now;
}

@assert.unique: {Blocks: [
    Blocker,
    Blocked
]}
entity UserBlocks : cuid, managed {
    Blocker : Association to Users @mandatory;
    Blocked : Association to Users @mandatory;
}
