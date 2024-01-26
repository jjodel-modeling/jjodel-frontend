import Axios from 'axios';
import {Json} from '../joiner';

export type Response = {code: number, data: Json|null}
class Api {
    static async get(path: string): Promise<Response> {
        try {
            const response = await Axios.get(path);
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async post(path: string, obj: Json): Promise<Response> {
        try {
            const response = await Axios.post(path, obj);
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async patch(path: string, obj: Json): Promise<Response> {
        try {
            const response = await Axios.patch(path, obj);
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
    static async delete(path: string): Promise<Response> {
        try {
            const response = await Axios.delete(path);
            return {code: response.status, data: response.data};
        } catch (e) {
            return {code: 400, data: null};
        }
    }
}

export default Api;
