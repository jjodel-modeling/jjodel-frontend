import {
    BEGIN,
    Constructors,
    CoordinateMode,
    Debug, DEdgePoint,
    Defaults,
    DGraphElement,
    Dictionary,
    DModelElement,
    DNamedElement,
    DocString,
    DPointerTargetable, DProject,
    DState,
    DViewPoint, DVoidEdge,
    EdgeBendingMode,
    EdgeGapMode, EdgeSegment,
    EGraphElements,
    EModelElements,
    END,
    getWParams,
    GObject,
    GraphPoint,
    GraphSize,
    Info, LEdge, LEdgePoint, LGraphElement, LModelElement,
    Log,
    LogicContext,
    LPointerTargetable, LProject, LUser,
    LViewPoint,
    LVoidEdge,
    MyProxyHandler,
    Pointer,
    Pointers, PrimitiveType,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    Selectors,
    SetFieldAction, SetRootFieldAction,
    ShortAttribETypes,
    store,
    TRANSACTION,
    U, ViewEClassMatch,
    windoww
} from "../../joiner";
import {DUser, EPSize, Pack1, transientProperties } from "../../joiner/classes";
import DSL from "../../DSL/DSL";
import {ReactNode} from "react";
import {labeltype} from "../../model/dataStructure/GraphDataElements";

let CSS_Units0 = {'Local-font relative':{
        'cap':     'cap - (Cap height) the nominal height of capital letters of the element\'s font.',
        'ch':      'ch - Average character advance of a narrow glyph in the element\'s font, as represented by the "0" (ZERO, U+0030) glyph.',
        'em':      'em - Font size of the element\'s font.',
        'ex':      'ex - x-height of the element\'s font.',
        'ic':      'ic - Average character advance of a full-width glyph in the element\'s font, as represented by the "水" (CJK water ideograph, U+6C34) glyph.',
        'lh':      'lh - Line height of the element.',
    },

    'Root-font relative':{
        'rcap':    'rcap - Cap height (the nominal height of capital letters) of the root element\'s font.',
        'rch':     'rch - Average character advance of a narrow glyph in the root element\'s font, as represented by the "0" (ZERO, U+0030) glyph.',
        'rem':     'rem - Font size of the root element\'s font.',
        'rex':     'rex - x-height of the root element\'s font.',
        'ric':     'ric - Average character advance of a full-width glyph in the root element\'s font, as represented by the "水" (CJK water ideograph, U+6C34) glyph.',
        'rlh':     'rlh - Line height of the root element.',
    },

    'Relative':{
        'dvh':      'dvh - 1% of the dynamic viewport\'s height.',
        'dvw':      'dvw - 1% of the dynamic viewport\'s width.',
        'lvh':      'lvh - 1% of the large viewport\'s height.',
        'lvw':      'lvw - 1% of the large viewport\'s width.',
        'svh':      'svh - 1% of the small viewport\'s height.',
        'svw':      'svw - 1% of the small viewport\'s width.',
        'vb':       'vb - 1% of viewport\'s size in the root element\'s block axis.',
        'vh':       'vh - 1% of viewport\'s height.',
        'vi':       'vi - 1% of viewport\'s size in the root element\'s inline axis.',
        'vmax':     'vmax - 1% of viewport\'s larger dimension.',
        'vmin':     'vmin - 1% of viewport\'s smaller dimension.',
        'vw':       'vw - 1% of viewport\'s width.',
        'fr':       'fr - (Flex) Represents a flexible length within a grid container',
        '%':        '% - Percentage',
    },

    'Container @Query relative':{
        'cqb':      'cqb - 1% of a query container\'s block size',
        'cqh':      'cqh - 1% of a query container\'s height',
        'cqi':      'cqi - 1% of a query container\'s inline size',
        'cqmax':    'cqmax - The larger value of cqi or cqb',
        'cqmin':    'cqmin - The smaller value of cqi or cqb',
        'cqw':      'cqw - 1% of a query container\'s width',
    },

    'Absolute lengths':{
        'cm':      'cm - (Centimeters) 1cm = 96px/2.54',
        'in':      'in - (Inches) 1in = 2.54cm = 96px',
        'mm':      'mm - (Millimeters) 1mm = 1/10th of 1cm',
        'pc':      'pc - (Picas) 1pc = 1/6th of 1in',
        'pt':      'pt - (Points) 1pt = 1/72th of 1in',
        'px':      'px - (Pixels) 1px = 1/96th of 1in',
        'Q':       'Q - (Quarter-millimeters) 1Q = 1/40th of 1cm',
    },

    'Angles':{
        'deg':      'deg - (Degrees) There are 360 degrees in a full circle.',
        'grad':     'grad - (Gradians) There are 400 gradians in a full circle.',
        'rad':      'rad - (Radians) There are 2π radians in a full circle.',
        'turn':     'turn - (Turns) There is 1 turn in a full circle.',
    },

    'Time':{
        'ms':     'ms - Milliseconds',
        's':      's - (Seconds) There are 1,000 milliseconds in a second.',
    },

    'Frequency':{
        'Hz':      'Hz - (Hertz) Represents the number of occurrences per second.',
        'kHz':     'kHz - (KiloHertz) A kiloHertz is 1000 Hertz.',
    },

    'Resolution':{
        'dpcm':     'dpcm - Dots per centimeter.',
        'dpi':      'dpi - Dots per inch.',
        'dppx':     'dppx - Dots per px unit.',
    },
};
export let CSS_Units: typeof CSS_Units0 & { jsx: ReactNode, pattern: string } = CSS_Units0 as any;

let pattern: string[] = [];

CSS_Units.jsx = <datalist id={"__jodel_CSS_units"}>{
   (Object.keys(CSS_Units) as (keyof typeof CSS_Units0)[]).map(k1 => {
        let v1: GObject = CSS_Units[k1];
       console.log("optgroup css units", {k1, v1, karr:Object.keys(v1), k1arr:Object.keys(CSS_Units)});

       return <optgroup label={k1}>
            {Object.keys(v1).map(k => {
                let v = v1[k];
                console.log("css units", {k, v, k1, v1, karr:Object.keys(v1), k1arr:Object.keys(CSS_Units)});
                pattern.push(k);
                return <option value={k} title={v}></option>
            })}
        </optgroup>
    })
}</datalist>;
//throw new Error("Stop");
CSS_Units.pattern = "^(" + pattern.join('|') + ")$";
windoww.CSS_Units = CSS_Units;


/*
export type CSS_AbsoluteUnit = 'px' | 'cm' | 'mm' | 'pt' | 'pc' | 'in' | '';
export type CSS_RelativeDomUnit = '%' | 'fr' | 'vw' | 'vh' | 'vmin' | 'vmax';
export type CSS_RelativeFontUnit =  'em' | 'rem' | 'ex' | 'ch';
export type CSSUnit = CSS_AbsoluteUnit | CSS_RelativeFontUnit | CSS_RelativeDomUnit;*/

export type StringControl = {type:'text', value: string};
export type NumberControl = {type:'number', value: number, unit: DocString<"css unit">};
export type PaletteControl = {type:'color', value: tinycolor.ColorFormats.RGBA[]}; // array of rgba: red, green, blue, alpha
export type PathControl = {type:'path', value: string, x: string, y: string, options: {k: string, v:string}[]};
export type PaletteType = Dictionary<string, PaletteControl | NumberControl | StringControl | PathControl>;


