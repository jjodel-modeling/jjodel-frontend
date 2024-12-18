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
    static async getUserById(id: string): Promise<LUser|null> {
        const response = await Api.get(`${Api.persistance}/users?id=${id}`);
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

    static async updateUserById(

            id: string, 
            name: string, 
            surname: string, 
            nickname: string,
            country: string, 
            affiliation: string, 
            newsletter: boolean): Promise<LUser|null> {

        const response = await Api.get(`${Api.persistance}/users?id=${id}`);
        if(response.code !== 200) return null;

        const patch_response = await Api.patch(`${Api.persistance}/users/update?id=${id}`, {name: name, surname: surname, country: country, nickname: nickname, affiliation: affiliation, newsletter: newsletter});

        if(patch_response.code !== 200) {return null};
        const user = U.wrapper<DUser>(response.data);  

        return LUser.fromD(user); 
    }

    static async updatePasswordById(id: string, password: string): Promise<LUser|null> {

        const patch_response = await Api.patch(`${Api.persistance}/users/set_password?id=${id}`, {password: password});

        if (patch_response.code === 400) {
            return null;
        };

        const user = U.wrapper<DUser>(patch_response.data);  
        

        return LUser.fromD(user); 
    }

}
export {UsersApi};
