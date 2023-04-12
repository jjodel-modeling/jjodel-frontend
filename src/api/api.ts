import axios from 'axios';

export default class API {
    static post() {
        console.clear();
        axios.post('http://172.20.0.102:8000/api/v1/user/', {
            username: "test",
            password: "Password123!",
            name: "test",
            mail: "test@mail.it"
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}
