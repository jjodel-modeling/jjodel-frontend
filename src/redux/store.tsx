import {
    Asterisk,
    BEGIN, Circle,
    Constructors,
    CoordinateMode,
    CreateElementAction, Cross,
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
    END, Enneagon, Field,
    GObject, Graph, GraphElement,
    GraphPoint,
    GraphSize, GraphVertex, Heptagon, Hexagon,
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
    RuntimeAccessibleClass, Septagon, SetFieldAction,
    SetRootFieldAction,
    ShortAttribETypes, SimpleStar, Square, Star,
    store, Trapezoid, Triangle, U, Vertex, VoidVertex,
} from '../joiner';
import {DV} from "../common/DV";
//import {Selected} from "../joiner/types";
import {DefaultEClasses, ShortDefaultEClasses} from "../common/U";
import { GraphElements, Graphs, Vertexes, Edges, Fields } from '../joiner';
import DefaultViews from "./defaults/views";
import tinycolor, {Instance} from "tinycolor2";
import {ReactNode} from "react";

console.warn('ts loading store');

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise

// export const statehistory_obsoleteidea: {past: IStore[], current: IStore, future: IStore[]} = { past:[], current: null, future:[] } as any;
export const statehistory: {
        [userpointer:Pointer<DUser>]: {undoable:GObject<"delta">[], redoable: GObject<"delta">[]}
} & {
    globalcanundostate: boolean // set to true at first user click }
} = { globalcanundostate: false} as any;
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

    // important! every new version update version.n, but leave date = new Date().toString() and conversionList = empty arr []
    version:{n:number, date:string, conversionList: number[]} = {n:2.2, date: new Date().toString(), conversionList: []};

    env: Dictionary = process.env;  //damiano: this might make problems on load
    debug: boolean = false;
    logs: Pointer<DLog>[] = [];
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];


    viewelements: Pointer<DViewElement, 0, 'N'> = [];
    stackViews: Pointer<DViewElement, 0, 'N'> = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    // collaborators: UserState[];
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

    m2models: Pointer<DModel, 0, 'N'> = [];
    m1models: Pointer<DModel, 0, 'N'> = [];

    isLoading: boolean = false;

    projects: Pointer<DProject, 0, 'N'> = [];
    collaborativeSession: boolean = false;
    ////////////////     flags shared, but handled locally      /////////////////////////////

    /* RECOMPILES MODULE */
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
    VIEWS_RECOMPILE_all?: boolean | Pointer<any>[];
    ELEMENT_CREATED: Pointer[] = [];
    ELEMENT_DELETED: Pointer[] = [];

    ClassNameChanged: Dictionary<Pointer<DModelElement>, DocString<"name">> = {}; // for ocl matchings by m2 class name: "context inv Human: ..."

    tooltip: string = '';

    /* IoT: Topic Table */
    topics: Dictionary<string, unknown> = {
        'sensors/1': [{value: {raw: 10, unit: 's'}, timestamp: 1}, {value: {raw: 12, unit: 's'}, timestamp: 2}],
        'sensors/2': [{value: {raw: 20, unit: 's'}, timestamp: 2}],
        'sensors/3': [{value: {raw: 30, unit: 's'}, timestamp: 3}]
    };

    advanced: boolean = false;


    static fixcolors(){
        (window as any).tinycolor = tinycolor;
        let tofix = ["tetrad", "triad", "splitcomplement"];
        for (let f of tofix) {
            tinycolor.prototype[f + "0"] = tinycolor.prototype[f];
            tinycolor.prototype[f] = function (){ let a = this.getAlpha(); return this[f+'0']().map((t: Instance) => t.setAlpha(a)); }
        }
    }
    static init(store?: DState): void {
        this.fixcolors();
        BEGIN()
        const viewpoint = DViewPoint.new2('Default', '', (vp)=>{ vp.isExclusiveView = false; }, true, 'Pointer_ViewPointDefault');
        const validationViewpoint = DViewPoint.new2('Validation default', '', (vp)=>{ vp.isExclusiveView = false; vp.isValidation = true;}, true, 'Pointer_ViewPointValidation');

        Log.exDev(viewpoint.id !== Defaults.viewpoints[0], "wrong vp id initialization", {viewpoint, def:Defaults.viewpoints});
        const views: DViewElement[] = makeDefaultGraphViews(viewpoint.id, validationViewpoint.id);

        for (let view of views) { CreateElementAction.new(view); }

        for (let primitiveType of Object.values(ShortAttribETypes)) {
            let dPrimitiveType;
            if (primitiveType === ShortAttribETypes.EVoid) continue; // or make void too without primitiveType = true, but with returnType = true?
            dPrimitiveType = DClass.new(primitiveType, false, false, true, false, '', undefined, true, 'Pointer_' + primitiveType.toUpperCase());
            SetRootFieldAction.new('primitiveTypes', dPrimitiveType.id, '+=', true);
        }

        /// creating m3 "Object" metaclass
        let dObject = DClass.new(ShortDefaultEClasses.EObject, false, false, false, false,
            '', undefined, true, 'Pointer_' + ShortDefaultEClasses.EObject.toUpperCase());

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
        END();
    }
}


