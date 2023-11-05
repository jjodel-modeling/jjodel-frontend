import Fetch from './fetch';
import {ApiResponse, DUser, SetRootFieldAction} from '../joiner';

class PersistanceApi {
    private static url = '/persistance/';

    private static async responseHandler(response: Response|null): Promise<ApiResponse> {
        if(!response) return {code: 400, body: 'Connection Error'};
        if(response.ok) return {code: 200, body: await response.json()};
        return {code: response.status, body: await response.text()};
    }

    static async login(email: string, password: string): Promise<ApiResponse> {
        const response = await Fetch.post(this.url, 'auth/login', {email, password});
        return await this.responseHandler(response);
    }
    static async register(username: string, email: string, password: string): Promise<ApiResponse> {
        const response = await Fetch.post(this.url, 'auth/register', {username, email, password});
        return await this.responseHandler(response);
    }
    static async logout(): Promise<void> {
        await Fetch.get(this.url, 'auth/logout');
        window.location.reload();
    }
}

export default PersistanceApi;
