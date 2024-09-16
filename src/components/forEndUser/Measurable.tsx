import React, {Component, CSSProperties, PureComponent, ReactChild, ReactElement, ReactNode} from "react";
import {DGraphElement, Dictionary, GObject, GraphSize, LGraph, Log, RuntimeAccessible, Size, TRANSACTION, U} from "../../joiner";
import $ from "jquery";
/// <reference path="../../common/libraries/jqui-types.ts" />
import {JQueryUI} from "../../common/libraries/jqui-types"
import "./Measurable.scss";

type ResizableEvent = JQueryUI.ResizableEvent;
type DraggableEvent = JQueryUI.DraggableEvent;
type RotatableEvent = JQueryUI.RotatableEvent;
type DraggableOptions = JQueryUI.DraggableOptions;
type ResizableOptions = JQueryUI.ResizableOptions;
type RotatabeOptions = JQueryUI.RotatableOptions;
// private
interface MeasurableState {
}
interface ScrollState {
}

type EventLetter = 's'|'ing'|'e';
type MeasurableUIEvent = ResizableEvent | DraggableEvent | RotatableEvent;

@RuntimeAccessible('MeasurableComponent')
export class MeasurableComponent extends Component<MeasurableAllProps, MeasurableState>{
    static cname: string = "MeasurableComponent";
    static childmodekeys: (keyof CSSStyleDeclaration)[] = ['left', 'top', 'transform', 'position'];


    private html: Element | null = null;
    private $html!:  JQuery<Element>;
    dragOptionsChanged: boolean = true;
    resizeOptionsChanged: boolean = true;
    rotateOptionsChanged: boolean = true;
    defaultOptions: {"draggable": JQueryUI.DraggableOptions, resizable: JQueryUI.ResizableOptions, rotatable: GObject} = {
        draggable: {
            cancel: '.no-drag,[contenteditable="true"],input,textarea,button,select,option',
            cursor: 'grabbing',
            // containment: 'parent',
            distance: 5,
            // helper: 'clone', // 'original' or 'csselector'? or func=>html
            // disabled: !(view.draggable),}
        },
        resizable: {},
        rotatable: {},
    }
    oldPos: Dictionary<string, number> = {left: undefined, top: undefined} as any;

    componentDidMount() {
        this.afterUpdate();
    }
    componentDidUpdate(prevProps: Readonly<MeasurableAllProps>, prevState: Readonly<MeasurableState>, snapshot?: any) {
        this.afterUpdate();
    }

