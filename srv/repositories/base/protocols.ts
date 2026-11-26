export interface BaseRepository<Model> {
    findById(Id: string): Promise<Model | null>;
    findByIds(Ids: string[]): Promise<Model[]>;
}
