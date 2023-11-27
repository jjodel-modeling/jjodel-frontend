import {io} from 'socket.io-client';

class Collaborative {
    static client = io('/', {path: '/collaborative', autoConnect: false});
}

export default Collaborative;
