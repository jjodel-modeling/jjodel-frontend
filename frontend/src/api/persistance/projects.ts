import {
    CreateElementAction, Dictionary,
    DModel,
    DProject, GObject, L, Log,
    LProject,
    Pointer, R, RuntimeAccessible,
    SetFieldAction, store,
    TRANSACTION,
    U
} from '../../joiner';
import Storage from "../../data/storage";

import {UpdateProjectRequest} from "../DTO/UpdateProjectRequest";
import Api from "../api";
import {duplicateProject} from "../../pages/components/Project";
import {COMMIT} from "../../redux/action/action";
import {ProjectPointers} from "../../joiner/classes";
import {DTOProjectGetAll} from "../DTO/GetAllProjects";
import {ProjectResponseDTO} from "../DTO/ProjectResponseDTO";

@RuntimeAccessible('ProjectsApi')
class ProjectsApi {

    static async create(type: DProject['type'], name?: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = [], otherProjects?: LProject[]): Promise<void> {
        const project = DProject.new(type, name, undefined, m2, m1, undefined, otherProjects);
        if(U.isOffline()) {
            Offline.create(project);
            // return project;
        }
        else {
            await Online.create(project);
            R.navigate('/allProjects');
        }
    }


    static async getAll(): Promise<void> {
        let isOffline = U.isOffline();
        if(isOffline) Offline.getAll();
        else await Online.getAll();
    }

    static async delete(project: LProject): Promise<void> {
        if(U.isOffline()) {
            Offline.delete(project.__raw as DProject);
        }
        else {
            await Online.delete((project as any)._Id || project.id);
        }
    }


    // NB: returned value is not yet persistent, and is a dto in case of online getone
    static async getOne(id: DProject['id']): Promise<null|DProject> {
        if(U.isOffline()) return Offline.getOne(id);
        else return await Online.getOne(id);
    }


    static async save(project: LProject): Promise<DProject> {
        const dProject = {...project.__raw} as DProject;
        dProject.lastModified = Date.now();
        dProject.viewpointsNumber = project.viewpoints.length;
        dProject.metamodelsNumber = project.metamodels.length;
        dProject.modelsNumber = project.models.length;
        const state = await U.compressedState(dProject);
        dProject.state = state;
        if(U.isOffline()) await Offline.save(dProject);
        else await Online.save(dProject);
        U.isProjectModified = false;
        return dProject;
    }

    static async favorite(project: DProject): Promise<void> {
        if(U.isOffline()) return Offline.favorite(project);
        else return await Online.favorite(project);
    }


    static async importFromText(content: string, name: string = '', date: number = Date.now()) {
        let project = JSON.parse(content) as DProject;
        project.isFavorite = false;
        let state = store.getState();
        let resp_replace = 'Replace';
        let resp_dup = 'Duplicate';
        let response: string = resp_dup;
        TRANSACTION('import project', async ()=>{
            console.log('importing project:', {id:project.id, project, projects: state.projects, included: state.projects.includes(project.id)});
            let dialogDuplicate: boolean = false;
            if (dialogDuplicate && state.projects.includes(project.id)) {
                console.log('awaiting...')
                let promise = U.dialog2('Project already imported', '', [{txt:resp_replace}, {txt:resp_dup}]);
                COMMIT();
                response = await promise;
                console.log('awaiting... COMPLETED ', response)
            }
            if (response === resp_dup) {
                let ret = duplicateProject(project);
                project = await ret;
            }
            if (response === resp_replace){
                let old = L.from(project.id);
                if (old) {
                    old.delete();
                    COMMIT();
                }
            }
            if (U.isOffline()) Offline.import(project);
            else await Online.import(project);
            CreateElementAction.new(project);
            })
        }


    static import() {
        const reader = new FileReader();
        reader.onload = async e => {
            const content = String(e.target?.result);
            try {
                await ProjectsApi.importFromText(content);
            } catch (e) {
                U.alert('e', 'Invalid File.', 'Something went wrong ...');
            }
        }

        let extensions = ['*.jjodel'];
        U.fileRead((e: unknown, files?: FileList | null, fileContents?: string[]) => {
            if (!files?.length) return;
            const file = files[0];
            reader.readAsText(file);
        }, extensions, true);
        // U.resetState();
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
        TRANSACTION('loading projects (offline)', () => {
            for (const project of projects) {
                DProject.new(project.type, project.name, project.state, [], [], project.id);
                SetFieldAction.new(project.id, 'creation', project.creation, '', false);
                SetFieldAction.new(project.id, 'lastModified', project.lastModified, '', false);
                SetFieldAction.new(project.id, 'description', project.description, '', false);
                SetFieldAction.new(project.id, 'viewpointsNumber', project.viewpointsNumber, '', false);
                SetFieldAction.new(project.id, 'metamodelsNumber', project.metamodelsNumber, '', false);
                SetFieldAction.new(project.id, 'modelsNumber', project.modelsNumber, '', false);
                SetFieldAction.new(project.id, 'isFavorite', project.isFavorite, '', false);
            }
        });
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
        U.alert('i', 'Project Saved!', '');
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
        const creationProjectRequest : UpdateProjectRequest = new UpdateProjectRequest(project);

        await Api.post(`${Api.persistance}/project`, creationProjectRequest);
    }