@RuntimeAccessible('DViewElement')
export class DViewElement extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LViewElement;
    // static logic: typeof LViewDViewElementElement;
    // static structure: typeof DViewElement;
    public static MeasurableKeys: string[] = ['onDataUpdate', 'onDragStart', 'onDragEnd', 'whileDragging', 'onResizeStart',
        'onResizeEnd', 'whileResizing', 'onRotationStart', 'onRotationEnd', 'whileRotating'];
    public static RecompileKeys: string[] = ['onDataUpdate', 'onDragStart', 'onDragEnd', 'whileDragging', 'onResizeStart',
        'onResizeEnd', 'whileResizing', 'onRotationStart', 'onRotationEnd', 'whileRotating',
        'constants', 'usageDeclarations', 'jsxString', 'preconditions', 'jsCondition', 'ocl', 'events', 'labels', 'longestLabel'];

    static LFromHtml(target?: Element | null): LViewElement | undefined { return LPointerTargetable.fromPointer(DViewElement.PtrFromHtml(target) as Pointer); }
    static DFromHtml(target?: Element | null): DViewElement | undefined { return DPointerTargetable.fromPointer(DViewElement.PtrFromHtml(target) as Pointer); }
    static PtrFromHtml(target?: Element | null): Pointer<DViewElement> | undefined {
        while (target) {
            if ((target.attributes as any).viewid) return (target.attributes as any).viewid.value;
            target = target.parentElement;
        }
        return undefined;
    }
    // inherited redefine
    // public __raw!: DViewElement;
    id!: Pointer<DViewElement, 1, 1, LViewElement>;


    // own properties
    isValidation!: boolean; // only for root views (ex viewpoints) to group views semantically.
    name!: string;
    isExclusiveView!: boolean;

    // processate 1 sola volta all'applicazione della vista o all'editing del campo
    constants?: string;
    // _parsedConstants?: GObject; // should be protected but LView is not subclass

    // evaluate tutte le volte che l'elemento viene aggiornato (il model o la view cambia).
    preRenderFunc!: string;

    jsxString!: string; // l'html template
    usageDeclarations?: string;

    longestLabel?: DocString<"function">;
    labels?: DocString<"function">;

    forceNodeType?: DocString<'component name (Vertex, Field, GraphVertex, Graph)'>; // used in DefaultNode
    // scalezoomx: boolean = false; // whether to resize the element normally using width-height or resize it using zoom-scale css
    // scalezoomy: boolean = false;
    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;
    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    appliableTo!: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'EdgePoint'|'Field';
    subViews!: Dictionary<Pointer<DViewElement>, number/* priority boost */>;
    oclCondition!: string; // ocl selector
    jsCondition!: string; // js selector
    oclUpdateCondition!: DocString<(view: LViewElement)=>boolean>;
    //oclUpdateCondition_PARSED!: undefined | ((view: LViewElement)=>boolean); moved in transient
    OCL_NEEDS_RECALCULATION!: boolean; // if only the oclCondition needs to be reapplied to all model elements
    OCL_UPDATE_NEEDS_RECALCULATION!: boolean; // if both ocl needsto be reapplied and the oclUpdateCondition -> transient.view[v.id].oclUpdateCondition_PARSED needs to be remade
    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    defaultVSize!: GraphSize;
    adaptHeight!: boolean;// | 'fit-content' | '-webkit-fill-available';
    adaptWidth!: boolean;
    /*width!: number;
    height!: number;*/
    draggable!: boolean;
    resizable!: boolean;
    viewpoint!: Pointer<DViewPoint>;
    //display!: 'block'|'contents'|'flex'|string;
    //constraints!: GObject<"obsolete, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    onDataUpdate!: string;
    onDragStart!: string;
    onDragEnd!: string;
    whileDragging!: string;
    onResizeStart!: string;
    onResizeEnd!: string;
    whileResizing!: string;
    onRotationStart!: string;
    onRotationEnd!: string;
    whileRotating!: string;
    events!: Dictionary<DocString<"functionName">, DocString<"functionBody">>;
    bendingMode!: EdgeBendingMode;
    edgeGapMode!: EdgeGapMode;
    //useSizeFrom!: EuseSizeFrom;
    storeSize!: boolean;
    size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>;
    lazySizeUpdate!: boolean; // if true updates it once when the vertex is released. if false updates vertex position every X millisecond while dragging.
    edgeStartOffset!: GraphPoint;
    edgeEndOffset!: GraphPoint;
    edgeStartOffset_isPercentage!: boolean;
    edgeEndOffset_isPercentage!: boolean;
    edgeStartStopAtBoundaries!: boolean;
    edgeEndStopAtBoundaries!: boolean;
    edgePointCoordMode!: CoordinateMode;
    edgeHeadSize!: GraphPoint;
    edgeTailSize!: GraphPoint;
    palette!: Readonly<PaletteType>;
    css!: string;
    cssIsGlobal!: boolean;
    /* private */ compiled_css!: string;
    /* private */ css_MUST_RECOMPILE!: boolean;
    father?: Pointer<DViewElement>;
/*
    public static new(name: string, jsxString: string, father?: DViewElement, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclCondition: string = '',
                      priority?: number, persist: boolean = true, isDefaultView: boolean = false): DViewElement {
        let id = isDefaultView ? 'Pointer_View' + name : undefined;
        let vp = father.viewpoint;
        return new Constructors(new DViewElement('dwc'), father.id, persist, undefined, id).DPointerTargetable()
            .DViewElement(name, jsxString, vp, defaultVSize, usageDeclarations, constants,
            preRenderFunc, appliableToClasses, oclCondition, priority).end();
    }*/
    public static new(...a:never): any{}
    public static new2(name: string, jsxString: string, father0?: DViewElement, callback?: (d:DViewElement)=>void, persist: boolean = true,
                       id?: string): DViewElement {
        // let id = isDefaultView ? 'Pointer_View' + name : undefined;
        let father: DViewElement = father0 || DPointerTargetable.from(Defaults.viewpoints[0]);
        let vp = father.viewpoint || Defaults.viewpoints[0];
        return new Constructors(new DViewElement('dwc'), father.id, persist, undefined, id)
            .DPointerTargetable().DViewElement(name, jsxString, vp).end(callback);
    }

    static newDefault(forData?: DNamedElement): DViewElement{
        const jsx = `<div className={'root'}>
    <div className={'header'}>
        <div className={'input-container mx-2'}>
            <b className={'object-name'}>Name:</b>
            <Input data={data} field={'name'} hidden={true} autosize={true} />
        </div>
    </div>
    <div className={'body'}>To add information here,<br/> edit the view<br/><i>"{view.name}"</i></div>
    {decorators}
</div>`;
        const palettes: PaletteType = {
            "border-color-": {type:"color", value: [{r:187, g:187, b:187, a:1}]},
            "background-": {type:"color", value: [{r:238, g:242, b:243, a:1}]},
            "color-": {type:"color", value: [{r:3, g:54, b:86, a:1}]},
        }
            const css = `.root {
    border: 1px solid var(--border-color-1);
    border-radius: 4px;
    background-color: var(--background-1);
    
    font-family: Verdana, sans-serif;
    color: var(--color-1);
    font-size: 0.7rem;
}
 
.root div.header {
    text-align: center;
    border-bottom: 1px solid var(--border-color-1);
    padding: 0px;
    margin: 0px;
}
 
.root div.header {
    font-size: 1rem;
}
 
.root div.header input:empty {
    margin-left: 0px;
}
.root div.body {
    text-align: center;
    font-weight: normal;  
    height: auto;
    padding: 5px;
}
 `;
        let query = '';
        if (forData) switch(forData.className) {
            case 'DClass':
                query = `context DObject inv: self.instanceof.id = '${forData.id}'`;
                break;
            case 'DAttribute':
            case 'DReference':
                query = `context DValue inv: self.instanceof.id = '${forData.id}'`;
                break;
            default:
                query = `context ${forData.className} inv: self.id = '${forData.id}'`;
                break;
        }
        const user = LUser.fromPointer(DUser.current);
        // const project = user?.project; if(!project) return this;
        let name: string;
        const vp: LViewPoint = user?.project?.activeViewpoint || LPointerTargetable.fromPointer(Defaults.viewpoints[0]);
        if (forData?.name) {
            name = forData.name + 'View';
        } else {
            let names: string[] = vp.subViews.map(v => v && v.name);
            name = U.increaseEndingNumber( 'view_' + 0, false, false, newName => names.indexOf(newName) >= 0);
        }
        return DViewElement.new2(name, jsx, vp.__raw,(d)=>{
            d.css = css;
            d.palette = palettes;
            d.css_MUST_RECOMPILE = true;
            d.oclCondition = query;
        }, true);
    }
}

