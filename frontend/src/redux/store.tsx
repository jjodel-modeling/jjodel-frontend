import {DPlaceholder, DTypeDeclaration, type Language, transientProperties, Uobj} from '../joiner';
import {
    Asterisk,
    Circle,
    Constructors,
    CoordinateMode,
    CreateElementAction, Cross, D,
    DAttribute,
    DClass,
    DClassifier, Decagon, DecoratedStar, DEdge,
    DEdgePoint,
    Defaults,
    DEnumerator,
    DEnumLiteral,
    DExtEdge,
    DGraph,
    DGraphElement,
    DGraphVertex,
    Dictionary,
    DLog,
    DModel,
    DModelElement,
    DObject, DocString,
    DOperation,
    DPackage,
    DParameter,
    DPointerTargetable,
    DProject,
    DRefEdge,
    DReference,
    DUser,
    DValue,
    DVertex,
    DViewElement,
    DViewPoint,
    DVoidEdge, Edge,
    EdgeBendingMode,
    EdgeHead, EdgePoint, Ellipse,
    Enneagon, Field,
    GObject, Graph, GraphElement,
    GraphPoint,
    GraphSize, GraphVertex, Heptagon, Hexagon, L,
    LGraphElement,
    LModelElement,
    LObject, Log,
    LogicContext,
    LOperation,
    LPackage,
    LParameter,
    LPointerTargetable, LProject,
    LRefEdge,
    LReference,
    LUser,
    LValue,
    LViewElement,
    LViewPoint, Nonagon, Octagon,
    Pentagon,
    Pointer,
    Pointers, Polygon, Rectangle,
    RuntimeAccessible,
    RuntimeAccessibleClass, Selectors, Septagon, SetFieldAction,
    SetRootFieldAction,
    ShortAttribETypes, SimpleStar, Square, Star,
    store, TRANSACTION, Trapezoid, Triangle, U, UserHistory, Vertex, VoidVertex,
} from '../joiner';
import {DV} from "../common/DV";
import {DefaultEClasses, ShortDefaultEClasses} from "../common/U";
import { GraphElements, Graphs, Vertexes, Edges, Fields } from '../joiner';
import DefaultViews from "./defaults/views";
import tinycolor, {Instance} from "tinycolor2";
import {ReactNode} from "react";
import {VersionFixer} from "./VersionFixer";
let windoww: GObject<typeof window> = window;
//console.warn('ts loading store');

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise


// export const statehistory_obsoleteidea: {past: IStore[], current: IStore, future: IStore[]} = { past:[], current: null, future:[] } as any;
export const statehistory: {
    [userpointer:Pointer<DUser>]: UserHistory,
    all: UserHistory
} & {
    all: UserHistory,
    globalcanundostate: boolean // set to true at first user click }
} = {globalcanundostate: false, all: new UserHistory()} as any;
(window as any).statehistory = statehistory;

@RuntimeAccessible('DState')
export class DState extends DPointerTargetable{
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    static new(): DState {
        let ds = new DState('dwc');
        new Constructors(ds, undefined, false, undefined)
            .DPointerTargetable().DState();
        // .end();
        return ds; // do not trigger persist and CreateElement for state, or it will be stored in idlookup making a loop
    }

    static getState(patched: boolean = true): DState {
        if (!patched) return store.getState();
        else return transientProperties.livePatches || store.getState();
        // else return Uobj.applyObjectDelta(store.getState(), transientProperties.livePatches, false)
    }

    // no need to manually update for each update
    version:{n:number, date:string, conversionList: number[]} = {n:VersionFixer.get_highestversion(), date: new Date().toString(), conversionList: []};
    timestamp!: number;
    timestampdiff!: number;

    advanced!: boolean;
    debug!: boolean;
    logs: Pointer<DLog>[] = [];
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    m2models: Pointer<DModel, 0, 'N'> = [];
    m1models: Pointer<DModel, 0, 'N'> = [];


    viewelements: Pointer<DViewElement, 0, 'N'> = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    collaborators: Pointer<DUser>[] = [];
    idlookup: Record<Pointer<DPointerTargetable>, DPointerTargetable> = {};

