import {createStore, PreloadedState, Reducer, Store, StoreEnhancer} from 'redux';
import {
    GObject,
    GraphPoint,
    Point,
    DAttribute,
    DClass,
    DModel,
    DModelElement,
    DNamedElement,
    DReference,
    Pointer,
    DPointerTargetable,
    RuntimeAccessibleClass,
    SetRootFieldAction,
    TRANSACTION,
    Dictionary,
    DUser,
    DocString,
    DViewElement,
    windoww,
    CreateElementAction,
    DGraphElement,
    LGraphElement,
    RuntimeAccessible,
    DGraph,
    LGraph,
    LViewElement,
    LPointerTargetable,
    getPath,
    LModelElement, LModel, LPackage, LAnnotation,
} from "../joiner";

import {Mixin} from "ts-mixer";

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise
export class IStore {
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    currentUser: DUserState;
    stackViews: Pointer<DViewElement>[] = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    // collaborators: UserState[];
    idlookup: Record<Pointer<DPointerTargetable, 1, 1>, DPointerTargetable> = {};

    //// DClass section to fill
    graphs: Pointer<DGraph, 0, 'N', LGraph> = [];









    /// DClass section end

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };
    constructor(){
//        super();
        this.currentUser = new DUserState();
        this.models = [];
        // this.collaborators = [];
        // this.fakeinit();
    }

    static fakeinit(store?: IStore): void {
        const outElemArray: DModelElement[] = [];
        const m3: DModel = this.makeM3Test(false, outElemArray);
        TRANSACTION( () => {
            for (let elem of outElemArray) {
                new CreateElementAction(elem);
            }
        });
    }

    static makeM3Test(fireAction: boolean = true, outElemArray: DPointerTargetable[] = []): DModel {
        const me: DModelElement = new DClass('ModelElement', true);
        const annotation: DClass = new DClass('Annotation');
        annotation.implements = [me.id];
        const namedElement: DClass = new DClass('NamedElement');
        const attribname: DAttribute = new DAttribute('name');
        namedElement.implements = [me.id]; // , classifier.id, namedelement.id, modelelement.id]
        namedElement.attributes = [attribname.id];

        const pkg: DClass = new DClass('M3Package');
        const attriburi: DAttribute = new DAttribute('uri');
        pkg.implements = [namedElement.id];
        pkg.attributes = [attriburi.id];
        const classifierref: DReference = new DReference('classifiers');
        pkg.references = [classifierref.id];

        const model: DClass = new DClass('M3');
        const pkgref: DReference = new DReference('package');
        model.implements = [namedElement.id];
        pkgref.type = pkg.id;
        const classe: DClass = new DClass('Class', false, true);
        classifierref.type = classe.id;
        classe.implements = [namedElement.id]; // , classifier.id, namedelement.id, modelelement.id]
        /// model itself outside of ecore
        const m3: DModel = new DModel('M3');
        m3.packages = [pkg.id];
        const m3graph: DGraph = DGraph.create(m3.id);
        // m3.modellingElements = [me.id, annotation.id, namedElement.id, attribname.id, pkg.id, attriburi.id, classifierref.id, pkgref.id, classe.id];
        // dispatching actions


        const editinput = "<Input field={'name'} />";
        let view: DViewElement = new DViewElement('m3View', '<p><h1>hello1 {this.data.name + (this.data.id)}</h1><i>{JSON.stringify(Object.keys(this))}</i>' + editinput + '</p>');
        let editView: DViewElement = makeEditView();
        let graphView: DViewElement = makeDefaultGraphView();

        let test: DViewElement = new DViewElement('testView', '');
        test.addSubview(view.id);
        test.addSubview(editView.id);
        test.addSubview(graphView.id);

        outElemArray.push.call(outElemArray, m3, m3graph, me, annotation, namedElement, attribname, pkg, attriburi, classifierref, pkgref, classe, view, editView, graphView, test);
        // m3._transient.currentView = view.id;
        /*
        if (fireAction)
            TRANSACTION( () => {
                // new SetRootFieldAction('models[]', m3);
                // for (let elem of outElemArray) { DModelElement.persist(elem); }
            });*/
        return m3;
    }
}
function makeDefaultGraphView(): DViewElement {
    // let jsxstringtodo = todo itera i nodi o i children di un modello nel jsx;
    let thiss: {data: LModelElement} = null as any;
    // let jsxstring = <div><span>{JSON.stringify(thiss.data.__raw)}</span> <div className={"childrens"}>{thiss.data.childrens.map((p) => <VertexConnected data={p.id} />)}</div></div>;
    let jsxstring = '<div><b>{this.data.__raw.className + ": " + this.data.id}</b><span style={{maxHeight: "50px", display: "block", overflowY: "scroll"}}>{JSON.stringify({...this.data.__raw, childrens: this.data.childrens})}</span>\n' +
        '<div className={"childrens"}>childrens: {this.data.childrens.map((p) => <Vertex data={p.id} />)}</div>\n' +
        '{/*<Field data={this.data.id} nodeid={this.nodeid + "2"} graphid={this.graphid} view = {Selectors.getByName(DViewElement, \'EditView\').id} />\n*/}' +
        '</div>';
    // let jsxstring = '<div><DataOutputComponent data={this.data.__raw} /> <div className={"childrens"}>{this.data.childrens.map((p) => <Vertex data={p.id} />)}</div></div>';
    let view: DViewElement = new DViewElement('GraphDefaultView', jsxstring, undefined, '', '', '', [DModelElement.name]);
    view.subViews = [view.id]; // childrens can use this view too todo: this is temporary
    return view;
}
function makeEditView(): DViewElement{
    // let jsx = <p><h1>edit view of {this.data.name}</h1><Input obj={this.view.id} field={((getPath as DViewElement).jsxString as any).$}/></p>;
    let jsxstring = '<p><h1>edit view of {this.data.name}</h1><Textarea obj={this.views[1].id} field={((getPath).jsxString).$}/></p>;';
    let view: DViewElement = new DViewElement('EditView', jsxstring);
    view.subViews = [view.id]; // childrens can use this view too, this is indented and likely definitive.
    return view;
}
/*
class SynchStore{// shared on session

}
class AsynchStore{ // user private
    pendingUserAction: UserPendingAction[];
}*/

@RuntimeAccessible
export class DUserState extends DPointerTargetable {
    pointerPosition?: GraphPoint;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};
    constructor() { super(true); }
}

@RuntimeAccessible
export class LUserState extends Mixin(DUserState, LPointerTargetable) {
    pointerPosition?: GraphPoint;
    defaultView!: LViewElement;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};
    constructor() { super(true); }
}

@RuntimeAccessible
export class ViewPointState extends DPointerTargetable{
    name: string = '';
}

// todo: ogni entità ha: dati (store), logica con operazioni, dati di presentazione, ...?

@RuntimeAccessible
export class ModelStore {
    private _meta!: ModelStore | string; // todo: credo sia un Pointer? roba vecchia. oldcomment: // string memorizzata nello store, logicamente si comporta come una reference perchè usi la stringa per recuperare un modelstore (il tipo modelstore è di documentazione)
    instances!: (ModelStore | string)[];

    // todo: figata! getter e setter senza proxy??
    get meta(): ModelStore | string {
        return this._meta;
    }

    set meta(value: ModelStore | string) {
        this._meta = value;
    }
}
/*
type Cconnect = <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = DefaultState>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>
): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;
*/
// export const initialState: IStore = new IStore();
