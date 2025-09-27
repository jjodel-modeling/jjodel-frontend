import {type Dictionary, DUser, GObject, LUser, RuntimeAccessible, U} from '../../joiner';
import Api from '../api';
import {UpdateUserRequest} from "../DTO/UpdateUserRequest";
import {ChangePasswordRequest} from "../DTO/ChangePasswordRequest";
import type {LayoutData} from "rc-dock";
import {UserResponseDTO} from "../DTO/UserRequestDTO";
import {TokenResponse} from "../DTO/TokenResponse";
import {JwtClaims} from "../DTO/JwtClaims";

@RuntimeAccessible('UsersApi')
class UsersApi {

    static async getUserByEmail(email: string): Promise<LUser|null> {
        const response = await Api.get(`${Api.persistance}/users?email=${email}`);
        if(response.code !== 200) return null;
        const user = response.data as any as DUser;
        const rawUser = DUser.new(user.name, user.surname, user.nickname, user.affiliation, user.country, user.newsletter, user.email, '', user.id, user._Id);
        return LUser.fromD(rawUser);
    }

    static async getAllEmails(): Promise<string[]> {
        const response = await Api.get(`${Api.persistance}/users`);
        if(response.code !== 200) return [];
        const users = U.wrapper<DUser[]>(response.data);
        return users.filter(u => u.id !== DUser.current).map(u => u.email);
    }


    static async getUserByGUID(guid: string, raw: TokenResponse, claims?: JwtClaims|null): Promise<DUser|null> {
        let response: GObject = await Api.get(`${Api.persistance}/account/by-id/${guid}`);
        console.log('getUserByGUID', {guid, raw, claims, response, code:response.code, data:response.data});

        if ((response.code+'')[0] !== '2') {
            let title: string = response.data?.title;
            let msg: string = response.data?.description;
            U.alert('e', title || (response.data as any as string), msg);
            return null;
        }

        return new UserResponseDTO(response.data).toJodelClass(raw, claims);
    }

    static async updateUserById(updateUserRequest: UpdateUserRequest): Promise<boolean> {
        const response: GObject = await Api.put(`${Api.persistance}/account/`, {...updateUserRequest});
        console.log('UpdateUserById', {updateUserRequest, code:response.code, data:response.data, response});

        if ((response.code+'')[0] !== '2') {
            let title: string = response.data?.title;
            let msg: string = response.data?.description;
            U.alert('e', title || (response.data as any as string), msg);
            return false;
        }
        //const user = U.wrapper<DUser>(response.data);

        return true; //LUser.fromD(user);
    }


    static async updatePassword(changePasswordRequest: ChangePasswordRequest): Promise<number> {
        const response: GObject = await Api.post(`${Api.persistance}/account/change-password`, changePasswordRequest);
        if ((response.code+'')[0] !== '2') {
            let title: string = response.data?.title;
            let msg: string = response.data?.description;
            U.alert('e', title || (response.data as any as string), msg);
        } else U.alert('i', 'Your password has been successfully updated!','');

        return response.code;
        // return U.wrapper<DUser>(response.data);
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
