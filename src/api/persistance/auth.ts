import Api, {Response} from '../../data/api';
import Storage from '../../data/storage';
import {DUser, U} from '../../joiner';

class AuthApi {
    static async login(email: string, password: string): Promise<Response> {
        Storage.reset(); Storage.write('offline', 'false');
        return await Api.post(`${Api.persistance}/auth/login`, {email, password});
    }
    static async register(username: string, email: string, password: string): Promise<Response> {
        Storage.reset(); Storage.write('offline', 'false');
        return await Api.post(`${Api.persistance}/auth/register`, {username, email, password});
    }
    static async logout(): Promise<void> {
        await Api.delete(`${Api.persistance}/auth/logout`);
        Storage.reset();
        U.refresh();
    }
    static offline(): void {
        Storage.reset(); Storage.write('offline', 'true');
        const user = DUser.new('Unknown');
        Storage.write('user', user);
    }
}

export {AuthApi};
