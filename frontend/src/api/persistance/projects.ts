import {
    Dictionary,
    DModel,
    DProject,
    GObject,
    LProject,
    Pointer,
} from '../../joiner';
import {
    CreateElementAction,
    L,
    Log,
    R,
    RuntimeAccessible,
    SetFieldAction,
    store,
    TRANSACTION,
    U,
    ProjectPointers
} from '../../joiner';
import Storage from "../../data/storage";

import {UpdateProjectRequest} from "../DTO/UpdateProjectRequest";
import Api from "../api";
import {duplicateProject} from "../../pages/components/Project";
import {CollabClearHistoryAction, CollabRefreshAction, COMMIT} from "../../redux/action/action";
import {DTOProjectGetAll} from "../DTO/GetAllProjects";
import {ProjectResponseDTO} from "../DTO/ProjectResponseDTO";
import { getNextVersionNumber, formatVersion } from '../../utils/versionUtils';
import ActivityLogger from '../../services/ActivityLogger';
import { ActivityType } from '../../types/activity';
import {VersionFixer} from "../../redux/VersionFixer";

@RuntimeAccessible('ProjectsApi')
class ProjectsApi {
    static isLoading: boolean = true;

    static async create(type: DProject['type'], name?: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = [], otherProjects?: LProject[]): Promise<void> {
        const project = DProject.new(type, name, undefined, m2, m1, undefined, otherProjects);
        if(U.isOffline()) {
            Offline.create(project);
        }
        else {
            await Online.create(project);
            R.navigate('/allProjects');
        }

        // Log activity
        ActivityLogger.log({
            type: ActivityType.PROJECT_CREATED,
            projectId: project.id,
            projectName: project.name || 'Unnamed Project',
        });
    }


    static async getAll(): Promise<void> {
        let isOffline = U.isOffline();
        if(isOffline) Offline.getAll();
        else await Online.getAll();
    }

    static async delete(project: LProject): Promise<void> {
        const projectName = project.name || 'Unnamed Project';
        const projectId = project.id;

        if(U.isOffline()) {
            Offline.delete(project.__raw as DProject);
        }
        else {
            await Online.delete((project as any)._Id || project.id);
        }

        // Log activity
        ActivityLogger.log({
            type: ActivityType.PROJECT_DELETED,
            projectId,
            projectName,
        });
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

        // Auto-increment version on save (vX.Y format, stored as number e.g. 3.4)
        const currentVersion = dProject.version;
        const nextVersion = getNextVersionNumber(currentVersion);
        dProject.version = nextVersion;
        console.log(`[Version] Project saved: ${formatVersion(currentVersion)} → ${formatVersion(nextVersion)}`);

        const state = await U.compressedState(dProject);
        dProject.state = state;
        if(U.isOffline()) await Offline.save(dProject);
        else await Online.save(dProject);
        U.isProjectModified = false;

        // Update the version in Redux state
        SetFieldAction.new(dProject.id, 'version', nextVersion, '', false);

        return dProject;
    }

    static async favorite(project: DProject): Promise<void> {
        if(U.isOffline()) return Offline.favorite(project);
        else return await Online.favorite(project);
    }

