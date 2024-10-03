import {io} from 'socket.io-client';
class Collaborative {
    // static client = io('/', {path: '/collaborative', autoConnect: false});
    static client = io(`${process.env['REACT_APP_COLLABORATIVE']}`, {path: '/collaborative', autoConnect: false});
}

export default Collaborative;
