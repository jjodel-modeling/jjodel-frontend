import {io} from 'socket.io-client';
import axios from 'axios';

export default class Collaborative {
    static client = io('/', {path: '/collaborative', autoConnect: false});
    static async init(code: string) {
        const actions = await axios.get(`/collaborative/rooms/${code}`);
        return actions.data;
    }
    static async createRoom() {
        const code = await axios.post(`/collaborative/rooms`);
        return code.data;
    }
}
