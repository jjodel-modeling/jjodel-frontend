import React, {Component, Dispatch, PureComponent, ReactElement, ReactNode,} from "react";
import {createPortal} from "react-dom";
import {connect} from "react-redux";
import './graphElement.scss';
import type {EdgeOwnProps} from "./sharedTypes/sharedTypes";
import {
    GraphSize,
    LGraph, MouseUpEvent, Point,
    Pointers,
    Selectors as Selectors_, Size, TRANSACTION, WGraph,
    GraphDragManager, GraphPoint, Selectors, GraphElementComponent
} from "../../joiner";
import {DefaultUsageDeclarations} from "./sharedTypes/sharedTypes";

import {EdgeStateProps, LGraphElement, store, VertexComponent,
    BEGIN,
    CreateElementAction, DClass, Debug,
    DEdge, DEnumerator,
    DGraph,
    DGraphElement,
    Dictionary, DModel,
    DModelElement, DObject,
    DocString, DPackage,
    DPointerTargetable,
    DState,
    DUser,
    DV,
    DViewElement,
    EMeasurableEvents, END,
    GObject,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    InOutParam,
    JSXT, Keystrokes,
    LClass,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    MyProxyHandler,
    Overlap,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    SetRootFieldAction,
    U,
    UX,
    windoww, transientProperties
} from "../../joiner";
import subViewsData from "../../components/rightbar/viewsEditor/data/SubViewsData";

// const Selectors: typeof Selectors_ = windoww.Selectors;

export class SubViewOwnProps {
    dataid?: Pointer<DModelElement>;
    nodeid!: Pointer<DGraphElement>;
    viewid!: Pointer<LViewElement>;
    context!: GObject;
    index!: number;
}
export class SubViewDispatchProps {}
export class SubViewReduxStateProps {
    // nothing, this is disconnected
}
export class SubViewStatee{

}

@RuntimeAccessible('SubViewComponent')
export class SubViewComponent<AllProps extends AllPropss = AllPropss, SubViewState extends SubViewStatee = SubViewStatee> extends GraphElementComponent<AllProps, SubViewState>{
    public static cname: string;
    static all: Dictionary<number, SubViewComponent> = {};
    public static map: Dictionary<Pointer<DGraphElement>, SubViewComponent> = {};
    static maxid: number = 0;
    id: number;

    public static defaultShouldComponentUpdate<AllProps extends GObject, State extends GObject, Context extends any>
    (instance: React.Component, nextProps: Readonly<AllProps>, nextState: Readonly<State>, nextContext: Context) {
        return (
            !U.shallowEqual(instance.props, nextProps) ||
            !U.shallowEqual(instance.state, nextState)
        );
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const ret: GraphElementDispatchProps = {} as any;
        return ret;
    }


    countRenders: number;
    _isMounted: boolean;
    lastViewChanges: {t: number, vid: Pointer<DViewElement>, v: LViewElement, key?: string}[];
    lastOnUpdateChanges: {t: number}[];
    stopUpdateEvents?: number; // undefined or view.clonedCounter;


    public shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<GraphElementState>, nextContext: any): boolean {
        return transientProperties.node[nextProps.nodeid].viewScores[vid].shouldUpdate; // computed by main component rendering the main view
        // return GraphElementComponent.defaultShouldComponentUpdate(this, nextProps, nextState, nextContext);
        // return super.shouldComponentUpdate({nodeid: nextProps.nodeid, usageDeclarations: this.newUsageDeclarations} as any, nextState, {usageDeclarations: this.oldUsageDeclarations, data: this.props.data});
    }




    constructor(props: AllProps, context: any) {
        super(props, context);
        this.lastViewChanges = [];
        this.lastOnUpdateChanges = []
        this.stopUpdateEvents = undefined;
        this._isMounted = false;
        this.countRenders = 0;
        this.id = SubViewComponent.maxid++;
        SubViewComponent.all[this.id] = this;
        SubViewComponent.map[props.nodeid as Pointer<DGraphElement>] = this;
        // @ts-ignore
        // this.state = {};
    }

    // constants: evalutate solo durante il primo render, può essere una funzione con effetti collaterali sul componente,
    // in tal caso la si esegue e si prende il valore di ritorno.
    // preRenderFunc: funzione evalutata ed eseguita sempre prima del render, ha senso solo per generare effetti collaterali sulle "costanti".
    // jsxString: funzione evalutata una sola volta durante il primo render ed eseguita ad ogni update dei dati.


    protected getContext(): GObject{
        let context: GObject = {component:this, __proto__:this.props.context};
        context._context = context;
        this.context = context;
        return context;
    }
    protected addToContext(context: GObject, newStuff: GObject): GObject{
        newStuff.__proto__ = context;
        return newStuff;
    }


