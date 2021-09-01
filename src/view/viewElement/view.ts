import {Dictionary, DocString, Pointer, Size, U, User} from "../../joiner";

export class ViewElement{
    id!: string; // user_id + autoincrement number for that user.
    constants?: string; // evalutate 1 sola volta all'applicazione della vista o alla creazione dell'elemento.
    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    jsxString!: string; // l'html template
    usageDeclarations?: string; // example: state
    scalezoomx: boolean = false; // whether to resize the element normally using width-height or resize it using zoom-scale css
    scalezoomy: boolean = false;
    size: Size = defaultSize;
    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    transient: TransientProperties;
    constructor(jsxString: string, usageDeclarations: string = '', constants: string = '', preRenderFunc: string = '') {
        this.jsxString = jsxString;
        this.usageDeclarations = usageDeclarations;
        this.constants = constants;
        this.preRenderFunc = preRenderFunc;
        this.id = U.getID();
        this.transient = new TransientProperties();
    }
}
class TransientProperties{
    isSelected: Dictionary<DocString<Pointer<User>>, boolean> = {};
    private: PrivateTransientProperties;
    constructor() {
        this.private = new PrivateTransientProperties();
    }
}
const defaultSize = new Size(0, 0, 200, 200);
class PrivateTransientProperties{
    public size: Size
    constructor(size?: Size) {
        this.size = size || defaultSize;
    }
}
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

