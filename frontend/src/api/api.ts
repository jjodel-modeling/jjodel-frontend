import Axios from "axios";
import {type Dictionary, DPointerTargetable, GObject, Json, Log, Pointers, R} from "../joiner";
import Storage from "../data/storage";

export type Response = {code: number, data: Json|null}
class Api {

    static persistance = `${process.env['REACT_APP_PERSISTANCE']}`;
    static memorec = `${process.env['REACT_APP_MEMOREC']}/memorec`;
    static token: string | null = null;

    private static headers() {
        // check if token is null

        try {
            if(!Api.token) {
                Api.token = Storage.read('token') || '';
            }
            return {'Authorization': "Bearer " + Api.token};
        } catch (e) {

            console.log("error headers");
        }
    }


    static async checkToken(): Promise<boolean> {
        if (Api.token || Storage.read('token')) {
            const exp: number = Storage.read('tokenExp');
            if (exp && exp > Math.floor(Date.now() / 1000)) {
                return true;
            } else console.error("expired token", {exp, at: Api.token, st: Storage.read('token')});
        }
        console.error("invalid token", {at: Api.token, st: Storage.read('token')});
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
            if(allowAnonymous || await Api.checkToken()) {
                const response = await Axios.delete(path, {headers: this.headers()});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};
        } catch (e) {
            Log.eDevv('delete API failed:', {e, path});
            return {code: 400, data: null};
        }
    }

}

export default Api;