import {U} from "../../joiner";

export class ViewElement{
    id!: string; // user_id + autoincrement number for that user.
    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    jsxString!: string; // l'html template
    usageDeclarations?: string; // example: state
    constructor(jsxString: string, usageDeclarations: string = '', constants: string = '', preRenderFunc: string = '') {
        this.jsxString = jsxString;
        this.usageDeclarations = usageDeclarations;
        this.constants = constants;
        this.preRenderFunc = preRenderFunc;
        this.id = U.getID();
    }
}
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

