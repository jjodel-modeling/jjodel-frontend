export interface MemoRecObject {
    context: string;
    model: MemoRecModel;

}

export interface MemoRecModel {
    name: string;
    methodDeclarations: MemoRecNamed[];

}

export interface MemoRecNamed {
    name: string;
    methodInvocations: string[];
}