    //// DClass section to fill
    graphs: Pointer<DGraph, 0, 'N'> = [];
    voidvertexs: Pointer<DGraphVertex, 0, 'N'> = [];
    vertexs: Pointer<DVertex, 0, 'N'> = [];
    graphvertexs: Pointer<DGraphVertex, 0, 'N'> = [];
    graphelements: Pointer<DGraphVertex, 0, 'N'> = []; // actually fields
    edgepoints: Pointer<DEdgePoint, 0, 'N'> = [];
    edges: Pointer<DEdge, 0, "N"> = [];

    classifiers: Pointer<DClassifier, 0, 'N'> = [];
    enumerators: Pointer<DEnumerator, 0, 'N'> = [];
    packages: Pointer<DPackage, 0, 'N'> = [];
    primitiveTypes: Pointer<DClass, 0, "N"> = [];
    attributes: Pointer<DAttribute, 0, "N"> = [];
    enumliterals: Pointer<DEnumLiteral, 0, "N"> = [];
    references: Pointer<DReference, 0, "N"> = [];
    classs: Pointer<DClass, 0, "N"> = [];
    operations: Pointer<DOperation, 0, "N"> = [];
    parameters: Pointer<DParameter, 0, "N"> = [];
    typedeclarations: Pointer<DTypeDeclaration>[] = [];
    placeholders: Pointer<DPlaceholder>[] = [];
    ecoreClasses: Pointer<DClass, 0, "N"> = [];
    returnTypes: Pointer<DClass, 0, "N"> = [];
    /// DClass section end

    isEdgePending: {user: Pointer<DUser>, source: Pointer<DClass>} = {user: '', source: ''};

    contextMenu: { display: boolean, x: number, y: number, nodeid: Pointer} = {display: false, x: 0, y: 0, nodeid:''};

