import Fetch from '../fetch';
import {Load} from './load';
import {Save} from './save';
import {ApiResponse, BEGIN, DProject, DUser, END, LProject, LUser, Pointer, SetRootFieldAction} from '../../joiner';
import {Delete} from "./delete";

class PersistanceApi {
    private static url = '/persistance/';

    static async responseHandler(response: Response|null): Promise<ApiResponse> {
        if(!response) return {code: 400, body: 'Connection Error'};
        if(response.ok) return {code: 200, body: await response.json()};
        return {code: response.status, body: await response.text()};
    }

    static async login(email: string, password: string): Promise<ApiResponse> {
        const response = await Fetch.post(this.url + 'auth/login', {email, password});
        return await this.responseHandler(response);
    }
    static async register(username: string, email: string, password: string): Promise<ApiResponse> {
        const response = await Fetch.post(this.url + 'auth/register', {username, email, password});
        return await this.responseHandler(response);
    }
    static async logout(): Promise<void> {
        await Fetch.get(this.url + 'auth/logout');
        window.location.reload();
    }
    static async saveProject(): Promise<void> {
        SetRootFieldAction.new('isLoading', true);
        const user = LUser.fromPointer(DUser.current);
        const project = user.project; if(!project) return;
        await Save.project(project);
        SetRootFieldAction.new('isLoading', false);
    }
    static async deleteProject(id: Pointer<DProject>): Promise<void> {
        SetRootFieldAction.new('isLoading', true);
        await Delete.project(id);
        SetRootFieldAction.new('isLoading', false);
    }

    static async loadMyProjects(): Promise<void> {
        SetRootFieldAction.new('isLoading', true);
        const user = LUser.fromPointer(DUser.current);
        const _response = await Fetch.get(this.url + `users/${DUser.current}/projects`);
        const response = await this.responseHandler(_response);
        if(response.code !== 200) return;
        const projects = response.body as unknown as DProject[];
        BEGIN(); for(let project of projects) await Load.project(project); END();
        user.projects = LProject.fromPointer(projects.map(project => project.id)) as LProject[];
        SetRootFieldAction.new('isLoading', false);
    }
}

export default PersistanceApi;
