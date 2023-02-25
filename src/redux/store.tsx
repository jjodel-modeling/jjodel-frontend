import type {
    DClassifier,
    DExtEdge,
    DGraphElement,
    DLog,
    DModelElement,
    DParameter,
    DRefEdge,
    LAttribute,
    LClass,
    LClassifier,
    LEdgePoint,
    LEnumerator,
    LEnumLiteral,
    LExtEdge,
    LGraph,
    LGraphVertex,
    LLog,
    LOperation,
    LPackage,
    LParameter,
    LRefEdge,
    LReference,
    LVertex,
    Pointer
} from '../joiner';
import {
    CreateElementAction,
    DAttribute,
    DClass,
    DEnumerator,
    DEnumLiteral,
    DGraph,
    DModel,
    DObject,
    DOperation,
    DPackage,
    DPointerTargetable,
    DReference,
    DUser,
    DValue,
    DViewElement,
    getPath, LModel,
    LObject,
    LUser,
    LValue,
    RuntimeAccessible,
    SetRootFieldAction,
} from "../joiner";
import React from "react";
import DV from "../common/DV";
import LeaderLine from "leader-line-new";

console.warn('ts loading store');

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise


export interface EdgeOptions{
    id: number,
    options: LeaderLine.Options,
    source: string,
    target: string
}

export class IStore {
    logs: Pointer<DLog, 0, 'N', LLog> = [];
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    currentUser: DUser;
    //change viewsEditor to hook function and use the state instaed redux (?)
    stackViews: Pointer<DViewElement>[] = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    // collaborators: UserState[];
    idlookup: Record<Pointer<DPointerTargetable, 1, 1>, DPointerTargetable> = {};

    //// DClass section to fill
    graphs: Pointer<DGraph, 0, 'N', LGraph> = [];
    voidvertexs: Pointer<DGraph, 0, 'N', LGraphVertex> = [];
    vertexs: Pointer<DGraph, 0, 'N', LVertex> = [];
    graphvertexs: Pointer<DGraph, 0, 'N', LGraphVertex> = [];

    edgepoints: Pointer<DGraph, 0, 'N', LEdgePoint> = [];
    //my addon
    extEdges: Pointer<DExtEdge, 0, "N", LExtEdge> = [];
    refEdges: Pointer<DRefEdge, 0, "N", LRefEdge> = [];

    classifiers: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    enumerators: Pointer<DEnumerator, 0, 'N', LEnumerator> = [];
    packages: Pointer<DPackage, 0, 'N', LPackage> = [];
    primitiveTypes: Pointer<DClass, 0, "N", LClass> = [];
    attributes: Pointer<DAttribute, 0, "N", LAttribute> = [];
    enumliterals: Pointer<DEnumLiteral, 0, "N", LEnumLiteral> = [];
    references: Pointer<DReference, 0, "N", LReference> = [];
    classs: Pointer<DClass, 0, "N", LClass> = [];
    operations: Pointer<DOperation, 0, "N", LOperation> = [];
    parameters: Pointer<DParameter, 0, "N", LParameter> = [];
    returnTypes: Pointer<DClass, 1, "N", LClass> = [];
    /// DClass section end

    isEdgePending: {user: Pointer<DUser, 1, 1, LUser>, source: Pointer<DClass, 1, 1, LClass>} = {user: "", source: ""};

    contextMenu: {display: boolean, x: number, y: number} = { display: false, x: 0, y: 0 };

    dragging: {random: number, id: string} = { random: 0, id: "" };
    edges: EdgeOptions[] = [];
    edgesCounter: number = 0;

    deleted : string[] = [];

