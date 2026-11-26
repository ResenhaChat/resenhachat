const MILLIS_PER_MINUTE = 60 * 1000;

export class RateLimiter {

    private readonly hits = new Map<string, number[]>();

    private lastSweep = Date.now();


    constructor(
        private readonly maxHits: number,
        private readonly windowInMinutes: number
    ) { }


    public tryConsume(key: string): boolean {

        const iNow = Date.now();

        this.sweep(iNow);

        const aHits = this.recentHits(key, iNow);
        const bAllowed = aHits.length < this.maxHits;

        if (bAllowed) {
            aHits.push(iNow);
        }

        this.save(key, aHits);

        return bAllowed;

    }


    private recentHits(key: string, iNow: number): number[] {

        const iWindowStart = iNow - this.windowInMinutes * MILLIS_PER_MINUTE;

        return (this.hits.get(key) ?? []).filter((iHit) => iHit > iWindowStart);

    }


    private save(key: string, aHits: number[]): void {

        if (aHits.length) {
            this.hits.set(key, aHits);
        } else {
            this.hits.delete(key);
        }

    }


    private sweep(iNow: number): void {

        if (iNow - this.lastSweep < this.windowInMinutes * MILLIS_PER_MINUTE) {
            return;
        }

        this.lastSweep = iNow;

        this.hits.forEach((_aHits, sKey) => this.save(sKey, this.recentHits(sKey, iNow)));

    }

}