function makeDefaultGraphViews(vp: Pointer<DViewPoint>, validationVP: Pointer<DViewPoint>): DViewElement[] {

    let errorOverlayView: DViewElement = DViewElement.new2('Semantic error view', DV.semanticErrorOverlay(), (v) => {
        v.jsCondition = 'let nstate = node?.state || {};\nObject.keys(nstate).filter(k => k.indexOf("error_")===0).map(k=>nstate[k]).join(\'\\n\').length>0';
        v.usageDeclarations = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "// console.log('overlayView ud inner ' + data.name, {errs:node.state, node, noder:node.r, data});\n" +
        "ret.nstate = node.state\n" +
        "ret.errors = Object.keys(ret.nstate).filter(k => k.indexOf(\"error_\")===0).map(k=>ret.nstate[k])\n" +
        "\n}"
        v.isExclusiveView = false;
        v.css =
`&.mainView { text-decoration-line: spelling-error; }
&.decorativeView {
    text-decoration-line: spelling-error;
    
    .overlap{
      outline: 4px solid var(--background-3);
      display: flex;
    }
    .error-message{
        color: var(--color-3);
        background: var(--background-3);
        border-radius: 0 16px 16px 0;
        margin: auto;
        padding: 8px;
        position:absolute;
        top:50%; right:0;
        transform: translate(calc(100% + 3px), calc(-50%));
    }
}`
    }, false, validationVP, 'Pointer_ViewOverlay' );

    let anchorView: DViewElement = DViewElement.new2('Anchors', DV.anchorJSX(), (v) => {
        v.isExclusiveView = false;
        v.palette={'anchor-': U.hexToPalette('#77f', '#f77', '#007'),
            'anchor-hover-': U.hexToPalette('#7f7', '#a44', '#070')}
        v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "ret.anchors = data && node.anchors;\n"+
            "ret.dragAnchor = node.events.dragAnchor; // @autogenerated, do not edit\n"+
            "ret.assignAnchor = node.events.assignAnchor; // @autogenerated, do not edit\n"+
            "}";
        v.events = {
            dragAnchor: '(coords /*Point*/, anchorName /*string*/)=>{\n' +
                '\tconst updateAnchor = {};\n'+
                '\tupdateAnchor[anchorName] = coords;\n'+
                '\tnode.anchors=updateAnchor;\n'+
                '}',
            assignAnchor: '(anchorName /*string*/)=>{\n' +
                '\tnode.assignEdgeAnchor(anchorName);\n'+
                '}'}
        v.css = `
.anchor.valid-anchor{
    display:block;
}

.anchor{
    display:none;
    position: absolute;
    background-color: var(--anchor-1);
    outline: 2px solid var(--anchor-3);
    transform: translate(-50%, -50%);
    pointer-events: all;
    cursor: crosshair;
    
    &:hover{
        background-color: var(--anchor-hover-1);
        outline: 2px solid var(--anchor-hover-3);
    }
    &.active-anchor{
        background-color: var(--anchor-2);
        &:hover{
            background-color: var(--anchor-hover-2);
        }
    }
}


`
    }, false, vp, 'Pointer_ViewAnchors' );

    let errorCheckName: DViewElement = DViewElement.new2('Naming error view', DV.invisibleJsx(), (v) => {
        v.isExclusiveView = false;
        v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "ret.name = data && data.name || '';\n"+
            "ret.type = data && data.className.substring(1) || 'shapeless';\n"+
            "}";
        v.onDataUpdate = `
let err = undefined;
//if (name.indexOf(" ") >= 0) err = "" + type + " names cannot contain white spaces."; else
if (name.length === 0 && type !== "shapeless") err = type + "es must be named.";
else if (!name[0].match(/[A-Za-z_$]/)) err = type + " names must begin with an alphabet letter or $_ symbols.";
else if (!name.match(/^[A-Za-z_$]+[A-Za-z0-9$_\\s]*$/)) err = type + " names can only contain an alphanumeric chars or or $_ symbols";
node.state = {error_naming:err};
`;}, false, validationVP, 'Pointer_ViewCheckName' );

let errorCheckLowerbound: DViewElement = DViewElement.new2('Lowerbound error view', DV.invisibleJsx(), (v) => {
            // v.jsCondition = '(data, node)=> {\nnode.state.errors?.length>0';
            v.appliableToClasses = ['DValue'];
            v.isExclusiveView = false;
            v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
                "// ** preparations and default behaviour here ** //\n" +
                "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
                "// ** declarations here ** //\n" +
                "ret.valuesLength = data.values.filter(v=>(v!==undefined && v!=='')).length;\n"+
                "ret.missingLowerbound = Math.max(0, data.lowerBound - ret.valuesLength);\n" +
                "}";
            v.onDataUpdate = `
let err = undefined;\n
if (missingLowerbound > 0) err = (data.className.substring(1))\n
 \t\t+ ' Lowerbound violation, missing ' + missingLowerbound + ' values.';\n
node.state = {error_lowerbound: err};\n
`;
    }, false, validationVP, 'Pointer_ViewLowerbound' );
    // errorOverlayView.oclCondition = 'context DValue inv: self.value < 0';

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


    let voidView: DViewElement = DViewElement.new('Void', DV.voidView(), undefined, '', '', '',
        [], '', undefined, false, true, vp);
    // voidView.appliableToClasses=["VoidVertex"];
    voidView.adaptWidth = true; voidView.adaptHeight = true;



    let edgeViews: DViewElement[] = [];
    let size0: GraphPoint = new GraphPoint(0, 0), size1: GraphPoint = new GraphPoint(12, 12), size2: GraphPoint = new GraphPoint(18, 12);


    function makeEdgeView(name: string, type: EdgeHead, headSize: GraphPoint | undefined, tailSize: GraphPoint | undefined, dashing: boolean): DViewElement{
        let ev = DV.edgeView(type, headSize || size0, tailSize || size0, dashing ? "10.5,9,0,0" : undefined, vp, name);
        edgeViews.push(ev);
        return ev;
    }

    makeEdgeView("Association", EdgeHead.reference,             size1,   undefined,  false);
    makeEdgeView("Dependency",  EdgeHead.reference,             size1,   undefined,  true);
    makeEdgeView("Inheritance", EdgeHead.extend,                size1,   undefined,  false);
    makeEdgeView("Aggregation", EdgeHead.aggregation,   undefined,      size2,      false);
    makeEdgeView("Composition", EdgeHead.composition,   undefined,      size2,      false);

    // edgeView.forceNodeType="Edge"

    /*
    for (let ev of edgeViews){
        ev.bendingMode = EdgeBendingMode.Line;
        ev.subViews = [edgePointView.id];
    }*/
    // nb: Error is not a view, just jsx. transform it in a view so users can edit it


    let dv_subviews = [DefaultViews.model(vp), DefaultViews.package(vp), DefaultViews.class(vp), DefaultViews.enum(vp),
        DefaultViews.attribute(vp), DefaultViews.reference(vp), DefaultViews.operation(vp), DefaultViews.parameter(vp),
        DefaultViews.literal(vp), DefaultViews.object(vp), DefaultViews.value(vp), anchorView, voidView, ...edgeViews, DefaultViews.edgepoint(vp)];

    let validation_subviews = [errorOverlayView, errorCheckLowerbound, errorCheckName];
    // SetFieldAction.new(vp, 'subViews', U.objectFromArrayValues(dv_subviews.map(dv=>dv.id), 1.5));
    // SetFieldAction.new(validationVP, 'subViews', U.objectFromArrayValues(validation_subviews.map(dv=>dv.id), 1.5));
    const ret = [...dv_subviews, ...validation_subviews];
    console.clear();
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
    contextMenu!: {display: boolean, x: number, y: number};
    user!: LUser;
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
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DState);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LState);

