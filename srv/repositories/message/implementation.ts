import cds from '@sap/cds';
import { Messages } from '@models/apps/dflc/resenha/entities';
import { MessageModel } from '@/models/message';
import { MessageRepository } from './protocols';
import { BaseRepositoryImplementation } from '../base/implementation';

export class MessageRepositoryImplementation extends BaseRepositoryImplementation<MessageModel> implements MessageRepository {

    public async create(Message: MessageModel): Promise<void> {

        await cds.run(INSERT.into(this.getEntity()).entries(Message.toEntityObject()));

    }


    protected entityName(): string {

        return 'Messages';

    }


    protected mapResult(Rows: unknown[]): MessageModel[] {

        return MessageModel.mapModel(Rows as Messages);

    }

}
