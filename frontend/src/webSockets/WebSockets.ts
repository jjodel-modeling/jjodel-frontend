import {io} from 'socket.io-client';

class WebSockets {
    static iot = io('http://localhost:5003', {path: '/iot', autoConnect: false, reconnection: false});
}

export default WebSockets;