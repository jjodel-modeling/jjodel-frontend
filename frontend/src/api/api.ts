import Axios from "axios";
import {type Dictionary, DPointerTargetable, GObject, Json, Log, R} from "../joiner";
import Storage from "../data/storage";
import { AuthApi } from "./persistance";
import { JwtClaims } from "./DTO/JwtClaims";
import type {LayoutData} from "rc-dock";

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

        if(Api.token || Storage.read('token')) {

            const exp :number = Storage.read('tokenExp');

            if (exp && exp > Math.floor(Date.now() / 1000)) {


                return true;
            }

        }
        console.log("token scaduto o non valido");
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
        if (!(d._id && d.id && d.className)) return data;

        d = {...data} as any;
        // check if it is already been swapped to desired state
        if (toJodel && d.id.indexOf('Pointer') === 0) return data;
        if (!toJodel && d._id.indexOf('Pointer') === 0) return data;
        let tmp = d._id;
        d._id = d.id;
        d.id = tmp;
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

    static async post(path: string, obj: Json, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if(allowAnonymous || await Api.checkToken()) {
                const response = await Axios.post(path, Api.swapToGUID(obj), {headers: this.headers()});
                console.log('Api response', {path, response});
                return {code: response.status, data: Api.swapToJodelID(response.data)};
            }
            return {code: 401, data: null};
        } catch (e) {
            Log.eDevv('post API failed:', {e, path, obj});
            return {code: 400, data: null};
        }
    }

    static async put(path: string, obj: Json, allowAnonymous:boolean = false): Promise<Response> {
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