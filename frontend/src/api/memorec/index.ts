import {GObject, Json, LModelElement, LNamedElement, U} from '../../joiner';
import {MemoRecModel, MemoRecNamed, MemoRecObject} from './types';
import Api from '../api';

export default class MemoRec {
    static async structuralFeature(me: LModelElement): Promise<{data: GObject[], type:'class'|'package'}> {
        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const classes = model.classes;
        const memorecClasses: MemoRecNamed[] = [];
        for(const myClass of classes) {
            const attributes = myClass.attributes.map(x => x.name);
            const references = myClass.references.map(x => x.name);
            memorecClasses.push({name: myClass.name, methodInvocations: [...attributes, ...references]});
        }
        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecClasses};
        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};
        const response = await Api.post(`${Api.memorec}/structuralFeatures`, U.wrapper<Json>(memorecObject));
        if(!response.data) return {data: [], type: 'class'}
        const data: GObject[] = U.wrapper<GObject[]>(response.data);
        data.sort((a, b) => b.score - a.score);
        return {data: data, type: 'class'};
    }

    static async classifier(me: LModelElement): Promise<{data: GObject[], type:'class'|'package'}> {
        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const packages= model.packages;
        const memorecPackages: MemoRecNamed[] = [];
        for(const myPackage of packages) {
            const classes = myPackage.classes.map(x => x.name);
            memorecPackages.push({name: myPackage.name, methodInvocations: classes});
        }
        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecPackages};
        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};
        const response = await Api.post(`${Api.memorec}/classes`, U.wrapper<Json>(memorecObject));
        if(!response.data) return {data: [], type: 'package'}
        const data: GObject[] = U.wrapper<GObject[]>(response.data);
        data.sort((a, b) => b.score - a.score);
        return {data: data, type: 'package'};
    }
}
