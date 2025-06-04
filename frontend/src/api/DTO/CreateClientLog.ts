export class CreateClientLog {

    level: 'Error' | 'Warning' | 'Information' = 'Information';
    title: string = '';
    version: string = '';
    creation: Date = new Date();
    message: string = '';
    stackTrace?: string;
    compoStack?: string;
    contextJson?: string;
    dState?: string;
    transientJson?: string;
}