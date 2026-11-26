import type { WebSocket } from 'ws';
import { RealtimeEvent } from '../events';

export interface RealtimeHub {
    register(UserId: string, Socket: WebSocket): boolean;
    unregister(UserId: string, Socket: WebSocket): boolean;
    publish(UserIds: string[], Event: RealtimeEvent): void;
    broadcast(Event: RealtimeEvent): void;
    sendTo(Socket: WebSocket, Event: RealtimeEvent): void;
    isOnline(UserId: string): boolean;
    onlineUserIds(): string[];
    sockets(): WebSocket[];
}
