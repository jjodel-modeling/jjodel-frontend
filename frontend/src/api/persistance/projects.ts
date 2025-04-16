import {
    CreateElementAction,
    DModel,
    DProject,
    LProject,
    Pointer, R,
    SetFieldAction,
    TRANSACTION,
    U
} from '../../joiner';
import Storage from "../../data/storage";
import {Project} from "../DTO/Project";

import {UpdateProjectRequest} from "../DTO/UpdateProjectRequest";
import {CreateProjectRequest} from "../DTO/CreateProjectRequest";
import Api from "../api";
// import Api from "../../data/api";

class ProjectsApi {


    static async create(type: DProject['type'], name?: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = [], otherProjects?: LProject[]): Promise<void> {

        const project = DProject.new(type, name, undefined, m2, m1, undefined, otherProjects);
        console.log(project);
       
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
            await Online.delete(project.id);

        }
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
        const dProject = project.__raw as DProject;
        dProject.state = state;
        if(U.isOffline()) await Offline.save(dProject);
        else await Online.save(dProject);
        U.isProjectModified = false;
    }

    static async favorite(project: DProject): Promise<void> {
        if(U.isOffline()) return Offline.favorite(project);
        else return await Online.favorite(project);
    }


    static async importFromText(content: string, name: string = '', date: number = Date.now()) {
        const project = JSON.parse(content) as DProject;
        project.isFavorite = false;
        if (U.isOffline()) Offline.import(project);
        else await Online.import(project);
        CreateElementAction.new(project);
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


    static async create (project: DProject): Promise<void> {
        const creationProjectRequest : CreateProjectRequest = new Project();
        creationProjectRequest.description = project.description;
        creationProjectRequest.name = project.name;
        creationProjectRequest.type = project.type;


        await Api.post(`${Api.persistance}/project`, {...creationProjectRequest});


    }


    static async getAll(): Promise<void> {
        const response = await Api.get(`${Api.persistance}/project/`);
        console.log('loading projects getall', {response});
        if (response.code !== 200) {
            /* 401: Unauthorized -> Invalid Token (Local Storage)  */
            // U.resetState();
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
                const projectDto = new Project();
                projectDto.id = raw.id;
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
        console.log(id);
        await Api.delete(`${Api.persistance}/project/${id}`);
    }


    static async getOne(id: string): Promise<DProject|null> {


        const response = await Api.get(`${Api.persistance}/project/${id}`);
        if(response.code !== 200) {
            return null;
        }
        return U.wrapper<DProject>(response.data);
    }

    static async save(project: DProject): Promise<void> {

        console.log(project);
        const updateProjectRequest = UpdateProjectRequest.convertDprojectToUpdateProject(project);
        console.log(updateProjectRequest);
        const response = await Api.put(`${Api.persistance}/project/`, {...updateProjectRequest});
        console.log(response);
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
            U.alert('e', 'Cannot set this property!', 'Something went wrong ...');
        }
        SetFieldAction.new(project.id, 'isFavorite', !project.isFavorite);
    }




    static async import(project: DProject): Promise<void> {

        console.log(project.id)
        const response = await Api.get(`${Api.persistance}/project/${project.id}`);

        if(response.code === 200) {

            const updateProjectRequest :UpdateProjectRequest = UpdateProjectRequest.convertDprojectToUpdateProject(project);
            const response = await Api.put(`${Api.persistance}/project/`, {...updateProjectRequest});

            if(response.code !== 200) {
                U.alert('e', 'Cannot import project!', 'Something went wrong ...');
            }
        } else {

            await Online.create(project);
        }


    }


}

let windoww = window as any;
windoww.ProjectsApi = ProjectsApi;
windoww.Api = Api;
export {ProjectsApi};
