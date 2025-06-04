
import Api from '../api';
import {CreateClientLog} from "../DTO/CreateClientLog";
import {Json} from "../../joiner";
export type Response = {code: number, data: Json|null}

class LogApi {

    static async create(createClientLog :CreateClientLog): Promise<Response> {

        return await Api.post(`${Api.persistance}/client-log`, {...createClientLog});
    }
}
export {LogApi};
