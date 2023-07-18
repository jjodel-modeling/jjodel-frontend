export interface MemoRecObject {
    context: string;
    model: MemoRecModel;

}

 export interface MemoRecModel {
    name: string;
    methodDeclarations: MemoRecClass[];

}

 export interface MemoRecClass {
    name: string;
    methodInvocations: string[];
}