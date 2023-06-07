import React, {CSSProperties, ReactNode} from "react";
import type {
    DGraph,
    DGraphElement,
    DModelElement,
    DViewElement,
    Json,
    LGraph,
    LGraphElement,
    LModelElement,
    LViewElement,
    Pointer
} from "../../../joiner";
import {LClass, LUser} from "../../../joiner";

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
    data?: LModelElement;
    dataid?: Pointer<DModelElement, 1, 1, LModelElement>;
    // model?: LModel;
    // [userMappedFromRedux: string]: any; // roba che l'utente ha dichiarato di voler prendere dallo stato e redux gli carica nelle props
    preRenderFunc?: string;
    evalContext!: Json;
    template!: () => ReactNode;
    node!: LGraphElement;
    graph!: LGraph;

    lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };// vertex only
}

export class GraphElementDispatchProps {
}

export class GraphElementOwnProps {
    data?: Pointer<DModelElement, 0, 1, LModelElement>;
    view?:Pointer<DViewElement, 1, 1, LViewElement>; // | LViewElement
    // generic props for every component that this component will need to extend joining user-specified values and component-specific built-in values
    children?: any;
    style?: CSSProperties;
    'class'?: string | string[];
    'className'?: string | string[];
    key?: string;
    parentnodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    nodeid?: Pointer<DGraphElement, 1, 1, LGraphElement>; // Injected
    graphid?: Pointer<DGraph, 1, 1, LGraph>; // injected
    parentViewId?: Pointer<DViewElement, 1, 1, LViewElement>// injected
}
