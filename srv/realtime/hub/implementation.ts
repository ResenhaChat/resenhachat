import { WebSocket } from 'ws';
import { RealtimeEvent } from '../events';
import { RealtimeHub } from './protocols';

export class RealtimeHubImplementation implements RealtimeHub {

    private readonly connections = new Map<string, Set<WebSocket>>();


    public register(UserId: string, Socket: WebSocket): boolean {

        const oSockets = this.connections.get(UserId) ?? new Set<WebSocket>();
        const bFirst = oSockets.size === 0;

        oSockets.add(Socket);

        this.connections.set(UserId, oSockets);

        return bFirst;

    }


    public unregister(UserId: string, Socket: WebSocket): boolean {

        const oSockets = this.connections.get(UserId);

        if (!oSockets) {
            return false;
        }

        oSockets.delete(Socket);

        if (oSockets.size > 0) {
            return false;
        }

        this.connections.delete(UserId);

        return true;

    }


    public publish(UserIds: string[], Event: RealtimeEvent): void {

        const sMessage = JSON.stringify(Event);

        new Set(UserIds).forEach((sUserId) => {

            this.connections.get(sUserId)?.forEach((oSocket) => this.write(oSocket, sMessage));

        });

    }


    public broadcast(Event: RealtimeEvent): void {

        const sMessage = JSON.stringify(Event);

        this.sockets().forEach((oSocket) => this.write(oSocket, sMessage));

    }


    public sendTo(Socket: WebSocket, Event: RealtimeEvent): void {

        this.write(Socket, JSON.stringify(Event));

    }


    public isOnline(UserId: string): boolean {

        return this.connections.has(UserId);

    }


    public onlineUserIds(): string[] {

        return [...this.connections.keys()];

    }


    public sockets(): WebSocket[] {

        return [...this.connections.values()].flatMap((oSockets) => [...oSockets]);

    }


    private write(Socket: WebSocket, Message: string): void {

        if (Socket.readyState === WebSocket.OPEN) {
            Socket.send(Message);
        }

    }

}