    static async updateTags(project: DProject, tags: string[]): Promise<void> {
        console.log('[DEBUG ProjectsApi.updateTags] Called with project:', project);
        console.log('[DEBUG ProjectsApi.updateTags] Tags to save:', tags);
        console.log('[DEBUG ProjectsApi.updateTags] Is offline:', U.isOffline());
        if(U.isOffline()) return Offline.updateTags(project, tags);
        else return await Online.updateTags(project, tags);
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

        let extensions = ['.jjodel'];
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
        console.log('[DEBUG Offline.getAll] Projects from localStorage:', projects);
        TRANSACTION('loading projects (offline)', () => {
            for (const project of projects) {
                console.log('[DEBUG Offline.getAll] Loading project:', project.name, 'tags:', project.tagNames);
                /*if (!project._Id || !project.id && project.state) {
                   let decompressed = U.decompressState(project.state);
                   decompressed it is pointless, the db does not have the jid anyway and cannot single get it.

                }*/
                DProject.new(project.type, project.name, project.state, [], [], project.id);
                SetFieldAction.new(project.id, 'creation', project.creation, '', false);
                SetFieldAction.new(project.id, 'lastModified', project.lastModified, '', false);
                SetFieldAction.new(project.id, 'description', project.description, '', false);
                SetFieldAction.new(project.id, 'viewpointsNumber', project.viewpointsNumber, '', false);
                SetFieldAction.new(project.id, 'metamodelsNumber', project.metamodelsNumber, '', false);
                SetFieldAction.new(project.id, 'modelsNumber', project.modelsNumber, '', false);
                SetFieldAction.new(project.id, 'isFavorite', project.isFavorite, '', false);
                SetFieldAction.new(project.id, 'tagNames', project.tagNames || [], '', false);
                // Load version from saved project, default to 1.0 if not present
                SetFieldAction.new(project.id, 'version', project.version || 1.0, '', false);
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

    static async updateTags(project: DProject, tags: string[]): Promise<void> {
        console.log('[DEBUG Offline.updateTags] Called');
        console.log('[DEBUG Offline.updateTags] Project:', project);
        console.log('[DEBUG Offline.updateTags] Tags:', tags);

        const projects = Storage.read<DProject[]>('projects') || [];
        console.log('[DEBUG Offline.updateTags] Projects from storage:', projects);

        const filtered = projects.filter(p => p.id !== project.id);
        console.log('[DEBUG Offline.updateTags] Filtered projects (without current):', filtered);

        const updatedProject = {...project, tags};
        console.log('[DEBUG Offline.updateTags] Updated project to save:', updatedProject);

        const newProjectsList = [...filtered, updatedProject];
        console.log('[DEBUG Offline.updateTags] New projects list to write:', newProjectsList);

        Storage.write('projects', newProjectsList);
        console.log('[DEBUG Offline.updateTags] Storage.write completed');

        SetFieldAction.new(project.id, 'tagNames', tags, '', false);
        console.log('[DEBUG Offline.updateTags] SetFieldAction completed');
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
        await Api.post(`${U.env('JODEL_PERSISTANCE')}/project`, creationProjectRequest);
    }

    static async getAll(): Promise<void> {
        const response = await Api.get(`${U.env('JODEL_PERSISTANCE')}/project/`);
        console.log('loading projects getall', {response, user: windoww.DUser.current, DUser:windoww});
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
                DProject.new2(pointers, (d: GObject<DProject>)=>{
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
        await Api.delete(`${U.env('JODEL_PERSISTANCE')}/project/${id}`);
    }


    static async getOne(id: string): Promise<DProject|null> {
        const response = await Api.get(`${U.env('JODEL_PERSISTANCE')}/project/jjodel/${id}`);
        if (response.code !== 200 || !response.data) {
            return null;
        }

        console.log('api get one', {response});
        let ret = new ProjectResponseDTO(response.data).toJodelClass();
        console.log('api get one ret', {ret});
        return ret;
    }

    static async save(project: DProject): Promise<void> {
        project = {...project} as any;
        if (!project.version) project.version = store.getState().version.n;
        if (!('_Id' in project)) (project as any)._Id = undefined;
        const updateProjectRequest = new UpdateProjectRequest(project);
        console.log('online save request: ', {updateProjectRequest});
        const response = await Api.put(`${U.env('JODEL_PERSISTANCE')}/project/`, updateProjectRequest);

        if (response.code !== 200) {
            U.alert('e', 'Cannot Save','Something went wrong ...');
            Log.ee('Failed to save', {response, updateProjectRequest, project});
        }
        else {
            U.alert('i', 'Project Saved!', '');
            if ((windoww as any).Collaborative?.online) {
                CollabClearHistoryAction.new();
                // CollabRefreshAction.new();
            }
        }
    }



    static async favorite(project: DProject): Promise<void> {
        const updateProjectRequest = new UpdateProjectRequest(project);
        const response = await Api.put(`${U.env('JODEL_PERSISTANCE')}/project/`, updateProjectRequest);

        if(response.code !== 200) {
            U.alert('e', 'Cannot set the project as favorite!', 'Something went wrong ...');
        }
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }

    static async updateTags(project: DProject, tags: string[]): Promise<void> {
        const updatedProject = {...project, tags};
        const updateProjectRequest = new UpdateProjectRequest(updatedProject);
        const response = await Api.put(`${U.env('JODEL_PERSISTANCE')}/project/`, updateProjectRequest);

        if(response.code !== 200) {
            U.alert('e', 'Cannot update tags!', 'Something went wrong ...');
        }
        SetFieldAction.new(project.id, 'tagNames', tags, '', false);
    }

    static async import(project: DProject): Promise<void> {
        const updateProjectRequest = new UpdateProjectRequest(project);
        delete (updateProjectRequest as GObject)._Id;
        const response = await Api.post(`${U.env('JODEL_PERSISTANCE')}/project/`, updateProjectRequest);
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
