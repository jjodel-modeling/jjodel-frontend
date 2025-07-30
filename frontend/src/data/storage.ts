
export class Storage {
    static read<T>(key: string): T {
        let val: string | null = localStorage.getItem(key);
        if (val) try {
            // NB: JSON.parse can parse to correct type also null/number/boolean from strings
            return JSON.parse(val) as unknown as T;
        } catch (e) { }
        return val as unknown as T;

    }

    static write(key: string, obj: unknown): void {
        let str: string;
        switch (typeof obj){
            case 'object': str = JSON.stringify(obj); break;
            default: str = ''+obj; break;
        }
        localStorage.setItem(key, str);
    }


    static reset(): void { localStorage.clear(); } /* NO! never fully reset the state or offline mode breaks completely with lost data. */
}

export default Storage;
(window as any).JStorage = Storage;

