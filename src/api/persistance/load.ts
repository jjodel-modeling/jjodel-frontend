import PersistanceApi from './index';
import Fetch from '../fetch';
import {Pointer, DProject, DModel, CreateElementAction, SetRootFieldAction} from '../../joiner';

export class Load {
    private static url = '/persistance/';

    static async project(project: DProject) {
        const projectUrl = this.url + `projects/${project.id}`;
        await Load.element(`${projectUrl}/metamodels`);
        await Load.element(`${projectUrl}/models`);
        await Load.element(`${projectUrl}/packages`);
        await Load.element(`${projectUrl}/classes`);
        await Load.element(`${projectUrl}/enumerators`);
        await Load.element(`${projectUrl}/attributes`);
        await Load.element(`${projectUrl}/references`);
        await Load.element(`${projectUrl}/literals`);
        CreateElementAction.new(project);
    }

    private static async element(url: string): Promise<void> {
        const response = await PersistanceApi.responseHandler(await Fetch.get(url));
        const elements = response.body;
        if(response.code !== 200 || !Array.isArray(elements)) return;
        for(let element of elements) CreateElementAction.new(element);
    }

}
