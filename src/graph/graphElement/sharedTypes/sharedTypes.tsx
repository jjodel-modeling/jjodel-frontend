import {DModelElement, GObject, Json, LModel, LModelElement, Pointer, UserState, ViewElement} from "../../../joiner";
import React, {CSSProperties, ReactNode} from "react";

export class GraphElementStatee {/*
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode) {
        this.preRenderFunc = preRenderFunc;
        this.evalContext = evalContext;
        this.template = templatefunc;
    }
    preRenderFunc?: string;
    evalContext: Json;
    template: () => ReactNode;*/
}

export class GraphElementReduxStateProps {
    // userexample?: UserState; // todo: make and repace with proxy wrapper "User", or make a "cached" global variable synchronized with redux state for easier access
    view!: ViewElement;
    graphID!: string;
    data!: LModelElement;
    // model?: LModel;
    // [userMappedFromRedux: string]: any; // roba che l'utente ha dichiarato di voler prendere dallo stato e redux gli carica nelle props
    preRenderFunc?: string;
    evalContext!: Json;
    template!: () => ReactNode;
}

export class GraphElementDispatchProps {
}

export class GraphElementOwnProps {
    data!: LModelElement | Pointer<DModelElement>;
    view!: ViewElement;

    // generic props for every component that this component will need to extend joining user-specified values and component-specific built-in values
    style?: CSSProperties;
    'class'?: string | string[];
    'className'?: string | string[];
    key?: string
}
