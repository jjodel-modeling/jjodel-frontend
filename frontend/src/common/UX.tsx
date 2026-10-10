// import ReactJson from 'react-json-view' // npm i react-json-view
import React, {JSX, ReactElement, ReactNode} from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { InputOwnProps, SelectOwnProps } from '../components/forEndUser/Input';
import {
    GraphElementOwnProps,
    GObject,
    Dictionary,
    DocString,
    Pointer,
    LGraph,
    MultiSelectOptGroup,
} from "../joiner";
import {
    LPointerTargetable,
    U,
    Log,
    windoww,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    EdgeOwnProps,
    DGraphElement,
    DModelElement,
    transientProperties, JSXT, DViewElement
} from "../joiner";
import {ScrollableComponent} from "../components/forEndUser/Measurable";
import {displayError} from "./jsxErrorView";
import {
    Control,
    MetaElementPicker,
    Panel,
    Panell,
    Slider,
    Toggle_Obsolete,
    Zoom
} from "../components/forEndUser/Control";
import {T2M_API} from "../components/forEndUser/MTM";

// var Convert = require('ansi-to-html');

// U-functions that require jsx
@RuntimeAccessible('UX')
export class UX{

    static recursiveMap<T extends ReactNode | ReactNode[] | null | undefined>(children: T, fn: (rn: T, i: number, depthIndices: number[])=>T, depthIndices: number[] = [], props?: GObject): T {
        // NB: depthIndices is correct but if there is an expression children evaluated to false like {false && <jsx>},
        // it counts as children iterated regardless. so html indices might be apparently off, but like this is even safer as indices won't change when conditions are changed.
        const innermap = (child0: ReactNode, i1: number, depthIndices: number[]): T => {
            let child: GObject = child0 as any;
            // console.log('UX recursive map', {child, isRE: React.isValidElement(child)});

            if (!React.isValidElement(child)) {
                if (Array.isArray(child)) return React.Children.map(child as T, (c: T, i3: number)=>innermap(c, i3, [...depthIndices, i3])) as T;
                if (child && typeof child === "object") {
                    if (!windoww.invalidObjsReact) windoww.invalidObjsReact = [];
                    windoww.invalidObjsReact.push(child);
                    return "<! Objects cannot be rendered in jsx : " + (child as any)?.name + ">" as T;
                }
                return child as T; }
            if ((child.props as GObject)?.children) {
                // let deeperDepthIndices = [...depthIndices, i1];  // depthIndices; //
                // should probably change deeperDepthIndices in [...deeperDepthIndices, i] in next uncommented line.
                // Giordano: add ignore for webpack
                //@ts-ignore
                child = React.cloneElement(child, { children: UX.recursiveMap(child.props.children,
                        (e: T, i2: number, ii) => fn(e, i2, ii), depthIndices, props) });
                // this can be optimized, and i think i can avoid cloning here, as the nodes are already cloned in "fn" = ux.injectprops
            }
            return fn(child as T, i1, depthIndices);
        };
        // console.warn('UX recursive map STRT object re', children);

        if (!Array.isArray(children)) return innermap(children as ReactNode, 0, [...depthIndices, 0]) as T;
        // replace {data} with {<DefaultNode data={data}/>
        function mapLObjectsToJSX(c: any, index: number): any {
            if (!c || typeof c !== 'object') return c;
            if (React.isValidElement(c)) return c;
            if (Array.isArray(c)) return c.map(mapLObjectsToJSX);
            let cname = c.className;
            if (!cname) return null; // object not translable to jsx -> ignored
            if (!LPointerTargetable.extends(cname, 'DModelElement')) return null;
            let id = c.id;
            let key = id; // +index;
            if (id === props?.dataid) return null; // to avoid loops, but does not check circular references not obvious ( a->b->a ) and same problem can happen with <Vertex> or <DefaultNode>
            if (cname === 'DModel') return null; // windoww.Components.Vertex({data:c, key, isVertex:true, isGraph:false});
            // return <div>obj!</div>;
            return windoww.Components.DefaultNode({data:c, key});
            // return <DefaultNode data={c} />;
        }
        children = children.map(mapLObjectsToJSX) as any;
        // console.warn('UX recursive map MIDD object re', children);
        // if (typeof children[0] === "object") return (children).map( (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as any as T;
        let ret = React.Children.map(children, (c: T, i3: number)=>innermap(c, i3, [...depthIndices,i3])) as T;

        // console.warn('UX recursive map END object re', children);
        return ret;
    }

    // injectProp removed (de-entanglement stage 5): its only caller was the classic graphElement.tsx renderer.

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

    // just to avoid changing extension to jsx in classes.ts
    static img(url:string){ return <img src={url} />; }

