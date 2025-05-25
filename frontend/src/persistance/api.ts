import axios from 'axios';
import type {Dictionary, GObject} from "../joiner";
import type {LayoutData} from "rc-dock";

export default class Persistance {
    static setUserAutosaveLayout(val: boolean) {
        throw new Error("Method not implemented.");
    }
    static setActiveLayout(val: string) { // Dictionary<string, LayoutData>
        throw new Error("Method not implemented.");
    }
    static url(path: string): string {
        return 'http://localhost:8000/api/v1/' + path + '/';
    }

    static post(): void {
        axios.post(Persistance.url('user'), {
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

    static get(): void {
        axios.get(Persistance.url('user'))
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    static test(email: string): void {
        axios.post(Persistance.url('user'), {
            username: "test",
            password: "Password123!",
            name: "test",
            mail: email
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    static setUserLayout(persistance_val: Dictionary<string, LayoutData>) {

    }
}
