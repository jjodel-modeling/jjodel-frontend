import {LGraphElement, U} from '../../joiner';
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
    LEdge,
    LEdgePoint,
    LGraphVertex,
    LVoidVertex,
    LVertex,
    Pointer
} from '../../joiner';


type T = LModel|LPackage|LClass|LEnumerator|LAttribute|LReference|LEnumLiteral|LObject|LValue|LViewElement|LGraph|LGraphVertex|LVoidVertex|LVertex|LGraphElement|LEdge|LEdgePoint;
export class Save {
    private static url = '/persistance/';

    static async project(project: LProject): Promise<void> {
        await Fetch.post(this.url + 'projects', U.json(project));

        const projectUrl = this.url + `projects/${project.id}`;

        const graphs: LGraph[] = project.graphs;
        const edges: LEdge[] = graphs.flatMap(g => g.subElements.filter(e => e.className === 'DEdge')) as LEdge[];
        const edgePoints: LEdgePoint[] = edges.flatMap(e => e.subElements) as LEdgePoint[];
        const graphVertexes: LGraphVertex[] = graphs.flatMap(g => g.subElements.filter(gv => gv.className === 'DGraphVertex')) as LGraphVertex[];
        const allVertexes: (LVoidVertex|LVertex)[] = graphVertexes.flatMap(gv => gv.subElements) as (LVoidVertex|LVertex)[];
        const voidVertexes: LVoidVertex[] = allVertexes.filter(av => av.className === 'DVoidVertex') as LVoidVertex[];
        const vertexes: LVertex[] = allVertexes.filter(av => av.className === 'DVertex') as LVertex[];
        const graphElements: LGraphElement[] = allVertexes.flatMap(v => v.subElements.filter(ge => ge.className === 'DGraphElement') as LGraphElement[])

        // todo: fix metamodels.attributes, metamodels.literals and models.values (for now done without sub-checking)
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
            Save.elements(`${projectUrl}/graphs`, graphs),
            Save.elements(`${projectUrl}/graphVertexes`, graphVertexes),
            Save.elements(`${projectUrl}/voidVertexes`, voidVertexes),
            Save.elements(`${projectUrl}/vertexes`, vertexes),
            Save.elements(`${projectUrl}/graphElements`, graphElements),
            Save.elements(`${projectUrl}/edges`, edges),
            Save.elements(`${projectUrl}/edgePoints`, edgePoints)
        ]);
    }

    private static async elements(url: string, elements: T[]): Promise<void> {
        /* Override */
        await Fetch.delete(url);
        const defaultViews = U.getDefaultViewsID() as Pointer[];
        for(let element of elements) {
            if(!defaultViews.includes(element?.id)) {
                console.log('Saving To Server', element);
                await Fetch.post(url, U.json(element));
            }
        }
    }

}
