import {io} from 'socket.io-client';
import Settings from '../../settings/Settings';

class Collaborative {
    // static client = io('/', {path: '/collaborative', autoConnect: false});
    static client = io(Settings.collaborativeURL, {path: '/collaborative', autoConnect: false});
}

export default Collaborative;