/* todo:
    what should be here?
        usagedeclaration
        shouldcompoupdate
        prerenderfunc
        renderview || displayerror
        return
*/

    public render(nodeType:string = '', styleoverride:React.CSSProperties={}, classes: string[]=[]): ReactNode {
        let view: LViewElement = LPointerTargetable.fromPointer(this.props.view);
        let node: LViewElement = LPointerTargetable.fromPointer(this.props.node);
        let data: LViewElement | undefined = this.props.data && LPointerTargetable.fromPointer(this.props.data);

        // EMeasurableEvents.onDataUpdate -> handling and checking for loops
        if (!this.stopUpdateEvents || this.stopUpdateEvents !== view.clonedCounter) {
            this.stopUpdateEvents = undefined;
            if (data && (this.dataOldClonedCounter !== data.clonedCounter) && this.doMeasurableEvent(EMeasurableEvents.onDataUpdate)) {
                this.dataOldClonedCounter = data.clonedCounter;
                let thischange = {t: Date.now()};
                this.lastOnUpdateChanges.push(thischange);
                if (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 20]?.t < 200) {
                    // if N updates in <= 0.2 sec
                    this.stopUpdateEvents = view.clonedCounter;
                    Log.eDevv("loop in node.render() likely due to MeasurableEvent onDataUpdate. It has been disabled until the view changes.",{
                        change_log: this.lastOnUpdateChanges,
                        component: this,
                        timediff: (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 20]?.t)
                    } as any);
                }
            }
        }

        classes.push('DecorativeView');
        U.arrayMergeInPlace(classes, this.state.classes);
        if (Array.isArray(this.props.className)) { U.arrayMergeInPlace(classes, this.props.className); }
        else if (this.props.className) { classes.push(this.props.className); }
        if (Array.isArray(this.props.class)) { U.arrayMergeInPlace(classes, this.props.class); }
        else if (this.props.class) { classes.push(this.props.class); }
        /// end set classes


        invalidUsageDeclarations calculation was in mapstatetoprops i think?, but for decorative views needs to be moved here
        if (this.props.invalidUsageDeclarations) {
            return this.displayError(this.props.invalidUsageDeclarations, "Usage Declaration");
        }
        let sharedContext: GObject = this.getContext();
        add usageDeclarations to sharedContext
        let context = this.addToContext(usageDeclarationsContext);
        todo: make it in array sorting phase in stack view, that primary view is always first regardless of score, and other views are mandatory decorative views.


        let mainViewElement: ReactNode | ReactElement = this.renderView(this.props, view, context, nodeType, classes, styleoverride,[]);// decoratorViews);
        console.log('rendering subview stack', {view, mainViewElement})
        return mainViewElement;
    }



}

// private
// type AllPropss = GraphElementOwnProps & GraphElementDispatchProps & GraphElementReduxStateProps;
type AllPropss = Overlap<Overlap<SubViewOwnProps, SubViewDispatchProps>, SubViewReduxStateProps>;

const SubViewConnected = SubViewComponent;
export const SubView = SubViewComponent;

/*
const SubViewConnected = connect<SubViewReduxStateProps, SubViewDispatchProps, SubViewOwnProps, DState>(
    SubViewComponent.mapStateToProps,
    SubViewComponent.mapDispatchToProps
)(SubViewComponent as any);

export const SubView = (props: GraphElementOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <SubViewConnected {...{...props, children}} />; }*/
// console.info('graphElement loaded');


SubViewComponent.cname = "SubViewComponent";
SubViewConnected.cname = "SubViewConnected";
SubView.cname = "SubView";
