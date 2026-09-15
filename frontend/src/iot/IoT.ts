import {io} from 'socket.io-client';
class IoT {
    //@ts-ignore
    static client: Socket;
    public static init() {
        if (IoT.client) return IoT.client;
        //@ts-ignore
        return IoT.client = io(`${window.U.env('JODEL_IOT')}`, {path: '/iot', autoConnect: false});
    }
}

export default IoT;
