import type {LProject, LModel, LPackage, LClass, LEnumerator, LAttribute, LReference, LEnumLiteral} from '../../joiner';
import {U} from '../../joiner';
import Fetch from '../fetch';

export class Save {
    private static url = '/persistance/';

    static async project(project: LProject): Promise<void> {
        await Fetch.post(this.url + 'projects', U.json(project));

        const projectUrl = this.url + `projects/${project.id}`;
        await Save.elements(`${projectUrl}/metamodels`, project.metamodels);
        await Save.elements(`${projectUrl}/models`, project.models);
        await Save.elements(`${projectUrl}/packages`, project.metamodels.flatMap(m => m.packages));
        await Save.elements(`${projectUrl}/classes`, project.metamodels.flatMap(m => m.classes));
        await Save.elements(`${projectUrl}/enumerators`, project.metamodels.flatMap(m => m.enumerators));
        // await Save.elements(`${projectUrl}/attributes`, project.metamodels.flatMap(m => m.attributes));
        await Save.elements(`${projectUrl}/references`, project.metamodels.flatMap(m => m.references));
        // await Save.elements(`${projectUrl}/literals`, project.metamodels.flatMap(m => m.literals));
    }

    private static async elements(url: string, elements: (LModel|LPackage|LClass|LEnumerator|LAttribute|LReference|LEnumLiteral)[]): Promise<void> {
        await Fetch.delete(url);
        console.log('DEBUGGING', elements);
        for(let element of elements) await Fetch.post(url, U.json(element));
    }

}
