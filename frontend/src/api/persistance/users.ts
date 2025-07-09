import {type Dictionary, DUser, LUser, RuntimeAccessible, U} from '../../joiner';
import Api from '../api';
import {UpdateUserRequest} from "../DTO/UpdateUserRequest";
import {ChangePasswordRequest} from "../DTO/ChangePasswordRequest";
import type {LayoutData} from "rc-dock";

@RuntimeAccessible('UsersApi')
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


    static async updateUserById(updateUserRequest :UpdateUserRequest): Promise<boolean> {
        const response = await Api.put(`${Api.persistance}/account/`, {...updateUserRequest});
        console.log(response.code, response.data);

        if ((response.code+'')[0] !== '2') { // if response code starts with 2 (200, 204) i know it is a terrible check but it's legacy.
            return false;
        }
        //const user = U.wrapper<DUser>(response.data);

        return true; //LUser.fromD(user);
    }


    static async updatePassword(changePasswordRequest :ChangePasswordRequest): Promise<LUser|null> {

        const response = await Api.post(`${Api.persistance}/account/change-password`, {...changePasswordRequest});
        if(response.code !== 200) {
            return null;
        }
        const user = U.wrapper<DUser>(response.data);

        return LUser.fromD(user);
    }


    // todo: implement and move them to appropriate place?
    static setUserAutosaveLayout(val: boolean) {
        throw new Error("Method not implemented.");
    }
    static setActiveLayout(val: string) { // Dictionary<string, LayoutData>
        throw new Error("Method not implemented.");
    }

    static setUserLayout(persistance_val: Dictionary<string, LayoutData>) {

    }

}
export {UsersApi};
