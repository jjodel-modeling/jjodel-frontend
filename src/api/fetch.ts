import {Json} from '../joiner';

class Fetch {
    static credentials: RequestCredentials = 'include';
    static headers = {'Content-type': 'application/json; charset=UTF-8'};

    static async get(url: string, path: string): Promise<Response|null> {
        try {
            const response = await fetch(url + path, {method: 'GET', credentials: this.credentials});
            console.log(`GET: ${url}${path}`, response);
            return response;
        } catch(e) {
            alert('Connection Error');
            return null;
        }
    }

    static async post(url: string, path: string, body: Json): Promise<Response|null> {
        try {
            const response = await fetch(url + path, {
                method: 'POST',
                credentials: this.credentials,
                headers: this.headers,
                body: JSON.stringify(body)
            });
            console.log(`POST: ${url}${path}`, body, response);
            return response;
        } catch(e) {
            alert('Connection Error');
            return null;
        }
    }

    static async patch(url: string, path: string, body: Json): Promise<Response|null> {
        try {
            const response = await fetch(url + path, {
                method: 'PATCH',
                credentials: this.credentials,
                headers: this.headers,
                body: JSON.stringify(body)
            });
            console.log(`PATCH: ${url}${path}`, body, response);
            return response;
        } catch(e) {
            alert('Connection Error');
            return null;
        }
    }

    static async delete(url: string, path: string): Promise<Response|null> {
        try {
            const response = await fetch(url + path, {method: 'DELETE', credentials: this.credentials});
            console.log(`DELETE: ${url}${path}`, response);
            return response;
        } catch(e) {
            alert('Connection Error');
            return null;
        }
    }
}

export default Fetch;
