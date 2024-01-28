import {DProject, DUser, LProject, LUser, SetFieldAction, store, U} from '../../joiner';
import Storage from "../../data/storage";
import {SaveManager} from "../../components/topbar/SaveManager";

class ProjectsApi {
    static async create(type: DProject['type'], name: DProject['name']): Promise<DProject> {
        const project = DProject.new(type, name);
        if(U.isOffline()) Offline.create(project);
        else await Online.dummy();
        return project;
    }
    static async getAll(): Promise<void> {
        if(U.isOffline()) Offline.getAll();
        else await Online.dummy();
    }
    static async delete(project: LProject): Promise<void> {
        if(U.isOffline()) Offline.delete(project.__raw as DProject);
        else await Online.dummy();
        project.delete();
    }
    static async getOne(id: DProject['id']): Promise<null|DProject> {
        if(U.isOffline()) return Offline.getOne(id);
        else return await Online.dummy();
    }
    static async save(project: LUser['project']): Promise<void> {
        if(!project) return;
        if(U.isOffline()) Offline.save(project.__raw as DProject);
        else await Online.dummy();
    }
}

class Offline {
    static create (project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        projects.push(project);
        Storage.write('projects', projects);
    }
    static getAll(): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        for(const project of projects)
            DProject.new(project.type, project.name, project.state, [], [], project.id);
    }
    static delete(project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filteredProjects = projects.filter(p => p.id !== project.id);
        Storage.write('projects', filteredProjects);
    }
    static getOne(id: string): DProject|null {
        const projects = Storage.read<DProject[]>('projects') || [];
        let filtered: DProject|DProject[] = projects.filter(p => p.id === id);
        if(filtered.length <= 0) return null;
        return filtered[0];
    }
    static save(project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);

        const state = JSON.stringify(store.getState());
        filtered.push({...project, state} as DProject);

        Storage.write('projects', filtered);
    }
}

class Online {
    static async dummy(): Promise<null> {
        return null;
    }
}

export {ProjectsApi};
