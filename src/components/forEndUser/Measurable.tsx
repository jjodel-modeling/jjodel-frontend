import React, {Component, CSSProperties, PureComponent, ReactChild, ReactElement, ReactNode} from "react";
import {GObject, Log, TRANSACTION, U} from "../../joiner";
import $ from "jquery";

// private
interface ThisState {
}

export class MeasurableComponent extends Component<AllProps, ThisState>{
    static cname: string = "MeasurableComponent";


    private html: Element | null = null;
    private $html!:  JQuery<Element>;
    dragOptionsChanged: boolean = true;
    resizeOptionsChanged: boolean = true;
    rotateOptionsChanged: boolean = true;
    defaultOptions: {"draggable": JQueryUI.DraggableOptions, resizable: JQueryUI.ResizableOptions, rotatable: GObject} = {
        draggable: {
            cursor: 'grabbing',
            // containment: 'parent',
            distance: 5,
            // helper: 'clone', // 'original' or 'csselector'? or func=>html
            // disabled: !(view.draggable),}
        },
        resizable: {},
        rotatable: {},
    }

    componentDidMount() {
        this.afterUpdate();
    }
    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<ThisState>, snapshot?: any) {
        this.afterUpdate();
    }
    afterUpdate(): void{
        if (!this.html) return;
        this.$html = $(this.html);
        if (this.dragOptionsChanged) { this.afterUpdateSingle("draggable"); }
        if (this.resizeOptionsChanged) { this.afterUpdateSingle("resizable"); }
        if (this.rotateOptionsChanged) { this.afterUpdateSingle("rotatable"); }
    }

    afterUpdateSingle(type: "draggable" | "resizable" | "rotatable"): void{
        if (!this.$html) return;
        let $measurable = this.$html;

        // todo: changing options at runtime works, but changing children does not update


        let eventmap = {
            's':    {'draggable': 'onDragStart',    'rotatable': 'onRotateStart',   'resizable': 'onResizeStart'},
            'ing':  {'draggable': 'whileDragging',  'rotatable': 'whileRotating',   'resizable': 'whileResizing'},
            'e':    {'draggable': 'onDragEnd',      'rotatable': 'onRotateEnd',     'resizable': 'onResizeEnd'  },
        }
        let jqui_ing: string;
        switch (type){
            default: jqui_ing = Log.eDevv("unexpected measurable event: " + type); return;
            case "draggable": jqui_ing = 'drag'; break;
            case "resizable": jqui_ing = 'resize'; break;
            case "rotatable": jqui_ing = 'rotate'; break;
        }
        /*
        defaultoptions.start = (event: GObject, obj: GObject) => {
            TRANSACTION(()=>{
                //for (let vid of allviews) this.doMeasurableEvent((EMeasurableEvents as any)[eventmap.s[type]], vid);
            })
        }
        defaultoptions[jqui_ing] = (event: GObject, obj: GObject) => {
            TRANSACTION(()=>{
                //for (let vid of allviews) this.doMeasurableEvent((EMeasurableEvents as any)[eventmap.s[type]], vid);
            })
        };
        defaultoptions.stop = (event: GObject, obj: GObject) => {
            TRANSACTION(()=>{
                //for (let vid of allviews) this.doMeasurableEvent((EMeasurableEvents as any)[eventmap.s[type]], vid);
            })
        }*/
        let options: GObject;
        const props: GObject = this.props;
        const datamap = {draggable: "uiDraggable", resizable: "uiResizable", rotatable: "uiRotatable"};
        const optionmap = {draggable: "draggable", resizable: "resizable", rotatable: "rotatable"};
        const optionkey = optionmap[type];
        if (props[optionkey] === false || !props[optionkey]) {
            console.log("measurable off", {$measurable, type, datamap});
            if ($measurable.data(datamap[type])) ($measurable as GObject)[type]('disable');
            return;
        }
        if (props[optionkey] === true) {
            options = {};
        } else options = {...props[optionkey]};

        //let jodelevent = {'s': eventmap.s[type], 'ing': eventmap.ing[type], 'e': eventmap.e[type]};
        let jquievent = {'s': 'start', 'ing': jqui_ing, 'e':'stop'};
        let evtkey: keyof typeof jquievent;
        for (evtkey in jquievent) {
            let jqkey = jquievent[evtkey] || '';
            let propsevent = props[eventmap[evtkey][type]];
            if (!propsevent) continue;
            if (typeof propsevent !== "function") {
                Log.ee("<Measurable /> " + eventmap[evtkey][type] + " props must be a function");
                continue;
            }
            options[jqkey+"_debug"] = propsevent;
            options[jqkey] = (...params: any)=> { propsevent(...params) };
        }
        let propsOptions = {...options};
        let defaultOptions = this.defaultOptions[type];
        U.objectMergeInPlace(options, defaultOptions);
        console.log("measurable", {type, $measurable, options, propsOptions, defaultOptions});
        ($measurable as GObject)[type](options);
    }
    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<ThisState>, nextContext: any): boolean {
        console.log("measurable shouldup", {nc:nextProps.children, tc:this.props.children, eq: nextProps.children == this.props.children});
        // todo: would need to check if pros.children has changed, but that requires a deep search of subcomponents props and state.
        // currently with just return true it works and rerenders every time the parent component rerenders. not when other elements are interacted.
        // it works also with <Input> as direct child and it updates.
        if (window) return true;
        const oldProps = this.props || {};
        this.dragOptionsChanged = false;
        this.resizeOptionsChanged = false;
        this.rotateOptionsChanged = false;
        let ret: boolean = false;
        const nestederr = "Options cannot contain functions or nested objects";
        if (!U.isShallowEqualWithProxies(oldProps.draggable, nextProps.draggable)) {
            const opt: GObject = oldProps.draggable as any;
            if (opt && typeof opt === "object") for(let k in opt){ switch (typeof opt[k]){ case "function": case "object": Log.ee("drag" + nestederr, k); } }
            this.dragOptionsChanged = true;
            ret = true;
        }
        if (!U.isShallowEqualWithProxies(oldProps.resizable, nextProps.resizable)) {
            const opt: GObject = oldProps.resizable as any;
            if (opt && typeof opt === "object") for(let k in opt){ switch (typeof opt[k]){ case "function": case "object": Log.ee("resize" + nestederr, k); } }
            this.resizeOptionsChanged = true;
            ret = true;
        }
        if (!U.isShallowEqualWithProxies(oldProps.rotatable, nextProps.rotatable)) {
            const opt: GObject = oldProps.rotatable as any;
            if (opt && typeof opt === "object") for(let k in opt){ switch (typeof opt[k]){ case "function": case "object": Log.ee("rotate" + nestederr, k); } }
            this.rotateOptionsChanged = true;
            return true;
        }
        if (ret) return true; // i don't need to set more this.variable stuff and i already determined something changed.
        if (Object.keys(oldProps).length !== Object.keys(nextProps).length) return true;
        let k: keyof typeof nextProps;
        for (k in oldProps){
            switch(k){
                //case "axis": if (ok)
                case "draggable": case "resizable": case "rotatable": continue;
                case "children": continue;
            }
            if (!(k in nextProps)) return false;
            let ok = oldProps[k];
            let nk = nextProps[k];
            if (ok === nk) continue;
            let tk = typeof ok;
            if (tk !== typeof nk) return false;
            switch (tk) {
                case "object": Log.ee("unexpected object in <Measurable/> props", {k, nk, ok}); return true;
                case "function": if (ok!.toString() !== nk!.toString()) return true; break;
                default: return false; // already checked they are !==
            }
        }
        return false;
    }

    render(): ReactNode {
        let child: ReactElement = this.props.children as any;
        console.log("measurable render", child);
        if (!child) return child;
        if (Array.isArray(child)) {
            if (child.length !== 1) {
                Log.ee("Measurable can have only 1 subelement and it cannot be an array or a <>React.fragment</>");
                return child;
            }
            else child = child[0];
        }
        if (child.type.toString() === React.Fragment.toString()) {
            Log.ee("Measurable can have only 1 subelement and it cannot be an array or a <>React.fragment</>");
            return child; }

        let oldProps = child.props;
        let newProps = {
            ref: (html: Element | null)=>{ this.html = html; }
        };
        U.objectMergeInPlace(newProps, oldProps);
        let clonedChild = React.cloneElement(child, newProps);
        return clonedChild;
    }
}

type EventHandler = ()=>void;
type Options = GObject;
// private
interface OwnProps {
    children: ReactChild[] | ReactChild;

    //dragOptions?: Options;
    //drag?: Options;
    draggable?: JQueryUI.DraggableOptions | boolean;
    onDragStart?: EventHandler;
    whileDragging?: EventHandler;
    onDragEnd?: EventHandler;

    //resizeOptions?: Options;
    //resize?: Options;
    resizable?: JQueryUI.ResizableOptions | boolean;
    onResizeStart?: EventHandler;
    whileResizing?: EventHandler;
    onResizeEnd?: EventHandler;

    //rotateOptions?: Options;
    //rotate?: Options;
    rotatable?: GObject | boolean;
    onRotationStart?: EventHandler;
    whileRotating?: EventHandler;
    onRotationEnd?: EventHandler;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func
/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }
*/

(MeasurableComponent as any).defaultProps = {
    autosizex: true,
    autosizey: true,
    style: undefined,
    children: [],
} as OwnProps;

export function Measurable(props: AllProps, children: ReactChild[] = []): ReactElement {
    return <MeasurableComponent {...{...props, children}}>{children}</MeasurableComponent>;
}

/*connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MeasurableComponent);*/
