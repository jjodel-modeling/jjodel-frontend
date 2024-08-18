import React, {Component, CSSProperties, PureComponent, ReactChild, ReactElement, ReactNode} from "react";
import {Dictionary, GObject, Log, RuntimeAccessible, TRANSACTION, U} from "../../joiner";
import $ from "jquery";
import {JQueryUI} from "../../common/libraries/jqui-types";
import {OwnProps} from "../rightbar/structureEditor/ModelMetaData";
type ResizableEvent = JQueryUI.ResizableEvent;
type DraggableEvent = JQueryUI.DraggableEvent;
type RotatableEvent = ()=>void; // todo

// private
interface MeasurableState {
}
interface ScrollState {
}

type MeasurableUIEvent = ResizableEvent | DraggableEvent | RotatableEvent;

@RuntimeAccessible('MeasurableComponent')
export class MeasurableComponent extends Component<MeasurableAllProps, MeasurableState>{
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
    oldPos: Dictionary<string, number> =  {left: 0, top: 0};

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

    afterUpdateSingle(type: "draggable" | "resizable" | "rotatable"): void{
        if (!this.$html) return;
        let $measurable = this.$html;

        // todo: changing options at runtime works, but changing children does not update


        type EventLetter = 's'|'ing'|'e';
        let eventmap = {
            's':    {'draggable': 'onDragStart',    'rotatable': 'onRotateStart',   'resizable': 'onResizeStart'},
            'ing':  {'draggable': 'whileDragging',  'rotatable': 'whileRotating',   'resizable': 'whileResizing'},
            'e':    {'draggable': 'onDragEnd',      'rotatable': 'onRotateEnd',     'resizable': 'onResizeEnd'  },
        }
        let childmodekeys: (keyof CSSStyleDeclaration)[] = ['left', 'top', 'transform', 'position'];
        //let positionMap = new WeakMap<HTMLElement, {left: number; top: number}>();
        let childmode = (e: HTMLElement, evt?: any, evtkind?: EventLetter, ui?:any): void => {
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
            }*/

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
        function absoluteToTransform(e: HTMLElement, evt?: any, evtkind?: EventLetter): void {
            let x = e.style.left;
            let y = e.style.top;/*
            e.style.left = '0px';
            e.style.top = '0px';*/
            //e.style.position = 'unset';
            e.style.transform = `translate(${x}, ${y})`;
        }
        let translateeevents: Dictionary<string, Dictionary<string, DraggableEvent>> = {
            'draggable': {
                's': (e, ui)=>{ absoluteToTransform(e.target as HTMLElement, e, 's'); },
                'ing': (e, ui)=>{ absoluteToTransform(e.target as HTMLElement, e, 'ing'); },
                'e': (e, ui)=>{ absoluteToTransform(e.target as HTMLElement, e, 'e'); }},
            'resizable': {
                's': (e, ui)=>{},
                'ing': (e, ui)=>{},
                'e': (e, ui)=>{}},
            'rotatable': {
                's': (e, ui)=>{},
                'ing': (e, ui)=>{},
                'e': (e, ui)=>{}},
        };
        let defaulteevent = (evtkind: EventLetter)=>( (e: any, ui: any) => {
            //console.log('measurable default event', {type, evtkind, translateeevents, e, t: e.target});
            if (this.props.transformMode === true) translateeevents[type][evtkind](e, ui);
            childmode(e.target, e, evtkind, ui);
        } ) as MeasurableUIEvent;
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
            console.log("measurable off " + type, {$measurable, type, datamap, optionkey, props});
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
            if (propsevent && typeof propsevent !== "function") {
                Log.ee("<Measurable /> " + eventmap[evtkey][type] + " props must be a function");
                continue;
            }
            options[jqkey+"_debug"] = propsevent;
            // call ondragend... jodel events
            let oldevt = options[jqkey];
            let jodelevt = propsevent; // (...params: any) => propsevent(...params); // was made to preserve "this"?
            let translatemodeevt: null | MeasurableUIEvent = defaulteevent(evtkey);
            let allevents = [oldevt, jodelevt, translatemodeevt].filter((e)=>!!e);
            if (allevents.length) options[jqkey] = (...params: any)=> { for (let e of allevents) e(...params); };
        }
        let propsOptions = {...options};
        let defaultOptions = this.defaultOptions[type];
        U.objectMergeInPlace(options, defaultOptions);
        //console.log("measurable", {type, $measurable, options, propsOptions, defaultOptions});
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
}
/*
@RuntimeAccessible('InfiniteScrollComponent')
export class InfiniteScrollComponent extends Component<ScrollOwnProps, ScrollState>{
    static cname: string = "InfiniteScrollComponent";
    render(){
        return <Measurable transformMode={false} onChildren={true}>{ this.props.children}</Measurable>
    }
}
*/
// private
interface ScrollOwnProps {
    children: ReactChild[] | ReactChild;
}
interface MeasurableOwnProps {
    children: ReactChild[] | ReactChild;
    //dragOptions?: Options;
    //drag?: Options;
    draggable?: JQueryUI.DraggableOptions | boolean;
    onDragStart?: DraggableEvent;
    whileDragging?: DraggableEvent;
    onDragEnd?: DraggableEvent;
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

export class InfiniteScrollComponent extends Component<any, any>{ }

export function Measurable(props: MeasurableAllProps, children: ReactChild[] = []): ReactElement {
    return <MeasurableComponent {...{...props, children}}>{children}</MeasurableComponent>;
}
// todo: shortcuts for Draggable Resizable Rotatable with whileDragging onDragStart props simplified to start, while, end
export function InfiniteScroll(props: MeasurableAllProps, children: ReactChild[] = []): ReactElement {
    return <Measurable {...{...props, children}} transformMode={false} onChildren={true}>{children}</Measurable>;
}/*
export function InfiniteScroll(props: MeasurableAllProps, children: ReactChild[] = []): ReactElement {
    return <InfiniteScrollComponent {...{...props, children}}>{children}</InfiniteScrollComponent>;
}*/

/*connect<MeasurableStateProps, DispatchProps, MeasurableOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MeasurableComponent);*/
