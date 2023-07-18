import axios, {AxiosResponse} from 'axios';
import {Json, LModelElement, LNamedElement, SetRootFieldAction, U} from "../joiner";
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
        const data = [
            [
                {
                    "recommendedItem": "address",
                    "score": 0.8
                },
                {
                    "recommendedItem": "bookTitle",
                    "score": 0.8
                },
                {
                    "recommendedItem": "edition",
                    "score": 0.8
                },
                {
                    "recommendedItem": "fromPage",
                    "score": 0.8
                },
                {
                    "recommendedItem": "isbn",
                    "score": 0.8
                },
                {
                    "recommendedItem": "month",
                    "score": 0.8
                },
                {
                    "recommendedItem": "name",
                    "score": 0.8
                },
                {
                    "recommendedItem": "number",
                    "score": 0.8
                },
                {
                    "recommendedItem": "series",
                    "score": 0.8
                },
                {
                    "recommendedItem": "title",
                    "score": 0.8
                },
                {
                    "recommendedItem": "toPage",
                    "score": 0.8
                },
                {
                    "recommendedItem": "volume",
                    "score": 0.8
                },
                {
                    "recommendedItem": "year",
                    "score": 0.8
                }
            ]
        ];
        SetRootFieldAction.new('memorec', data);
        /*
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

        */
    }

}
