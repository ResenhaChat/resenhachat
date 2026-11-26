import { PushSubscription } from '@models/apps/dflc/resenha/entities';
import { Either } from '@sweet-monads/either';
import { AbstractError } from '@/errors';
import { MessageModel } from '@/models/message';
import { BaseService } from '../base';

export type PushSubscriptionInput = {
    Endpoint?: string | null;
    P256dh?: string | null;
    Auth?: string | null;
    UserAgent?: string | null;
};

export interface PushService extends BaseService<PushSubscription> {
    /** Chave pública VAPID (a mesma que o navegador usa para se inscrever); null se não configurada. */
    publicKey(): string | null;
    subscribe(UserId: string, Input: PushSubscriptionInput): Promise<Either<AbstractError, boolean>>;
    unsubscribe(UserId: string, Endpoint?: string | null): Promise<Either<AbstractError, boolean>>;
    sendTest(UserId: string): Promise<Either<AbstractError, boolean>>;
    /** Avisa os membros offline sobre a mensagem recém-gravada (nunca falha: erros vão só para o log). */
    notifyNewMessage(Message: MessageModel): Promise<void>;
}