    afterUpdate(): void{
        if (!this.html) return;
        this.$html = $(this.html);
        if (this.dragOptionsChanged) { this.afterUpdateSingle("draggable"); }
        if (this.resizeOptionsChanged) { this.afterUpdateSingle("resizable"); }
        if (this.rotateOptionsChanged) { this.afterUpdateSingle("rotatable"); }
    }
    /*
        afterUpdateSingle(type: "draggable" | "resizable" | "rotatable"): void{
            if (this.props.draggable) this.afterUpdateDraggable
        }/*
        afterUpdateDraggable_old(): void{
            nope, erase this and just make the previous _old genericversion with inner dynamic functions called 9 times like event('drag', 'while'); event('drag', 'end'); event('resize', 'while');...
            make and extract new functions from code so that it dinamically build the jqui options object
            if (!this.$html) return;
            let $measurable = this.$html;
            let jqui_options = this.props.draggable;
            let jqui_start = jqui_options === 'object' ? jqui_options.start : undefined;
            let jqui_end = jqui_options === 'object' ? jqui_options.stop : undefined;
            let jqui_ing = jqui_options === 'object' ? jqui_options.drag : undefined;
            let props_start = this.props.onDragStart;
            let props_end = this.props.onDragEnd;
            let props_ing = this.props.whileDragging;
            let type = 'draggable';


            //let positionMap = new WeakMap<HTMLElement, {left: number; top: number}>();
            let childmode_drag = (e: HTMLElement, evt?: any, evtkind?: EventLetter, ui?:any): void => {
                let oc = this.props.onChildren;
                if (!oc) {
                    Log.ee('not oc', {evt, oc, e, p: this.props}); return;
                }
                let child: HTMLElement;
                if (typeof oc === 'function') child = oc(e);
                else child = e.children[0] as HTMLElement;
                if (!child) {
                    Log.ee('child not found', {child, evt, oc, e}); return;
                }
                let oldpos = this.oldPos; // positionMap.get(e);
                console.log('measurable default event child ' + evtkind, {ui, e, oc, oldpos});
                //if (evtkind === 'e') { positionMap.set(e, ui.position); }

                /*if (evtkind === 's') {
                    ui.originalPosition.left = 300;
                    ui.offset.left = 300;
                    ui.position.left = 300;
                    console.log('measurable sstart ', {type, e, oc, ui, el: e.style.left, cl: child.style.left});
                }* /

                let key: any;
                for (key of childmodekeys) {
                    let fixpos = () => {
                        if (oldpos && (oldpos as any)[key] !== undefined) {
                            if (key ==='left') console.log('measurable fixpos ' + evtkind, (oldpos as any)[key] + ui.position[key] + 'px', (oldpos as any)[key]);
                            let newpos = (oldpos as any)[key] + ui.position[key];
                            child.style[key] = (newpos) + 'px';
                            if (evtkind === 'e') this.oldPos[key] = newpos;
                        }
                        else child.style[key] = e.style[key];
                    }
                    fixpos();
                    if (evtkind === 'e')  setTimeout(fixpos, 1000);
                    if (evtkind === 's' && !e.classList.contains('draggable-child-mode')) e.classList.add('draggable-child-mode');
                    // delete e.style[key]
                }
            }

            let translateeevents: Dictionary<string, Dictionary<string, DraggableEvent>> = {
                'draggable': {
                    's': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 's'); },
                    'ing': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 'ing'); },
                    'e': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 'e'); }},
            };
            let defaulteevent = (evtkind: EventLetter): MeasurableUIEvent | null =>{
                if (!this.props.transformMode && !this.props.onChildren) return null;
                return (e: any, ui: any) => {
                    //console.log('measurable default event', {type, evtkind, translateeevents, e, t: e.target});
                    if (this.props.transformMode === true) translateeevents[type][evtkind](e, ui);
                    childmode_drag(e.target, e, evtkind, ui);
                }
            };

            if (props[optionkey] === false || !props[optionkey]) {
                console.log("measurable off " + type, {$measurable, type, datamap, optionkey, props});
                if ($measurable.data(datamap[type])) ($measurable as GObject)[type]('disable');
                return;
            }
            if (props[optionkey] === true) {
                options = {};
            } else options = {...props[optionkey]};

            if (props_start && typeof props_start !== "function") { return Log.ee("<Measurable /> onDragStart props must be a function"); }
            if (props_end && typeof props_end !== "function") { return Log.ee("<Measurable /> onDragEnd props must be a function"); }
            if (props_ing && typeof props_ing !== "function") { return Log.ee("<Measurable /> whileDragging props must be a function"); }
            if (!jqui_start && !props_start && ! default_start) delete options.start,
                else options.start = (evt, ui) => { default_start?.(evt, ui); jqui_start?.(evt, ui); props_start?.(thiss.getCoords(evt, ui), evt, ui); }

            let propsOptions = {...options};
            let defaultOptions = this.defaultOptions[type];
            U.objectMergeInPlace(options, defaultOptions);
            //console.log("measurable", {type, $measurable, options, propsOptions, defaultOptions});
            ($measurable as GObject)[type](options);
        }*/

