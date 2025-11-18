import {DUser, LUser, type GObject} from "../joiner";

export class Storage {
    static read<T>(key: string): T {
        let val: string | null | T = localStorage.getItem(key);

        if (val) try {
            // NB: JSON.parse can parse to correct type also null/number/boolean from strings
            val = JSON.parse(val) as unknown as T;
            if (key === 'user') LUser.replace((val as DUser));
        } catch (e) { }
        return val as T;

    }

    static write(key: string, obj: unknown): void {
        let str: string = '';
        if (obj === null) obj = undefined;
        // console.trace('store.write('+key+', '+obj+')', {key, obj});
        if (key === 'user') LUser.replace((obj as DUser));
        switch (typeof obj){
            case undefined: localStorage.removeItem(key); break;
            case 'object': str = JSON.stringify(obj); break;
            default: str = ''+obj; break;
        }
        localStorage.setItem(key, str);
    }


    static resetLogin(): void {
        localStorage.removeItem('offline');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refreshTokenExp');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExp');
        localStorage.removeItem('user');
        // localStorage.clear();  NO! never fully reset the state or project recovery mode and offline completely loses data.
    }
}

export default Storage;
(window as any).JStorage = Storage;

