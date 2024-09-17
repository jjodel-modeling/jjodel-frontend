import {CreateElementAction, DModel, DProject, LProject, Pointer, SetFieldAction, TRANSACTION, U} from '../../joiner';
import Storage from "../../data/storage";
import Api from "../../data/api";

class ProjectsApi {
    static async create(type: DProject['type'], name?: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = [], otherProjects?: LProject[]): Promise<DProject> {
        const project = DProject.new(type, name, undefined, m2, m1, undefined, otherProjects);
        if(U.isOffline()) Offline.create(project);
        else await Online.create(project);
        return project;
    }
    static async getAll(): Promise<void> {
        if(U.isOffline()) Offline.getAll();
        else await Online.getAll();
    }
    static async delete(project: LProject): Promise<void> {
        if(U.isOffline()) Offline.delete(project.__raw as DProject);
        else await Online.delete(project.__raw as DProject);
        project.delete();
    }
    static async getOne(id: DProject['id']): Promise<null|DProject> {
        if(U.isOffline()) return Offline.getOne(id);
        else return await Online.getOne(id);
    }
    static async save(project: LProject): Promise<void> {
        project.lastModified = Date.now();
        project.viewpointsNumber = project.viewpoints.length;
        project.metamodelsNumber = project.metamodels.length;
        project.modelsNumber = project.models.length;
        const state = await U.compressedState(project.id);
        project.state = state;
        const dProject = {...project.__raw, state} as DProject;
        console.log('Saving project', dProject);
        if(U.isOffline()) await Offline.save(dProject);
        else await Online.save(dProject);
    }
    static async favorite(project: DProject): Promise<void> {
        if(U.isOffline()) return Offline.favorite(project);
        else return await Online.favorite(project);
    }

    static import() {
        const reader = new FileReader();
        reader.onload = async e => {
            const content = String(e.target?.result);
            try {
                const project = JSON.parse(content) as DProject;
                project.isFavorite = false;
                if(U.isOffline()) Offline.import(project);
                else await Online.import(project);
                CreateElementAction.new(project);
            } catch (e) {U.alert('e', 'Invalid File.')}
        }

        let extensions = ['*.jjodel'];
        U.fileRead((e: unknown, files?: FileList | null, fileContents?: string[]) => {
            if (!files?.length) return;
            const file = files[0];
            reader.readAsText(file);
        }, extensions, true);
        U.refresh();
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
        for(const project of projects) {
            DProject.new(project.type, project.name, project.state, [], [], project.id);
            TRANSACTION(() => {
                SetFieldAction.new(project.id, 'creation', project.creation, '', false);
                SetFieldAction.new(project.id, 'lastModified', project.lastModified, '', false);
                SetFieldAction.new(project.id, 'description', project.description, '', false);
                SetFieldAction.new(project.id, 'viewpointsNumber', project.viewpointsNumber, '', false);
                SetFieldAction.new(project.id, 'metamodelsNumber', project.metamodelsNumber, '', false);
                SetFieldAction.new(project.id, 'modelsNumber', project.modelsNumber, '', false);
                SetFieldAction.new(project.id, 'isFavorite', project.isFavorite, '', false);
            });
        }
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
    static async save(project: DProject): Promise<void> {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);
        Storage.write('projects', [...filtered, project]);
        U.alert('i', 'Project Saved!');
    }
    static async favorite(project: DProject): Promise<void> {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);
        Storage.write('projects', [...filtered, {...project, isFavorite: !project.isFavorite}]);
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }
    static import(project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);
        filtered.push(project);
        Storage.write('projects', filtered);
    }
}

class Online {
    static async create (project: DProject): Promise<void> {
        await Api.post(`${Api.persistance}/projects`, {
            id: project.id,
            creation: project.creation || Date.now(),
            description: project.description,
            name: project.name,
            type: project.type
        });
    }
    static async getAll(): Promise<void> {
        const response = await Api.get(`${Api.persistance}/projects`);
        if(response.code !== 200) {
            /* 401: Unauthorized -> Invalid Token (Local Storage)  */
            Storage.reset();
            U.refresh();
            return;
        }
        const data = U.wrapper<DProject[]>(response.data);
        for(const project of data) {
            DProject.new(project.type, project.name, project.state, [], [], project.id);
            TRANSACTION(() => {
                SetFieldAction.new(project.id, 'creation', project.creation, '', false);
                SetFieldAction.new(project.id, 'lastModified', project.lastModified, '', false);
                SetFieldAction.new(project.id, 'description', project.description, '', false);
                SetFieldAction.new(project.id, 'viewpointsNumber', project.viewpointsNumber, '', false);
                SetFieldAction.new(project.id, 'metamodelsNumber', project.metamodelsNumber, '', false);
                SetFieldAction.new(project.id, 'modelsNumber', project.modelsNumber, '', false);
                SetFieldAction.new(project.id, 'isFavorite', project.isFavorite, '', false);
            });
        }
    }
    static async delete(project: DProject): Promise<void> {
        await Api.delete(`${Api.persistance}/projects/${project.id}`);
    }
    static async getOne(id: string): Promise<DProject|null> {
        const response = await Api.get(`${Api.persistance}/projects/${id}`);
        if(response.code !== 200) return null;
        return U.wrapper<DProject>(response.data);
    }
    static async save(project: DProject): Promise<void> {
        const response = await Api.patch(`${Api.persistance}/projects/${project.id}`, {...project});
        if(response.code !== 200) U.alert('e', 'Cannot Save');
        else U.alert('i', 'Project Saved!');
    }
    static async favorite(project: DProject): Promise<void> {
        const response = await Api.patch(`${Api.persistance}/projects/${project.id}`, {
            isFavorite: !project.isFavorite
        });
        if(response.code !== 200) U.alert('e', 'Cannot set this property!');
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }
    static async import(project: DProject): Promise<void> {
        await Online.create(project);
        await Api.patch(`${Api.persistance}/projects/${project.id}`, {...project});
    }
}

export {ProjectsApi};
