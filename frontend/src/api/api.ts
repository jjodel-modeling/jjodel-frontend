import Axios from 'axios';
import {Json, DUser} from '../joiner';
import Storage from "./storage";

export type Response = {code: number, data: Json|null}
class Api {
    static persistance = `${process.env['REACT_APP_PERSISTANCE']}/persistance`;
    static memorec = `${process.env['REACT_APP_MEMOREC']}/memorec`;

    private static headers(): {'auth-token': string} {
        let token: string = Storage.read('token') || '';
        return {'auth-token': token};
    }
    static async get(path: string): Promise<Response> {
        try {
            const response = await Axios.get(path, {headers: this.headers()});
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async post(path: string, obj: Json): Promise<Response> {
        try {
            const response = await Axios.post(path, obj, {headers: this.headers()});
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async patch(path: string, obj: Json): Promise<Response> {
        try {
            const response = await Axios.patch(path, obj, {headers: this.headers()});
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async delete(path: string): Promise<Response> {
        try {
            const response = await Axios.delete(path, {headers: this.headers()});
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
}

export default Api;
