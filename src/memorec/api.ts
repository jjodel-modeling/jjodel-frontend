import axios, {AxiosResponse} from 'axios';
import {Json, LModelElement, LNamedElement, U} from "../joiner";
import {MemoRecClass, MemoRecModel, MemoRecObject} from "./types";

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

    static async structuralFeature(me: LModelElement): Promise<void> {
        console.clear();

        const named: LNamedElement = LNamedElement.fromPointer(me.id);
        const model = me.model;
        const classes = model.classes;

        const memorecClasses: MemoRecClass[] = [];


        for(let myClass of classes) {
            const attributes = myClass.attributes.map(x => x.name);
            memorecClasses.push({name: myClass.name, methodInvocations: attributes});
        }

        const memorecModel: MemoRecModel = {name: model.name, methodDeclarations: memorecClasses};

        const memorecObject: MemoRecObject = {context: named.name, model: memorecModel};



        const response = await MemoRec.post('structuralFeatures', memorecObject);
        console.log(response);
    }

}
