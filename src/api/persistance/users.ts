import {CreateElementAction, DUser, LUser, U} from "../../joiner";
import Api from "../../data/api";

class UsersApi {
    static async getUserByEmail(email: string): Promise<LUser|null> {
        const response = await Api.get(`${Api.persistance}/users?email=${email}`);
        if(response.code !== 200) return null;
        const user = U.wrapper<DUser>(response.data);
        const rawUser = DUser.new(user.username, user.id);
        return LUser.fromD(rawUser);
    }
}
export {UsersApi};
