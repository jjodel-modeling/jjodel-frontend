import axios, {AxiosResponse} from 'axios';
import {LModelElement, LNamedElement} from "../joiner";

interface MemorecObject {
    context: string;
    model: MemorecModel;
}

interface MemorecModel {
    name: string;
    methodDeclarations: MemorecClass[];
}

interface MemorecClass {
    name: string;
    methodInvocations: string[];
}

export default class MemoRec {
    static url(path: string): string {
        return 'http://localhost:8080/' + path;
    }

    static async post(path: string, obj: MemorecObject): Promise<AxiosResponse> {
        return await axios.post(MemoRec.url(path), obj);
    }

    static async get(path: string): Promise<AxiosResponse> {
        return await axios.get(MemoRec.url(path));
    }

    static async test(me: LModelElement): Promise<void> {
        console.clear();
        const named: LNamedElement = LNamedElement.fromPointer(me.id);

        const model = me.model;
        const classes = model.classes;

        const memorecClasses: MemorecClass[] = [];
        for(let myClass of classes) {
            const attributes = myClass.attributes.map(x => x.name);
            memorecClasses.push({name: myClass.name, methodInvocations: attributes});
        }
        const memorecModel: MemorecModel = {name: model.name, methodDeclarations: memorecClasses};
        const memorecObject: MemorecObject = {context: named.name, model: memorecModel};

        const response = await MemoRec.post('structuralFeatures', memorecObject);
        console.log(response);
    }

}
