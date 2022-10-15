import {createStore, PreloadedState, Reducer, Store, StoreEnhancer} from 'redux';
import type {
    LGraph,
    LVertex,
    LEdgePoint} from '../joiner';
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
    LViewElement,
    LPointerTargetable,
    getPath,
    LModelElement,
    LPackage,
    DPackage,
    MixOnlyFuncs,
    DGraph,
    DClassifier,
    DEnumerator,
    Input,
    DOperation,
    SetFieldAction,
    DObject,
    LClassifier,
    DEnumLiteral,
    LEnumerator,
    MDE,
    Selectors,
    DLog,
    LLog,
    LClass,
    DDataType,
    DEdgePoint,
    DExtEdge,
    LExtEdge,
    DRefEdge,
    LRefEdge,
    LAttribute,
    LEnumLiteral, LReference
} from "../joiner";
import React, {ChangeEvent, CSSProperties} from "react";
import {LGraphVertex} from "../model/dataStructure/GraphDataElements";
import {MyProxyHandler} from "../joiner";
import DV from "../common/DV";
console.warn('ts loading store');

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise
export class IStore {
    logs: Pointer<DLog, 0, 'N', LLog> = [];
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    currentUser: DUserState;
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

    /// DClass section end

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };

    constructor() {
//        super();
        this.currentUser = new DUserState();
        this.models = [];
        // this.collaborators = [];
        // this.fakeinit();
    }

    static fakeinit(store?: IStore): void {
        const graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
        for (let graphDefaultView of graphDefaultViews) {
            new CreateElementAction(graphDefaultView);
        }
        const dModel = new DModel("Test Model");
        new CreateElementAction(dModel);
        new CreateElementAction(DGraph.create(dModel.id));

        const primitiveTypes = ["EString", "EInt", "EBoolean"];
        for (let primitiveType of primitiveTypes) {
            const dPrimitiveType = new DClass(primitiveType);
            new CreateElementAction(dPrimitiveType);
            new SetRootFieldAction("primitiveTypes+=", dPrimitiveType.id);
        }
    }
}
function makeDefaultGraphViews(): DViewElement[] {

    let mview: DViewElement = new DViewElement('ModelDefaultView', DV.modelView(), undefined, '', '', '', [DModel.name]);
    let pkgview: DViewElement = new DViewElement('PackageDefaultView', DV.packageView(), undefined, '', '', '', [DPackage.name]);
    let cview: DViewElement = new DViewElement('ClassDefaultView', DV.classView(), undefined, '', '', '', [DClass.name]);
    let eview: DViewElement = new DViewElement('EnumDefaultView', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.name]);
    let aview: DViewElement = new DViewElement('AttribDefaultView', DV.attributeView(), undefined, '', '', '', [DAttribute.name]);
    let rview: DViewElement = new DViewElement('RefDefaultView', DV.referenceView(), undefined, '', '', '', [DReference.name]);
    let oview: DViewElement = new DViewElement('OperationDefaultView', DV.attributeView(), undefined, '', '', '', [DOperation.name]);
    let literalDefaultView: DViewElement = new DViewElement('LiteralDefaultView', DV.literalView(), undefined, '', '', '', [DEnumLiteral.name]);

    pkgview.subViews = [cview.id]; // childrens can use this view too todo: this is temporary

    let defaultJsx = `<div className={"render-test"}></div>`;
    let defaultView: DViewElement = new DViewElement("DefaultView", defaultJsx, undefined, "",
        "", "", []);

    let alldefaultViews = [mview, pkgview, cview, eview, aview, rview, oview, literalDefaultView, defaultView];
    mview.subViews = [mview.id, ...alldefaultViews.slice(1).map(e => e.id)]// childrens can use this view too todo: this is temporary, should just be the sliced map of everything else.
    return alldefaultViews;
}

function makeEditView(): DViewElement{
    // let jsx = <p><h1>edit view of {this.data.name}</h1><Input className={'raw'} obj={this.view.id} field={((getPath as DViewElement).jsxString as any).$}/></p>;
    let jsxstring = '<p style={{display: "flex", flexFlow: "wrap"}}><h1>edit view of {this.data.name}</h1><Textarea obj={this.views[1].id} field={((getPath).jsxString).$}/></p>;';
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
