import {io} from 'socket.io-client';
class IoT {
    static client = io(`${process.env['REACT_APP_IOT']}`, {path: '/iot', autoConnect: false});
}

export default IoT;
