import ReactJson from 'react-json-view' // npm i react-json-view
import React, {ReactElement, ReactNode} from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { GraphElementOwnProps, GObject, Dictionary, DocString, Pointer, LGraph } from "../joiner";
import type { InputOwnProps } from '../components/forEndUser/Input';
import type { SelectOwnProps } from '../components/forEndUser/Select';
import type { TextAreaOwnProps } from '../components/forEndUser/TextArea';
import {
    LPointerTargetable,
    U,
    Log,
    GraphElementComponent,
    windoww,
    RuntimeAccessible,
    EdgeComponent,
    RuntimeAccessibleClass,
    EdgeOwnProps,
    DGraphElement,
    DModelElement,
    transientProperties, JSXT, DViewElement
} from "../joiner";
import {AllPropss} from "../graph/vertex/Vertex";

var Convert = require('ansi-to-html');

// U-functions that require jsx
@RuntimeAccessible('UX')
export class UX{

    static recursiveMap<T extends ReactNode | ReactNode[] | null | undefined>(children: T, fn: (rn: T, i: number, depthIndices: number[])=>T, depthIndices: number[] = []): T {
        // NB: depthIndices is correct but if there is an expression children evaluated to false like {false && <jsx>},
        // it counts as children iterated regardless. so html indices might be apparently off, but like this is even safer as indices won't change when conditions are changed.
        const innermap = (child: ReactNode, i1: number, depthIndices: number[]): T => {
            if (!React.isValidElement(child)) {
                if (Array.isArray(child)) return React.Children.map(child as T, (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as T;
                if (child && typeof child === "object") {
                    if (!windoww.invalidObjsReact) windoww.invalidObjsReact = [];
                    windoww.invalidObjsReact.push(child);
                    return "<! Objects cannot be rendered in jsx : " + (child as any)?.name + ">" as T;
                }
                return child as T; }
            if (child.props.children) {
                // let deeperDepthIndices = [...depthIndices, i1];  // depthIndices; //
                // should probably change deeperDepthIndices in [...deeperDepthIndices, i] in next uncommented line.
                // Giordano: add ignore for webpack
                //@ts-ignore
                child = React.cloneElement(child, { children: UX.recursiveMap(child.props.children,
                        (e: T, i2: number, ii) => fn(e, i2, ii), depthIndices) });
                // this can be optimized, and i think i can avoid cloning here, as the nodes are already cloned in "fn" = ux.injectprops
            }
            return fn(child as T, i1, depthIndices);
        };
        if (!Array.isArray(children)) return innermap(children as ReactNode, 0, [...depthIndices, 0]) as T;
        // if (typeof children[0] === "object") return (children).map( (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as any as T;
        return React.Children.map(children, (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as T;
    }
    /*
    public static draggable_eventmap = {
        's':    {'draggable': 'onDragStart',    'rotatable': 'onRotateStart',   'resizable': 'onResizeStart'},
        'ing':  {'draggable': 'whileDragging',  'rotatable': 'whileRotating',   'resizable': 'whileResizing'},
        'e':    {'draggable': 'onDragEnd',      'rotatable': 'onRotateEnd',     'resizable': 'onResizeEnd'  },
    };
    public static draggable_eventprops= UX.initMeasurable();
    static initMeasurable(): Dictionary<string, boolean>{
        return U.objectFromArrayValues(Object.values(UX.draggable_eventmap).flatMap(v=>Object.values(v)), true);
    }*/

    static injectProp(parentComponent: GraphElementComponent, e: ReactNode, gvidmap_useless: Dictionary<DocString<'VertexID'>, boolean>,
                      parentnodeid: string, index: number, indices: number[], injectOffset?: LGraph): ReactNode {
        let re: ReactElement | null = UX.ReactNodeAsElement(e);

        // injectOffset&&console.log("inject offset props 1:", {e, re, injectOffset});
        if (!re) return e;
        // @ts-ignore this
        // const parentComponent = this;
        const type = (re.type as any).WrappedComponent?.name || re.type;
        let injectProps: GraphElementOwnProps = {} as any;
        if (injectOffset) {
            const style = {...(re.props?.style || {})};
            let offset = injectOffset.offset;
            let scale = injectOffset.zoom;
            style.position = "absolute";
            style.left = offset.x;
            style.top = offset.y;
            style.transform = "scale(" + scale.x + "," + scale.y + ")"
            injectProps.style = style;
            console.log("inject offset props:", {re, injectProps});
        }
        //  fix the injection somehow. override Edge() Vertex() Asterisk() ...
        // const windoww = window as any;
        // console.log('ux.injectingProp pre ', {type: (re.type as any).WrappedComponent?.name || re.type}, {mycomponents: windoww.mycomponents, re, props:re.props});
        // add "view" (view id) prop as default to sub-elements of any depth to inherit the view of the parent unless the user forced another view to apply
        switch (type) {
            default:
                // console.count('ux.injectingProp case default: ' + type);
                if (indices.length <= 2 && (parentComponent?.props?.childStyle)) {
                    // if first non-component child of a GraphElement with a clipPath shape, i assign clip path to it.
                    console.log('injecting to first child (A):', {re, indices, il: indices.length, pc: parentComponent, injectProps, cs:parentComponent.props.childStyle});
                    let istyle: GObject = injectProps.style = {...(injectProps.style || {})};
                    injectProps.style = injectProps.style ? {...injectProps.style} : {};
                    U.objectMergeInPlace(injectProps.style, parentComponent.props.childStyle);
                } else return re;
                break;
            /*
            case windoww.Components.Input.name:
            case windoww.Components.Textarea.name:
                const objid =  re.props.obj?.id || re.props.obj || parentComponent.props.data.id;
                const ret = React.cloneElement(re, {key: UX.getKey(re) || parentComponent.props.view.id + '_' + parentComponent.props.data.id + '_' + re.props.field, obj: objid, obj2: objid});
                //console.log('relement Input set props',
                //    {'re.props.obj.id': re.props.obj?.id, 're.props.obj': re.props.obj, 'thiss.props.data.id': thiss.props.data.id, thiss, re, objid, ret, 'ret.props': ret.props});
                return ret;*/
            // case windoww.Components.GraphElement.name:
            case windoww.Components.Input.cname+"Component":
            case windoww.Components.Select.cname+"Component":
            case windoww.Components.TextArea.cname+"Component":
                // todo: can i do a injector that if the user provides a ModelElement list raw <div>{this.children}</div> it wraps them in DefaultNode?
                const injectProps2: InputOwnProps | SelectOwnProps | TextAreaOwnProps = {} as any;
                const parentnodeid = parentComponent.props.node?.id;
                injectProps2.data = re.props.data || (typeof parentComponent.props.data === "string" ? parentComponent.props.data : parentComponent.props.data?.id);
                // !IMPORTANT! this key does not remove the responsability of adding keys to <GraphElement>s. this is assigning the key to the first returned element by component A,
                // but react needs to distinguish component A from other components, and he still doesn't have a key. in fact this is useless as this component can only have 1 child
                injectProps2.key = UX.getKey(re) || (parentnodeid + "_input_"+index);
                return React.cloneElement(re, injectProps2);
            case windoww.Components.GraphElementComponent.cname:
            // case windoww.Components.DefaultNode.name:
            case windoww.Components.DefaultNodeComponent.cname:
            // case windoww.Components.Graph.name:
            // case windoww.Components.GraphComponent.cname:
            case "Graph": case "GraphComponent":
            // case windoww.Components.Field.name:
            // case windoww.Components.FieldComponent.cname:
            // case windoww.Components.Vertex.name:
            case EdgeComponent.cname:
            case windoww.Components.VertexComponent.cname:
                injectProps.parentViewId = parentComponent.props.view.id || (parentComponent.props.view as any); // re.props.view ||  thiss.props.view
                injectProps.parentnodeid = parentComponent.props.node?.id;
                injectProps.graphid = parentComponent.props.graphid;
                // const vidmap = GraphElementRaw.graphVertexID_counter;
                // if (!vidmap[injectProps.graphid]) vidmap[injectProps.graphid] = {};
                // const gvidmap = vidmap[injectProps.graphid];
                // const validVertexIdCondition = (id: string): boolean => gvidmap_useless[id];
                // todo: come butto dei sotto-vertici dentro un vertice contenitore? o dentro un sotto-grafo? senza modificare il jsx ma solo draggando? React-portals?
                const dataid = (typeof re.props.data === "string" ? re.props.data : re.props.data?.id) || "shapeless";
                let idbasename: string;

                console.log('injecting props ' + type, {re, pc: parentComponent, injectProps, ownProps: re.props});
                if (re.props.initialSize?.id) { idbasename = re.props.initialSize?.id; } else
                if (re.props.nodeid) { idbasename = re.props.nodeid; } else
                if (re.props.id) { idbasename = re.props.id; } else
                if (UX.getKey(re)) {
                    idbasename = injectProps.parentnodeid + "_" +UX.getKey(re);
                    // console.log("keyid: ", {idbasename});
                }
                else switch (type) {
                    default:
                        idbasename = injectProps.parentnodeid + "_" + dataid + "N";
                        break;
                    case windoww.Components.EdgePoint.cname:
                        idbasename = injectProps.parentnodeid + "_" + (dataid || re.props.startingSize?.id || indices.join("_")) + "EP";
                        break;
                    case EdgeComponent.cname: case "Edge":
                        console.log('injecting props ' + type + " without key", {re, pc: parentComponent, injectProps, ownProps: re.props});
                        let edgeProps:EdgeOwnProps = re.props;
                        let edgestart_id: Pointer<DGraphElement> | Pointer<DModelElement> = (edgeProps.start as any).id || edgeProps.start;
                        let edgeend_id: Pointer<DGraphElement> | Pointer<DModelElement> = (edgeProps.end as any).id || edgeProps.end;
                        idbasename = injectProps.parentnodeid + "_" + edgestart_id + "-" + edgeend_id;
                }
                // (injectProps.parentnodeid)+"_"+(dataid)+indices.join("_");//injectProps.graphid + '_' + dataid;
                // console.log("setting nodeid", {injectProps, props:re.props, re});
                // Log.exDev(!injectProps.graphid || !dataid, 'vertex is missing mandatory props.', {graphid: injectProps.graphid, dataid, props: re.props});
                Log.exDev(!injectProps.graphid, 'vertex is missing mandatory props (graphid).', {graphid: injectProps.graphid, dataid, props: re.props});
                if (false && indices.length === 2) {
                    // if first component child, of a component? like (DefaultNode -> Vertex)?
                    console.log('injecting to first child (B):', {re, pc: parentComponent, injectProps});
                    if (parentComponent?.props.style?.clipPath) injectProps.style = {...(injectProps.style || {}), clipPath: parentComponent?.props.style?.clipPath||''}
                }
                injectProps.nodeid = idbasename; // U.increaseEndingNumber(idbasename, false, false, validVertexIdCondition);
                injectProps.htmlindex = indices[indices.length - 1]; // re.props.node ? re.props.node.htmlindex : indices[indices.length - 1];
                injectProps.key = UX.getKey(re) || injectProps.nodeid;
                // console.log("cloning jsx:", re, injectProps);
                Log.ex((injectProps.nodeid === injectProps.graphid||injectProps.nodeid === injectProps.parentnodeid) && type !== "GraphComponent", "User manually assigned a invalid node id. please remove or change prop \"nodeid\"", {type: (re.type as any).WrappedComponent?.cname || re.type}, {mycomponents: windoww.mycomponents, re, props:re.props});
        }
        console.log('injecting props ' + type, {id: injectProps.nodeid, re, pc: parentComponent, injectProps});
        return React.cloneElement(re, injectProps);
    }

    static ReactNodeAsElement(e: React.ReactNode): React.ReactElement | null {
        return e && (e as ReactElement).type ? e as ReactElement : null;
    }
    static getKey(e: ReactNode): string | undefined {
        return (e as any)?.key; // NOT e.props.key, key is not a part of props in ReactNode.
    }

    public static async deleteWithAlarm(lItem: LPointerTargetable) {
        const MySwal = withReactContent(Swal);
        const confirm = await MySwal.fire({
            title: "Delete " + lItem.toString() + "?",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            showLoaderOnConfirm: true
        });
        if (confirm.value === true) {
            lItem.delete();
        }
    }
    public static async info(text: string) {
        const MySwal = withReactContent(Swal);
        const confirm = await MySwal.fire({
            title: text,
            showCancelButton: false,
            confirmButtonText: "Got It"
        });
    }









    private static initPropInjectionStuff(): string[]{
        UX.graphComponents = ['GraphElement', '...more'];
        UX.inputComponents = ['Input', 'Select', 'TextArea','...more'];
        UX.graphComponentsRegexp = new RegExp(UX.graphComponents.map(s=>'(?:;\\}\\)\\]\\,\\;\\s)'+s+'\\(').join('|'));
        UX.inputComponentRegexp = new RegExp(UX.graphComponents.map(s=>'(?:;\\}\\)\]\\,\\;\\s)'+s+'\\(').join('|'));
        UX.viewRootProps = '"data-viewid": props.viewid,' +
            ' addStyle: (offset ? {position:"absolute", left:offset.x, top:offset.y/*,transform:"scale("+zoom.x+","+zoom.y+")"*/} : undefined)';
        UX.mainViewRootProps = 'ref: component.html, id: props.nodeid, "data-nodeid": props.nodeid, "data-dataid": props.dataid,\n' +
            '"data-modelname": data?.className || "model-less",' +
            '"data-userselecting": JSON.stringify(node.isSelected || {}),' +
            '"data-nodetype": node.className, ' +
            '"data-parentview": props.parentviewid, ' +
            //'"data-order": node.zIndex,' +
            'onClick: component.onClick,' +
            'onContextMenu: component.onContextMenu,' +
            'onMouseDown: component.onMouseDown,' +
            'onMouseUp: component.onMouseUp,' +
            'onwheel: component.onScroll,' +
            'onMouseEnter: component.onEnter,' +
            'onMouseLeave: component.onLeave,' +
            'tabIndex: (props as any).tabIndex || node.zIndex || -1,' +
            '"data-countrenders": component.countRenders++,' +
            'decorators: otherViews,'+// used in user jsx to inject decorator views
            'classNameAdd: [(component.countRenders%2 ? "animate-on-update-even" : "animate-on-update-odd"),"mainView", props.viewid, ...props.viewsid].join(","),' +
            '...this.props';
        UX.decorativeViewRootProps +='classNameAdd: "decorativeView " + props.viewid, "data-mainview": mainviewid';
        return UX.graphComponents
    }
    private static graphComponents: string[] = UX.initPropInjectionStuff();
    private static inputComponents: string[] = undefined as any;
    private static graphComponentsRegexp: RegExp = undefined as any;
    private static inputComponentRegexp: RegExp = undefined as any;
    private static GC_propsAdder(index: number): string { return "nodeid: window._assignnodeid(props, "+index+"), key:"+index; }
    private static Input_propsAdder(index: number):string { return "key:"+index; }
    private static injectPropsToString_addstuff(s: string, index: number, props: string, type: string, propsAdder?:((index: number)=>string) | undefined): string { // move out in global scope
        switch (s[index]) {
            case '{': // props object
                // let propstr = JSON.stringify(propsToInjectAtRoot);
                // propstr = propstr.substring(1, propstr.length-2);
                s = s.substring(0, index+1) + props + (propsAdder ? ','+propsAdder(index) : '') + ',' + s.substring(index+1);
                break;
            case 'n': // null:
                // let propstr = JSON.stringify(propsToInjectAtRoot)
                s = s.substring(0, index) + '{'+props+(propsAdder ? ','+propsAdder(index) : '') + '}' + s.substring(index+4);
                break;
            default: Log.exDevv('unexpected string in '+type+' props injection parser',
                {s_pre:s.substring(index-10, 10), s_post:s.substring(index, index+10), index, c:s[index], fullstr:s});
                break;
        }
        return s;
    }
    private static viewRootProps: string;
    private static decorativeViewRootProps: string;
    private static mainViewRootProps: string;
// propsToInject cannot be an object because i need variable names as prop values, NOT strings, not their immediate values. so i pass a string with a list of props
    static injectPropsToString(s: string, asMainView:boolean, graphComponentsProps: string, inputComponentProps: string){
        // non-root props are injected through Component constructors instead
        // plan B instead: make it  "DefaultNde({pa: "pa"}, ["a", [b,c]])" ---> "Root(DefaultNde, {pa: "pa"}, ["a", [b,c]]) and handle injection in Root func
        const propsToInjectAtRoot = UX.viewRootProps + ','+(asMainView ? UX.mainViewRootProps : UX.decorativeViewRootProps);
        //add in context: component = (this as GraphElementComponent), otherViews
        // 'style: {...viewStyle, ...styleoverride},' + need to fix this
        // 'className: classes.join(\' \'),' + and this
        // and otherViews as ReactNode[]
        // context.mainviewid (different from context.view in decorative views)
        s = s.trim();
        if (propsToInjectAtRoot.length) {
            let argStartIndex = s.indexOf('(', 1) + 1;//.match(/[A-Za-z_$0-9]+\(/)
            // todo: hamdle props.addstyle
            // add im props: offset: this.props.isGraph ££ this.props.ode.offset, zoom: this.props.isGraph ££ this.props.ode.zoom

            if (s[argStartIndex] === "'") argStartIndex = s.indexOf("'", argStartIndex+1);// it is a lowercase component with name as string in first param
            s = UX.injectPropsToString_addstuff(s, argStartIndex, propsToInjectAtRoot, 'root');

            // used in GC_propsAdder as a string to be eval-ed
            (window as any)._assignnodeid = function _assignnodeid(props: AllPropss, index:number): string {
                const tnv = transientProperties.node[props.nodeid].viewScores[props.viewid];
                if (!tnv.nodeidcounter) tnv.nodeidcounter = {};
                if (tnv.nodeidcounter[index] === undefined) tnv.nodeidcounter[index] = 0;
                else tnv.nodeidcounter[index]++;

                return props.nodeid+'_'+index+'_'+tnv.nodeidcounter[index];
                // every time before jsx render, " let nc = transientProperties.node[props.nodeid].viewScores[props.viewid].nodeidcounter; for (let k of nc) nc[k]=0; or just nodeidcounter={}
            }
        }

        // lowercase, no props          React.createElement('defaultNde', null, ["a", [a,b,c]])
        // uppercase, ++ props          DefaultNde({pa: "pa", pb: b, pc: "c"}, ["a", [a,b,c]])
        // lowercase, ++ props          React.createElement('defaultNde', {a: "1"}, ["a", [a,b,c]])
        // uppercase, no props          DefaultNde(null, ["a", [a,b,c]])
        // might have () wrapping all
        // or array wrapping all
        // or comments (both inline and line)
        // or even a string at beginning
        // nightmare case is:          `(["a()", /*comment()*/ React.createElement('defaultNde', {a: "1"}, ["a", [a,b,c]]),2])`
        // !! fix: force users to have < as first char?? and editor tells it's wrong if this is not the case?
        // that forces mono-root, but arrays would be hard to inject root-level props and prone to break anyway
        let match: RegExpExecArray | null;
        //here i give up, because i cannot compute nodeid without htmlindex[] from root to component
        // cannot even get nodeid according to jsxstr position because of loops / map generate multiple nodes from same string index
        // NO! i can do srtindex+counters[strindex]++?
        //

        graphComponentsProps = 'parentnodeid: props.nodeid, graphid:this.props.node.className.indexOf("Graph")>=0 ? props.nodeid : props.graphid,' +
            ' parentViewId:props.viewid';// + dynamically: 'nodeid, key' // - removed: htmlindex
        inputComponentProps = 'data: props.data, field:"name"'; // + dynamically: 'key'

        if (graphComponentsProps.length > 0) while (match = UX.graphComponentsRegexp.exec(s)) {
            let matchstr: string = match[0];
            //let pre = s.substring(0, match.index) + matchstr;
            let argStartIndex = match.index + matchstr.length;
            s = UX.injectPropsToString_addstuff(s, argStartIndex, graphComponentsProps, 'graphElement', UX.GC_propsAdder);
        }
        if (inputComponentProps.length > 0) while (match = UX.inputComponentRegexp.exec(s)) {
            let matchstr: string = match[0];
            //let pre = s.substring(0, match.index) + matchstr;
            let argStartIndex = match.index + matchstr.length;
            s = UX.injectPropsToString_addstuff(s, argStartIndex, inputComponentProps, 'inputComponent', UX.Input_propsAdder);
        }
        return s;
    }

    static parseAndInject(jsxString: string, v: DViewElement): string {
        let jsxCompiled: DocString<ReactNode>;
        let e: any;
        try { jsxCompiled = JSXT.fromString(jsxString, {factory: 'React.createElement'}); }
        catch (ee: any) { e = ee; jsxCompiled = GraphElementComponent.displayError(e, "JSX Syntax", v, undefined, undefined, true) as any; }
        console.log('jsxparse' + (e ? '_ERROR' : '_ok'), {e, jsxString, jsxCompiled, v});
        return jsxCompiled;
    }
}