    absoluteToTransform(e: HTMLElement, evt?: any, evtkind?: EventLetter): any {
        let x = e.style.left;
        let y = e.style.top;
        /*
            e.style.left = '0px';
            e.style.top = '0px';*/
        //e.style.position = 'unset';
        e.style.transform = `translate(${x}, ${y})`;
    }
    childmode(e: HTMLElement, evt?: any, evtkind?: EventLetter, ui?:any): void{
        let oc = this.props.onChildren;
        if (!oc) {
            Log.ee('not oc', {evt, oc, e, p: this.props}); return;
        }
        let child: HTMLElement;
        console.log('cchild', {e, evt,  evtkind, ui});
        if (typeof oc === 'function') child = oc(e);
        else child = e.children[0] as HTMLElement;
        if (!child) {
            Log.ee('child not found', {child, evt, oc, e}); return;
        }
        console.log('measurable default event child ' + evtkind, {ui, e, oc, oldpos: this.oldPos});
        //if (evtkind === 'e') { positionMap.set(e, ui.position); }

        /*if (evtkind === 's') {
            ui.originalPosition.left = 300;
            ui.offset.left = 300;
            ui.position.left = 300;
            console.log('measurable sstart ', {type, e, oc, ui, el: e.style.left, cl: child.style.left});
        }*/

        let key: any;
        for (key of MeasurableComponent.childmodekeys) {
            let fixpos = () => {
                let oldpos = this.oldPos; // positionMap.get(e); {x:-1000, y:-3000};//
                if (oldpos && (oldpos as any)[key] !== undefined) {
                    let newpos = (oldpos as any)[key] + ui.position[key];
                    if (key ==='left') console.log('measurable fixpos ' + newpos + 'px', (oldpos as any)[key], {oldpos, uipos:ui.position, newpos});
                    child.style[key] = (newpos) + 'px';
                    if (evtkind === 'e') this.oldPos[key] = newpos;
                }
                else child.style[key] = e.style[key];
            }
            if (evtkind === 'e') setTimeout(fixpos, 1000);
            if (evtkind === 's') {
                let graph = this.props.isPanning;
                if (this.oldPos.left === undefined && graph) {
                    console.log('measurable fixposss ',{oldpos:{...this.oldPos}});
                    this.oldPos.left = ui.position.left = graph.offset.x;
                    this.oldPos.top = ui.position.top = graph.offset.y;
                }
                if (!e.classList.contains('draggable-child-mode')) e.classList.add('draggable-child-mode');
            }
            fixpos();
            // delete e.style[key]
        }
    }
    getDefaultEvent(type: "draggable" | "resizable" | "rotatable", evtkind: EventLetter): MeasurableUIEvent | null {
        if (!this.props.transformMode && !(this.props.onChildren && type === 'draggable')) return null;
        switch (type) {
            case 'draggable': if (!this.props.transformMode && !this.props.onChildren) return null; break
            case 'resizable': break
            case 'rotatable': break
        }

        let translateeevents: Dictionary<string, Dictionary<string, DraggableEvent>> = {
            'draggable': {
                's': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 's'); },
                'ing': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 'ing'); },
                'e': (e, ui)=>{ this.absoluteToTransform(e.target as HTMLElement, e, 'e'); }},
            /*'resizable': {
                's': (e, ui)=>{ },
                'ing': (e, ui)=>{ },
                'e': (e, ui)=>{ }},
            'rotatable': {
                's': (e, ui)=>{ },
                'ing': (e, ui)=>{ },
                'e': (e, ui)=>{ }},*/
        };
        return (e: any, ui: any) => {
            console.log('measurable default event', {type, evtkind, translateeevents, e, t: e.target});
            if (this.props.transformMode === true) translateeevents[type]?.[evtkind]?.(e, ui);
            this.childmode(e.target, e, evtkind, ui);
        }
    }
    makeEvent(options: GObject<DraggableOptions>, type: string, evtkey: keyof typeof jquievent) {
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
        //let jodelevent = {'s': eventmap.s[type], 'ing': eventmap.ing[type], 'e': eventmap.e[type]};
        let jquievent = {'s': 'start', 'ing': jqui_ing, 'e':'stop'};

        let jqkey = jquievent[evtkey] || '';
        let props: GObject<MeasurableAllProps> = this.props;
        let propsevent = props[eventmap[evtkey][type]];

        if (propsevent && typeof propsevent !== "function") {
            Log.ee("<Measurable /> " + eventmap[evtkey][type] + " props must be a function");
            return;
        }
        // call ondragend... jodel events
        let jquievt = options[jqkey];
        // let jodelevt = propsevent; // (...params: any) => propsevent(...params); // was made to preserve "this"?
        let defaultevt: null | MeasurableUIEvent = this.getDefaultEvent(type, evtkey);
        let allevents = [defaultevt, jquievt, propsevent].filter((e)=>!!e);
        if (allevents.length) options[jqkey] = ((evt, ui)=>{
            for (let e of allevents) {
                propsevent = props[eventmap[evtkey][type]]; // if i don't redeclare it here, closure makes a mess taking always the last jodelevt for all iterations.
                if (e === propsevent) { e(this.getCoords(evt, ui, this.props.isPanning), evt, ui); }
                else e(evt, ui);
            }
        }) as DraggableEvent;
    }
    afterUpdateSingle(type: "draggable" | "resizable" | "rotatable"): void{
        // was forced to move from general loop-style implementation to individual redundant stuff because of closure messes.
        if (!this.$html) return;
        let $measurable = this.$html;
        let options: GObject;
        const props: GObject = this.props;
        const datamap = {draggable: "uiDraggable", resizable: "uiResizable", rotatable: "uiRotatable"};
        const optionmap = {draggable: "draggable", resizable: "resizable", rotatable: "rotatable"};
        const optionkey = optionmap[type];
        if (props[optionkey] === false || !props[optionkey]) {
            // console.log("measurable off " + type, {$measurable, type, datamap, optionkey, props});
            if ($measurable.data(datamap[type])) ($measurable as GObject)[type]('disable');
            return;
        }
        if (props[optionkey] === true) {
            options = {};
        } else options = {...props[optionkey]};

        // todo: changing options at runtime works, but changing children does not update

        let jqui_ing: string;
        switch (type){
            default: jqui_ing = Log.eDevv("unexpected measurable event: " + type); return;
            case "draggable": jqui_ing = 'drag'; break;
            case "resizable": jqui_ing = 'resize'; break;
            case "rotatable": jqui_ing = 'rotate'; break;
        }
        let jquievent = {'s': 'start', 'ing': jqui_ing, 'e':'stop'};
        let evtkey: keyof typeof jquievent;
        for (evtkey in jquievent) { this.makeEvent(options, type, evtkey); }
        let defaultOptions = this.defaultOptions[type];
        U.objectMergeInPlace(options, defaultOptions);
        ($measurable as GObject)[type](options);
    }
    shouldComponentUpdate(nextProps: Readonly<MeasurableAllProps>, nextState: Readonly<MeasurableState>, nextContext: any): boolean {
        //console.log("measurable shouldup", {nc:nextProps.children, tc:this.props.children, eq: nextProps.children == this.props.children});
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

    updateDefaultOptions(){
        /*let addClasses = this.props.children ? 'on-children' as any : undefined;
                                          jqui.classes does not owrk? and addclass is only for draggable?
        if (this.defaultOptions.draggable.addClasses !== addClasses) {
            this.defaultOptions.resizable.classes = addClasses;
            // this.defaultOptions.rotatable.classes = addClasses;
        }*/
    }
    render(): ReactNode {
        let child: ReactElement = this.props.children as any;

        this.updateDefaultOptions();
        if (!child) return child || null; // sometimes react passes {} as props.children?
        if (!Object.keys(child).length) return Log.ee("Measurable can have only 1 subelement and it cannot be an array or a <>React.fragment</>", child, this.props);
        if (Array.isArray(child)) {
            if (child.length !== 1) {
                Log.ee("Measurable can have only 1 subelement and it cannot be an array or a <>React.fragment</>", child, this.props);
                return child;
            }
            else child = child[0];
        }
        if (child.type.toString() === React.Fragment.toString()) {
            Log.ee("Measurable can have only 1 subelement and it cannot be an array or a <>React.fragment</>", child, this.props);
            return child; }

        let oldProps = child.props;
        let newProps = {
            ref: (html: Element | null)=>{
                if (html && !U.isHtmlNode(html)) {
                    Log.ee('ref tring to set non-html element', html);
                    return;
                }
                this.html = html;
            }
        };
        U.objectMergeInPlace(newProps, oldProps);
        let clonedChild = React.cloneElement(child, newProps);
        return clonedChild;
    }

    private getCoords(evt: JQueryEventObject, ui: JQueryUI.DraggableEventUIParams, isPanning?: LGraph): GraphSize {
        let size = Size.of(evt.target);
        let graph: LGraph = DGraphElement.graphLFromHtml(evt.target) as LGraph;
        let gsize: GraphSize = graph?.translateHtmlSize(size);
        if (isPanning) {
            let position = this.props.onChildren ? this.oldPos : ui.position;
            gsize.x = position.left;
            gsize.y = position.top;
        }
        return gsize;
    }
}

