import axios, {AxiosResponse} from 'axios';
import {Json, LModelElement} from "../joiner";

export default class MemoRec {
    static url(path: string): string {
        return 'http://localhost:8080/' + path;
    }

    static async post(path: string, obj: Json): Promise<AxiosResponse> {
        return await axios.post(MemoRec.url(path), obj);
    }

    static async get(path: string): Promise<AxiosResponse> {
        return await axios.get(MemoRec.url(path));
    }

    static async test(me: LModelElement): Promise<void> {
        console.clear();

        const model = me.model;

        const classes = model.classes;

        for(let myClass of classes) {
            const attributes = myClass.attributes;
            console.log(attributes)
        }

        const obj: Json = {
            "context" : "Book",
            "model" : {
                "name": "juri.txt",
                "methodDeclarations": [
                    {
                        "name": "Record",
                        "methodInvocations": [
                            "ee",
                            "url",
                            "key",
                            "mdate"
                        ]
                    },
                    {
                        "name": "Article",
                        "methodInvocations": [
                            "title",
                            "fromPage",
                            "toPage",
                            "number",
                            "volume",
                            "month",
                            "year"
                        ]
                    },
                    {
                        "name": "Author",
                        "methodInvocations": [
                            "name"
                        ]
                    },
                    {
                        "name": "Journal",
                        "methodInvocations": [
                            "name"
                        ]
                    },
                    {
                        "name": "Book",
                        "methodInvocations": [
                            "title",
                            "month",
                            "volume",
                            "series",
                            "edition",
                            "isbn"
                        ]
                    },
                    {
                        "name": "InCollection",
                        "methodInvocations": [
                            "title",
                            "bookTitle",
                            "year",
                            "fromPage",
                            "toPage",
                            "month"
                        ]
                    },
                    {
                        "name": "InProceedings",
                        "methodInvocations": [
                            "title",
                            "bootitle",
                            "year",
                            "fromPage",
                            "toPage",
                            "month"
                        ]
                    },
                    {
                        "name": "MastersThesis",
                        "methodInvocations": [
                            "title",
                            "year",
                            "month"
                        ]
                    },
                    {
                        "name": "Proceedings",
                        "methodInvocations": [
                            "title",
                            "year",
                            "month",
                            "isbn"
                        ]
                    },
                    {
                        "name": "PhDThesis",
                        "methodInvocations": [
                            "title",
                            "year",
                            "month"
                        ]
                    },
                    {
                        "name": "Www",
                        "methodInvocations": [
                            "title",
                            "year",
                            "month"
                        ]
                    },
                    {
                        "name": "Editor",
                        "methodInvocations": [
                            "name"
                        ]
                    },
                    {
                        "name": "Organization",
                        "methodInvocations": [
                            "name"
                        ]
                    },
                    {
                        "name": "Publisher",
                        "methodInvocations": [
                            "name",
                            "address"
                        ]
                    },
                    {
                        "name": "School",
                        "methodInvocations": [
                            "name",
                            "address"
                        ]
                    }
                ]
            }
        };

        const response = await MemoRec.post('structuralFeatures', obj);
        console.log(response);
    }

}
