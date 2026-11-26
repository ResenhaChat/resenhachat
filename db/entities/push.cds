namespace apps.dflc.resenha.entities;

using {
    cuid,
    managed
} from '@sap/cds/common';
using { apps.dflc.resenha.entities.Users } from './users';

/**
 * Inscrições de Web Push (notificação com o app fechado). Uma linha por navegador;
 * o mesmo endpoint sempre pertence ao usuário que se inscreveu por último.
 */
@assert.unique: { Endpoint: [Endpoint] }
entity PushSubscriptions : cuid, managed {
    User       : Association to Users @mandatory;
    Endpoint   : String(500) @mandatory;
    P256dh     : String(200) @mandatory;
    Auth       : String(100) @mandatory;
    UserAgent  : String(255);
    LastUsedAt : Timestamp;
}
