namespace apps.dflc.resenha.entities;

using {
    cuid,
    managed
} from '@sap/cds/common';
using { apps.dflc.resenha.entities.ConversationKind, apps.dflc.resenha.entities.MemberRole } from '../types/enums';
using { apps.dflc.resenha.entities.Users } from './users';
using { apps.dflc.resenha.entities.Messages } from './messages';

@assert.unique: { DirectKey: [DirectKey] }
entity Conversations : cuid, managed {
    Kind              : ConversationKind default 'Group' @mandatory;
    Name              : String(80);
    Description       : String(500);
    Avatar            : LargeBinary @Core.MediaType: AvatarMimeType;
    AvatarMimeType    : String(100) @Core.IsMediaType;
    AvatarVersion     : Integer default 0;
    IsPublic          : Boolean default false;
    OnlyAdminsCanPost : Boolean default false;
    DirectKey         : String(80);
    LastMessageAt     : Timestamp;
    LastMessage       : String(200);
    LastMessageKey    : String(40);
    LastMessageArgs   : String(1000);
    Members           : Composition of many ConversationMembers
                            on Members.Conversation = $self;
    Messages          : Association to many Messages
                            on Messages.Conversation = $self;
}

@assert.unique: {Member: [
    Conversation,
    User
]}
entity ConversationMembers : cuid {
    Conversation : Association to Conversations @mandatory;
    User         : Association to Users @mandatory;
    Role         : MemberRole default 'Member';
    JoinedAt     : Timestamp @cds.on.insert: $now;
    LastReadAt   : Timestamp;
    MutedUntil   : Timestamp;
    IsPinned     : Boolean default false;
    IsArchived   : Boolean default false;
}
