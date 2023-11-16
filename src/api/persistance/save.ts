import {U} from '../../joiner';
import Fetch from '../fetch';
import type {
    LProject,
    LModel,
    LPackage,
    LClass,
    LEnumerator,
    LAttribute,
    LReference,
    LEnumLiteral,
    LObject,
    LValue,
    LViewElement,
    LGraph,
    LGraphVertex,
    LVoidVertex,
    LVertex,
    Pointer
} from '../../joiner';


type T = LModel|LPackage|LClass|LEnumerator|LAttribute|LReference|LEnumLiteral|LObject|LValue|LViewElement|LGraph|LGraphVertex|LVoidVertex|LVertex;
export class Save {
    private static url = '/persistance/';

    static async project(project: LProject): Promise<void> {
        await Fetch.post(this.url + 'projects', U.json(project));

        const projectUrl = this.url + `projects/${project.id}`;
        await Promise.all([
            /* DATA */
            Save.elements(`${projectUrl}/metamodels`, project.metamodels),
            Save.elements(`${projectUrl}/models`, project.models),
            Save.elements(`${projectUrl}/packages`, project.metamodels.flatMap(m => m.packages)),
            Save.elements(`${projectUrl}/classes`, project.metamodels.flatMap(m => m.classes)),
            Save.elements(`${projectUrl}/enumerators`, project.metamodels.flatMap(m => m.enumerators)),
            Save.elements(`${projectUrl}/attributes`, project.metamodels.flatMap(m => m.attributes)),
            Save.elements(`${projectUrl}/references`, project.metamodels.flatMap(m => m.references)),
            Save.elements(`${projectUrl}/literals`, project.metamodels.flatMap(m => m.literals)),
            Save.elements(`${projectUrl}/objects`, project.models.flatMap(m => m.objects)),
            Save.elements(`${projectUrl}/values`, project.models.flatMap(m => m.values)),
            /* VIEWS */
            Save.elements(`${projectUrl}/views`, project.views),
            /* NODES */
            // Save.elements(`${projectUrl}/graphs`, project.graphs),
            // Save.elements(`${projectUrl}/graphVertexs`, project.graphs.flatMap(m => m.subElements.filter(s => s.className === 'DGraphVertex'))),
            // Save.elements(`${projectUrl}/voidVertexs`, project.graphs.flatMap(m => m.subElements.filter(s => s.className === 'DVoidVertex'))),
            // Save.elements(`${projectUrl}/vertexs`, project.graphs.flatMap(m => m.subElements.filter(s => s.className === 'DVertex'))),
        ]);
        // todo: fix metamodels.attributes, metamodels.literals and models.values (for now done without sub-checking)
    }

    private static async elements(url: string, elements: T[]): Promise<void> {
        /* Override */
        await Fetch.delete(url);
        const defaultViews = U.getDefaultViewsID() as Pointer[];
        for(let element of elements) {
            if(!defaultViews.includes(element?.id))
                await Fetch.post(url, U.json(element));
        }
    }

}