    static async getAll(): Promise<void> {
        const response = await Api.get(`${Api.persistance}/project/`);
        console.log('loading projects getall', {response});
        if (response.code !== 200) {
            Log.ee('Project.getAll() invalid token', {response});
            /* 401: Unauthorized -> Invalid Token (Local Storage)  */
            return Promise.reject('Invalid Token');
        }
    

        // Check if the received data is a valid array
        if (!Array.isArray(response.data)) {
            Log.ee('Project.getAll() invalid response format', {response});
        }

        // Cast the raw data to an array, bypassing type safety
        const rawProjects = response.data as unknown as DTOProjectGetAll[];

        // Wrap all operations in a transaction to ensure atomic updates
        TRANSACTION('loading projects', () => {
            let debugidmap: Dictionary = {};
            for (const raw of rawProjects as GObject<DTOProjectGetAll>[]) {
                if (debugidmap[raw.id]) {
                    Log.eDevv('duplicate project id', {raw});
                    continue;
                }
                debugidmap[raw.id] = raw;
                raw.creation = new Date(raw.creation).getTime();
                raw.lastModified = new Date(raw.lastModified).getTime();
                raw.type = ['public', 'private', 'collaborative'].includes(raw.type) ? raw.type : 'private';
                let pointers: ProjectPointers = {} as any;
                pointers.id = raw.id;
                pointers.favorite = raw.favorite;
                pointers.models = raw.models;
                pointers.metamodels = raw.metamodels;
                pointers.graphs = raw.graphs;
                pointers.viewpoints = raw.viewpoints;
                pointers.activeViewpoint = raw.activeViewpoint;

                //const dproject = DProject.new(raw.type as 'public' |'private' | 'collaborative', raw.name , raw.state, [], [], raw.id);
                const dproject = DProject.new2(pointers, (d: GObject<DProject>)=>{
                    for (let k in raw) {
                        if (k in pointers) continue;
                        d[k] = raw[k];
                    }
                }, rawProjects as any, true);
            }
        });
    }


    static async delete(id :string): Promise<void> {
        console.log(id);
        await Api.delete(`${Api.persistance}/project/${id}`);
    }


    static async getOne(id: string): Promise<DProject|null> {
        const response = await Api.get(`${Api.persistance}/project/jjodel/${id}`);
        if (response.code !== 200) {
            return null;
        }
        let dto = response.data as unknown as ProjectResponseDTO;
        let ret = new ProjectResponseDTO(dto).toJodelClass();
        return ret;
    }

    static async save(project: DProject): Promise<void> {
        project = {...project} as any;
        if (!project.version) project.version = store.getState().version.n;
        if (!('_Id' in project)) (project as any)._Id = undefined;
        const updateProjectRequest = new UpdateProjectRequest(project);
        console.log('online save request: ', {updateProjectRequest});
        const response = await Api.put(`${Api.persistance}/project/`, updateProjectRequest);

        if (response.code !== 200) {
            U.alert('e', 'Cannot Save','Something went wrong ...');
            Log.ee('Failed to save', {response, updateProjectRequest, project});
        }
        else {
            U.alert('i', 'Project Saved!', '');
        }
    }



    static async favorite(project: DProject): Promise<void> {
        const updateProjectRequest = new UpdateProjectRequest(project);
        const response = await Api.put(`${Api.persistance}/project/`, updateProjectRequest);

        if(response.code !== 200) {
            U.alert('e', 'Cannot set the project as favorite!', 'Something went wrong ...');
        }
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }




    static async import(project: DProject): Promise<void> {
        const updateProjectRequest = new UpdateProjectRequest(project);
        delete (updateProjectRequest as GObject)._Id;
        const response = await Api.post(`${Api.persistance}/project/`, updateProjectRequest);
        if (response.code === 200) {
            console.log('import', {project, updateProjectRequest, response});
        } else {
            U.alert('e', 'Cannot import project!', 'Something went wrong ...');
            Log.ee('failed to import project', {response, project});
            //await Online.create(project);
        }
    }


}

let windoww = window as any;
windoww.ProjectsApi = ProjectsApi;
windoww.Api = Api;
export {ProjectsApi};