    objects: Pointer<DObject, 0, 'N', LObject> = [];
    values: Pointer<DValue, 0, 'N', LValue> = [];

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };

    users: Pointer<DUser, 0, 'N', LUser> = [];

    viewpoint: Pointer<DViewPoint> = '';
    viewpoints: Pointer<DViewPoint, 0, 'N'> = [];


    isLoading: boolean = false;

    projects: Pointer<DProject, 0, 'N'> = [];
    ////////////////     flags shared, but handled locally      /////////////////////////////

    /* RECOMPILES MODULE */
    NODES_RECOMPILE_labels: Pointer<DGraphElement>[] = [];
    NODES_RECOMPILE_longestLabel: Pointer<DGraphElement>[] = [];

    VIEWS_RECOMPILE_labels: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_longestLabel: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_onDataUpdate: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_onDragStart: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_onDragEnd: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_whileDragging: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_onResizeStart: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_onResizeEnd: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_whileResizing: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_onRotationStart: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_onRotationEnd: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_whileRotating: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_constants: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_usageDeclarations: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_jsxString: Pointer<DViewElement>[] = [];

    VIEWS_RECOMPILE_preconditions: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_jsCondition: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_ocl: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_events: (Pointer<DViewElement> | {vid: Pointer<DViewElement>, keys: string[] | undefined})[] = [];
    RECOMPILE_LANGUAGE: {engine: string, language: string}[] = [];
    VIEWS_RECOMPILE_snap: Pointer<DViewElement>[] = [];  // those 2 are not really needed as 1-depth sub-objects in D, are still "deeply" checked for differences in shouldComponentUpdate.
    NODES_RECOMPILE_snap: Pointer<DGraphElement>[] = []; // those 2 are not really needed as 1-depth sub-objects in D, are still "deeply" checked for differences in shouldComponentUpdate.
    VIEWS_RECOMPILE_grid: Pointer<DViewElement>[] = [];  // deprecated already, because i cannot query the state from reducer, so i need to query ahead of time and populate NODES_RECOMPILE_grid instead.
    NODES_RECOMPILE_grid: Pointer<DGraphElement>[] = [];
    VIEWS_RECOMPILE_all?: boolean | Pointer<any>[];

    ELEMENT_CREATED: Pointer[] = [];
    ELEMENT_DELETED: Pointer[] = [];

    ClassNameChanged: Dictionary<Pointer<DModelElement>, DocString<"name">> = {}; // for ocl matchings by m2 class name: "context inv Human: ..."

    tooltip: string = '';

    /* IoT: Topic Table */
    topics: Dictionary<string, unknown> = {};

    alert: string = '';
    dialog: string = '';
    dialog_response: string = '';
    action_description: string = '';
    action_title: string = '';
    languages!: Dictionary<string, Language> & {_selected: string};


    static fixcolors(){
        (window as any).tinycolor = tinycolor;
        let tofix = ["tetrad", "triad", "splitcomplement"];
        for (let f of tofix) {
            let f0 = f + '0';
            if (tinycolor.prototype[f0]) return;
            tinycolor.prototype[f0] = tinycolor.prototype[f];
            tinycolor.prototype[f] = function (){ let a = this.getAlpha(); return this[f0]().map((t: Instance) => t.setAlpha(a)); }
        }
    }
    static init(store?: DState): void {
        windoww.preventNavigation = false;
        if (windoww.location.hash.indexOf('#/project') === 0) this.init_editor(store);
        else this.init_dashboard(store);
    }
    static init_dashboard(store?: DState): void {
        console.error('init_dash');
    }

    static init_editor(store?: DState): void {
        this.fixcolors();
        TRANSACTION('init jodel state', ()=>{
            const viewpoint = DViewPoint.newVP('Default', (vp)=>{
                vp.palette = {
                    'border-': U.hexToPalette('#a3a3a3')
                }
                vp.css = `
/* -- Jjodel Abstract Syntax Specification v2.0 -- */



/* stuff for subelements */
[data-nodetype="GraphVertex"] {
  width: 50%;
  height: 50%;
}


[data-nodetype="Field"] { white-space: nowrap; }
[data-nodetype="VoidVertex"],
[data-nodetype="Vertex"],
[data-nodetype="GraphVertex"] {
  left: var(--left) !important;
  top: var(--top) !important;
  >*{ border: 0.1em solid var(--border-1); }
  &>.ui-resizable-handle{ border: none; }
  & hr {color: var(--border-1); }

}

[data-nodetype]{
  /* setup zoom */
  transform-origin: top left;
  
  /* for graph, transform only dynamic elements that can be panned */
  &.Graph.mainView{ transform: none !important; }
  /* for nested nodes, apply zoom only on roots that don't have a panning (otherwise is applied to pan instead) */
  .mainView.not-scrollable, .scrollable{
      transform: scale(var(--zoom-x), var(--zoom-y));
      transform-origin: top left;
  }
  

}

/* normally hide overflow on all nodes */
&,[data-nodetype], [data-nodetype]>*{
  overflow: hidden;
  /* but allow it on selected nodes or nodes containing edges */
  &.selected-by-me, &:has(.selected-by-me, .Edge, .edge, .edges), &:hover, &:active, &:focus-within, &:focus{
    overflow: visible;
    z-index: 100 !important;
    outline-width: 0px!important;
    outline-style: solid;
    outline-color: var(--selected)!important;
  }
  .Vertex, .Field {
    &.selected-by-me, &:hover, &:active, &:focus-within, &:focus {
      outline-width: 4px!important;
      outline-style: solid!important;
      outline-color: var(--selected)!important;
    }
  }
}

&,[data-nodetype] {
  &.selected-by-me, &:hover, &:active, &:focus-within, &:focus{
    outline-width: 4px;
    outline-style: solid;
    outline-color: var(--selected)!important;
  }
}

/* edge overflow is always visible (or lines would be cropped)*/
.Edge{ overflow: visible; }
/* this class is for edge container, must be positioned at top-left with no size but in overflow.
otherwise you would click the edge container instead of the graph-elements beneath it. */
.edges { z-index: 101; position: absolute; top: 0; left: 0; height: 0; width: 0; overflow: visible; }
`
            }, true, Defaults.Pointer_ViewPointDefault);
            const validationViewpoint = DViewPoint.newVP('Default Validation',
                (vp)=>{ vp.isExclusiveView = false; vp.isValidation = true;}, true, Defaults.Pointer_ViewPointValidation);

            Log.exDev(viewpoint.id !== Defaults.viewpoints[0], "wrong vp id initialization", {viewpoint, def:Defaults.viewpoints});
            const views: DViewElement[] = makeDefaultGraphViews(viewpoint, validationViewpoint);

            for (let view of views) { CreateElementAction.new(view); }

            for (let primitiveType of Object.values(ShortAttribETypes)) {
                let dPrimitiveType;
                if (primitiveType === ShortAttribETypes.EVoid) continue; // or make void too without primitiveType = true, but with returnType = true?
                dPrimitiveType = DClass.new(primitiveType, false, false, true, false, '', undefined, true, 'Pointer_' + primitiveType.toUpperCase());
                SetRootFieldAction.new('primitiveTypes', dPrimitiveType.id, '+=', true);
            }

            /// creating m3 "Object" metaclass
            let dObject = DClass.new(ShortDefaultEClasses.EObject, false, false, false, false,
                '', undefined, true, Defaults.Pointer_EOBJECT);

            SetRootFieldAction.new('ecoreClasses', dObject.id, '+=', true);
            for (let defaultEcoreClass of Object.values(DefaultEClasses)) {
                // todo: creat everyone and not just object, make the whole m3 populated.
            }

            /*
            let tmp = Object.values(GraphElements);
            for (let k in tmp) {
                let v: any = tmp[k];
                Log.exDev(!v, 'wrong import order', {k, v, GraphElements, tmp});
                if (!v.cname) continue; // it is a subdictionary
                GraphElements[(v.cname as string)] = GraphElements[k] = v;
            }*/
        })
    }
}


