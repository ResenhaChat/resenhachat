export type RealtimeEvent =
    | { type: 'presence.snapshot'; payload: { OnlineUserIds: string[] } }
    | { type: 'presence.changed'; payload: { UserId: string; IsOnline: boolean; LastSeenAt: string | null } }
    | { type: 'message.created'; payload: { ConversationId: string; MessageId: string; SenderId: string | null } }
    | { type: 'conversation.read'; payload: { ConversationId: string; UserId: string; LastReadAt: string } }
    | { type: 'conversation.created'; payload: { ConversationId: string } }
    | { type: 'conversation.updated'; payload: { ConversationId: string } }
    | { type: 'members.changed'; payload: { ConversationId: string } }
    | { type: 'typing'; payload: { ConversationId: string; UserId: string } }
    | { type: 'ping'; payload: Record<string, never> }
    | { type: 'pong'; payload: Record<string, never> };

export type ClientEvent =
    | { type: 'typing'; payload: { ConversationId: string } }
    | { type: 'ping'; payload: Record<string, never> }
    | { type: 'pong'; payload: Record<string, never> };
