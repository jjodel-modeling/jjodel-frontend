import {
    CreateElementAction,
    DModel,
    DProject, L,
    LProject,
    Pointer, R,
    SetFieldAction, store,
    TRANSACTION,
    U
} from '../../joiner';
import Storage from "../../data/storage";
import {Project} from "../DTO/Project";

import {UpdateProjectRequest} from "../DTO/UpdateProjectRequest";
import {CreateProjectRequest} from "../DTO/CreateProjectRequest";
import Api from "../api";
import {duplicateProject} from "../../pages/components/Project";
import {COMMIT} from "../../redux/action/action";

class ProjectsApi {


    static async create(type: DProject['type'], name?: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = [], otherProjects?: LProject[]): Promise<void> {

        const project = DProject.new(type, name, undefined, m2, m1, undefined, otherProjects);

        if(U.isOffline()) {
            Offline.create(project);
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
            // swap ids
            await Online.delete(project.__raw._id!);
        }
    }


    static async getOne(id: DProject['id']): Promise<null|DProject> {
        if(U.isOffline()) return Offline.getOne(id);
        else return await Online.getOne(id);
    }


    static async save(project: LProject): Promise<DProject> {
        project.lastModified = Date.now();
        project.viewpointsNumber = project.viewpoints.length;
        project.metamodelsNumber = project.metamodels.length;
        project.modelsNumber = project.models.length;
        const dProject = {...project.__raw} as DProject;
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
        let response: string = '';
        let resp_replace = 'Replace';
        let resp_dup = 'Duplicate';
        TRANSACTION('import project', async ()=>{
            console.log('importing project:', {id:project.id, project, projects: state.projects, included: state.projects.includes(project.id)});
            if (state.projects.includes(project.id)) {
                console.log('awaiting...')
                let promise = U.dialog2('Project already imported', '', [{txt:resp_replace}, {txt:resp_dup}]);
                COMMIT();
                response = await promise;
                console.log('awaiting... COMPLETED ', response)
            }
            console.log('awaiting... skipped? ', response)
            if (response === resp_dup) {
                let ret = duplicateProject(project);
                console.log('awaiting... duplicate ', {ret, rett: typeof ret === 'object' && ret ? {...ret} : ret, project})
                project = await ret;
                console.log('awaiting... duplicate COMPLETED ', project)
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
        U.resetState();
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

    static async create (project: DProject, imported: boolean = false): Promise<void> {
        const creationProjectRequest : CreateProjectRequest = new CreateProjectRequest();
        creationProjectRequest.description = project.description;
        creationProjectRequest.name = project.name;
        creationProjectRequest.type = project.type;
        creationProjectRequest._id = project.id;
        creationProjectRequest.imported = imported;
        creationProjectRequest.state = project.state;
        await Api.post(`${Api.persistance}/project`, {...creationProjectRequest});
    }


    static async getAll(): Promise<void> {
        const response = await Api.get(`${Api.persistance}/project/`);

        if (response.code !== 200) {
            /* 401: Unauthorized -> Invalid Token (Local Storage)  */
            return Promise.reject('Invalid Token');
        }

        // Check if the received data is a valid array
        if (!Array.isArray(response.data)) {

        }

        // Cast the raw data to an array, bypassing type safety
        const rawProjects = response.data as unknown as any[];

        // Wrap all operations in a transaction to ensure atomic updates

        TRANSACTION('loading projects', () => {
            for (const raw of rawProjects) {
                // Populate the DTO with raw backend data and necessary conversions
                //todo: this is needed?
                const projectDto = new Project();
                projectDto._id = raw.id;
                projectDto.id = raw._Id;
                projectDto.name = raw.name;
                projectDto.description = raw.description;
                projectDto.state = raw.state;
                projectDto.viewpointsNumber = raw.viewpointsNumber;
                projectDto.metamodelsNumber = raw.metamodelsNumber;
                projectDto.modelsNumber = raw.modelsNumber;
                projectDto.isFavorite = raw.isFavorite;
                projectDto.creation = new Date(raw.creation).getTime();
                projectDto.lastModified = new Date(raw.lastModified).getTime();
                projectDto.type = ['public', 'private', 'collaborative'].includes(raw.type) ? raw.type : 'private';

                const dproject = DProject.new(projectDto.type as 'public' |'private' | 'collaborative', projectDto.name , projectDto.state, [], [], projectDto.id);
                dproject._id = raw.id;

                // Dynamically set each field of the domain object using SetFieldAction
                SetFieldAction.new(dproject.id, 'creation', projectDto.creation, '', false);
                SetFieldAction.new(dproject.id, 'lastModified', projectDto.lastModified, '', false);
                SetFieldAction.new(dproject.id, 'description', projectDto.description, '', false);
                SetFieldAction.new(dproject.id, 'viewpointsNumber', projectDto.viewpointsNumber, '', false);
                SetFieldAction.new(dproject.id, 'metamodelsNumber', projectDto.metamodelsNumber, '', false);
                SetFieldAction.new(dproject.id, 'modelsNumber', projectDto.modelsNumber, '', false);
                SetFieldAction.new(dproject.id, 'isFavorite', projectDto.isFavorite, '', false);
            }
        });
        return Promise.resolve();
    }


    static async delete(id :string): Promise<void> {
        await Api.delete(`${Api.persistance}/project/${id}`);
    }


    static async getOne(id: string): Promise<DProject|null> {

        const response = await Api.get(`${Api.persistance}/project/${id}`);
        if(response.code !== 200) {
            return null;
        }
        // swap ids.
        let swap = response.data!["_Id"];
        response.data!['_Id'] = response.data!['id'];
        response.data!['id'] = swap;

        return response.data as unknown as DProject;
    }

    static async save(project: DProject): Promise<void> {

        const updateProjectRequest = UpdateProjectRequest.convertDprojectToUpdateProject(project);

        const response = await Api.put(`${Api.persistance}/project/`, {...updateProjectRequest});

        if(response.code !== 200) {
            U.alert('e', 'Cannot Save','Something went wrong ...');
        }
        else {
            U.alert('i', 'Project Saved!', '');
        }
    }



    static async favorite(project: DProject): Promise<void> {
        const updateProjectRequest :UpdateProjectRequest = UpdateProjectRequest.convertDprojectToUpdateProject(project);
        const response = await Api.put(`${Api.persistance}/project/`, {...updateProjectRequest});

        if(response.code !== 200) {
            U.alert('e', 'Cannot set the project as favorite!', 'Something went wrong ...');
        }
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }




    static async import(project: DProject): Promise<void> {
        const response = await Api.get(`${Api.persistance}/project/${project.id}`);

        if(response.code === 200) {

            const updateProjectRequest :UpdateProjectRequest = UpdateProjectRequest.convertDprojectToUpdateProject(project);
            const response = await Api.put(`${Api.persistance}/project/`, {...updateProjectRequest});

            if(response.code !== 200) {
                U.alert('e', 'Cannot import project!', 'Something went wrong ...');
            }
        }
        else {
            await Online.create(project, true);
        }
    }


}

let windoww = window as any;
windoww.ProjectsApi = ProjectsApi;
windoww.Api = Api;
export {ProjectsApi};
