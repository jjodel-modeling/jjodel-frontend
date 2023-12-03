import type {LProject, LViewElement} from '../../joiner';
import {U, Defaults} from '../../joiner';
import Fetch from '../fetch';
import type {DataTypes, NodeTypes} from '../../joiner/types';

export class Save {
    private static url = '/persistance/';

    static async project(p: LProject): Promise<void> {
        await Fetch.post(this.url + 'projects', U.json(p));

        const projectUrl = this.url + `projects/${p.id}`;
        await Promise.all([
            /* DATA */
            Save.data(`${projectUrl}/metamodels`, p.metamodels),
            Save.data(`${projectUrl}/packages`, p.packages),
            Save.data(`${projectUrl}/classes`, p.classes),
            Save.data(`${projectUrl}/attributes`, p.attributes),
            Save.data(`${projectUrl}/references`, p.references),
            Save.data(`${projectUrl}/operations`, p.operations),
            Save.data(`${projectUrl}/parameters`, p.parameters),
            Save.data(`${projectUrl}/enumerators`, p.enumerators),
            Save.data(`${projectUrl}/literals`, p.literals),
            Save.data(`${projectUrl}/models`, p.models),
            Save.data(`${projectUrl}/objects`, p.objects),
            Save.data(`${projectUrl}/values`, p.values),
            /* VIEWS */
            Save.views(`${projectUrl}/views`, p.views),
            Save.views(`${projectUrl}/viewpoints`, p.viewpoints),
            /* NODES */
            Save.nodes(`${projectUrl}/graphs`, p.graphs),
            Save.nodes(`${projectUrl}/graphVertexes`, p.graphVertexes),
            Save.nodes(`${projectUrl}/voidVertexes`, p.voidVertexes),
            Save.nodes(`${projectUrl}/vertexes`, p.vertexes),
            Save.nodes(`${projectUrl}/graphElements`, p.fields),
            Save.nodes(`${projectUrl}/edges`, p.edges),
            Save.nodes(`${projectUrl}/edgePoints`, p.edgePoints)

        ]);
    }

    private static async data(url: string, elements: DataTypes[]): Promise<void> {
        await Fetch.delete(url);
        for(let element of elements) {
            if(!element) continue;
            console.log(`Saving To Server (${element.className})`, element);
            await Fetch.post(url, U.json(element));
        }
    }

    private static async views(url: string, elements: LViewElement[]): Promise<void> {
        const defaults = [...Defaults.views, ...Defaults.viewpoints];
        await Fetch.delete(url);
        for(let element of elements) {
            if(!element || defaults.includes(element.id)) continue;
            console.log(`Saving To Server (${element.className})`, element);
            await Fetch.post(url, U.json(element));
        }
    }

    private static async nodes(url: string, elements: NodeTypes[]): Promise<void> {
        await Fetch.delete(url);
        for(let element of elements) {
            if(!element) continue;
            console.log(`Saving To Server (${element.className})`, element);
            await Fetch.post(url, U.json(element));
        }
    }

}
