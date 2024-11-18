import Api, {Response} from '../../data/api';
import Storage from '../../data/storage';
import {DUser, U} from '../../joiner';

class AuthApi {
    static async login(email: string, password: string): Promise<Response> {
        Storage.reset(); Storage.write('offline', 'false');
        return await Api.post(`${Api.persistance}/auth/login`, {email, password});
    }
    static async register(name: string, surname: string, country: string, affiliation: string, newsLetter: boolean, nickname: string, email: string, password: string): Promise<Response> {
        Storage.reset(); Storage.write('offline', 'false');
        return await Api.post(`${Api.persistance}/auth/register`, {name, surname, country, affiliation, newsLetter, nickname, email, password});
    }
    static async logout(): Promise<void> {
        if(!U.isOffline()) await Api.delete(`${Api.persistance}/auth/logout`);
        Storage.reset();
        U.refresh();
    }

    static offline(): void {
        Storage.reset(); Storage.write('offline', 'true');
        const user = DUser.new('Offline', 'User', 'Unknown', 'Unknown', 'Unknown', false, 'Unknown', 'Unknown', `Pointer${Date.now()}_OfflineUser`);
        Storage.write('user', user);
    }
}

export {AuthApi};