function makeDefaultGraphViews(vp: DViewPoint, validationVP: DViewPoint): DViewElement[] {
    let errorOverlayView: DViewElement = DViewElement.new2('Generic error view', DV.semanticErrorOverlay(), validationVP, (v) => {
        v.jsCondition = 'let nstate = node?.state || {};\nObject.keys(nstate).filter(k => k.indexOf("error_")===0 && nstate[k]).length>0';
        v.usageDeclarations = "(ret)=>{\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "// console.log('overlayView ud inner ' + data.name, {errs:node.state, node, noder:node.r, data});\n" +
            "ret.nstate = node.state\n" +
            // "ret.errors = Object.keys(ret.nstate).filter(k => k.indexOf(\"error_\")===0).map(k=>ret.nstate[k])\n" +
            "ret.errors = Object.keys(ret.nstate).map(k => k.indexOf(\"error_\")===0 ? ret.nstate[k] : '').filter(e=>e)\n" +
            "\n}";
        v.isExclusiveView = false;
        v.css =
            `/* -- v2.0 - */
&.mainView { text-decoration-line: spelling-error; }
&.decorativeView {
    text-decoration-line: spelling-error;
    
    .overlap{
      outline: 1px dotted var(--failure);
      display: flex;
    }

    .error-message{
        color: var(--accent);
        background: var(--bg-2-5);
        border-radius: var(--radius);
        margin: auto;
        padding: 8px 14px 16px 10px;
        position:absolute;
        top:50%; right:0;
        transform: translate(calc(100% + 20px), calc(-50%));

    }
    .error-message::before {
      position: relative;
      top: 4px;
      font-family: bootstrap-icons;
      font-size: 1.2rem;
      content: '\\F333';
      margin-right: 10px;
      padding-top: 10px!important;
    }
}
`
    }, false, Defaults.Pointer_ViewOverlay );

    let errorCheckName: DViewElement = DViewElement.new2('Naming error view', DV.invisibleJsx(), validationVP, (v) => {
        v.isExclusiveView = false;
        v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "ret.name = data && data.name || '';\n"+
            "ret.type = data && data.className.substring(1) || 'shapeless object';\n"+
            "}";
        v.onDataUpdate = `
if (!data) return;
let err = undefined;
if (name.length === 0) err = type + " must be named.";
else if (!name[0].match(/[A-Za-z_$]/)) err = type + " names must begin with an alphabet letter or $_ symbols.";
else if (!name.match(/^[A-Za-z_$]+[A-Za-z0-9$_\\s]*$/)) err = type + " names can only contain an alphanumeric chars or or $_ symbols";
if (node.state.error_naming !== err) node.state = {error_naming: err};
`.trim();}, false, Defaults.Pointer_ViewCheckName );

    let errorCheckLowerbound: DViewElement = DViewElement.new2('Lowerbound error view', DV.invisibleJsx(), validationVP, (v) => {
            // v.jsCondition = '(data, node)=> {\nnode.state.errors?.length>0';
            v.appliableToClasses = ['DValue'];
            v.isExclusiveView = false;
            v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
                "// ** preparations and default behaviour here ** //\n" +
                "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
                "// ** declarations here ** //\n" +
                "ret.valuesLength = data.values.filter(v=>v!==undefined).length;\n"+
                "ret.missingLowerbound = Math.max(0, data.lowerBound - ret.valuesLength);\n" +
                "}";
            v.onDataUpdate = `
let err = undefined;\n
if (missingLowerbound > 0) err = (data.className.substring(1))\n
\t\t+ ' Lowerbound violation, missing ' + missingLowerbound + ' values.';\n
node.state = {error_lowerbound: err};\n
`.trim();
    }, false, Defaults.Pointer_ViewLowerbound );
    // errorOverlayView.oclCondition = 'context DValue inv: self.value < 0';
    /*
        let makeCollabBorder = (gaps: number, index: number) => {
            if (gaps === 0) return "";
            if (gaps === 1)turn `
    `
    /*        return`
    [users="${gaps}"], [users="${gaps}"]::before{
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' rx='5' fill='none' stroke='currentColor' stroke-width='2' stroke-dasharray='12 ${gaps*12}' stroke-dashoffset='-${index*12}'/%3E%3C/svg%3E");
    }
    }
    for (let i = 0; i <=10; i++){
        collabcss += makeCollabBorder(i);
    }
`*/
    let collabcss = `
.naming-list{
    position: absolute;
    bottom: 110%;
    left: 5%;
    display: flex;
    justify-content: end;
    width: 100%;
    gap: 5px;
    font-weight: 900;
    
    .collab-name{
        color: var(--main-color);
        top: -20%;
    }
}
svg.avatar{
    width: 30px;
    height: 30px;
}
.borders rect{
    --size: 40px; /*NB: 40 px is sized to have 1 segment for each user when there are 10 users. use 20 to have 2 segments each or fractions of 40*/
    stroke-dasharray: var(--size) calc(var(--gaps) * var(--size));
    stroke-dashoffset: calc(-1 * var(--offset) * var(--size));
    stroke: var(--main-color);
    stroke-width: 10;
    fill: transparent;
}
.avatar{
    overflow: visible;
    text {
        stroke: var(--main-color);
    }
    circle {
        stroke: var(--main-color);
        fill: var(--bg-color);
        stroke-width: 17.5;
    }
}
.overlap >* {
    pointer-events: all;
}

.color-1{
    --main-color: var(--color-1);
    --bg-color: var(--background-1);
}
.color-2{
    --main-color: var(--color-2);
    --bg-color: var(--background-2);
    --offset: 2;
}
.color-3{
    --main-color: var(--color-3);
    --bg-color: var(--background-3);
}
.color-4{
    --main-color: var(--color-4);
    --bg-color: var(--background-4);
}
.color-5{
    --main-color: var(--color-5);
    --bg-color: var(--background-5);
}
.color-6{
    --main-color: var(--color-6);
    --bg-color: var(--background-6);
}
.color-7{
    --main-color: var(--color-7);
    --bg-color: var(--background-7);
}
.color-8{
    --main-color: var(--color-8);
    --bg-color: var(--background-8);
}
.color-9{
    --main-color: var(--color-9);
    --bg-color: var(--background-9);
}
.color-0, .overlap{
    /* fallback value */
    --main-color: var(--color-10);
    --bg-color: var(--background-10);
}
`;
    let collaborativeView: DViewElement = DViewElement.new2('Display collaborators', DV.collaborative(), vp, (v) => {
        v.jsCondition = 'LProject.getProject().onlineUsers > 0 && node?.selection.length > 0';
        v.usageDeclarations = "(ret)=>{\n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "maxColors = view?.palette[\"color-\"]?.value.length;"+
            "project = LProject.getProject();"+
            "selection = [...node.selection, ...node.selection, ...node.selection].filter(e => !!e);"+
            "\n}";
        v.isExclusiveView = false;
        v.palette = {
            'color-': U.hexToPalette("#212121", "#FBC02D", "#673AB7", "#FF9800", "#4CAF50", "#E91E63", "#009688", "#795548", "#9C27B0", "#FF5722"),
            "background-":  U.hexToPalette("#FFFFFF", "#FFFDE7", "#E1BEE7", "#FFF3E0", "#C8E6C9", "#F8BBD0", "#B2DFDB", "#E7DBCB", "#E1BEE7", "#FFCCBC")
        }
        v.css = collabcss;
    }, false, Defaults.Pointer_ViewCollaborative );

    let valuecolormap: GObject = {};
    valuecolormap[ShortAttribETypes.EBoolean] = "orange";
    valuecolormap[ShortAttribETypes.EByte] = "orange";
    valuecolormap[ShortAttribETypes.EShort] = "orange";
    valuecolormap[ShortAttribETypes.EInt] = "orange";
    valuecolormap[ShortAttribETypes.ELong] = "orange";
    valuecolormap[ShortAttribETypes.EFloat] = "orange";
    valuecolormap[ShortAttribETypes.EDouble] = "orange";
    valuecolormap[ShortAttribETypes.EDate] = "green";
    valuecolormap[ShortAttribETypes.EString] = "green";
    valuecolormap[ShortAttribETypes.EChar] = "green";
    valuecolormap[ShortAttribETypes.EVoid] = "gray";


    let voidView: DViewElement = DViewElement.new2('Fallback', DV.fallbackView(), vp, (v)=>{
        v.usageDeclarations = "";
        v.usageDeclarations = `(ret)=>{ // scope: data, node, view, state,
// ** preparations and default behaviour here ** //
// add preparation code here (like for loops to count something), then list the dependencies below.
// Fallback view - minimal declarations

// ** declarations here ** //
ret.parentView = L.from(component?.props?.parentviewid);
}`
        v.css =
`&.mainView > .void{
    flex-wrap: wrap;
    display: flex;
    border: none;
}`
    }, false, Defaults.Pointer_ViewFallback);


    let edgeViews: DViewElement[] = [];
    let size0: GraphPoint = new GraphPoint(12, 12), size1: GraphPoint = new GraphPoint(12, 12), size2: GraphPoint = new GraphPoint(18, 12);


    let model = DefaultViews.model(vp);
    let packagee = DefaultViews.package(model);
    let classs = DefaultViews.class(packagee);
    let enumm = DefaultViews.enum(packagee);
    let attr = DefaultViews.attribute(classs);
    let ref = DefaultViews.reference(classs);
    let op = DefaultViews.operation(classs);
    let par = DefaultViews.parameter(op);
    let lit = DefaultViews.literal(enumm);
    let obj = DefaultViews.object(model);
    let typedecl = DefaultViews.typeDeclaration(classs);

    let single = DefaultViews.singleton(model);
    let val = DefaultViews.value(obj);
    let anchorView = DefaultViews.anchor(model);

    function makeEdgeView(name: string, type: EdgeHead, headSize: GraphPoint | undefined, tailSize: GraphPoint | undefined, dashing: boolean): DViewElement{
        let ev = DV.edgeView(type, headSize || size0, tailSize || size0, dashing ? "10.5,9,0,0" : undefined, model, name);
        edgeViews.push(ev);
        return ev;
    }

    makeEdgeView("Association", EdgeHead.reference,             size1,   undefined,  false);
    makeEdgeView("Dependency",  EdgeHead.reference,             size1,   undefined,  true);
    makeEdgeView("Inheritance", EdgeHead.extend,                size1,   undefined,  false);
    makeEdgeView("Aggregation", EdgeHead.aggregation,   undefined,      size2,      false);
    makeEdgeView("Composition", EdgeHead.composition,   undefined,      size2,      false);
    makeEdgeView("", EdgeHead.reference, size1,   undefined,  false);




    // edgeView.forceNodeType="Edge"

    /*
    for (let ev of edgeViews){
        ev.bendingMode = EdgeBendingMode.Line;
        ev.subViews = [edgePointView.id];
    }*/
    // nb: Error is not a view, just jsx. transform it in a view so users can edit it



    let dv_subviews = [model, packagee, classs, enumm, attr, ref, op, par,
        lit, obj, val, typedecl, single, voidView,
        ...edgeViews,
        DefaultViews.edgepoint(model),
        anchorView, collaborativeView];

    let validation_subviews = [errorOverlayView, errorCheckLowerbound, errorCheckName];
    // SetFieldAction.new(vp, 'subViews', U.objectFromArrayValues(dv_subviews.map(dv=>dv.id), 1.5));
    // SetFieldAction.new(validationVP, 'subViews', U.objectFromArrayValues(validation_subviews.map(dv=>dv.id), 1.5));
    const ret = [...dv_subviews, ...validation_subviews];
    for (let v of ret) Log.e(!v.events, "missing events on view " + v.name, {v, ret});
    for (let v of ret) Log.w(!!!v.events, "found events on view " + v.name, {v, ret});
    return ret;
}

@RuntimeAccessible('ViewPointState')
export class ViewPointState extends DPointerTargetable{
    name: string = '';
}

// to delete?
@RuntimeAccessible('ModelStore')
export class ModelStore {
    private _meta!: ModelStore | string;
    instances!: (ModelStore | string)[];

    // getter e setter senza proxy
    get meta(): ModelStore | string {
        return this._meta;
    }

    set meta(value: ModelStore | string) {
        this._meta = value;
    }
}



@RuntimeAccessible('LState')
export class LState<Context extends LogicContext<DState> = any, C extends Context = Context, D extends DState = DState> extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DPointerTargetable & DState;
    public static structure: typeof DPointerTargetable;
    public static singleton: LPointerTargetable;
    // return type is wrong, but have to extend the static method of RuntimeAccessibleClass which is completely different and returns a class constructor.
    static get<T2 extends typeof RuntimeAccessibleClass & { logic?: typeof LPointerTargetable | undefined; }>(): T2 & LState { return LState.wrap(store.getState() as any) as any; }
    user!: LUser;
    advanced!: boolean;
    debug!: boolean;
    room!: string;
    _lastSelected?: {modelElement?: LModelElement, node?: LGraphElement, view?: LViewElement};
    idlookup!:Dictionary<Pointer, DPointerTargetable>;

    get__lastSelected(c: Context): this["_lastSelected"] {
        let ls = c.data._lastSelected;
        return ls && {modelElement: LState.wrap(ls.modelElement), node: LState.wrap(ls.node), view: LState.wrap(ls.view)}; }

    _defaultCollectionGetter(c: Context, k: keyof DState): LPointerTargetable[] {
        return LPointerTargetable.fromPointer(c.data[k] as any);
    }
    _defaultGetter(c: Context, k: keyof DState) {
        let v = c.data[k];
        if (Array.isArray(v)) {
            if (v.length === 0) return [];
            else if (Pointers.isPointer(v[0] as any)) return this._defaultCollectionGetter(c, k);
            return v;
        }
        return v;
    }

    get_getByFullPath(c: Context): this['getByFullPath'] { return this.wrongAccessMessage('LState.getByFullPath'); }
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DState);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LState);

