import cds from '@sap/cds';
import type { IncomingMessage, Server } from 'http';
import type { Duplex } from 'stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import {
    TYPING_MAX_TRACKED_CONVERSATIONS,
    TYPING_THROTTLE_MILLIS,
    WS_EXPIRED_CLOSE_CODE,
    WS_EXPIRED_CLOSE_REASON,
    WS_HEARTBEAT_MILLIS,
    WS_MAX_PAYLOAD_BYTES,
    WS_PATH
} from '@/constants/realtime';
import { JwtTokens, VerifiedToken } from '@/infrastructure/JwtTokens';
import { PresenceService } from '@/services/presence';
import { ClientEvent } from '../events';
import { RealtimeHub } from '../hub';
import { RealtimeServer } from './protocols';

type LiveSocket = WebSocket & { isAlive?: boolean; expiryTimer?: NodeJS.Timeout };

export class RealtimeServerImplementation implements RealtimeServer {

    private readonly log = cds.log('realtime');

    private readonly wss = new WebSocketServer({ noServer: true, maxPayload: WS_MAX_PAYLOAD_BYTES });

    private readonly typingSentAt = new WeakMap<WebSocket, Map<string, number>>();


    constructor(
        private readonly Hub: RealtimeHub,
        private readonly Presence: PresenceService
    ) { }


    public attach(HttpServer: Server): void {

        HttpServer.on('upgrade', (Request: IncomingMessage, Socket: Duplex, Head: Buffer) => {

            const oUrl = new URL(Request.url ?? '/', 'http://localhost');

            if (oUrl.pathname !== WS_PATH) {
                return;
            }

            const oSession = JwtTokens.verify(oUrl.searchParams.get('token') ?? '');

            if (!oSession) {

                Socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
                Socket.destroy();

                return;

            }

            this.wss.handleUpgrade(Request, Socket, Head, (oSocket) => this.onConnection(oSocket, oSession));

        });

        this.startHeartbeat(HttpServer);

    }


    private onConnection(Socket: LiveSocket, Session: VerifiedToken): void {

        Socket.isAlive = true;

        Socket.on('pong', () => { Socket.isAlive = true; });
        Socket.on('message', (Data: RawData) => this.onMessage(Socket, Session.UserId, Data));
        Socket.on('close', () => this.onClose(Socket, Session.UserId));
        Socket.on('error', (oError: Error) => this.log.warn('socket error', oError.message));

        this.scheduleExpiry(Socket, Session.ExpiresAt);

        const bFirst = this.Hub.register(Session.UserId, Socket);

        this.Hub.sendTo(Socket, { type: 'presence.snapshot', payload: { OnlineUserIds: this.Hub.onlineUserIds() } });

        if (bFirst) {
            this.Hub.broadcast({ type: 'presence.changed', payload: { UserId: Session.UserId, IsOnline: true, LastSeenAt: null } });
        }

    }


    private scheduleExpiry(Socket: LiveSocket, ExpiresAt: number): void {

        Socket.expiryTimer = setTimeout(
            () => Socket.close(WS_EXPIRED_CLOSE_CODE, WS_EXPIRED_CLOSE_REASON),
            Math.max(ExpiresAt - Date.now(), 0)
        );

    }


    private onClose(Socket: LiveSocket, UserId: string): void {

        clearTimeout(Socket.expiryTimer);

        if (!this.Hub.unregister(UserId, Socket)) {
            return;
        }

        this.Presence.recordDisconnect(UserId)
            .then((sLastSeenAt) => {

                this.Hub.broadcast({ type: 'presence.changed', payload: { UserId, IsOnline: false, LastSeenAt: sLastSeenAt } });

            })
            .catch((oError: unknown) => this.log.error(oError));

    }


    private onMessage(Socket: WebSocket, UserId: string, Data: RawData): void {

        const oEvent = this.parse(Data);

        if (oEvent?.type === 'ping') {

            this.Hub.sendTo(Socket, { type: 'pong', payload: {} });

        } else if (oEvent?.type === 'typing' && this.allowTyping(Socket, oEvent.payload.ConversationId)) {

            this.forwardTyping(UserId, oEvent.payload.ConversationId);

        }

    }


    private allowTyping(Socket: WebSocket, ConversationId: string): boolean {

        const oSentAt = this.typingSentAt.get(Socket) ?? new Map<string, number>();
        const iNow = Date.now();
        const iLastSent = oSentAt.get(ConversationId);

        this.typingSentAt.set(Socket, oSentAt);

        if (iLastSent !== undefined && iNow - iLastSent < TYPING_THROTTLE_MILLIS) {
            return false;
        }

        oSentAt.set(ConversationId, iNow);

        if (oSentAt.size > TYPING_MAX_TRACKED_CONVERSATIONS) {

            const sOldest = oSentAt.keys().next().value;

            if (sOldest !== undefined) {
                oSentAt.delete(sOldest);
            }

        }

        return true;

    }


    private forwardTyping(UserId: string, ConversationId: string): void {

        this.Presence.typingRecipients(UserId, ConversationId)
            .then((aUserIds) => this.Hub.publish(aUserIds, { type: 'typing', payload: { ConversationId, UserId } }))
            .catch((oError: unknown) => this.log.error(oError));

    }


    private parse(Data: RawData): ClientEvent | null {

        try {

            const oEvent: unknown = JSON.parse(Data.toString());

            if (typeof oEvent !== 'object' || oEvent === null || !('type' in oEvent)) {
                return null;
            }

            const oPayload = 'payload' in oEvent && typeof oEvent.payload === 'object' && oEvent.payload !== null ? oEvent.payload : {};

            if (oEvent.type === 'ping' || oEvent.type === 'pong') {
                return { type: oEvent.type, payload: {} };
            }

            if (oEvent.type === 'typing' && 'ConversationId' in oPayload && typeof oPayload.ConversationId === 'string') {
                return { type: 'typing', payload: { ConversationId: oPayload.ConversationId } };
            }

            return null;

        } catch {

            return null;

        }

    }


    private startHeartbeat(HttpServer: Server): void {

        const oTimer = setInterval(() => {

            this.Hub.sockets().forEach((oSocket: LiveSocket) => {

                if (oSocket.isAlive === false) {

                    oSocket.terminate();

                    return;

                }

                oSocket.isAlive = false;
                oSocket.ping();

            });

        }, WS_HEARTBEAT_MILLIS);

        HttpServer.on('close', () => clearInterval(oTimer));

    }

}