@RuntimeAccessible('LViewElement')
export class LViewElement<Context extends LogicContext<DViewElement, LViewElement> = any, D extends DViewElement = any>
    extends LPointerTargetable { // MixOnlyFuncs(DViewElement, LPointerTargetable)

    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LViewElement;
    // static logic: typeof LViewElement;
    // static structure: typeof DViewElement;

    // inherited redefine
    public __raw!: DViewElement;
    id!: Pointer<DViewElement, 1, 1, LViewElement>;
    public r!: this;



    // own properties
    isValidation!: boolean; // only for root views (ex viewpoints) to group views semantically.
    name!: string;
    __info_of__name: Info = {isGlobal: true, type: ShortAttribETypes.EString, txt:<div>Name of the view</div>}
    isOverlay!:boolean;
    __info_of__isOverlay: Info = {isGlobal:true, type: ShortAttribETypes.EBoolean, txt:<div>If not exclusive, the view is meant to add a functional outline of tools to a primary View, or css.
            <br/>A non-exclusive view cannot be applied alone and needs an exclusive view to render the main graphical content.</div>};
    get_isOverlay(c: Context): this["isOverlay"] { return this.get_isExclusiveView(c); }
    set_isOverlay(val: this["isOverlay"], c: Context): boolean { return this.set_isExclusiveView(val, c); }

    label!: this["longestLabel"];  // should never be read change their documentation in write only. their values is "read" in this.segments
    longestLabel!: labeltype; // (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType;
    labels!: labeltype; // (e:LVoidEdge, segment: EdgeSegment, allNodes: LEdge["allNodes"], allSegments: EdgeSegment[]) => PrimitiveType;
    __info_of__longestLabel: Info = {label:"Longest label", type:"function(edge)=>string",
        readType: "(edge:LEdge, segment: EdgeSegment, allNodes: DGraphElement[], allSegments: EdgeSegment[]) => PrimitiveType",
        writeType: "string",
        txt: <span>Label assigned to the longest path segment.</span>}
    __info_of__label: Info = {type: "", txt: <span>Alias for longestLabel</span>};
    __info_of__labels: Info = {label:"Multiple labels",
        readType: "type of longestLabel | longestLabel[]",
        writeType: "string",
        txt: <span>Instructions to label to multiple or all path segments in an edge</span>
    };
    get_label(c: Context): this["longestLabel"] { return this.get_longestLabel(c); }
    set_label(val: DVoidEdge["longestLabel"], c: Context): boolean { return this.set_longestLabel(val, c); }
    get_longestLabel(c: Context): this["longestLabel"] { return transientProperties.view[c.data.id].longestLabel; }
    get_labels(c: Context): this["labels"] { return transientProperties.view[c.data.id].labels; }
    set_longestLabel(val: DVoidEdge["longestLabel"], c: Context): boolean {
        Log.exDevv('Edge.labels are disabled, pass it through props instead');
        if (val === c.data.longestLabel) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "longestLabel", val);
            SetRootFieldAction.new("VIEWS_RECOMPILE_longestLabel+=", c.data.id);
        });
        return true;
    }
    set_labels(val: DVoidEdge["labels"], c: Context): boolean {
        Log.exDevv('Edge.labels are disabled, pass it through props instead');
        if (val === c.data.labels) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "labels", val);
            SetRootFieldAction.new("VIEWS_RECOMPILE_labels+=", c.data.id);
        });
        return true; }

    allPossibleParentViews!: LViewElement[];
    __info_of__allPossibleParentViews: Info = {isGlobal: true, type: 'LViewElement[]', txt: 'All views except subviews and this view.' }
    get_allPossibleParentViews(c: Context): this['allPossibleParentViews']{
        let subviewsarr = this.get_allSubViews(c);
        let subviews = U.objectFromArray(subviewsarr, (sv)=>sv.id);
        let allviewsarr: LViewElement[] = Selectors.getAll(DViewElement, undefined, undefined, true, true);
        let allviews = U.objectFromArray(allviewsarr, (sv)=>sv.id);
        console.log('allPossibleParentViews', {subviews, subviewsarr, allviews:{...allviews}, allviewsarr});
        for (let k in subviews) {
            delete allviews[k];
        }
        delete allviews[c.data.id];
        console.log('allPossibleParentViews ret', {allviews});
        return Object.values(allviews);
    }



    explicitApplicationPriority!: number; // priority of the view, if a node have multiple applicable views, the view with highest priority is applied.
    __info_of__explicitApplicationPriority: Info = {isGlobal: true, type: ShortAttribETypes.EByte, label:"explicit priority",
        txt: 'Application priority of view. If multiple views match an element, the highest priority will render the main jsx.' }
    get_explicitApplicationPriority(c: Context): this["explicitApplicationPriority"] {
        if (c.data.explicitApplicationPriority !== undefined) return c.data.explicitApplicationPriority;
        else return (c.data.jsCondition?.length || 1) + (c.data.oclCondition?.length || 1); }
    set_explicitApplicationPriority(val: this["explicitApplicationPriority"] | undefined, c: Context): boolean {
        if (c.data.explicitApplicationPriority === val) return true;
        for (let nid in transientProperties.node){
            let tn = transientProperties.node[nid];
            for (let vid in tn.viewScores){
                let tnv = tn.viewScores[vid];
                if (!tnv.metaclassScore || !tnv.OCLScore) continue;
                if (tnv.jsScore === true) tn.needSorting = true; // recompute final score.
            }
        }
        SetFieldAction.new(c.data, "explicitApplicationPriority", val as number, '', false);
        return true;
    }

    isExclusiveView!: boolean;
    __info_of__isExclusiveView: Info = {isGlobal:true, type: ShortAttribETypes.EBoolean, txt:<div>If not exclusive, the view is meant to add a functional outline of tools to a primary View, or css.
    <br/>A non-exclusive view cannot be applied alone and needs an exclusive view to render the main graphical content.</div>};
    get_isExclusiveView(c: Context): this["isExclusiveView"] { return c.data.isExclusiveView; }
    set_isExclusiveView(val: this["isExclusiveView"], c: Context): boolean {
        if (Defaults.check(c.data.id)) return true; // cannot delete or "demote" to decorations the main views, to make sure there is always at least 1 appliable view.
        return SetFieldAction.new(c.data, "isExclusiveView", !!val, '', false);
    }

    constants?: string;
    __info_of__constants: Info = {todo:true, isGlobal: true, type: "Function():Object", label:"constants declaration",
        txt:<div>Data used in the visual representation, meant to be static values evaluated only once when the view is first applied.<br/>
        Check default value view for an example.<br/>
    </div>};
    // Example 1: <code>{'{color:"red", background: "gray"}'}</code><br/>
    // Example 2: <code>{'function(){\n    let fib = [1,1]; for (let i = 2; i < 100) { fib[i] = fib[i-2]+fib[i-1]; }\n    return fib; }'}</code><br/>

    preRenderFunc?: string; // evalutate tutte le volte che l'elemento viene aggiornato (il model o la view cambia)
    __info_of__preRenderFunc: Info = {isGlobal: true, obsolete: true, type: "Function():Object", label:"pre-render function",
        txt:<div>Data used in the visual representation, meant to be dynamic values evaluated every time the visual representation is updated.<br/>Replaced by usageDeclarations.</div>}

    protected _defaultGetter(c: Context, k: keyof Context["data"]): any { return this.__defaultGetter(c, k); }

    protected _defaultSetter(v: any, c: Context, k: keyof Context["data"]): any { return this.__defaultSetter(v, c, k); }

    jsxString!: string;
    __info_of__jsxString: Info = {isGlobal: true, type: "text", label:"JSX template",
        txt:<div>The main ingredient, a <a href={"https://react.dev/learn/writing-markup-with-jsx"}>JSX template</a> that will be visualized in the graph.</div>}
    protected get_jsxString(context: Context): this['jsxString'] {
        return context.data.jsxString;
    }
    protected set_jsxString(val: this['jsxString'], context: Context): boolean {
        TRANSACTION(() => {
            // const jsx = DSL.parser(val);
            SetFieldAction.new(context.data, 'jsxString', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_jsxString', context.data.id, '+=', false);
        });
        return true;
    }

    usageDeclarations?: string;
    __info_of__usageDeclarations: Info = {todo: false, isGlobal: true, type: "Function():Object", label:"usage declarations",
        txt: <div>Subset of the global or elements's data state that is graphically used.
            <br/>If specified the element will only update when one of those has changed.
            <br/>Can optimize performance and ensure the node is updated even when navigating remote properties that
            <br/>    don\'t belong to this element, like visualizing the name of an object pointed by a reference.
            <br/>Context: it has the usual variables present in a JSX template (data, view, node...)
            <br/>    plus a special variable "ret" where dependencies are registered.{/*and a "state" variable containing the entire application state.*/}
            <br/>Usage Example: see the default view for value.
    </div>}
    protected get_usageDeclarations(c: Context): this["usageDeclarations"]{
        return c.data.usageDeclarations || "(ret)=>{ // scope contains: data, node, view, constants, state\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "ret.data = data\n" +
            "ret.node = node\n" +
            "ret.view = view\n" +
            "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
            // if you want your node re-rendered every time, add a dependency to ret.state = state; or ret.update = Math.random();
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "}";
    }
    protected set_usageDeclarations(val: this['usageDeclarations'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'usageDeclarations', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_usageDeclarations', context.data.id, '+=', false);
        })
        return true;
    }

    // format should be array of (usedPaths: string[]) starting with "data." AUTOMATICALLY inefered from the ocl editor.
    oclUpdateCondition!: (oldData: LModelElement, newData:LModelElement) => boolean;
    __info_of__oclUpdateCondition: Info = {readType: '(view: LViewElement)=>boolean', writeType: 'function string',
        txt: "[Optionally] Declare variables that are used in OCL condition, so that OCL will be re-checked only when those values have changed."}
    get_oclUpdateCondition(c: Context): this["oclUpdateCondition"] { return transientProperties.view[c.data.id].oclUpdateCondition_PARSED; }
    set_oclUpdateCondition(val: DocString<"function">, c: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "oclUpdateCondition", val || '', '', false);
            // not recalculated right now because the change needs to be sent to collaborative editor users
            // it is pointer, but i don't want to set pointedby's, it is very short lived.
            SetRootFieldAction.new("OCL_UPDATE_NEEDS_RECALCULATION", c.data.id, '+=', false);
        });
        return true;
    }
