import type {
    DClassifier,
    DEdgePoint,
    DExtEdge,
    DGraphElement,
    DLog,
    DModelElement,
    DParameter,
    DRefEdge, GObject,
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
    DGraphVertex,
    DVertex,
    Pointer,
    LViewPoint,
} from '../joiner';
import {
    CreateElementAction,
    DAttribute,
    DClass,
    DModel,
    DEnumerator,
    DEnumLiteral,
    DGraph,
    DObject,
    DOperation,
    DPackage,
    DPointerTargetable,
    DReference,
    DUser,
    DValue,
    DViewElement,
    getPath,
    LModel,
    LObject,
    LUser,
    LValue, LViewElement, DViewPoint,
    RuntimeAccessible, SetFieldAction,
    SetRootFieldAction, ShortAttribETypes, Selectors, GraphSize, EdgeBendingMode, DVoidEdge,
} from "../joiner";

import React from "react";
import {DV} from "../common/DV";
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

// export const statehistory_obsoleteidea: {past: IStore[], current: IStore, future: IStore[]} = { past:[], current: null, future:[] } as any;
export const statehistory: {
        [userpointer:Pointer<DUser>]: {undoable:GObject<"delta">[], redoable: GObject<"delta">[]}
} & {
    globalcanundostate: boolean // set to true at first user click }
} = { globalcanundostate: false} as any;
statehistory[DUser.current] = {undoable:[], redoable:[]}; // todo: make it able to combine last 2 changes with a keystroke. reapeat N times to combine N actions. let it "redo" multiple times, it's like recording a macro.

(window as any).statehistory = statehistory;
export class IStore {
    debug: boolean = true;
    logs: Pointer<DLog, 0, 'N', LLog> = [];
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    currentUser: DUser;

    viewelements: Pointer<DViewElement, 0, 'N', LViewElement> = [];
    stackViews: Pointer<DViewElement, 0, 'N', LViewElement> = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    // collaborators: UserState[];
    idlookup: Record<Pointer<DPointerTargetable, 1, 1>, DPointerTargetable> = {};

    //// DClass section to fill
    graphs: Pointer<DGraph, 0, 'N', LGraph> = [];
    voidvertexs: Pointer<DGraphVertex, 0, 'N', LGraphVertex> = [];
    vertexs: Pointer<DVertex, 0, 'N', LVertex> = [];
    graphvertexs: Pointer<DGraphVertex, 0, 'N', LGraphVertex> = [];

    edgepoints: Pointer<DEdgePoint, 0, 'N', LEdgePoint> = [];
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
    returnTypes: Pointer<DClass, 0, "N", LClass> = [];
    /// DClass section end

    isEdgePending: { user: Pointer<DUser, 1, 1, LUser>, source: Pointer<DClass, 1, 1, LClass> } = {
        user: '',
        source: ''
    };

    contextMenu: { display: boolean, x: number, y: number } = {display: false, x: 0, y: 0};

    //dragging: {random: number, id: string} = { random: 0, id: "" }; fix
    edges: EdgeOptions[] = [];  // delete

    deleted: string[] = [];

    objects: Pointer<DObject, 0, 'N', LObject> = [];
    values: Pointer<DValue, 0, 'N', LValue> = [];

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };
    users: Pointer<DUser, 1, 'N', LUser>;
    _edgeSettings = {strokeWidth: 1, color: '#000000', zIndex: 150, path: 'smooth'}
    _edgesDisplayed = {extend: true, referenceM2: true, referenceM1: true}

    viewpoint: Pointer<DViewPoint, 1, 1, LViewPoint> = '';
    viewpoints: Pointer<DViewPoint, 0, 'N', LViewPoint> = [];

    m2models: Pointer<DModel, 0, 'N', LModel> = [];
    m1models: Pointer<DModel, 0, 'N', LModel> = [];

    room: string = '';


    constructor() {
        // todo: this must become a pointer to idlookup and fire a CreateNewElementAction
        this.currentUser = DUser.new(undefined, false);
        this.users = [this.currentUser.id];
        this.models = [];
    }

    static fakeinit(store?: IStore): void {
        // const graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
        // for (let graphDefaultView of graphDefaultViews) { CreateElementAction.new(graphDefaultView); }

        const viewpoint = DViewPoint.new('Default', '');
        viewpoint.id = 'Pointer_DefaultViewPoint';
        CreateElementAction.new(viewpoint);
        SetRootFieldAction.new('viewpoint', viewpoint.id, '', true);

        const views: DViewElement[] = makeDefaultGraphViews();
        for (let view of views) {
            view.id = 'Pointer_View' + view.name;
            view.viewpoint = 'Pointer_DefaultViewPoint';
            CreateElementAction.new(view);
        }

        for (let primitiveType of Object.values(ShortAttribETypes)) {
            let dPrimitiveType;
            if (primitiveType === ShortAttribETypes.void) continue; // or make void too without primitiveType = true, but with returnType = true?
            else {
                dPrimitiveType = DClass.new(primitiveType, false, false, true, false, '', undefined, false);
                dPrimitiveType.id = 'Pointer_' + dPrimitiveType.name.toUpperCase();
                CreateElementAction.new(dPrimitiveType);
            }
            SetRootFieldAction.new('primitiveTypes', dPrimitiveType.id, '+=', true);
        }

        /*
        const returnTypes = ["void", "undefined", "null"]; // rimosso undefined dovrebbe essere come void (in ShortAttribEtypes, null è ritornato solo dalle funzioni che normalmente ritornano qualche DObject, quindi tipizzato con quel DObject
        for (let returnType of returnTypes) {
            const dReturnType = DClass.new(returnType);
            CreateElementAction.new(dReturnType);
            SetRootFieldAction.new("returnTypes", dReturnType.id, '+=', true);
        }
        */

    }
}

