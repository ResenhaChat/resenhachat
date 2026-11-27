namespace apps.dflc.resenha.entities;

using {
    cuid,
    managed
} from '@sap/cds/common';
using { apps.dflc.resenha.entities.MessageKind } from '../types/enums';
using { apps.dflc.resenha.entities.Users } from './users';
using { apps.dflc.resenha.entities.Conversations } from './conversations';

entity Messages : cuid, managed {
    Conversation : Association to Conversations @mandatory;
    Sender       : Association to Users;
    Kind         : MessageKind default 'Text';
    Text         : String(4000);
    ReplyTo      : Association to Messages;
    IsViewOnce   : Boolean default false;
    EditedAt     : Timestamp;
    DeletedAt    : Timestamp;
    SystemKey    : String(40);
    SystemArgs   : String(1000);
    Attachment   : Composition of one MessageAttachments
                       on Attachment.Message = $self;
    Reactions    : Composition of many MessageReactions
                       on Reactions.Message = $self;
    Views        : Composition of many MessageViews
                       on Views.Message = $self;
}

entity MessageAttachments : cuid {
    Message         : Association to Messages @mandatory;
    Content         : LargeBinary @Core.MediaType: MimeType;
    MimeType        : String(100) @Core.IsMediaType;
    FileName        : String(255);
    Size            : Integer;
    DurationSeconds : Integer;
    Width           : Integer;
    Height          : Integer;
    Thumbnail       : LargeBinary @Core.MediaType: ThumbnailMimeType;
    ThumbnailMimeType : String(100) @Core.IsMediaType;
}

@assert.unique: {Reaction: [
    Message,
    User
]}
entity MessageReactions : cuid {
    Message : Association to Messages @mandatory;
    User    : Association to Users @mandatory;
    Emoji   : String(16) @mandatory;
}

@assert.unique: {View: [
    Message,
    User
]}
entity MessageViews : cuid {
    Message  : Association to Messages @mandatory;
    User     : Association to Users @mandatory;
    OpenedAt : Timestamp @cds.on.insert: $now;
}
