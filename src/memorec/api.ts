import axios, {AxiosResponse} from 'axios';
import {GObject, LModelElement, LNamedElement} from "../joiner";
import {MemoRecModel, MemoRecNamed, MemoRecObject} from "./types";


export default class MemoRec {
    static async post(path: string, obj: MemoRecObject): Promise<AxiosResponse> {
        console.clear();
        console.log(obj);
        return await axios.post('/memorec/' + path, obj);
    }

    static async structuralFeature(me: LModelElement): Promise<{data:GObject[], type:'class'|'package'}> {

        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const classes = model.classes;

        const memorecClasses: MemoRecNamed[] = [];

        for(let myClass of classes) {
            const attributes = myClass.attributes.map(x => x.name);
            const references = myClass.references.map(x => x.name);
            memorecClasses.push({name: myClass.name, methodInvocations: [...attributes, ...references]});
        }

        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecClasses};

        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};
        console.log('input', memorecObject);

        const response = await MemoRec.post('structuralFeatures', memorecObject);
        console.log(response);

        const data: GObject[] = response.data.slice(0, 10);
        data.sort((a,b) => b.score - a.score);

        return {data: data, type: 'class'};

    }

    static async classifier(me: LModelElement): Promise<{data:GObject[], type:'class'|'package'}> {
        console.clear();
        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const packages= model.packages;

        const memorecPackages: MemoRecNamed[] = [];

        for(let myPackage of packages) {
            const classes = myPackage.classes.map(x => x.name);
            memorecPackages.push({name: myPackage.name, methodInvocations: classes});
        }
        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecPackages};

        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};
        console.log('input', memorecObject);

        const response = await MemoRec.post('classes', memorecObject);
        console.log(response);

        const data:GObject[] = response.data.slice(0, 10);
        data.sort((a,b) => b.score - a.score);
        return {data: data, type: 'package'};
    }
}
