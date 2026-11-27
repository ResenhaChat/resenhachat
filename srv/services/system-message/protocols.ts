import { Request } from '@sap/cds';

export type SystemMessageKey =
    | 'system.groupCreated'
    | 'system.channelCreated'
    | 'system.memberAdded'
    | 'system.memberRemoved'
    | 'system.memberLeft'
    | 'system.channelJoined'
    | 'system.becameAdmin'
    | 'system.leftAdmin'
    | 'system.becameOwner'
    | 'system.nameChanged'
    | 'system.descriptionChanged'
    | 'system.photoChanged'
    | 'system.photoRemoved';

export type SystemEvent = {
    Key: SystemMessageKey;
    ActorId: string;
    TargetId?: string;
    Name?: string;
};

export interface SystemMessageService {
    announce(Request: Request, ConversationId: string, Event: SystemEvent): Promise<void>;
    announceMany(Request: Request, ConversationId: string, Events: SystemEvent[]): Promise<void>;
}