    objects: Pointer<DObject, 0, 'N', LObject> = [];
    values: Pointer<DValue, 0, 'N', LValue> = [];

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };
    users: Pointer<DUser, 1, 'N', LUser>;
    _edgeSettings = { showAnchor: false, size: 1, color: '#000000' }

    viewpoint: number = 0;
    viewpoints: number[] = [0];

    constructor() {
        // todo: this must become a pointer to idlookup and fire a CreateNewElementAction
        this.currentUser = DUser.new();
        this.users = [this.currentUser.id];
        this.models = [];
    }

    static fakeinit(store?: IStore): void {
        const graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
        for (let graphDefaultView of graphDefaultViews) {
            CreateElementAction.new(graphDefaultView);
        }
        const dMetaModel = DModel.new("Metamodel");
        CreateElementAction.new(dMetaModel);
        CreateElementAction.new(DGraph.new(dMetaModel.id));

        const primitiveTypes = ['EString', 'EInt', 'EBoolean'];
        for (let primitiveType of primitiveTypes) {
            const dPrimitiveType = DClass.new(primitiveType);
            CreateElementAction.new(dPrimitiveType);
            SetRootFieldAction.new("primitiveTypes", dPrimitiveType.id, '+=', true);
        }
        const returnTypes = ["void", "undefined", "null"];
        for (let returnType of returnTypes) {
            const dReturnType = DClass.new(returnType);
            CreateElementAction.new(dReturnType);
            SetRootFieldAction.new("returnTypes", dReturnType.id, '+=', true);
        }
        const dModel: DModel = DModel.new('Model');
        dModel.isMetamodel = false;
        CreateElementAction.new(dModel);
        CreateElementAction.new(DGraph.new(dModel.id));
    }

    static makeM3Test(fireAction: boolean = true, outElemArray: DPointerTargetable[] = []): DModel {
        const me: DClass = DClass.new('ModelElement', true);
        const annotation: DClass = DClass.new('Annotation');
        annotation.implements = [me.id];
        const namedElement: DClass = DClass.new('NamedElement');
        const attribname: DAttribute = DAttribute.new('name');
        namedElement.implements = [me.id]; // , classifier.id, namedelement.id, modelelement.id]
        namedElement.attributes = [attribname.id];

        // todo: uncomment const pkg: DClass = new DClass('M3Package');
        const pkg: DPackage = DPackage.new('M3Package');
        const attriburi: DAttribute = DAttribute.new('uri');
        // todo: uncomment pkg.implements = [namedElement.id];
        // todo: uncomment pkg.attributes = [attriburi.id];
        const classifierref: DReference = DReference.new('classifiers');
        // todo: uncomment pkg.references = [classifierref.id];

        const model: DClass = DClass.new('M3');
        const pkgref: DReference = DReference.new('package');
        model.implements = [namedElement.id];
        //pkgref.type = pkg.id;
        const classe: DClass = DClass.new('Class', false, true);
        classifierref.type = classe.id;
        classe.implements = [namedElement.id]; // , classifier.id, namedelement.id, modelelement.id]
        /// model itself outside of ecore
        const m3: DModel = DModel.new('M3');
        m3.packages = [pkg.id];
        // const m3graph: DGraph = DGraph.create(m3.id);
        const m3graph: DGraph = DGraph.new(m3.id, '', '', '');
        // m3.modellingElements = [me.id, annotation.id, namedElement.id, attribname.id, pkg.id, attriburi.id, classifierref.id, pkgref.id, classe.id];
        // dispatching actions


        const editinput = "<Input className={''} field={'name'} />";
        // let m3view: DViewElement = new DViewElement('m3View', '<p style={{display: "flex", flexFlow: "wrap"}}><h1>m3view {this.data.name + (this.data.id)}</h1><i>{JSON.stringify(Object.keys(this))}</i>' + editinput + '</p>');
        // let editView: DViewElement = makeEditView();
        let graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
/*
        let test: DViewElement = new DViewElement('testView', '');
        test.addSubview(view.id);
        // test.addSubview(editView.id);
        test.addSubview(graphView.id);*/

        outElemArray.push.call(outElemArray, m3, m3graph, me, annotation, namedElement, attribname, pkg, attriburi, classifierref, pkgref, classe, ...graphDefaultViews);
        // outElemArray.push(m3view);
        // outElemArray.push(editView);
        // outElemArray.push(test);
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
function makeDefaultGraphViews(): DViewElement[] {

    let mview: DViewElement = DViewElement.new('ModelDefaultView', DV.modelView(), undefined, '', '', '', [DModel.name]);
    mview.draggable = false; mview.resizable = false;
    let pkgview: DViewElement = DViewElement.new('PackageDefaultView', DV.packageView(), undefined, '', '', '', [DPackage.name]);
    let cview: DViewElement = DViewElement.new('ClassDefaultView', DV.classView(), undefined, '', '', '', [DClass.name]);
    let eview: DViewElement = DViewElement.new('EnumDefaultView', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.name]);
    let aview: DViewElement = DViewElement.new('AttribDefaultView', DV.attributeView(), undefined, '', '', '', [DAttribute.name]);
    aview.draggable = false; aview.resizable = false;
    let rview: DViewElement = DViewElement.new('RefDefaultView', DV.referenceView(), undefined, '', '', '', [DReference.name]);
    rview.draggable = false; rview.resizable = false;
    let oview: DViewElement = DViewElement.new('OperationDefaultView', DV.operationView(), undefined, '', '', '', [DOperation.name]);
    oview.draggable = false; oview.resizable = false;
    let literalView: DViewElement = DViewElement.new('LiteralDefaultView', DV.literalView(), undefined, '', '', '', [DEnumLiteral.name]);
    literalView.draggable = false; literalView.resizable = false;
    let objectView: DViewElement = DViewElement.new('ObjectDefaultView', DV.objectView(), undefined, '', '', '', [DObject.name]);
    let valueView: DViewElement = DViewElement.new('ValueDefaultView', DV.valueView(), undefined, '', '', '', [DValue.name]);
    valueView.draggable = false; valueView.resizable = false;


    pkgview.subViews = [cview.id]; // childrens can use this view too todo: this is temporary

    let alldefaultViews = [mview, pkgview, cview, eview, aview, rview, oview, literalView, objectView, valueView];
    mview.subViews = [mview.id, ...alldefaultViews.slice(1).map(e => e.id)]// childrens can use this view too todo: this is temporary, should just be the sliced map of everything else.
    return alldefaultViews;
}

function makeEditView(): DViewElement{
    // let jsx = <p><h1>edit view of {this.data.name}</h1><Input className={'raw'} obj={this.view.id} field={((getPath as DViewElement).jsxString as any).$}/></p>;
    let jsxstring = '<p style={{display: "flex", flexFlow: "wrap"}}><h1>edit view of {this.data.name}</h1><Textarea obj={this.views[1].id} field={((getPath).jsxString).$}/></p>;';
    let view: DViewElement = DViewElement.new('EditView', jsxstring);
    view.subViews = [view.id]; // childrens can use this view too, this is indented and likely definitive.
    return view;
}
/*
class SynchStore{// shared on session

}
class AsynchStore{ // user private
    pendingUserAction: UserPendingAction[];
}*/
/*
@RuntimeAccessible
export class DUserState extends DPointerTargetable {
    pointerPosition?: GraphPoint;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};
    constructor() {
        super(true);
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class LUserState extends MixOnlyFuncs(DUserState, LPointerTargetable) {
    pointerPosition?: GraphPoint;
    defaultView!: LViewElement;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};

}
DPointerTargetable.subclasses.push(DUserState);*/

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
console.error('ts loaded store');