@RuntimeAccessible('ScrollableComponent')
export class ScrollableComponent extends Component<ScrollOwnProps, ScrollState>{
    static cname: string = "ScrollableComponent";
    render(){
        let graph = this.props.graph;
        let create = (e: JQueryEventObject) => {/*
            let target: HTMLElement = e.target.children[0] as HTMLElement;
            target.style.left = graph.offset.x+'px';
            target.style.top = graph.offset.y+'px';*/
            // $(target).data({uiDraggable:{offset:{left: graph.offset.x, top: graph.offset.y}}});
        }
        return (
            <div className={"scrollable"}>
                <Measurable draggable={{create}}
                            isPanning={graph}
                            onDragEnd={graph ? (coords, ...args: any)=>{
                                if (!graph) return; // just for ts-lint
                                console.log("drag odee", {coords, graph, args});
                                let offset = graph.offset;
                                if (!offset.equals(coords)) graph.offset = coords as any;
                            } : undefined}
                            onChildren={true}>
                    <div className="panning-handle">
                        <div className="panning-content">{ this.props.children }</div>
                    </div>
                </Measurable>
            </div>);
    }
}

// private
interface ScrollOwnProps {
    children: ReactChild[] | ReactChild;
    graph: LGraph;
}
interface MeasurableOwnProps {
    isPanning?: LGraph;
    children: ReactChild[] | ReactChild;
    //dragOptions?: Options;
    //drag?: Options;
    draggable?: JQueryUI.DraggableOptions | boolean;
    onDragStart?: DraggableEvent;
    whileDragging?: DraggableEvent;
    onDragEnd?: (coords: GraphSize, ...args: Parameters<DraggableEvent>)=>void;
    onChildren?: boolean | ((e: HTMLElement)=>HTMLElement);

