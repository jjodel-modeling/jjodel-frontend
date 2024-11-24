import {DUser, LUser, U} from '../../joiner';
import Api from '../../data/api';

class UsersApi {
    static async getUserByEmail(email: string): Promise<LUser|null> {
        const response = await Api.get(`${Api.persistance}/users?email=${email}`);
        if(response.code !== 200) return null;
        const user = U.wrapper<DUser>(response.data);
        const rawUser = DUser.new(user.name, user.surname, user.nickname, user.affiliation, user.country, user.newsletter, user.email, '', user.id);
        return LUser.fromD(rawUser);
    }
    static async getAllEmails(): Promise<string[]> {
        const response = await Api.get(`${Api.persistance}/users`);
        if(response.code !== 200) return [];
        const users = U.wrapper<DUser[]>(response.data);
        return users.filter(u => u.id !== DUser.current).map(u => u.email);
    }
}
export {UsersApi};
