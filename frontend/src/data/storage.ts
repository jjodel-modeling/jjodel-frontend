export class Storage {
    static read<T>(key: string): T|null {
        try {
            return JSON.parse(localStorage.getItem(key) || '') as unknown as T;
        } catch (e) {
            return null;
        }

    }

    static write(key: string, obj: unknown): void {
        localStorage.setItem(key, JSON.stringify(obj || 'undefined'));
    }

    /*static reset(): void { localStorage.clear(); } NO! never fully reset the state or offline mode breaks completely with lost data. */
}

export default Storage;