function makeDefaultGraphViews(): DViewElement[] {

    let modelView: DViewElement = DViewElement.new('Model', DV.modelView(), undefined, '', '', '', [DModel.name]);
    // modelView.draggable = false; modelView.resizable = false; already guaranteed by <Graph />

    let packageView: DViewElement = DViewElement.new('Package', DV.packageView(), undefined, '', '', '', [DPackage.name]);
    packageView.defaultVSize = new GraphSize(0, 0, 500, 500);

    let classView: DViewElement = DViewElement.new('Class', DV.classView(), undefined, '', '', '', [DClass.name]);
    classView.adaptWidth = true;
    classView.adaptHeight = true;

    let enumView: DViewElement = DViewElement.new('Enum', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.name]);
    enumView.adaptWidth = true;
    enumView.adaptHeight = true;

    let attributeView: DViewElement = DViewElement.new('Attribute', DV.attributeView(), undefined, '', '', '', [DAttribute.name]);

    let referenceView: DViewElement = DViewElement.new('Reference', DV.referenceView(), undefined, '', '', '', [DReference.name]);

    let operationView: DViewElement = DViewElement.new('Operation', DV.operationView(), undefined, '', '', '', [DOperation.name]);

    let literalView: DViewElement = DViewElement.new('Literal', DV.literalView(), undefined, '', '', '', [DEnumLiteral.name]);

    let objectView: DViewElement = DViewElement.new('Object', DV.objectView(), undefined, '', '', '', [DObject.name]);
    objectView.adaptWidth = true;
    objectView.adaptHeight = true;
    let voidView: DViewElement = DViewElement.new('Void', DV.voidView(), undefined, '', '', '', [DObject.name]);
    voidView.appliableToClasses=["VoidVertex"];
    voidView.explicitApplicationPriority=2;
    voidView.adaptWidth = true;
    voidView.adaptHeight = true;

    let edgePointView: DViewElement = DViewElement.new('EdgePoint', DV.edgePointView(), new GraphSize(0, 0, 30, 30), '', '', '', []);
    let edgePointViewSVG: DViewElement = DViewElement.new('EdgePointSVG', DV.edgePointViewSVG(), new GraphSize(0, 0, 10, 10), '', '', '', []);
    let edgeView: DViewElement = DViewElement.new('Edge', DV.edgeView(), undefined, '', '', '', [DVoidEdge.name]);
    // edgeView.forceNodeType="Edge"
    edgeView.explicitApplicationPriority=2;
    edgeView.bendingMode = EdgeBendingMode.Line;
    edgeView.subViews = [edgePointView.id];
    // nb: Error is not a view, just jsx. transform it in a view so users can edit it

    let valueView: DViewElement = DViewElement.new('Value', DV.valueView(), undefined, '', '', '', [DValue.name]);

    const defaultPackage: DViewElement = DViewElement.new('Default Package', DV.defaultPackage());
    defaultPackage.query = `context DPackage inv: self.name = 'default'`;

    return [modelView, packageView, classView, enumView, attributeView, referenceView, operationView, literalView, objectView, valueView, defaultPackage, voidView, edgeView, edgePointView, edgePointViewSVG];
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
// console.info('ts loaded store');
