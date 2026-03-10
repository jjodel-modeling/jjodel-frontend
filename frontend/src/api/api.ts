import Axios from "axios";
import {
    type Dictionary,
    type Json,
    type GObject,
    DPointerTargetable,
    D,
    DUser,
    Log,
    Pointers,
    R,
    RuntimeAccessible
} from "../joiner";
import Storage from "../data/storage";

export type Response = {code: number, data: Json|null};

@RuntimeAccessible('Api')
export class Api {
    public static cname: string = 'Api';
    public static persistance = `${process.env['JODEL_PERSISTANCE']}`;
    private static token: string | null = null;
    private static _refreshToken: string | null = null;
    private static refreshTokenTimer: number = -1;
    private static tokenExp: number = 0;
    private static _refreshTokenExp: number = 0;

    private static headers() {
        if (!Api.token) Api.token = Storage.read('token');
        if (!Api.token) { return undefined; }
        return {'Authorization': "Bearer " + Api.token};
    }


    static checkToken(refreshTimer: boolean = true): boolean {
        if (!Api.token) Api.token = Storage.read('token');
        if (!Api._refreshToken) Api._refreshToken = Storage.read('refreshToken');
        if (!Api.tokenExp) Api.tokenExp = Storage.read('tokenExp');
        if (!Api.refreshTokenTimer) Api.refreshTokenTimer = Storage.read('refreshTokenTimer');
        if (!Api.token) return false;

        const exp: number = Api.tokenExp;
        let valid: boolean = exp ? exp > Date.now() : false;
        if (!valid) {
            Log.ee("expired token", {exp, at: Api.token, st: Storage.read('token')});
            return false;
        }

        if (!refreshTimer) return true;
        // setup timer to renew refresh token
        let safetyMargin = 0.2; // 0.2 = 20% of time before it expires.
        let maxNetworkDelay = 5 * 60; // 5min? (tentatively, depends on browser). PS: units are seconds, not ms.
        let diff = (exp - Date.now() / 1000);
        let refreshTokenTimeout = diff - Math.max(maxNetworkDelay, safetyMargin * (1 - diff));
        clearTimeout(Api.refreshTokenTimer);
        if (refreshTokenTimeout <= 0) Api.refreshToken(true);
        else Api.refreshTokenTimer = setTimeout(()=> Api.refreshToken(false), refreshTokenTimeout*1000) as unknown as number;
        return true;
    }

    static swapToJodelID<T extends any>(data: T): T { return Api.swapID(data, true); }
    static swapToGUID<T extends any>(data: T): T { return Api.swapID(data, false); }
    static swapID<T extends any>(data: T, toJodel: boolean = true): T {
        // if is primitive, return as is
        if (!data || typeof data !== 'object') return data;

        if (Array.isArray(data)) return data.map(e=>Api.swapID(e, toJodel)) as T;
        let d: GObject<DPointerTargetable|any> = data as any;

        // if is an object but not jodel object, return it as is
        if (!d._Id && !d.id) return data;

        d = {...data} as any;
        // check if it is already been swapped to desired state
        // console.log('swap id api', {data, id:d.id, guid:d._Id, toJodel});
        if (toJodel && d.id && Pointers.isPointer(d.id)) return data;
        if (!toJodel && (Pointers.isPointer(d._Id))) return data;

        let tmp = d._Id;
        d._Id = d.id;
        d.id = tmp;
        Log.eDev(toJodel && !Pointers.isPointer(d.id), 'API: cannot swap id and guid, id is missing', {data, id:d.id, guid:d._Id, toJodel});
        Log.eDev(!toJodel && !Pointers.isPointer(d._Id), 'API: cannot swap guid and uid, guid is missing', {data, id:d.id, guid:d._Id, toJodel});
        return d as any;
    }

    static async get(path: string, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if (allowAnonymous || Api.checkToken()) {
                const response = await Axios.get(path, {headers: this.headers()});
                console.log('Api response', {path, response});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            // means invalid token
            return {code: 401, data: null};

        } catch (e) {
            Log.eDevv('get API failed:', {e, path});
            return {code: 400, data: null};
        }

    }