/* moved it as setrootfield action and as array. check it after every reducer. update im same style the color palette too?
    OCL_NEEDS_RECALCULATION!: boolean;
    __info_of__OCL_NEEDS_RECALCULATION: Info = {hidden: true, type: ShortAttribETypes.EBoolean,
        txt: "if only the oclCondition needs to be reapplied to all model elements"}
    get_OCL_NEEDS_RECALCULATION(c: Context): this["OCL_NEEDS_RECALCULATION"] { return c.data.OCL_NEEDS_RECALCULATION; }
    set_OCL_NEEDS_RECALCULATION(val: this["OCL_NEEDS_RECALCULATION"], c: Context): boolean { return this.cannotSet('OCL_NEEDS_RECALCULATION'); }

    OCL_UPDATE_NEEDS_RECALCULATION!: boolean;
    __info_of__OCL_UPDATE_NEEDS_RECALCULATION: Info = {hidden: true, type: ShortAttribETypes.EBoolean,
        txt: "if both ocl needsto be reapplied and the oclUpdateCondition -> transient.view[v.id].oclUpdateCondition_PARSED needs to be remade"}
    get_OCL_UPDATE_NEEDS_RECALCULATION(c: Context): this["OCL_UPDATE_NEEDS_RECALCULATION"] { return c.data.OCL_UPDATE_NEEDS_RECALCULATION; }
    set_OCL_UPDATE_NEEDS_RECALCULATION(val: this["OCL_UPDATE_NEEDS_RECALCULATION"], c: Context): boolean { return this.cannotSet('OCL_UPDATE_NEEDS_RECALCULATION'); }*/

    private css_MUST_RECOMPILE!: boolean;
    public cssIsGlobal!: boolean;
    __info_of__cssIsGlobal: Info = {type: ShortAttribETypes.EBoolean, txt: "Use with caution!\nIf true, custom css can affect even elements not matched with this view, or outside the graph."}
    get_cssIsGlobal(c: Context): this["cssIsGlobal"] {
        return c.data.cssIsGlobal;
    }
    set_cssIsGlobal(val: this["cssIsGlobal"], c: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "cssIsGlobal", !!val, '', false);
            // compile only when accessed, to prevent color inputs to do a mess of compilations
            SetFieldAction.new(c.data, "css_MUST_RECOMPILE", true, '', false);
        });
        return true;
    }
    public css!: string;
    __info_of__css: Info = {type: "css string", txt: "Inject custom css that cannot be inserted inline like :hover or css variables.\nSupport LESS syntax."}
    get_css(c: Context): this["css"] { return c.data.css; }
    set_css(val:this["css"], c: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "css", val, '', false);
            // compile only when accessed, to prevent color inputs to do a mess of compilations
            SetFieldAction.new(c.data, "css_MUST_RECOMPILE", true, '', false);
        });
        return true;
    }

    compiled_css!: string;
    __info_of__compiled_css: Info = { hidden: true, txt:'css + palettes compiled from less in css'};
    get_compiled_css(c: Context): this["compiled_css"] {
        if (c.data.isExclusiveView && c.data.className === DViewPoint.cname && !Defaults.check(c.data.id) ) {
            let project = this.get_project(c);
            let dproject = project?.__raw as DProject | undefined;
            if (!(dproject && dproject.activeViewpoint === c.data.id)) return '';
        }
        if (!c.data.css_MUST_RECOMPILE) return c.data.compiled_css; // return c.proxyObject.r.__raw.compiled_css;
        let s = '';
        const allowLESS = false;
        let shortPaletteName: string;
        let cc = c;
        function rgbastring(c: tinycolor.ColorFormats.RGBA): string{
            Log.exDev(!c, "invalid color:", {id: cc.data.id, c, shortPaletteName, p:cc.data.palette});
            return "rgba("+c.r+","+c.g+","+c.b+","+c.a+")";
        }
        //let palettes = U.paletteSplit(c.data.palette);
        for (let paletteName in c.data.palette) {
            let palette0 = c.data.palette[paletteName] as any;
            if (palette0.type === "color") {
                let palette = palette0 as PaletteControl;
                let colors = palette.value;
                if (!colors.length) continue;
                if (['-', '_'].includes(paletteName[paletteName.length-1])) shortPaletteName = paletteName.substring(0, paletteName.length - 1);
                else shortPaletteName = paletteName;
                let rgba = rgbastring(colors[0]);
                // set prefixed name without number
                if (allowLESS) s += "\t@" + shortPaletteName + ": " + rgba + ';\n';
                s += "\t--" + shortPaletteName + ": " + rgba + ';\n';
                // set prefixed-0 name
                if (allowLESS) s += "\t@" + paletteName + '0: ' + rgba + ';\n';
                s += "\t--" + paletteName + '0: ' + rgba + ';\n';
                // set prefixed-1 to prefixed-...n names
                for (let i = 0 ; i < colors.length; i++) {
                    rgba = rgbastring(colors[i]);
                    if (allowLESS) s += "\t@" + paletteName + (i+1) + ": " + rgba + ';\n';
                    s += "\t--" + paletteName + (i+1) + ": " + rgba + ';\n';
                }
            } else if (palette0.type === 'path'){
                let palette: PathControl = palette0;
                let val = U.replaceAll(palette.value, 'view.', '');
                val = U.replaceAll(val, 'this.', '');
                val = U.replaceAll(val, 'x', palette.x);
                val = U.replaceAll(val, 'y', palette.y);
                val = U.replaceAll(val, '+', ' +');
                val = U.replaceAll(val, '-', ' -'); // important: cannot add space post-dash or it's harder to distinguish unary and binary -
                val = U.replaceAll(val, '/', ' / ');
                val = U.replaceAll(val, '*', ' * ');
                let valarr: (string | number)[] = val.split(/[,\s]/);
                // [] not allowed
                valarr = (valarr as string[]).map(val => {
                    if (!isNaN(+val)) return val;
                    let patharr: string[] = val.split('.');
                    let curr: GObject = c.data;
                    for (let pathseg of patharr) {
                        curr = curr[pathseg];
                        Log.e(!curr && (val.length > 1 || patharr.length > 1), "invalid variable path in css path control", {token:val, view:c.data.name});
                        if (!curr) break;
                    }
                    if (typeof curr === "object" || (typeof curr === "undefined" && (val.length > 1 || patharr.length > 1)))
                        Log.ee( "invalid variable path in css path control", {token:val, view:c.data.name});
                    else val = curr || val;
                    return val;
                }).filter(p=>!!p);

                for (let i = 0 ; i < valarr.length; i++) {
                    let val = valarr[i];
                    switch (val) { // i avoid subtracting L 1 -1 with spaces. it's unary if doesn't have a postfix space.
                        default: continue;
                        case '*': valarr[i] = +valarr[i-1] * +valarr[i+1]; valarr[i-1] = valarr[i+1] = ''; break;
                        case '/': valarr[i] = +valarr[i-1] / +valarr[i+1]; valarr[i-1] = valarr[i+1] = ''; break;
                        case '+': valarr[i] = +valarr[i-1] + +valarr[i+1]; valarr[i-1] = valarr[i+1] = ''; break;
                        case '-': valarr[i] = +valarr[i-1] - +valarr[i+1]; valarr[i-1] = valarr[i+1] = ''; break;
                    }
                }
                val = valarr.filter(p=>!!p).join(' ');
                val = "'"+val+"'";
                if (allowLESS) s += "\t@" + paletteName + ": " + val + ';\n';
                s += "\t--" + paletteName + ': ' + val + ';\n';
            }
            else {
                // number or text
                let palette: NumberControl | StringControl = palette0;
                let val = palette.value + ((palette as NumberControl).unit || '');
                if (!val) val = "''";
                if (allowLESS) s += "\t@" + paletteName + ": " + val + ';\n';
                s += "\t--" + paletteName + ': ' + val + ';\n';
            }
        }
        s += '\n\t' + U.replaceAll(c.data.css, '\n', '\n\t');
        const localViewSelector: string = (c.data.className === 'DViewPoint') ? '.GraphContainer' : '.'+c.data.id; // '[data-viewid="'+c.data.id+'"]';
        s = (!c.data.cssIsGlobal ? localViewSelector : 'body') +' {\n' + s + '\n}';
        // not an error, i'm updating directly d-view that is usually wrong, this is to prevent multiple nodes with same view to trigger compile and redux actions
        // count as if it's a derived attribute not really part of the store.
        c.data.css_MUST_RECOMPILE = false;
        return c.data.compiled_css = s;
    }
    set_compiled_css(val: this["compiled_css"], c: Context): boolean {
        Log.exx("Do not use setter for this, set it directly in d-object, along with compiled_css." +
        "\nOtherwise multiple nodes of the same view will start compiling together.\n" as any);
        return false;
    }

    public palette!: PaletteType;
    __info_of__palette: Info = {type: "Dictionary<prefix, colors[]>", txt:"Specify a set of colors, numbers or text variables to be used in the graphical syntax through css variables."}
    get_palette(c: Context): this["palette"] { return c.data.palette; }
    set_palette(val:this["palette"], c: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(c.data, "palette", val, '', false);
            SetFieldAction.new(c.data, "css_MUST_RECOMPILE", true, '', false);
        });
    return true; }

    forceNodeType?: DocString<'component name'>;
    __info_of__forceNodeType: Info = {isGlobal:true, type: "EGraphElements", enum: EGraphElements, label:"force node type",
        txt:<div>Forces this element to be rendered with your component of choice instead of automatic selection when generated by a &lt;DefaultNode&gt; tag.</div>}

    zoom!: GraphPoint;
    __info_of__zoom: Info = {todo: true, isNode: true, type: GraphPoint.cname, txt:<div>Zooms in or out the element using css scale.</div>}
    /*
    scalezoomx!: boolean; // whether to resize the element normally using width-height or resize it using zoom-scale css
    __info_of__scalezoomx: Info = {isNode: true, isEdge: false, isEdgePoint: false, txt:<div></div>}

    scalezoomy!: boolean;
    __info_of__scalezoomy: Info = {isNode: true, isEdge: false, isEdgePoint: false, txt:<div></div>}*/

    // not persistent, some not shared. deve essere diverso da utente ad utente perchè dipende dal pan e zoom nel grafo dell'utente attuale.
    // facendo pan su grafo html sposti gli elementi, per simulare uno spostamento del grafo e farlo sembrare illimitato.
    // __transient: DViewTransientProperties;

    appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
    __info_of__appliableToClasses: Info = {isGlobal: true, type: "EModelElements | EGraphElements",
        enum: {...EModelElements, ...EGraphElements, cname:"EModelElements | EGraphElements"}, label:"applicable to",
        txt: <div>Do a low priority match with elements of this type.
            <br/>This is just a shortcut with a lower priority than a OCL match.
            <br/>The same result can be obtained through OCL.</div>}

    appliableTo!: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'EdgePoint'|'Field';

    subViews!: LViewElement[];
    __info_of__subViews: Info = {isGlobal: true, hidden: true, type: "DViewElement[]", label:"sub-views",
        txt:<div>Views that are suggested to render elements contained in the current one with a higher match priority.
            <br/>Like a package view giving priority to a specific Class or Enum view to render his contained Classifiers in a common theme.
            <br/>If you wish to see the subview weight attached to the collection, access view.__raw.subviews instead.</div>}
    get_SubViews(c: Context): this["subViews"] {
        delete c.data.subViews.clonedCounter;
        return Object.keys(c.data.subViews).map( vid => LPointerTargetable.fromPointer(vid) as LViewElement);
    }
    set_SubViews(val: this["subViews"] | GObject, c: Context): boolean {
        let subviewsmap: GObject;
        if (Array.isArray(val)) {
            let ptrsArr = Pointers.fromArr(val);
            subviewsmap = U.objectFromArrayValues(ptrsArr, 1.5);
        } else subviewsmap = val || {};
        SetFieldAction.new(c.data, "subViews", subviewsmap, '', true);
        return true; }


    setSubViewScore!: (subview: Pack1<LViewElement>, boost?: number | null) => void;
    __info_of__setSubViewScore: Info = {isGlobal: true, hidden: true, type: "function(ViewElement, numeric_score): void", txt:<div>Adds, updates or unsets (if boost = null) a subview with his score.</div>}

    // adds, updates or unsets (if boost = null) a subview with his score.
    get_setSubViewScore(c: Context): ((subview: Pack1<LViewElement>, boost?: number | null) => void) {
        return (subview: Pack1<LViewElement>, boost: number| null = 1.5 ) => {
            let subviews = {...c.data.subViews};
            let ptr = Pointers.from(subview) as Pointer<DViewElement>;
            if (boost !== null) { // set mode
                if (subviews[ptr] === boost) return;
                subviews[ptr] = boost;
            } else {// set mode
                if (subviews[ptr] === undefined) return;
                delete subviews[ptr];
            }
            SetFieldAction.new(c.data, 'subViews',  subviews, '', true);
        };
    }


    allSubViews!: LViewElement[];
    __info_of__allSubViews: Info = {type: "ViewElement[]", txt: "recursively get this.subViews."}
    get_allSubViews(c: Context): this["allSubViews"] {
        delete c.data.subViews.clonedCounter;
        let arr: Pointer<DViewElement>[] = Object.keys(c.data.subViews);
        let nextarr: Pointer<DViewElement>[] = [];
        let idmap: Dictionary<Pointer, DViewElement> = {};
        let s: DState = store.getState();
        let dview: DViewElement;
        while (arr.length) {
            for (let vid of arr) {
                if (idmap[vid]) continue;
                dview = DPointerTargetable.fromPointer(vid, s);
                if (!dview) continue;
                idmap[vid] = dview;
                U.arrayMergeInPlace(nextarr, Object.keys(dview.subViews));
            }
            arr = nextarr;
            nextarr = [];
        }
        return LPointerTargetable.fromD(Object.values(idmap));
    }
    set_allSubViews(val: this["allSubViews"], c: Context): boolean { return this.wrongAccessMessage("cannot call set_allSubViews, it is a derived attribute"); }


    defaultVSize!: GraphSize;
    __info_of__defaultVSize: Info = {isNode:true, type: "GraphSize", label:"default size", txt: 'starting size of the node'}


    adaptWidth!: boolean;
    __info_of__adaptWidth: Info = {isNode:true, type: ShortAttribETypes.EBoolean, label:"adapt width",
        txt: 'Whether the element should expand his width to accomodate his own contents.'}

    adaptHeight!: boolean;
    __info_of__adaptHeight: Info = {isNode:true, type: ShortAttribETypes.EBoolean, label:"adapt height",
        txt: 'Whether the element should expand his height to accomodate his own contents.'}

    draggable!: boolean;
    __info_of__draggable: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: 'if the element can be dragged'}

    resizable!: boolean;
    __info_of__resizable: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: 'if the element can be resized'}

    oclCondition!: string; // ocl selector
    __info_of__oclCondition: Info = {isGlobal: true, hidden:true, label:"OCL apply condition", type: "text", // TODO: what's the difference with this.query?
        txt: 'OCL Query selector to determine which nodes or model elements should apply this view'}
    protected get_oclCondition(context: Context): this['oclCondition'] {
        return context.data.oclCondition;
    }
    set_oclCondition(val: string, context: Context): boolean {
        val = (val || '').trim();
        if (val === context.data.oclCondition) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'oclCondition', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_ocl', context.data.id, '+=', false); // it is pointer, but for transient stuff there is no need to set pointedby's
        })
        return true;
    }

    jsCondition!: string; // js selector
    __info_of__jsCondition: Info = {isGlobal: true, hidden:true, label:"js apply condition", type: "text",
        txt: 'js Query selector to determine which nodes or model elements should apply this view'}
    protected get_jsCondition(context: Context): this['jsCondition'] {
        return context.data.jsCondition;
    }
    set_jsCondition(val: string, context: Context): boolean {
        val = (val || '').trim();
        if (val === context.data.jsCondition) return true;
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'jsCondition', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_jsCondition', context.data.id, '+=', false);
        })
        return true;
    }

    // todo: how about allowing a view to be part in multiple vp's? so this reference would be an array or removed, and you navigate only from vp to v.
    viewpoint!: LViewPoint;
    __info_of__viewpoint: Info = {hidden: true, type: LViewPoint.cname, txt: <div>The collection of views containing this one, useful to activate multiple views at once.</div>}

    display!: 'block'|'contents';
    __info_of__display: Info = {obsolete: true, isNode: true, type: ShortAttribETypes.EString,
        txt: 'complete css injection instead'}

    onDragStart!: string;
    __info_of__onDragStart: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node begins being dragged.'}
    protected get_onDragStart(context: Context): this['onDragStart'] {
        return context.data.onDragStart;
    }
    protected set_onDragStart(val: this['onDragStart'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onDragStart', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onDragStart', context.data.id, '+=', false);
        })
        return true;
    }

    onDragEnd!: string;
    __info_of__onDragEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being dragged.'}
    protected get_onDragEnd(context: Context): this['onDragEnd'] {
        return context.data.onDragEnd;
    }
    protected set_onDragEnd(val: this['onDragEnd'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onDragEnd', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onDragEnd', context.data.id, '+=', false);
        })
        return true;
    }

    whileDragging!: string;
    __info_of__whileDragging: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being dragged.'}
    protected get_whileDragging(context: Context): this['whileDragging'] {
        return context.data.whileDragging;
    }
    protected set_whileDragging(val: this['whileDragging'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'whileDragging', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_whileDragging', context.data.id, '+=', false);
        })
        return true;
    }

    onResizeStart!: string;
    __info_of__onResizeStart: Info = {isNode: true, type: "Function():void",
    txt: 'Custom event activated when a node begins being resized.'}
    protected get_onResizeStart(context: Context): this['onResizeStart'] {
        return context.data.onResizeStart;
    }
    protected set_onResizeStart(val: this['onResizeStart'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onResizeStart', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onResizeStart', context.data.id, '+=', false);
        })
        return true;
    }

    onResizeEnd!: string;
    __info_of__onResizeEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being resized.'}
    protected get_onResizeEnd(context: Context): this['onResizeEnd'] {
        return context.data.onResizeEnd;
    }
    protected set_onResizeEnd(val: this['onResizeEnd'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onResizeEnd', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onResizeEnd', context.data.id, '+=', false);
        })
        return true;
    }

    whileResizing!: string;
    __info_of__whileResizing: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being resized.'}
    protected get_whileResizing(context: Context): this['whileResizing'] {
        return context.data.whileResizing;
    }
    protected set_whileResizing(val: this['whileResizing'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'whileResizing', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_whileResizing', context.data.id, '+=', false);
        })
        return true;
    }

    onRotationStart!: string;
    __info_of__onRotationStart: Info = {isNode: true, type: "Function():void",
    txt: 'Custom event activated when a node begins being rotated.'}
    protected get_onRotationStart(context: Context): this['onRotationStart'] {
        return context.data.onRotationStart;
    }
    protected set_onRotationStart(val: this['onRotationStart'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onRotationStart', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onRotationStart', context.data.id, '+=', false);
        })
        return true;
    }

    onRotationEnd!: string;
    __info_of__onRotationEnd: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated when a node finishes being rotated.'}
    protected get_onRotationEnd(context: Context): this['onRotationEnd'] {
        return context.data.onRotationEnd;
    }
    protected set_onRotationEnd(val: this['onRotationEnd'], context: Context): boolean {
        TRANSACTION(()=>{
        SetFieldAction.new(context.data, 'onRotationEnd', val, '', false);
        SetRootFieldAction.new('VIEWS_RECOMPILE_onRotationEnd', context.data.id, '+=', false);
        })
        return true;
    }

    whileRotating!: string;
    __info_of__whileRotating: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated multiple times when mouse is moved while a node is being rotated.'}
    protected get_whileRotating(context: Context): this['whileRotating'] {
        return context.data.whileRotating;
    }
    protected set_whileRotating(val: this['whileRotating'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'whileRotating', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_whileRotating', context.data.id, '+=', false);
        })
        return true;
    }

    onDataUpdate!: string;
    __info_of__onDataUpdate: Info = {isNode: true, type: "Function():void",
        txt: 'Custom event activated every time a property of his model, node or view is changed while the element is visibly rendered in a graph.\n<br>Caution! this might cause loops.'}
    protected get_onDataUpdate(context: Context): this['onDataUpdate'] {
        return context.data.onDataUpdate;
    }
    protected set_onDataUpdate(val: this['onDataUpdate'], context: Context): boolean {
        TRANSACTION(()=>{
            SetFieldAction.new(context.data, 'onDataUpdate', val, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_onDataUpdate', context.data.id, '+=', false);
        })
        return true;
    }

    events!: Dictionary<DocString<"functionName">, ((...a:any)=>any)>;
    event!:  Dictionary<DocString<"functionName">, ((...a:any)=>any)>;
    __info_of__events: Info = {todo: true, isGlobal: true, type: "Dictionary<name, function>",
        txt: <div>Custom events callable through JSX user interaction<br/>eg: &lt;div onClick=&#123;()=&gt;view.eventname()&#125; /&gt;</div>}
    __info_of__event: Info = {todo: true, isGlobal: true, type: "Dictionary<name, function>", txt: 'Alias for this.events'}
    protected get_event(c: Context): this['events'] { return this.get_events(c); }
    protected get_events(c: Context): this['events'] {
        Log.exx("use node.events instead", U.getStackTrace());
        return {};
        // return transientProperties.view[c.data.id]?.events || {};
    }
    protected set_events(val: DViewElement["events"], context: Context): boolean {
        const addUD = true;
        TRANSACTION(()=> {
            SetFieldAction.new(context.data, 'events', val, '+=', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_events', {
                vid: context.data.id,
                keys: Object.keys(val)
            }, '+=', false);
            let udstr = context.data.usageDeclarations;
            if (!addUD || !udstr) return;
            let delta = U.objectDelta(context.data.events, val, false);
            for (let key in delta) {
                let v = val[key];
                let autogenstr = 'ret.' + key + ' = node.events.'+key+'; // @autogenerated, do not edit\n';
                if (!v) udstr = udstr.split(autogenstr).join('');
                else {
                    if (!context.data.events[key]) { // insert
                        let findstr = '// ** declarations here ** //\n';
                        let insertat = udstr.indexOf(findstr);
                        if (insertat === -1) continue; // malformed ud, will skip
                        insertat += findstr.length;
                        udstr = udstr.substring(0, insertat) + autogenstr + udstr.substring(insertat);
                    } else {
                        // just updated func body, no name changed, no need to update UD.
                    }
                }
            }
            if (udstr === context.data.usageDeclarations) return;
            SetFieldAction.new(context.data, 'usageDeclarations', udstr, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_usageDeclarations', context.data.id, '+=', false);
        })
        return true;
    }

    constraints!: GObject<"todo, used in Vertex. they are triggered by events (view.onDragStart....) and can bound the size of the vertex">[];
    __info_of__constraints: Info = {todo: true, isNode: true, type: "Function():void",
        txt: 'not supported yet'}


    bendingMode!: EdgeBendingMode;
    __info_of__bendingMode: Info = {isEdge: true, enum: EdgeBendingMode, type: '"L" | "Q" | "C" | "T" | "S" | "A" | "QT" | "CS"',
        label:"path mode",
        txt: <><div>How Svg path should use the EdgePoints to bend his shape{/*<a href={"https://css-tricks.com/svg-path-syntax-illustrated-guide/"}>to bend his shape</a>*/}</div></>}

    edgeGapMode!: EdgeGapMode;
    __info_of__edgeGapMode: Info = {isEdge: true, enum: EdgeGapMode, type: '"gap" | "average" | "autoFill" | "lineFill" | "arcFill"',
        label:"gap mode",
        txt: <><div>How the segment should treat the EdgePoint interruptions.<br/>"gap" leaves an empty space to not overlap the EdgePoint,
            <br/>"linefill" makes the edge stop at the EdgePoint borders, but then connects the gap with a line.</div></>}

    /*
    bindVertexSizeToView!: boolean;
    __info_of__bindVertexSizeToView: Info = {isNode:true, type:ShortAttribETypes.EBoolean, label:"bind sizes to view",
        txt: <div>Store the vertex size inside the view instead of inside the vertex.
            <br/>This causes the vertex to have different positions according to the view currently appied to it.</div>}*/
    storeSize!: boolean;
    __info_of__storeSize: Info = {isNode: true, type: ShortAttribETypes.EBoolean, label:"bind sizes to view",
        txt: "Active: the node position depends from the view currently displayed.Inactive: it depends from the graph."}

    lazySizeUpdate!: boolean;
    __info_of__lazySizeUpdate: Info = {isNode: true, type: ShortAttribETypes.EBoolean, txt: <div>If true updates the node position only when the drag action is finished. (best performance)</div>}

    edgeStartOffset!: GraphPoint;
    __info_of__edgeStartOffset: Info = {isEdge: true, type: GraphPoint.cname, label:"start offset",
        txt: "Location where outgoing edges should start their path, relative to top-upper corner of the element."}

    edgeEndOffset!: GraphPoint;
    __info_of__edgeEndOffset: Info = {isEdge: true,  type: GraphPoint.cname, label:"end offset",
        txt: 'Same as this.edgeStartOffset'}


    edgeStartOffset_isPercentage!: boolean;
    __info_of__edgeStartOffset_isPercentage: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"start offset is a %",
        txt: <div>Whether edgeStartOffset is an absolute value or a percentage.<br/>(eg: 50% of element width, vs 50 pixels flat).</div>}

    edgeEndOffset_isPercentage!: boolean;
    __info_of__edgeEndOffset_isPercentage: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"end offset is a %",
        txt: <div>Whether edgeStartOffset is an absolute value or a percentage.<br/>(eg: 50% of element width, vs 50 pixels flat).</div>}


    edgeStartStopAtBoundaries!: boolean;
    __info_of__edgeStartStopAtBoundaries: Info = {isEdge: true, type:ShortAttribETypes.EBoolean, label:"start cannot cross boundaries",
        txt: <div>Whether outgoing edges should cross the node boundaries overlapping the node\'s html or stop at them.<br/>Edge arrows might enter the node if this is on.</div>}

    edgeEndStopAtBoundaries!: boolean;
    __info_of__edgeEndStopAtBoundaries: Info = {isEdge: true, type: ShortAttribETypes.EBoolean, label:"end cannot cross boundaries",
        txt: <div>Whether incoming edges should cross the node boundaries overlapping the node\'s html or stop at them.<br/>Edge arrows might enter the node if this is on.</div>}


    edgePointCoordMode!: CoordinateMode;
    __info_of__edgePointCoordMode: Info = {isEdgePoint: true, type: "CoordinateMode", enum: CoordinateMode, label:"coordinate mode",
        txt:<div>Store coordinates as absolute coordinates or relative to start/end nodes.</div>}
    set_edgePointCoordMode(val: CoordinateMode, c: Context): boolean {
        TRANSACTION(()=>{
            setTimeout(()=>{ // needs to be done after coordinatemode change is applied
                let s: DState = store.getState();
                for (let nid in transientProperties.node) {
                    let tn = transientProperties.node[nid];
                    if (!tn || tn.mainView?.id !== c.data.id) continue;
                    let lnode: LEdgePoint = LPointerTargetable.fromPointer(nid, s);
                    let triggerCoordinateModeChange = lnode as any;
                    triggerCoordinateModeChange.size = lnode.size;
                }
            }, 100);
            SetFieldAction.new(c.data, 'edgePointCoordMode', val, '', false);
        })
        return true;
    }

    edgeHeadSize!: GraphPoint;
    __info_of__edgeHeadSize: Info = {isEdge: true, type:GraphPoint.cname, label:"head decorator size", txt:<div>Size of the edge head decorator if present.</div>}

    edgeTailSize!: GraphPoint;
    __info_of__edgeTailSize: Info = {isEdge: true, type:GraphPoint.cname, label:"tail decorator size", txt:<div>Size of the tail head decorator if present.</div>}

    protected size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>; // use getSize, updateSize;
    __info_of__size: Info = {isNode: true, hidden:true, type: ShortAttribETypes.EInt,
        txt:<div>Do not use directly, contains all the sizes stored in this view. use getSize, updateSize instead.</div>}


    __info_of__updateSize: Info = {isNode:true, hidden:true, type:"Function(Pointer<GraphElement | ModelElement>, GraphSize) => GraphSize",
        txt:<div>Updates the size stored in this view for target element.<br/>@returns: the delta of the change between old value and new value.</div>}
    __info_of__getSize: Info = {isNode:true, hidden:true, type:"Function(Pointer<GraphElement | ModelElement>) => GraphSize",
        txt:<div>Gets the size stored in this view for target element.</div>}

    // public _parsedConstants!: GObject;
    // public get__parsedConstants(c: Context): this['_parsedConstants'] { return c.data._parsedConstants || {}; }

    public get_constants(c: Context): this['constants'] {
        return c.data.constants;
    }


    public static parseConstants(funcCode?: string): GObject | undefined {
        if (!funcCode) return {};
        let parsedConstants: GObject = {};
        let context: GObject = {__param: parsedConstants};
        context.__proto__ = windoww.defaultContext;
        try{
            let parsedFunc = U.parseFunctionWithContextAndScope(funcCode, context, context, ['ret']);
            parsedFunc(context, parsedConstants);
            // U.evalInContextAndScopeNew( "("+funcCode+")(this.__param)", context, true, false, false);
        } catch (e: any) {
            Log.ee("Attempted to save an invalid view.constant setup. Cause:\n" + e.message.split("\n")[0], e)
            return undefined;
        }
        return parsedConstants;
    }

    public set_constants(value: this['constants'], c: Context): boolean {
        if (value === c.data.constants) return true;
        TRANSACTION(()=> {
            SetFieldAction.new(c.data.id, 'constants', value, '', false);
            SetRootFieldAction.new('VIEWS_RECOMPILE_constants', c.data.id, '+=', false);
            SetFieldAction.new(c.data.id, "css_MUST_RECOMPILE", true, '', false);
        })
        return true;
    }

    public get_preRenderFunc(c: Context): this['preRenderFunc'] {
        return c.data.preRenderFunc;
    }
    public set_preRenderFunc(value: this['preRenderFunc'], c: Context): boolean {
        const _value = value ? value : '() => {}';
        return SetFieldAction.new(c.data.id, 'preRenderFunc', _value, '', false);
    }

    public get_edgeHeadSize(c: Context): this["edgeHeadSize"] { return new GraphPoint(c.data.edgeHeadSize.x, c.data.edgeHeadSize.y); }
    public get_edgeTailSize(c: Context): this["edgeTailSize"] { return new GraphPoint(c.data.edgeTailSize.x, c.data.edgeTailSize.y); }
    public set_edgeHeadSize(v: Partial<this["edgeHeadSize"]>, c: Context): boolean {
        let s = c.data.edgeHeadSize || new GraphPoint(0, 0);
        if (!("x" in v)) v.x = s.x;
        if (!("y" in v)) v.y = s.y;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data.id, "css_MUST_RECOMPILE", true, '', false);
            SetFieldAction.new(c.data.id, "edgeHeadSize", v as GraphPoint, '', false);
        });
        return true; }
    public set_edgeTailSize(v: Partial<this["edgeTailSize"]>, c: Context): boolean {
        let s = c.data.edgeTailSize || new GraphPoint(0, 0);
        if (!("x" in v)) v.x = s.x;
        if (!("y" in v)) v.y = s.y;
        TRANSACTION(()=>{
            SetFieldAction.new(c.data.id, "css_MUST_RECOMPILE", true, '', false);
            SetFieldAction.new(c.data.id, "edgeTailSize", v as GraphPoint, '', false);
        });
        return true;
    }

    fatherChain!: LViewElement[];
    __info_of__fatherChain: Info = {type: 'LViewElement[]', txt: 'a list of all father elements sorted from the closest to farthest'};
    public get_fatherChain(c: Context): this["fatherChain"] {
        let current = this.get_father(c);
        if (!current) return [] as any;
        let ret: LViewElement[] = [];
        while (current) {
            ret.push(current);
            current = current.father;
        }
        return ret;
    }
    father?: LViewElement;
    public get_father(c: Context): this["father"] {
        return (LViewPoint.fromPointer(c.data.father as Pointer<DViewPoint>));
    }
    public get_viewpoint(c: Context): this["viewpoint"] {
        let p = c.data.father;
        if (!p) return LPointerTargetable.fromD(c.data);
        let curr: LViewElement = LPointerTargetable.fromPointer(p);
        while (curr) {
            let prev = curr.father;
            if (!prev) return curr as LViewPoint;
            curr = prev;
        }
        return undefined as any;
    }
    // public set_subViews(v: Pointer<DViewPoint>[], context: Context): boolean { return this.cannotSet('subViews, call set_viewpoint on the sub-elements instead.'); }

    // WARNING!! if there are mass vp assignments, preserveOrder=true will cause a vp to "lose" subviews and keep only the last assigned.
    public set_viewpoint(v: Pointer<DViewPoint>, context: Context, manualDview?: DViewElement, preserveOrder: boolean = false): boolean {
        Log.exDevv('setViewpoint() should not be called, call view.setFather(viewpoint) instead');
        return true;
    }
    public set_father(v: Pointer<DViewPoint>, context: Context, manualDview?: DViewElement, preserveOrder: boolean = false): boolean {
        let ret = false;
        let pvid: Pointer<DViewPoint> = v && Pointers.from(v);
        const data =  (manualDview || context.data);
        let id = data.id;
        let oldpvid = data.father;
        if (pvid === oldpvid) return true;
        let dfather: DViewElement = (v && typeof v === "object") ? ((v as any).__raw || v) as any : DPointerTargetable.fromPointer(pvid);

        TRANSACTION(()=>{
            ret = SetFieldAction.new(id, "father", pvid, '', true);
            if (data.viewpoint !== dfather.viewpoint) SetFieldAction.new(id, "viewpoint", dfather.viewpoint, '', true);
            if (oldpvid) {
                let subViews = {...DPointerTargetable.fromPointer(oldpvid).subViews};
                delete subViews[id];
                SetFieldAction.new(oldpvid, "subViews", subViews, '', true);
            }
            if (pvid) {
                let name = data.name;
                let copyPos = name.indexOf("Copy");
                let oldSubViews = DPointerTargetable.fromPointer(pvid).subViews;
                let insertBefore: string = '';
                let subViews: GObject = {};
                if (copyPos) {
                    let copiedFromName: string = copyPos ? name.substring(0, copyPos).trim() : '';
                    if (copiedFromName in oldSubViews) insertBefore = copiedFromName;
                    else {
                        for (let key in oldSubViews) if (key.indexOf(copiedFromName) === 0) { insertBefore = key; break; }
                    }
                }


                // WARNING!! if there are mass vp assignments, this will cause a vp to "lose" subviews and keep only the last assigned.
                if (preserveOrder && insertBefore) {
                    subViews = {};
                    for (let key in oldSubViews) {
                        subViews[key] = oldSubViews[key];
                        // just to reinsert subviews **in order** so Object.keys() fits the new subview near the cloned one.
                        if (key === insertBefore) subViews[id] = subViews[insertBefore];
                    }
                } else { subViews = {...oldSubViews}; subViews[id] = 1.5; }
                subViews[id] = insertBefore ? subViews[insertBefore] : 1.5;
                SetFieldAction.new(pvid, "subViews", subViews, '+=', true);
            }
        })
        return ret;
    }


    public get_subViews(context: Context): LViewElement[]{
        let subViewsPointers = context.data.subViews;
        let subViews: LViewElement[] = [];
        for (let pointer in subViewsPointers) {
            let item: LViewElement = MyProxyHandler.wrap(pointer);
            if (item !== undefined) subViews.push(item);
        }
        return subViews;
    }

    // returns the delta of change
    public updateSize(id: Pointer<DModelElement> | Pointer<DGraphElement>, size: Partial<GraphSize>): boolean { return this.wrongAccessMessage("updateSize"); }
    public get_updateSize(context: Context): this["updateSize"] {
        return (id: Pointer<DModelElement> | Pointer<DGraphElement>, size0: Partial<GraphSize>) => {
            let size: EPSize = size0 as any;
            let vp = context.proxyObject.viewpoint;
            if (!context.data.storeSize) {
                if (vp?.storeSize) return vp.updateSize(id, size);
                return false;
            }
            let vsize: EPSize = (context.data.size[id] || vp?.__raw.size[id]) as EPSize || {} as any;
            let newSize: EPSize = new GraphSize() as EPSize;
            console.log({vsize, newSize, size, vp, d:context.data})
            if (size.currentCoordType === vsize?.currentCoordType) { // if samecoord system mix them.
                newSize.x = size?.x !== undefined ? size.x : vsize.x;
                newSize.y = size?.y !== undefined ? size.y : vsize.y;
            } else if (size.x !== undefined && size.y !== undefined) { // if different coord system pick all of size
                newSize.x = size.x;
                newSize.y = size.y;
                newSize.currentCoordType = size.currentCoordType || CoordinateMode.absolute;
            } else if (vsize.x !== undefined && vsize.y !== undefined) { // or all of vsize if size was invalid
                newSize.x = vsize.x;
                newSize.y = vsize.y;
                newSize.currentCoordType = vsize.currentCoordType || CoordinateMode.absolute;
            }
            let defaultsize = context.data.defaultVSize || vp?.__raw.defaultVSize;
            if (newSize.x === undefined || newSize.y === undefined) { // only if pos is invalid, i take defaultvsize and force to use coord absolute.
                newSize = new GraphSize().clone(defaultsize) as EPSize;
                newSize.currentCoordType = CoordinateMode.absolute;
            }
            // w and h are always absolute so they can be mixed to whathever coordinate mode indipendently from the rest.
            newSize.w = size?.w !== undefined ? size.w : vsize.w;
            newSize.h = size?.h !== undefined ? size.h : vsize.h;
            if (newSize.h === undefined) newSize.h = defaultsize.h || 10;
            if (newSize.w === undefined) newSize.w = defaultsize.w || 10;

            if (!newSize.equals(vsize)) SetFieldAction.new(context.data.id, "size." + id as any, newSize);
            return true;
        }
    }

    public get_defaultVSize(context: Context): this["defaultVSize"]{ return context.data.defaultVSize; }
    public getSize(id: Pointer<DModelElement> | Pointer<DGraphElement>): GraphSize | undefined{ return this.wrongAccessMessage("getSize"); }
    public get_getSize(context: Context): ((...a:Parameters<this["getSize"]>)=>ReturnType<LViewElement["getSize"]>) {
        function impl_getSize(id: Pointer<DModelElement> | Pointer<DGraphElement>): ReturnType<LViewElement["getSize"]> {
            if (typeof id === "object") id = (id as any).id;
            let view = context.data;
            let ret: GraphSize;
            if (view.storeSize){
                ret = view.size[id];
                if (ret) return ret;
            }
            let vp = context.proxyObject.viewpoint;
            if (vp && view.id !== vp.id && vp.storeSize){
                ret = vp.size[id];
                if (ret) return ret; }
            return undefined;
        }

        return impl_getSize; }

    set_generic_entry(context: Context, key: keyof DViewElement, val: any): boolean {
        console.log('set_generic_entry', {context, key, val});
        SetFieldAction.new(context.data, key, val);
        return true;
    }

    children!: LViewElement[];
    get_children(context: Context): this['children'] { return this.get_subViews(context); }


    get_lazySizeUpdate(context: Context): D["lazySizeUpdate"] { return Debug.lightMode || context.data.lazySizeUpdate; }
    set_lazySizeUpdate(val: D["lazySizeUpdate"], context: Context): boolean {
        return Debug.lightMode || this.set_generic_entry(context, 'lazySizeUpdate', val);
    }

    get_bendingMode(context: Context): D["bendingMode"] { return context.data.bendingMode; }
    set_bendingMode(val: D["bendingMode"], context: Context): boolean {
        return this.set_generic_entry(context, 'bendingMode', val);
    }

    set_appliableTo(val: this["appliableTo"], c: Context): boolean { // appliableTo >= forcenodetype
        if (!val) val = 'Any';
        let forceNodeType: string = c.data.forceNodeType as string;
        if (forceNodeType !== val) switch(val) {
            // case "Any": break;
            default: forceNodeType = val;
        }

        console.log("set_appliableTo", {forceNodeType, val});
        BEGIN()
        if (forceNodeType !== c.data.forceNodeType) SetFieldAction.new(c.data, "forceNodeType", forceNodeType, '', false);
        SetFieldAction.new(c.data, "appliableTo", val, '', false);
        END();
        return true;
    }
    set_forceNodeType(val: this["forceNodeType"], c: Context): boolean {
        if (!val) val = 'Any';
        /*let appliableTo: string = c.data.appliableTo as string;
        if (appliableTo !== val) switch (appliableTo){
            case undefined: case 'Any': break;
            //case 'GraphVertex': if ((appliableTo as any) !== 'Graph' && (appliableTo as any) !== 'Vertex') appliableTo = val; break;
            default: appliableTo = val; break;
        }*/
        BEGIN()
        // if (appliableTo !== c.data.appliableTo) SetFieldAction.new(c.data, "appliableTo", appliableTo, '', false);
        SetFieldAction.new(c.data, "forceNodeType", val, '', false);
        END();
        return true;
    }
    get_appliableToClasses(context: Context): this["appliableToClasses"] { return context.data.appliableToClasses || []; }
    set_appliableToClasses(val: this["appliableToClasses"], context: Context): boolean {
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        val.sort();
        let hasChanged: boolean;
        if (val.length === context.data.appliableToClasses?.length) {
            hasChanged = false;
            for (let i = 0; i < val.length; i++) if (val[i] !== context.data.appliableToClasses[i]) { hasChanged = true; break; }
        } else hasChanged = true;

        if (!hasChanged) return true;
        TRANSACTION(()=>{
            this.set_generic_entry(context, "appliableToClasses", val);
            SetRootFieldAction.new('VIEWS_RECOMPILE_preconditions', context.data.id, '+=', false);
        })
        return true;
    }

    set_defaultVSize(val: GraphSize, c: Context): boolean{
        if (!val || typeof val !== "object") return true;
        let x = val.x ?? +val.x;
        let y = val.y ?? +val.y;
        let w = val.w ?? +val.w;
        let h = val.h ?? +val.h;
        if (isNaN(x)) x = c.data.defaultVSize.x;
        if (isNaN(y)) y = c.data.defaultVSize.y;
        if (isNaN(w)) w = c.data.defaultVSize.w;
        if (isNaN(h)) h = c.data.defaultVSize.h;
        if (x === c.data.defaultVSize.x && y === c.data.defaultVSize.y && w === c.data.defaultVSize.w && h === c.data.defaultVSize.h) return true;
        SetFieldAction.new(c.data, 'defaultVSize', {x, y, w, h} as any, '', false);
        return true
    }


    public duplicate(deep: boolean = true, new_vp?: DuplicateVPChange): this {
        return this.wrongAccessMessage( (this.constructor as typeof RuntimeAccessibleClass).cname + "duplicate()"); }
    /*protected*/ get_duplicate(c: Context): ((deep?: boolean, new_vp?: DuplicateVPChange) => LViewElement) {
        return (deep: boolean = false, new_vp0?: DuplicateVPChange) => {
            console.log("DViewelement.duplicate", {cn: c.data.className, n:c.data.name, deep, new_vp0});
            let lview: LViewElement = undefined as any;
            let state: DState = store.getState();
            TRANSACTION( () => {
                let pvid: Pointer<DViewPoint> = c.data.viewpoint as Pointer<DViewPoint>;
                const dclone: DViewElement = c.data.className === 'DViewPoint' ?
                    DViewPoint.newVP(`${c.data.name} Copy`) :
                    DViewElement.new2(`${c.data.name} Copy`, '', DPointerTargetable.from(c.data.father as any),
                        undefined, true);
                // todo: test if this have correct parent, vp and pointedby
                lview = LPointerTargetable.fromD(dclone);
                const new_vp: DuplicateVPChange = new_vp0 || {pvid};
                // || {pvid,  score: (DPointerTargetable.from(pvid, state) as DViewElement).subViews[c.data.id]}

                for (let key in c.data) {
                    switch(key) {
                        case 'subViews':
                            // duplicate childrens only if deep
                            if (!deep) break;
                            // let subviews: Dictionary<Pointer, number> = {}
                            for (const oldvid in c.data.subViews) {
                                const oldScore = c.data.subViews[oldvid];
                                (LPointerTargetable.fromPointer(oldvid, state) as LViewElement).duplicate(deep, {pvid:dclone.id/*, score:oldScore*/});
                                // then everything is set inside case 'viewpoint' of subviews cloning
                            }
                            //lview.subViews = subviews as any;
                            break;
                        case 'father':
                            this.set_father(new_vp.pvid, undefined as any, dclone, !deep);
                            break;
                        case 'viewpoint':
                            // update parent view
                            /*
                            let subviews: Dictionary<Pointer, number> = {};
                            subviews[dclone.id] = new_vp.score;
                            SetFieldAction.new(new_vp.pvid, 'subViews', subviews, '+=', true);
                            SetFieldAction.new(dclone.id, 'viewpoint', new_vp.pvid, '+=', true);*/
                            // insert in-place right after the cloned view, with old score.
                            //this.set_viewpoint(new_vp.pvid, undefined as any, dclone, !deep);
                            // SetFieldAction.new(dclone.id, 'father', new_vp.vpid, '+=', true);
                            break;
                        case '':
                        case 'id':
                        case 'name':
                        case 'className':
                        case 'pointedBy':
                        case '_storePath':
                        case '_subMaps':
                        case 'clonedCounter': break;
                        case 'css_MUST_RECOMPILE': break;

                        case 'isValidation':
                            console.log("duplicate " + c.data.name + " set isvalidation", {data:c.data, iv:c.data.isValidation});
                            (lview as any)[key] = (c.data as any)[key];
                            break;
                        default:
                            try {
                                let v: any = (c.data as any)[key];
                                if (typeof v === 'object') v = (Array.isArray(v) ? [...v] : {...v});
                                (lview as any)[key] = v;
                            } catch(e) {
                            //    Log.ee('Error on duplicate view:', e);
                            }
                    }
                }

                // insert in viewpoint.subview
                //let defaultViews: Dictionary<Pointer, boolean> = Defaults.defaultViewsMap;
                let vp: LViewPoint = c.proxyObject.viewpoint;
                // let oldViews: Pointer<DViewElement>[] = Object.keys(vp.__raw.subViews);
                // if (Defaults.viewpoints.indexOf(vpid)) oldViews = oldViews.filter( vid => !defaultViews[vid]);
                // let i: number = oldViews.indexOf(c.data.id);
                /*
                if (i === -1) oldViews.push(dclone.id);
                else oldViews.splice(i+1, 0, dclone.id); // insert in-place right after the cloned view
                vp.subViews = oldViews as any;*/
                // SetRootFieldAction.new('stackViews', dview.id, '+=', true);


                const isVP = c.data.className === 'DViewPoint';
                if (isVP) SetRootFieldAction.new(`viewpoints`, c.data.id, '+=', true);
                else SetRootFieldAction.new(`viewelements`, c.data.id, '+=', true);
                for (let key of DViewElement.RecompileKeys) SetRootFieldAction.new(`VIEWS_RECOMPILE_${key}`, c.data.id, '+=', false);
            })
            return lview;
        }
    }
}
RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewElement);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewElement);

