import type { Server } from 'http';

export interface RealtimeServer {
    attach(HttpServer: Server): void;
}
