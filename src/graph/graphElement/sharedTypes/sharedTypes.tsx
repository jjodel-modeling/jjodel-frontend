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
    evalContext!: Json;
    //template!: string;
    node!: LGraphElement;
    data?: LModelElement;
    usageDeclarations!: DefaultUsageDeclarations;
    // graph!: LGraph;

    // lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };// vertex only
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
    view?: Pointer<DViewElement, 1, 1, LViewElement> | LViewElement
    initialSize?: InitialVertexSize;

    parentnodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    nodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    graphid?: Pointer<DGraph, 1, 1, LGraph>; // injected
    parentViewId?: Pointer<DViewElement, 1, 1, LViewElement>; // injected
    htmlindex?: number; // injected
}

export class EdgeOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isGraph?: boolean = false;
    isVertex?: boolean = true;
    start!: LGraphElement["id"];
    end!: LGraphElement["id"];
    label?: string;
    // label?: DEdge["longestLabel"]; they were initial values to be stored in node, initialized in jsx. but i moved them to view
    // labels?: DEdge["labels"];
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