type DuplicateVPChange = {
    pvid: Pointer<DViewElement>,
    // score: number //unused
}
export type WViewElement = getWParams<LViewElement, DPointerTargetable>;

@RuntimeAccessible('DViewTransientProperties')
export class DViewTransientProperties extends RuntimeAccessibleClass{
    static logic: typeof LPointerTargetable;
    _isDViewTransientProperties!: true;
    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private: DViewPrivateTransientProperties;
}

RuntimeAccessibleClass.set_extend(RuntimeAccessibleClass, DViewTransientProperties);
@RuntimeAccessible('LViewTransientProperties')
export class LViewTransientProperties extends LPointerTargetable{
    static structure: typeof DPointerTargetable;
    static singleton: LViewTransientProperties;
    _isLViewTransientProperties!: true;

    // isSelected: Dictionary<DocString<Pointer<DUser>>, boolean> = {};
    // private!: LViewPrivateTransientProperties;
    /*
        get_private(context: LogicContext<DViewTransientProperties>): LViewPrivateTransientProperties {
            return LViewTransientProperties.wrap(context.data.private, context.proxy.baseObjInLookup, context.proxy.additionalPath + '.private'); }*/
    /*
        get_isSelected(logicContext: LogicContext<TargetableProxyHandler<DViewTransientProperties>, DViewTransientProperties>): Proxyfied<Dictionary> {
            // @ts-ignore for $ at end of getpath
            console.log('GET_ISSELECTED handler func');
            return TargetableProxyHandler.getMap(logicContext.data.isSelected, logicContext, logicContext.proxy.additionalPath + '.' + (getPath as this).isSelected.$);
        }*/
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewTransientProperties);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewTransientProperties);
export type WViewTransientProperties = getWParams<LViewTransientProperties, DViewTransientProperties>;

/*

@RuntimeAccessible
export class DViewPrivateTransientProperties extends DPointerTargetable{
    static logic: typeof LViewPrivateTransientProperties;

    public size: GraphSize
    constructor(size?: GraphSize) {
        super();
        this.size = size || defaultVSize;
    }
}

@RuntimeAccessible
export class LViewPrivateTransientProperties extends DViewPrivateTransientProperties{
    static structure: typeof DViewPrivateTransientProperties;
    static singleton: LViewPrivateTransientProperties;

}*/
// shapeless component, receive jsx from redux
// can access any of the redux state, but will usually access 1-2 var among many,
// how can i dynamically mapStateToProps to map only the required ones?

