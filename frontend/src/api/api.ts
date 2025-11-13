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
    public static persistance = `${process.env['REACT_APP_PERSISTANCE']}`;
    public static memorec = `${process.env['REACT_APP_MEMOREC']}/memorec`;
    private static token: string | null = null;
    private static _refreshToken: string | null = null;
    private static refreshTokenTimer: number = -1;

    private static headers() {
        if (!Api.token) Api.token = Storage.read('token');
        if (!Api.token) { Log.eDevv("error headers, token not found"); }
        return {'Authorization': "Bearer " + Api.token};
    }


    static async checkToken(): Promise<boolean> {
        if (!Api.token) Api.token = Storage.read('token');
        if (!Api.token) return false;

        const exp: number = Storage.read('tokenExp');
        let ret: boolean = exp ? exp < Math.floor(Date.now() / 1000) : false;
        if (!ret) {
            Log.ee("expired token", {exp, at: Api.token, st: Storage.read('token')});
            return false;
        }

        // setup timer to renew refresh token
        let safetyMargin = 0.2; // 0.2 = 20% of time before it expires.
        let maxNetworkDelay = 5 * 60; // 5min? (tentatively, depends on browser). PS: units are seconds, not ms.
        let diff = (exp - Date.now() / 1000);
        let refreshTokenTimeout = diff - Math.max(maxNetworkDelay, safetyMargin * (1 - diff));
        clearTimeout(Api.refreshTokenTimer);
        if (refreshTokenTimeout <= 0) Api.refreshToken();
        else Api.refreshTokenTimer = setTimeout(()=> Api.refreshToken(), refreshTokenTimeout*1000) as unknown as number;
        return false;
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
        console.log('swap id api', {data, id:d.id, guid:d._Id, toJodel});
        if (toJodel && d.id && Pointers.isPointer(d.id)) return data;
        if (!toJodel && (Pointers.isPointer(d._Id))) return data;

        let tmp = d._Id;
        d._Id = d.id;
        d.id = tmp;
        Log.eDev(toJodel && !Pointers.isPointer(d.id), 'API: cannot swap id and guid, one is missing', {data, id:d.id, guid:d._Id, toJodel});
        Log.eDev(!toJodel && !Pointers.isPointer(d._Id), 'API: cannot swap guid and uid, one is missing', {data, id:d.id, guid:d._Id, toJodel});
        return d as any;
    }

    static async get(path: string, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if (allowAnonymous || await Api.checkToken()) {
                const response = await Axios.get(path, {headers: this.headers()});
                console.log('Api response', {path, response});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};

        } catch (e) {
            Log.eDevv('get API failed:', {e, path});
            return {code: 400, data: null};
        }

    }

    static async post(path: string, obj: GObject, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if (allowAnonymous || await Api.checkToken()) {
                console.log('post api call:', {obj, swap:Api.swapToGUID(obj)})
                const response = await Axios.post(path, Api.swapToGUID(obj), {headers: this.headers()});
                console.log('Api response', {path, r:response});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: 'Login session expired.' as any};
        } catch (e: any) {
            Log.ee('post API failed:', {e, path, obj}, e?.message);
            return {code: e?.response?.status || 400, data: e?.response?.data || ''};
        }
    }

    static async put(path: string, obj: GObject, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if(allowAnonymous || await Api.checkToken()) {
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
            if (allowAnonymous || await Api.checkToken()) {
                const response = await Axios.delete(path, {headers: this.headers()});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};
        } catch (e) {
            Log.eDevv('delete API failed:', {e, path});
            return {code: 400, data: null};
        }
    }


    private static async refreshToken(): Promise<boolean> {
        // NB: checkToken() required because hybernation/sleep would cause this to trigger exception.
        // if the timeout was scheduled for 2 min, but pc sleeps for 8h, after 8h it will try to refresh an expired token
        if (!Api.checkToken()) return false;
        try {
            const response = await Api.post('/account/refresh-token', {token: Api.token, refreshToken: Api._refreshToken}, false);
            console.log('refreshed', {response});
            // tood: ??? Api._refreshToken = response.data; ???
            return response && (response.code+'')[0] === '2';
        } catch (e) { Log.eDevv('refresh token error', e); return false; }
    }

    public static async revokeToken(): Promise<boolean> {
        if (!Api.checkToken()) return true;
        try {
            const response = await Api.post('/account/revoke', {username: D.fromPointer(DUser.current).nickname}, true);
            if (response && (response.code+'')[0] !== '2') return false;
            Api._refreshToken = Api.token = null;
            return true;
        } catch (e) { Log.eDevv('refresh token error', e); return false; }
    }
}

export default Api;