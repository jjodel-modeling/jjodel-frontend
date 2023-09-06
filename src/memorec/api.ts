import axios, {AxiosResponse} from 'axios';
import {GObject, LModelElement, LNamedElement} from "../joiner";
import {MemoRecModel, MemoRecNamed, MemoRecObject} from "./types";


export default class MemoRec {
    static url(path: string): string {
        return 'http://localhost:8080/' + path;
    }

    static async post(path: string, obj: MemoRecObject): Promise<AxiosResponse> {
        return await axios.post(MemoRec.url(path), obj);
    }

    static async get(path: string): Promise<AxiosResponse> {
        return await axios.get(MemoRec.url(path));
    }

    static async structuralFeature(me: LModelElement): Promise<{data:GObject[], type:'class'|'package'}> {

        console.clear();

        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const classes = model.classes;


        const memorecClasses: MemoRecNamed[] = [];

        for(let myClass of classes) {
            const attributes = myClass.attributes.map(x => x.name);
            memorecClasses.push({name: myClass.name, methodInvocations: attributes});
        }

        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecClasses};

        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};
        console.log('input', memorecObject);

        const response = await MemoRec.post('structuralFeatures', memorecObject);
        console.log(response);

        const data:GObject[] = response.data.slice(0, 10);
        data.sort((a,b) => b.score - a.score);
        // SetRootFieldAction.new('memorec', {data: response.data, type: 'class'});
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
        //SetRootFieldAction.new('memorec', {data: response.data, type: 'package'}); //setta l'oggetto memorec
        return {data: data, type: 'package'};
    }
}
