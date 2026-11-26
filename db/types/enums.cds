namespace apps.dflc.resenha.entities;

type Visibility       : String(10) enum {
    Everyone;
    Contacts;
    Nobody;
};

type ConversationKind : String(10) enum {
    General;
    Direct;
    Group;
    Channel;
};

type MemberRole       : String(10) enum {
    Owner;
    Admin;
    Member;
};

type MessageKind      : String(10) enum {
    Text;
    Image;
    Audio;
    Video;
    File;
    System;
};

type ThemeMode        : String(10) enum {
    Auto;
    Light;
    Dark;
};
