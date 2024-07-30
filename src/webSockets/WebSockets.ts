import {io} from 'socket.io-client';

class WebSockets {
    static collaborative = io('/', {path: '/collaborative', autoConnect: false, reconnection: false});
    static iot = io('http://localhost:5003', {path: '/iot', autoConnect: false, reconnection: false});
}

export default WebSockets;
