import axios from 'axios';

export default class MemoRec {
    static url(path: string): string {
        return 'http://localhost:8080/' + path + '';
    }

    static post(): void {
        const json = {
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
        axios.post(MemoRec.url('structuralFeatures'), json)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    static get(): void {
        axios.get(MemoRec.url('test'))
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

}