    static async post(path: string, obj: GObject, allowAnonymous:boolean = false, isRefreshToken: boolean = false): Promise<Response> {
        try {
            if (isRefreshToken || allowAnonymous || Api.checkToken()) {
                console.log('post api call:', {obj, swap:Api.swapToGUID(obj)});
                const response = await Axios.post(path, Api.swapToGUID(obj), isRefreshToken ? undefined : {headers: this.headers()});
                console.log('Api response', {path, r:response});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: 'Login session expired.' as any};
        } catch (e: any) {
            Log.ee('post API failed:', {e, path, obj}, e?.message);
            return {code: e?.response?.status || 400, data: e?.response?.data || e.message || ''};
        }
    }

    static async put(path: string, obj: GObject, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if (allowAnonymous || Api.checkToken()) {
                const response = await Axios.put(path, Api.swapToGUID(obj), {headers: this.headers()});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};

        } catch (e) {
            Log.eDevv('put API failed:', {e, path, obj});
            return {code: 400, data: null};
        }
    }

    static async delete(path: string, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if (allowAnonymous || Api.checkToken()) {
                const response = await Axios.delete(path, {headers: this.headers()});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};
        } catch (e) {
            Log.eDevv('delete API failed:', {e, path});
            return {code: 400, data: null};
        }
    }


    // public static maxx=20;
    private static throttle_refreshToken: number = 0;
    private static async refreshToken(skipCheckToken: boolean = false): Promise<boolean> {
        // NB: checkToken() required because hybernation/sleep would cause this to trigger exception.
        // if the timeout was scheduled for 2 min, but pc sleeps for 8h, after 8h it will try to refresh an expired token
        // if (Api.maxx--<=0) return false;
        // if (Api.maxx--<=0) return false;
        // console.warn('refreshtoken');
        if (!skipCheckToken && !Api.checkToken(false)) return false;

        if (Date.now() - Api.throttle_refreshToken < 2*60*1000) { return false; } // at most every 2 min

        Api.throttle_refreshToken = Date.now();
        try {
            const response: GObject = await Api.post(process.env['JODEL_PERSISTANCE']+'/account/refresh-token', {token: Api.token, refreshToken: Api._refreshToken}, true, true);
            if (!response || (response.code+'')[0] !== '2') {
                Log.ee('Failed to refresh token, session might expire soon.', {response});
                return false;
            }
            let r = {...response.data};
            if (isNaN(+r.expires)) { r.expires = new Date(r.expires).getTime(); }
            if (isNaN(+r.refreshTokenExpiryTime)) { r.refreshTokenExpiryTime = new Date(r.refreshTokenExpiryTime).getTime(); }
            r.expires = +r.expires;
            r.refreshTokenExpiryTime = +r.refreshTokenExpiryTime;
            if (isNaN(r.expires) || isNaN(r.refreshTokenExpiryTime)) { Log.eDevv('invalid expiration dates', {r}); }
            Api.storeSessionData(r.token, r.expires, r.refreshToken, r.refreshTokenExpiryTime);
            return true;
        } catch (e) { Log.eDevv('refresh token error', e); return false; }
    }

    public static async revokeToken(): Promise<boolean> {
        if (!Api.checkToken()) return true;
        let user = DUser.getUser();
        if (!user) return false;
        try {
            const response = await Api.post(process.env['JODEL_PERSISTANCE']+'/account/revoke', {username: user.nickname}, true);
            if (response && (response.code+'')[0] !== '2') return false;
            Api.storeSessionData();
            return true;
        } catch (e) { Log.eDevv('refresh token error', e); return false; }
    }


    // write storage
    static storeSessionData(token?: string, tokenExp?: number, refreshT?: string, RTExp?: number, user?: DUser): void {
        Api.token = token || '';
        Api.tokenExp = tokenExp || 0;
        Api._refreshToken = refreshT || '';
        Api._refreshTokenExp = RTExp || 0;

        Storage.write('token', token);
        Storage.write('tokenExp', tokenExp);
        Storage.write('refreshToken', refreshT);
        Storage.write('refreshTokenExp', RTExp);
        if (user) Storage.write('user', user);
        Storage.write('offline', false);
    }

}

export default Api;