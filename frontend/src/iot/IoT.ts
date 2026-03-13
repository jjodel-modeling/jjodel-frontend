import {io} from 'socket.io-client';
class IoT {
    //@ts-ignore
    static client = io(`${window.U.env('JODEL_IOT')}`, {path: '/iot', autoConnect: false});
}

export default IoT;
