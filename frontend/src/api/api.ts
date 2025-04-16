import Axios from "axios";
import {Json, R} from "../joiner";
import Storage from "../data/storage";
import { AuthApi } from "./persistance";
import { JwtClaims } from "./DTO/JwtClaims";

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

    static async get(path: string, allowAnonymous:boolean = false): Promise<Response> {
        try {

            if(allowAnonymous || await Api.checkToken()) {
                const response = await Axios.get(path, {headers: this.headers()});
                return {code: response.status, data: response.data};
            }
            return {code: 401, data: null};


        } catch (e) {
            return {code: 400, data: null};
        }

    }

    static async post(path: string, obj: Json, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if(allowAnonymous || await Api.checkToken()) {

                const response = await Axios.post(path, obj, {headers: this.headers()});
                return {code: response.status, data: response.data};
            }
            return {code: 401, data: null};
        } catch (e) {
            return {code: 400, data: null};
        }
    }

    static async put(path: string, obj: Json, allowAnonymous:boolean = false): Promise<Response> {
        try {

            if(allowAnonymous || await Api.checkToken()) {
                const response = await Axios.put(path, obj, {headers: this.headers()});
                return {code: response.status, data: response.data};
            }
            return {code: 401, data: null};

        } catch (e) {
            return {code: 400, data: null};
        }
    }

    /*
        static async patch(path: string, obj: Json, allowAnonymous:boolean = false): Promise<Response> {
            try {
                if(allowAnonymous || await Api.checkToken()) {
                    const response = await Axios.patch(path, obj, {headers: this.headers()});
                    return {code: response.status, data: response.data};
                }
                return {code: 401, data: null};

            } catch (e) {
                return {code: 400, data: null};
            }
        }
        */


    static async delete(path: string, allowAnonymous:boolean = false): Promise<Response> {
        try {
            if(allowAnonymous || await Api.checkToken()) {
                const response = await Axios.delete(path, {headers: this.headers()});
                return {code: response.status, data: response.data};
            }
            return {code: 401, data: null};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
}

export default Api;