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
    packageDefaultSize, Pentagon,
    Pointer,
    Pointers, Polygon, Rectangle,
    RuntimeAccessible,
    RuntimeAccessibleClass, Septagon,
    SetRootFieldAction,
    ShortAttribETypes, SimpleStar, Square, Star,
    store, Trapezoid, Triangle, U, Vertex, VoidVertex,
} from '../joiner';
import {DV} from "../common/DV";
//import {Selected} from "../joiner/types";
import {DefaultEClasses, ShortDefaultEClasses} from "../common/U";
import { GraphElements, Graphs, Vertexes, Edges, Fields } from '../joiner';

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
        return new Constructors(new DState('dwc'), undefined, false, undefined).DPointerTargetable().DState().end();
    }

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
    VIEWS_RECOMPILE_oclCondition: Pointer<DViewElement>[] = []; // auto-detected
    VIEWS_RECOMPILE_jsCondition: Pointer<DViewElement>[] = [];

    // views whose oclCondition needs to be reapplied to all model elements
    VIEWOCL_NEEDS_RECALCULATION: Pointer<DViewElement>[] = [];
    // views where both ocl needs to be reapplied and the oclUpdateCondition -> transient.view[v.id].oclUpdateCondition_PARSED needs to be remade
    VIEWOCL_UPDATE_NEEDS_RECALCULATION: Pointer<DViewElement>[] = [];


    // CSS_NEEDS_RECALCULATION: Pointer<DViewElement>[] = [];
    // DATAOCL_NEEDS_RECALCULATION: Pointer<DModelElement>[] = [];
    ClassNameChanged: Dictionary<Pointer<DModelElement>, DocString<"name">> = {};


    static init(store?: DState): void {
        BEGIN()
        // const viewpoint = DViewPoint.new('Default', '', undefined, '', '', '', [], '', 0, false);
        const viewpoint = DViewPoint.new2('Default', '', ()=>{}, true, 'Pointer_ViewPointDefault');
        const validationViewpoint = DViewPoint.new2('Validation', '', ()=>{}, true, 'Pointer_ViewPointValidation');
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
        for (let defaultEcoreClass of Object.values(DefaultEClasses)){
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
    let modelView: DViewElement = DViewElement.new('Model', DV.modelView(), undefined, '',
        '', '', [DModel.cname], '', 1, false, true, vp);
    modelView.draggable = false; modelView.resizable = false;
    modelView.oclCondition = 'context DModel inv: true';
    modelView.usageDeclarations = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "//ret.data = data\n" +
        "ret.node = node\n" +
        "ret.view = view\n" +
        "// custom preparations:\n" +
        "let packages = data && data.isMetamodel ? data.packages : [];\n" +
        "let suggestedEdges = data?.suggestedEdges || {};\n" +
        "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "ret.firstPackage = packages[0]\n"+
        "ret.otherPackages = packages.slice(1)\n"+
        "ret.m1Objects = data && !data.isMetamodel ? data.allSubObjects : []\n"+
        "ret.refEdges = (suggestedEdges.reference || []).filter(e => !e.vertexOverlaps)\n"+
        "ret.extendEdges = (suggestedEdges.extend || []).filter(e => !e.vertexOverlaps)\n"+
        "}";

    let packageView: DViewElement = DViewElement.new('Package', DV.packageView(), undefined, '', '', '', [DPackage.cname], '', 1, false, true, vp);
    packageView.defaultVSize = packageDefaultSize;
    packageView.oclCondition = `context DPackage inv: true`;

/*
    const defaultPackage: DViewElement = DViewElement.new('DefaultPackage', DV.defaultPackage(), undefined, '', '', '', [], '', 1, false);
    defaultPackage.defaultVSize = new GraphSize(0, 0);
    defaultPackage.explicitApplicationPriority = 2;
    defaultPackage.oclCondition = `context DPackage inv: self.name = 'default'`;
    defaultPackage.draggable = false; defaultPackage.resizable = false;*/

    let classView: DViewElement = DViewElement.new('Class', DV.classView(), undefined, '', '', '', [DClass.cname], '', 1, false, true, vp);
    classView.adaptWidth = true; classView.adaptHeight = true;
    classView.oclCondition = 'context DClass inv: true';
    classView.palette = {
        "color-": [
            "#ff0000",
            "#000000",
            "#ffffff",
        ],
        "background-": [
            "#ffffff",
            "#eeeeee",
            "#ff0000"
        ]
    };

    let enumView: DViewElement = DViewElement.new('Enum', DV.enumeratorView(), undefined, '', '', '', [DEnumerator.cname], '', 1, false, true, vp);
    enumView.adaptWidth = true; enumView.adaptHeight = true;
    enumView.oclCondition = 'context DEnumerator inv: true';

    let attributeView: DViewElement = DViewElement.new('Attribute', DV.attributeView(), undefined, '', '', '', [DAttribute.cname], '', 1, false, true, vp);
    attributeView.oclCondition = 'context DAttribute inv: true';
    // attributeView.palette = classView.palette;

    let referenceView: DViewElement = DViewElement.new('Reference', DV.referenceView(), undefined, '', '', '', [DReference.cname], '', 1, false, true, vp);
    referenceView.oclCondition = 'context DReference inv: true';

    let operationView: DViewElement = DViewElement.new('Operation', DV.operationView(), undefined, '', '', '', [DOperation.cname], '', 1, false, true, vp);
    operationView.oclCondition = 'context DOperation inv: true';

    let literalView: DViewElement = DViewElement.new('Literal', DV.literalView(), undefined, '', '', '', [DEnumLiteral.cname], '', 1, false, true, vp);
    literalView.oclCondition = 'context DEnumLiteral inv: true';

    let objectView: DViewElement = DViewElement.new('Object', DV.objectView(), undefined, '', '', '', [DObject.cname], '', 1, false, true, vp);
    objectView.adaptWidth = true; objectView.adaptHeight = true;
    objectView.oclCondition = 'context DObject inv: true';
    objectView.usageDeclarations = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "ret.data = data\n" +
        "ret.node = node\n" +
        "ret.view = view\n" +
        "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "ret.metaclassName = data.instanceof?.name || \"Object\"\n" +
        "ret.features = data.features\n" +
        "}";

    let errorOverlayView_old: DViewElement = DViewElement.new2('Semantic error view old', DV.semanticErrorOverlay_old(), (v) => {
        v.appliableToClasses = [DAttribute.cname]; // [DValue.cname];
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
    }, false, validationVP, 'Pointer_ViewOverlayOld' );

    let errorOverlayView: DViewElement = DViewElement.new2('Semantic error view', DV.semanticErrorOverlay(), (v) => {
        v.jsCondition = 'node.state.errors?.length>0';
        v.usageDeclarations = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "console.log('overlayView ud inner ' + data.name, {errs:node.state.errors, node, noder:node.r, data});\n" +
        "ret.errors = Object.values(node.state.errors || {});\n" +
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

    let errorCheckName: DViewElement = DViewElement.new2('Naming error view', DV.invisibleJsx(), (v) => {
        v.isExclusiveView = false;
        v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
            "// ** preparations and default behaviour here ** //\n" +
            "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
            "// ** declarations here ** //\n" +
            "ret.name = data && data.name || '';"+
            "ret.type = data && data.className.substring(1) || 'shapeless';\n"+
            "}";
        v.onDataUpdate = `
if (!node.state.errors) node.state.errors = {};
let err = '';
if (name.indexOf(" ") >= 0) err = "" + type + " names cannot contain white spaces.";
else if (name.length === 0 && type !== "shapeless") err = type + "es must be named.";
else if (!name[0].match(/[A-Za-z_$]/)) err = type + " names must begin with an alphabet letter or $_ symbols.";
else if (!name.match(/[A-Za-z_$]+[A-Za-z0-9$_]+/)) err = type + " names can only contain an alphanumeric chars or or $_ symbols";
console.log("measurable set naming error: "+err+", name:"+name, {err, name, dname:data.name, ddname:data.r.name});
node.state.errors = {...node.state.errors, naming: err};
`;}, false, validationVP, 'Pointer_ViewCheckName' );

let errorCheckLowerbound: DViewElement = DViewElement.new2('Lowerbound error view', DV.invisibleJsx(), (v) => {
            v.jsCondition = '(data, node)=> {\nnode.state.errors?.length>0';
            v.appliableToClasses = ['DValue'];
            v.isExclusiveView = false;
            v.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
                "// ** preparations and default behaviour here ** //\n" +
                "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
                "// ** declarations here ** //\n" +
                "ret.missingLowerbound = Math.min(0, data.lowerbound - data.values.length);\n" +
                "ret.valuesLength = data.values.length;"+
                "}";
            v.onDataUpdate = `
if (!node.state.errors) node.state.errors = {};
let err = '';
if (missingLowerbound) node.state.errors = {...node.state.errors, lowerbound: (data.className.substring(1)) + " Lowerbound violation, missing ' + missingLowerbound + ' values.'."};
node.state.errors = {...node.state.errors, naming: err};
`;
        v.css =
`&.mainView { text-decoration-line: spelling-error; }
&.decorativeView {
    [data-field="name"]{
        text-decoration-line: spelling-error;
        outline: 4px solid var(--background-3);
     }
}`
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
    let valueView: DViewElement = DViewElement.new('Value', DV.valueView(), undefined, '', '', '', [DValue.cname], '', 1, false, true, vp);
    valueView.oclCondition = 'context DValue inv: true';

    valueView.usageDeclarations = "(ret)=>{ // scope: data, node, view, state, \n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// ret.data = data // object does not need it because it displays only: features (listed individually) and name input being a subcomponent\n" +
        "ret.node = node\n" +
        "ret.view = view\n" +
        "// todo: put only first N values as dependency and show only those.\n" +
        "// data, node, view are dependencies by default. delete them above if you want to remove them.\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "ret.instanceofname = data.instanceof?.name\n" +
        "ret.valuesString = data.valuesString()\n" +
        "ret.typeString = data.typeString\n" +
        "}";

    let voidView: DViewElement = DViewElement.new('Void', DV.voidView(), undefined, '', '', '', [], '', 0, false, true, vp);
    // voidView.appliableToClasses=["VoidVertex"];
    voidView.explicitApplicationPriority = 2;
    voidView.adaptWidth = true; voidView.adaptHeight = true;

    let edgePointView: DViewElement = DViewElement.new('EdgePoint', DV.edgePointView(), new GraphSize(0, 0, 25, 25), '', '', '', [], '', 1, false, true, vp);
    edgePointView.appliableTo = 'edgePoint'; edgePointView.resizable = false;
    // edgePointView.edgePointCoordMode = CoordinateMode.relativePercent;
    edgePointView.edgePointCoordMode = CoordinateMode.absolute;

    let edgeViews: DViewElement[] = [];
    let size0: GraphPoint = new GraphPoint(0, 0), size1: GraphPoint = new GraphPoint(20, 20), size2: GraphPoint = new GraphPoint(20, 20); // todo: riportalo in 40,20
    let edgeConstants: string = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "   ret.strokeColor = 'gray'\n"+
        "   ret.strokeWidth = '2px'\n"+
        "   ret.strokeColorHover = 'black'\n"+
        "   ret.strokeColorLong = 'gray'\n"+
        "   ret.strokeLengthLimit = 300\n"+
        "   ret.strokeWidthHover = '4px'\n"+
        "}";
    let edgePrerenderFunc: string = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "ret.segments = edge.segments\n"+
        "}";

    let edgeUsageDeclarations = "(ret)=>{\n" +
        "// ** preparations and default behaviour here ** //\n" +
        "// ret.data = data\n" +
        "ret.edgeview = edge.view.id\n" +
        "ret.view = view\n" +
        "// data, edge, view are dependencies by default. delete them above if you want to remove them.\n" +
        "// add preparation code here (like for loops to count something), then list the dependencies below.\n" +
        "// ** declarations here ** //\n" +
        "ret.start = edge.start\n"+
        "ret.end = edge.end\n"+
        "}";

    function makeEdgeView(name: string, type: EdgeHead, headSize: GraphPoint | undefined, tailSize: GraphPoint | undefined, dashing: boolean): DViewElement{
        let ev = DViewElement.new2("Edge"+name,
            DV.edgeView(type, headSize ? DV.svgHeadTail("Head", type) : "", tailSize ? DV.svgHeadTail("Tail", type) : "", dashing ? "10.5,9,0,0" : undefined),
            (v: DViewElement) => {
                v.explicitApplicationPriority = 2;
                v.bendingMode = EdgeBendingMode.Line;
                v.appliableToClasses = [DVoidEdge.cname];
                v.edgeHeadSize = headSize || size0;
                v.edgeTailSize = tailSize || size0;
                v.constants = edgeConstants;
                v.usageDeclarations = edgeUsageDeclarations;
                v.preRenderFunc = edgePrerenderFunc;
                v.appliableTo = 'edge'; // todo: remove the entire property?
        }, false, vp, 'Pointer_ViewEdge' + name);
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
        ev.explicitApplicationPriority = 2;
        ev.bendingMode = EdgeBendingMode.Line;
        ev.subViews = [edgePointView.id];
    }*/
    // nb: Error is not a view, just jsx. transform it in a view so users can edit it

    return [modelView, packageView, //defaultPackage,
        classView, enumView, attributeView, referenceView, operationView,
        literalView, objectView, valueView, voidView, ...edgeViews, edgePointView,
        errorOverlayView, errorCheckLowerbound, errorCheckName
    ];
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

    get_contextMenu(c: Context): this["contextMenu"] { return c.data.contextMenu; }
    // get_user(c: Context): this["user"] { return LState.wrap(c.data.user) as LUser; }
    get_debug(c: Context): this["debug"] { return c.data.debug; }
    get_idlookup(c: Context): this["idlookup"] { return c.data.idlookup; }
    get__lastSelected(c: Context): this["_lastSelected"] {
        let ls = c.data._lastSelected;
        return ls && {modelElement: LState.wrap(ls.modelElement), node: LState.wrap(ls.node), view: LState.wrap(ls.view)}; }

    _defaultCollectionGetter(c: Context, k: keyof DState): LPointerTargetable[] { return LPointerTargetable.fromPointer(c.data[k] as any); }
    _defaultGetter(c: Context, k: keyof DState) {
        //console.log("default Getter");
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

