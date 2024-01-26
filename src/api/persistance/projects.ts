import {DProject, LProject, LUser, SetFieldAction, store, U} from '../../joiner';
import Storage from "../../data/storage";
import {SaveManager} from "../../components/topbar/SaveManager";

class ProjectsApi {
    static async create(type: DProject['type'], name: DProject['name']): Promise<void> {
        const project = DProject.new(type, name);
        const projects = Storage.read<DProject[]>('projects') || [];
        projects.push(project);
        Storage.write('projects', projects);
    }
    static async getAll(): Promise<void> {
        const projects = Storage.read<DProject[]>('projects') || [];
        for(const project of projects)
            DProject.new(project.type, project.name, project.state, [], [], project.id);
    }
    static async delete(project: LProject): Promise<void> {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filteredProjects = projects.filter(p => p.id !== project.id);
        console.log(filteredProjects, project.id)
        Storage.write('projects', filteredProjects);
        project.delete();
    }
    static async getOne(id: DProject['id']): Promise<null|DProject> {
        const projects = Storage.read<DProject[]>('projects') || [];
        let project: DProject|DProject[] = projects.filter(p => p.id === id);
        if(project.length <= 0) return null;
        return project[0];
    }
    static async save(project: LUser['project']): Promise<void> {
        if(!project) return;

        const projects = Storage.read<DProject[]>('projects') || [];
        const filteredProjects = projects.filter(p => p.id !== project.id);

        const state = JSON.stringify(store.getState());
        filteredProjects.push({...project.__raw, state} as DProject);

        Storage.write('projects', filteredProjects);
    }
}

export {ProjectsApi};
