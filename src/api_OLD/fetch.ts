import {Json, Log} from '../joiner';

class Fetch {
    static credentials: RequestCredentials = 'include';
    static headers = {'Content-type': 'application/json; charset=UTF-8'};

    static async get(url: string): Promise<Response|null> {
        try {
            const response = await fetch(url, {method: 'GET', credentials: this.credentials});
            console.log(`GET: ${url}`, response);
            return response;
        } catch(e) {
            Log.ee('Connection Error');
            return null;
        }
    }

    static async post(url: string, body: Json): Promise<Response|null> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: this.credentials,
                headers: this.headers,
                body: JSON.stringify(body)
            });
            console.log(`POST: ${url}`, body, response);
            return response;
        } catch(e) {
            Log.ee('Connection Error');
            return null;
        }
    }

    static async patch(url: string, body: Json): Promise<Response|null> {
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                credentials: this.credentials,
                headers: this.headers,
                body: JSON.stringify(body)
            });
            console.log(`PATCH: ${url}`, body, response);
            return response;
        } catch(e) {
            Log.ee('Connection Error');
            return null;
        }
    }

    static async delete(url: string): Promise<Response|null> {
        try {
            const response = await fetch(url, {method: 'DELETE', credentials: this.credentials});
            console.log(`DELETE: ${url}`, response);
            return response;
        } catch(e) {
            Log.ee('Connection Error');
            return null;
        }
    }
}

export default Fetch;
