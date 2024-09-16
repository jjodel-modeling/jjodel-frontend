import React, {CSSProperties, PureComponent, ReactNode} from "react";
import type {
    DEdge,
    DGraph,
    DGraphElement,
    DModelElement,
    DViewElement,
    Json,
    LGraph,
    LGraphElement,
    LModelElement,
    LViewElement,
    Pointer, PrimitiveType
} from "../../../joiner";
import {Dictionary, LClass, LEdge, LUser, LViewPoint, LVoidVertex, RuntimeAccessible} from "../../../joiner";
import {GObject, InitialVertexSize, orArr} from "../../../joiner/types";

export class GraphElementStatee {/*
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode) {
        this.preRenderFunc = preRenderFunc;
        this.evalContext = evalContext;
        this.template = templatefunc;
    }
    preRenderFunc?: string;
    evalContext: Json;
    template: () => ReactNode;* /
    nodeid: Pointer<DGraphElement, 1, 1, LGraphElement>;
    constructor(nodeid: Pointer<DGraphElement, 1, 1, LGraphElement>) {
        this.nodeid = nodeid;
    }*/
    // displayPosition?: GraphSize; // used while dragging to prevent flood of redux events
    classes!: string[];
}


export class GraphElementReduxStateProps {
    // userexample?: UserState; // todo: make and repace with proxy wrapper "User", or make a "cached" global variable synchronized with redux state for easier access
    view!: LViewElement;
    views!: LViewElement[]; // all applicable views
    // graphID!: string;
    // dataid?: Pointer<DModelElement, 1, 1, LModelElement>;
    // model?: LModel;
    // [userMappedFromRedux: string]: any; // roba che l'utente ha dichiarato di voler prendere dallo stato e redux gli carica nelle props
    //preRenderFunc?: string;
    // evalContext!: Json; moved to transient properties
    //template!: string;
    node!: LGraphElement;
    data?: LModelElement;
    // usageDeclarations!: DefaultUsageDeclarations;
    // invalidUsageDeclarations?: Error; // moved in stateProps.usageDeclarations.__invalidUsageDeclarations
    // graph!: LGraph;

    // lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };// vertex only
    nodeid!: Pointer<DGraphElement>;
    dataid?: Pointer<DModelElement>;
    viewid!: Pointer<DViewElement>;
    viewsid!: Pointer<DViewElement>[];
    parentviewid?:Pointer<DViewElement>;

    static new(): GObject<GraphElementReduxStateProps>{
        let e: GObject<GraphElementReduxStateProps> = new GraphElementReduxStateProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){  }
}

export class GraphElementDispatchProps {
}

// generic props for every component that this component will need to extend joining user-specified values and component-specific built-in values
export class BasicReactOwnProps {
    children?: ReactNode; // orArr<JSX.Element | PrimitiveType>;
    style?: CSSProperties;
    class?: string | string[]; // my add as a fault-tolerant fix for users not used to jsx
    className?: string | string[];
    key?: string;

    static new(): GObject<BasicReactOwnProps>{
        let e: GObject<BasicReactOwnProps> = new BasicReactOwnProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ }
}

export class GraphElementOwnProps extends BasicReactOwnProps {
    data?: Pointer<DModelElement, 0, 1, LModelElement> | LModelElement;
    view?: Pointer<DViewElement, 1, 1, LViewElement> | LViewElement;
    views?: LViewElement[] | Pointer<DViewElement>[];
    isGraph?: boolean;
    isGraphVertex?: boolean;
    isVertex?: boolean;
    isEdgePoint?: boolean;
    isEdge?: boolean;
    isVoid?: boolean;
    isField?: boolean = true;
    onDelete?: (node: LGraphElement)=>boolean; // return false to prevent deletion

    initialSize?: InitialVertexSize;

    parentnodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    nodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    graphid?: Pointer<DGraph, 1, 1, LGraph>; // injected
    parentViewId?: Pointer<DViewElement, 1, 1, LViewElement>; // injected
    htmlindex?: number; // injected
    childStyle?: CSSProperties; // obsolete use css // injected, indicates some properties are styled from <Polygon or such, and must be transferred to the first child of root