    //resizeOptions?: Options;
    //resize?: Options;
    resizable?: JQueryUI.ResizableOptions | boolean;
    onResizeStart?: ResizableEvent;
    whileResizing?: ResizableEvent;
    onResizeEnd?: ResizableEvent;
    transformMode?: boolean; // if true uses transform: translate() instead of pos:absolute; left; & top;

    //rotateOptions?: Options;
    //rotate?: Options;
    rotatable?: GObject | boolean;
    onRotationStart?: RotatableEvent;
    whileRotating?: RotatableEvent;
    onRotationEnd?: RotatableEvent;
}
// private
interface MeasurableStateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type MeasurableAllProps = MeasurableOwnProps & MeasurableStateProps & DispatchProps;

////// mapper func
/*
function mapStateToProps(state: DState, ownProps: MeasurableOwnProps): MeasurableStateProps {
    const ret: MeasurableStateProps = {} as any;
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
} as MeasurableOwnProps;


export function Measurable(props: MeasurableAllProps, children?: any): ReactElement {
    return <MeasurableComponent {...{...props}}>{props.children||children}</MeasurableComponent>;
}
// shortcuts for Draggable Resizable Rotatable with whileDragging onDragStart props simplified to start, while, end
export function Draggable(props: GObject<MeasurableAllProps>, children?: any): ReactElement {
    return <MeasurableComponent
        {...{...props}}
        draggable={props.options || props.draggable || true}
        onDragStart={props.start || props.begin || props.onDragStart}
        onDragEnd={props.end || props.stop || props.onDragEnd}
        whileDragging={props.drag || props.while || props.ing || props.whileDragging}
    >{props.children||children}</MeasurableComponent>;
}
export function Resizable(props: GObject<MeasurableAllProps>, children?: any): ReactElement {
    return <MeasurableComponent
        {...{...props}}
        resizable={props.options || props.resizable || true}
        onResizeStart={props.start || props.begin || props.onResizeStart}
        onResizeEnd={props.end || props.stop || props.onResizeEnd}
        whileResizing={props.resize || props.while || props.ing || props.whileResizing}
    >{props.children||children}</MeasurableComponent>;
}
export function Rotatable(props: GObject<MeasurableAllProps>, children?: any): ReactElement {
    return <MeasurableComponent
        {...{...props}}
        rotatable={props.options || props.rotatable || true}
        onRotationStart={props.start || props.begin || props.onRotateStart|| props.onRotationStart}
        onRotationEnd={props.end || props.stop || props.onRotateEnd|| props.onRotationEnd}
        whileRotating={props.rotate || props.while || props.ing || props.whileRotate || props.whileRotating}
    >{props.children||children}</MeasurableComponent>;
}


export function Scrollable(props: MeasurableAllProps, children?: any): ReactElement {
    // @ts-ignore
    return <ScrollableComponent {...{...props}}>{props.children||children}</ScrollableComponent>;
}/*
export function InfiniteScroll(props: MeasurableAllProps, children: ReactChild[] = []): ReactElement {
    return <InfiniteScrollComponent {...{...props, children}}>{children}</InfiniteScrollComponent>;
}*/

/*connect<MeasurableStateProps, DispatchProps, MeasurableOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MeasurableComponent);*/
