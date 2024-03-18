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
import {LClass, LEdge, LUser, LViewPoint, RuntimeAccessible} from "../../../joiner";
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
    parentviewid?:Pointer<DViewElement>
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
}

export class GraphElementOwnProps extends BasicReactOwnProps {
    data?: Pointer<DModelElement, 0, 1, LModelElement> | LModelElement;
    view?: Pointer<DViewElement, 1, 1, LViewElement> | LViewElement;
    views?: LViewElement[] | Pointer<DViewElement>[];

    initialSize?: InitialVertexSize;

    parentnodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    nodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    graphid?: Pointer<DGraph, 1, 1, LGraph>; // injected
    parentViewId?: Pointer<DViewElement, 1, 1, LViewElement>; // injected
    htmlindex?: number; // injected
    childStyle?: CSSProperties; // obsolete use css // injected, indicates some properties are styled from <Polygon or such, and must be transferred to the first child of root
}

export class EdgeOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isgraph?: boolean = false;
    isvertex?: boolean = true;
    start!: LGraphElement["id"];
    end!: LGraphElement["id"];
    label?: DEdge["longestLabel"];
    labels?: DEdge["labels"];
}

export class EdgeStateProps extends GraphElementReduxStateProps {
    node!: LEdge;
    edge!: LEdge; // just alias for node
    //lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint;
    start!: LGraphElement;
    end!: LGraphElement;
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
