import cds, { entity } from '@sap/cds';
import { BaseRepository } from './protocols';
import { ServiceLocator } from '@/infrastructure/ServiceLocator';

export abstract class BaseRepositoryImplementation<Model> implements BaseRepository<Model> {

    public async findById(Id: string): Promise<Model | null> {

        const oRows = await cds.run(SELECT.from(this.getEntity()).columns(...this.columns()).where({ ID: Id }));

        return this.mapResult(oRows)[0] ?? null;

    }


    public async findByIds(Ids: string[]): Promise<Model[]> {

        if (!Ids.length) {
            return [];
        }

        const oRows = await cds.run(SELECT.from(this.getEntity()).columns(...this.columns()).where({ ID: { in: Ids } }));

        return this.mapResult(oRows);

    }


    protected columns(): string[] {

        return ['*'];

    }


    protected getEntity(): entity {

        return ServiceLocator.getEntity(this.entityName());

    }


    protected abstract entityName(): string;


    protected abstract mapResult(Rows: unknown[]): Model[];

}