    static new(): GObject<GraphElementOwnProps>{
        let e: GObject<GraphElementOwnProps> = new GraphElementOwnProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ super(); }
}

export class EdgeOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    start!: LGraphElement["id"];
    end!: LGraphElement["id"];
    label?: DEdge["longestLabel"];
    labels?: DEdge["labels"];
    anchorStart?: string;
    anchorEnd?: string;
    isField?: boolean = false;
    isEdge?: boolean = true;
    isReference?: boolean;
    isValue?: boolean; // if missing it is deduced from isReference.
    isExtend?: boolean;
    isDepencency?: boolean; // package dep

    static new(): GObject<EdgeOwnProps>{
        let e: GObject<EdgeOwnProps> = new EdgeOwnProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ super(); }
}

export class EdgeStateProps extends GraphElementReduxStateProps {
    node!: LEdge;
    edge!: LEdge; // just alias for node
    //lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint;
    start!: LGraphElement;
    end!: LGraphElement;
    static new(): GObject<EdgeStateProps>{
        let e: GObject<EdgeStateProps> = new EdgeStateProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ super(); }
    // key: string;
}

// @RuntimeAccessible
export class DefaultUsageDeclarations{
    // all can be deleted in usageDeclaration function except view.
    view?: GraphElementReduxStateProps["view"];
    node?: GraphElementReduxStateProps["node"];
    data: GraphElementOwnProps["data"];
    [key:string]: any;
    constructor(ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps) {
        /*this.data = ret.data;
        this.view = ret.view;
        this.node = ret.node;/*/
    }
}

// @RuntimeAccessible
export class EdgeDefaultUsageDeclarations extends DefaultUsageDeclarations{
    start!: EdgeOwnProps["start"];
    end!: EdgeOwnProps["end"];
}



export class VertexOwnProps extends GraphElementOwnProps {
    // onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    // onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isField?: boolean = false;
    isVertex?: boolean = true;

    decorated?: boolean; // for <decoratedStar /> (defaults true)
    sides?: number // for <Polygon />, <Star /> and <Cross />
    innerRadius?: number // for <Star /> and <Cross />
    ratio?: number // for <Trapezoid />
    rotate?: number // initial vertex rotation

    static new(): GObject<VertexOwnProps>{
        let e: GObject<VertexOwnProps> = new VertexOwnProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ super(); }
}

export class VertexStateProps extends GraphElementReduxStateProps {
    node!: LVoidVertex;
    // lastSelected!: LModelElement | null;
    // selected!: Dictionary<Pointer<DUser>, LModelElement|null>;
    //selected!: LGraphElement|null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint;

    static new(): GObject<VertexStateProps>{
        let e: GObject<VertexStateProps> = new VertexStateProps();
        for (let k in e) if (e[k] === undefined) delete e[k];
        return e;
    }
    protected constructor(){ super(); }
}


export let contextFixedKeys: Dictionary<string, boolean> = {};
setContextFixedKeys();

function setContextFixedKeys(){
    // @ts-ignore: here i must use the constructor instead of new to have the undefined properties included.
    let propmakers: GObject[] = [new EdgeOwnProps(), new EdgeStateProps(), new VertexOwnProps(), new VertexStateProps(), {
        // "model", "graph",
        "constants": true, "usageDeclarations": true,
        "component": true,
        "htmlindex": true,
        "state": true, "props": true, "stateProps": true, "ownProps": true,
        "otherViews": true, 'decorators':true, // only on final jsx, decorators are injected
        //"data":true, "node":true, "parentViewId":true, "parentnodeid":true,// from props:
        //"view":true, "views":true, "viewScores":true,// from props:
        //"children":true, "isGraph":true, "isVertex":true, isEdge:true, isEdgePoint:true, isVoid: true, "graphid":true, "nodeid":true,// from props:
    }];
    for (let props of propmakers) for (let k in props) contextFixedKeys[k] = true;
    delete contextFixedKeys.class;
    return contextFixedKeys;
}
