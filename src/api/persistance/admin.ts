import {DProject, DUser, U} from "../../joiner";
import Api from "../../data/api";
import Axios from "axios";

class AdminApi {
    static async users(): Promise<DUser[]> {
        try {
            const response = await Axios.get(`${Api.persistance}/admin/users`, {
                headers: {'auth-token': 'nI1fS7Vy9g0uv5Ak'}
            });
            return U.wrapper<DUser[]>(response.data);
        } catch (e) {
            return [];
        }
    }

    static async projects(): Promise<DProject[]> {
        try {
            const response = await Axios.get(`${Api.persistance}/admin/projects`, {
                headers: {'auth-token': 'nI1fS7Vy9g0uv5Ak'}
            });
            return U.wrapper<DProject[]>(response.data);
        } catch (e) {
            return [];
        }
    }
}

export {AdminApi};
