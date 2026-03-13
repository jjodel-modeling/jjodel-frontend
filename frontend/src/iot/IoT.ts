import {io} from 'socket.io-client';
import {U} from "../joiner";
class IoT {
    static client = io(`${U.env('JODEL_IOT')}`, {path: '/iot', autoConnect: false});
}

export default IoT;