    /**
     * Generates a circular avatar with 1–3 centered letters.
     * Returns an SVG string (inline-safe) or a Base64 data URI.
     *
     * @param letters      Up to 3 characters to display
     * @param fontFamily   CSS font-family string (e.g. "sans-serif", "Georgia")
     * @param fontColor    Hex color for the text (e.g. "#ffffff")
     * @param backgroundColor  Hex fill color for the circle (e.g. "#3a86ff")
     * @param borderColor  Hex color for the border ring (e.g. "#ff006e")
     * @param borderWidth  Border thickness as a fraction of radius (e.g. 0.05 = 5%)
     * @param asDataUri    If true, returns a Base64 SVG data URI; otherwise raw SVG
     */
    static makeAvatar<T extends boolean = false>(
        letters: string,
        fontFamily: string = '"Inter Variable", -apple-system, sans-serif',
        fontColor: string = "#000000",
        borderColor: string = "#000000",
        backgroundColor: string = "#ffffff",
        borderWidth: number = 0.1, // as a % of border radius [0, 1]
        asDataUri: T = false as T
    ): T extends true ? string : ReactNode {
        let radius: number = 64;
        // Clamp to 3 characters
        const text = letters.slice(0, 3).toUpperCase();
        const len = text.length;

        const size = radius * 2; // SVG viewport side length
        const cx = radius;        // circle centre x
        const cy = radius;        // circle centre y

        // Border stroke width in px (borderWidth is a fraction of radius)
        const strokePx = borderWidth * radius;

        // Inner radius shrunk so the stroke doesn't bleed outside the viewport
        const innerRadius = radius - strokePx / 2;

        // Font size heuristic: fewer letters → bigger text
        // Fits comfortably inside the circle for 1–3 chars
        const fontSizeMap: Record<number, number> = { 1: 0.55, 2: 0.38, 3: 0.30 };
        const fontSizeRatio = (fontSizeMap[len] ?? 0.30) * 1.2;
        const fontSize = Math.round(radius * 2 * fontSizeRatio);

        // Letter-spacing nudge: tighten slightly for 3 chars
        const letterSpacing = len === 3 ? -1 : len === 2 ? 0.5 : 0;

        // Escape XML special chars in user-supplied strings
        const escapeXml = (s: string) =>
            s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

        const safeFontFamily = escapeXml(fontFamily);
        const safeText = escapeXml(text);
        console.log("make avatar 2", {text, safeText})


        const svgtxt = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${size}"
  height="${size}"
  viewBox="0 0 ${size} ${size}"
  role="img"
  aria-label="${safeText}"
>
  <!-- Background fill circle -->
  <circle
    cx="${cx}"
    cy="${cy}"
    r="${innerRadius}"
    fill="${backgroundColor}"
    stroke="${borderColor}"
    stroke-width="${strokePx}"
  />
  <!-- Centered initials -->
  <text
    x="${cx}"
    y="${cy}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="${safeFontFamily}"
    font-size="${fontSize}"
    font-weight="600"
    fill="${fontColor}"
    letter-spacing="${letterSpacing}"
  >${safeText}</text>
</svg>`;
        let svg = <svg
            className={"avatar"}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
        >
            <circle
                cx={cx}
                cy={cy}
                r={innerRadius}
            />
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                style={{fontFamily: safeFontFamily, fontSize, fontWeight: "600"}}
            >{safeText}</text>
        </svg>;

        if (asDataUri) {
            const b64 = Buffer.from(svgtxt).toString("base64");
            return `data:image/svg+xml;base64,${b64}`;
        }
        return svg as any;
    }

    static svgToElement(svg: string): SVGSVGElement {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");

        const parserError = doc.querySelector("parsererror");
        if (parserError) {
            throw new Error(`Invalid SVG: ${parserError.textContent}`);
        }

        const el = doc.documentElement as unknown as SVGSVGElement;

        // Adopt the node into the current document so it behaves like a native element
        return document.adoptNode(el);
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
            'onWheel: component.onScroll,' +
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
            (window as any)._assignnodeid = function _assignnodeid(props: GObject, index:number): string {
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
        catch (ee: any) { e = ee; jsxCompiled = displayError(e, "JSX Syntax", v, undefined, undefined, true) as any; }
        return jsxCompiled;
    }
    static stopEvt(e: GObject<React.SyntheticEvent>): void{
        if (!e) return;
        e.persist?.();
        (e as any).stopImmediatePropagation?.();
        e.stopPropagation?.();
        let ne: any = e.nativeEvent;
        e._jjIsStopped = true;
        if (!ne) return;
        ne.stopImmediatePropagation?.();
        ne.stopPropagation?.();
        if (!ne.isPropagationStopped) ne.isPropagationStopped = ()=>true;
        ne._jjIsStopped = true;
    }
    static isStoppedEvt(e: GObject<React.SyntheticEvent>): boolean{
        if (!e) return true;
        if (e._jjIsStopped || e.isPropagationStopped?.()) return true;
        let ne: any = e.nativeEvent;
        if (!ne) return false;
        return !!(ne._jjIsStopped || ne.isPropagationStopped?.());
    }

    static options(validTargets: MultiSelectOptGroup[]): JSX.Element[] {
        return validTargets
            .filter(e=>!!e)
            .map(e => <optgroup label={e.label} key={e.label}>
                { e.options.filter(o=>!!o).map(o=>(
                    <option value={o.value} key={o.value} title={o.title}>{o.label}</option>
                )) }
            </optgroup>);
    }
    /*
    does not catch: visibility: hidden, opacity:0, invisible stuff inside a overflow:scroll element, overlapping z-index (returns true)
    does catch display:none, top:-999999px, width:0 (returns false)
    possibly zoom can mess it up
    */
    static isElementInViewport(el?: Element, includePartiallyVisible: boolean = true): boolean {
        if (!el) return false;
        var rect = el.getBoundingClientRect(); // safely returns a 0-filled struct for non-in-dom elements
        return (
            rect.top + (includePartiallyVisible ? rect.height : 0) >= 0 &&
            rect.left + (includePartiallyVisible ? rect.width : 0)  >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    static onVisibilityChange(el: Element, callback: ()=>any):(()=>void) {
        var old_visible: boolean;
        return function () {
            var visible = UX.isElementInViewport(el);
            if (visible === old_visible) return;
            old_visible = visible;
            if (typeof callback == 'function') { callback(); }
        }
    }
}





