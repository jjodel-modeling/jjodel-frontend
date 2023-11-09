import type {LProject, LModel, LPackage, LClass, LEnumerator, LAttribute, LReference, LEnumLiteral, LObject, LValue} from '../../joiner';
import {U} from '../../joiner';
import Fetch from '../fetch';

export class Save {
    private static url = '/persistance/';

    static async project(project: LProject): Promise<void> {
        await Fetch.post(this.url + 'projects', U.json(project));

        const projectUrl = this.url + `projects/${project.id}`;
        await Promise.all([
            Save.elements(`${projectUrl}/metamodels`, project.metamodels),
            Save.elements(`${projectUrl}/models`, project.models),
            Save.elements(`${projectUrl}/packages`, project.metamodels.flatMap(m => m.packages)),
            Save.elements(`${projectUrl}/classes`, project.metamodels.flatMap(m => m.classes)),
            Save.elements(`${projectUrl}/enumerators`, project.metamodels.flatMap(m => m.enumerators)),
            Save.elements(`${projectUrl}/attributes`, project.metamodels.flatMap(m => m.attributes)),
            Save.elements(`${projectUrl}/references`, project.metamodels.flatMap(m => m.references)),
            Save.elements(`${projectUrl}/literals`, project.metamodels.flatMap(m => m.literals)),
            Save.elements(`${projectUrl}/objects`, project.models.flatMap(m => m.objects)),
            Save.elements(`${projectUrl}/values`, project.models.flatMap(m => m.values))
        ]);
        // todo: fix metamodels.attributes, metamodels.literals and models.values (done without sub-checking)
    }

    private static async elements(url: string, elements: (LModel|LPackage|LClass|LEnumerator|LAttribute|LReference|LEnumLiteral|LObject|LValue)[]): Promise<void> {
        /* Override */
        await Fetch.delete(url);
        for(let element of elements) await Fetch.post(url, U.json(element));
    }

}
