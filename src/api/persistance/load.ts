import PersistanceApi from './index';
import Fetch from '../fetch';
import {Pointer, DProject, DModel, CreateElementAction, SetRootFieldAction} from '../../joiner';

export class Load {
    private static url = '/persistance/';

    static async project(project: DProject) {
        const projectUrl = this.url + `projects/${project.id}`;
        await Promise.all([
            /* DATA */
            Load.element(`${projectUrl}/metamodels`),
            Load.element(`${projectUrl}/models`),
            Load.element(`${projectUrl}/packages`),
            Load.element(`${projectUrl}/classes`),
            Load.element(`${projectUrl}/enumerators`),
            Load.element(`${projectUrl}/attributes`),
            Load.element(`${projectUrl}/references`),
            Load.element(`${projectUrl}/literals`),
            Load.element(`${projectUrl}/objects`),
            Load.element(`${projectUrl}/values`),
            /* VIEWS */
            Load.element(`${projectUrl}/views`),
            /* NODES */
            Load.element(`${projectUrl}/graphs`),
            Load.element(`${projectUrl}/graphVertexes`),
            Load.element(`${projectUrl}/voidVertexes`),
            Load.element(`${projectUrl}/vertexes`),
            Load.element(`${projectUrl}/graphElements`),
            Load.element(`${projectUrl}/edges`),
            Load.element(`${projectUrl}/edgePoints`)
        ]);
        CreateElementAction.new(project);
    }

    private static async element(url: string): Promise<void> {
        const response = await PersistanceApi.responseHandler(await Fetch.get(url));
        const elements = response.body;
        if(response.code !== 200 || !Array.isArray(elements)) return;
        for(let element of elements) {
            console.log('Loading From Server', element);
            CreateElementAction.new(element);
        }
    }

}
