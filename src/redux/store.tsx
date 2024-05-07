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

    VIEWS_RECOMPILE_preconditions: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_jsCondition: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_ocl: Pointer<DViewElement>[] = [];
    VIEWS_RECOMPILE_events: (Pointer<DViewElement> | {vid: Pointer<DViewElement>, keys: string[] | undefined})[] = [];
    VIEWS_RECOMPILE_all?: boolean | Pointer<any>[];

    ClassNameChanged: Dictionary<Pointer<DModelElement>, DocString<"name">> = {}; // for ocl matchings by m2 class name: "context inv Human: ..."

    tooltip: string = '';


    static init(store?: DState): void {
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

function makeDefaultZoomView(vp: Pointer<DViewPoint>): void{
    // let viewsMap = U.objectFromArray(defaultViews, (v) => v.id);
/*
* power levels:
*
* 3 parameters
* 2 attributes
* 1 classes
* 0 packages only
* */

    let vnames = ['EdgePoint', 'Model', 'Package', 'Class', 'Enum', 'Attribute', 'Reference', 'Operation', 'Object', 'Value'];
    let jsxList: Dictionary<string, string> = {
            // 'EdgePoint': ``
            'Model':
`<div className={'root'}>
    {!data && "Model data missing."}
    <label style={{position:'absolute', right:'-50px', top:'50px', display: 'flex', transform: 'rotate(270deg)'}}>
        <input className="potenziometro" onChange={(e)=>{node.state = {level:+e.target.value}}} min="0" max="3" type="range" step="1" value={level}
            style = {{}}/>
            <div style={{transform: 'rotate(90deg) translate(0, 100%)'}}>Detail level:{level}</div>
    </label>
    <div className={'edges'}>
        {[
            refEdges.map(se => <Edge start={se.start.father.node} end={se.end.node} view={'Pointer_ViewEdge' + ( se.start.containment && 'Composition' || 'Association')} key={'REF_' + se.start.node.id + '~' + se.end.node.id} />), 
            extendEdges.map(se => <Edge start={se.start} end={se.end} view={'Pointer_ViewEdgeInheritance'} key={'EXT_' + se.start.node.id + '~' + se.end.node.id} />)
        ]}
    </div>
    {otherPackages.filter(p => p).map(pkg => <DefaultNode key={pkg.id} data={pkg} />)}
    {level >= 1 && firstPackage && firstPackage.children.filter(c => c).map(classifier => <DefaultNode key={classifier.id} data={classifier} />)}
    {level >= 1 && m1Objects.filter(o => o).map(m1object => <DefaultNode key={m1object.id} data={m1object} />)}
    {decorators}
</div>`,
            'Package':
`<div className={'root package'}>

    <div className={'package-children'}>
        {upperLevel >= 1 ? [
            <label style={{position:'absolute', right:'-50px', top:'50px', display: 'flex', transform: 'rotate(270deg)'}}>
                <input className="potenziometro" onChange={(e)=>{node.state = {level:+e.target.value}}} min="0" max="3" type="range" step="1" value={level}
                    style = {{}}/>
                <div style={{transform: 'rotate(90deg) translate(0, 100%)'}}>Detail level:{level}</div>
            </label>,
            data.children.map(c => <DefaultNode key={c.id} data={c} />)
            ] :
        [
            <div className={""}><b>Uri:</b><span className={"ms-1"}>{data.uri}</span></div>,
            <div className={""}>{[
                data.classes.length ? data.classes.length + " classes" : '',
                data.enumerators.length ? data.enumerators.length + " enumerators" : ''
               ].filter(v=>!!v).join(',')}</div>
        ]
        }
    </div>
    {decorators}
</div>`,
            'Class':
`<div className={'root class'}>
    <Input jsxLabel={<b className={'class-name'}>EClass:</b>} data={data} field={'name'} hidden={true} autosize={true} />
    <hr/>
    <div className={'class-children'}>
        {level >= 2 && [
            data.attributes.map(c => <DefaultNode key={c.id} data={c} />),
            data.references.map(c => <DefaultNode key={c.id} data={c} />),
            data.operations.map(c => <DefaultNode key={c.id} data={c} />)
          ]
         || [
         <div className={""}><b>isInterface:</b><span className={"ms-1"}>{''+data.interface}</span></div>,
         <div className={""}><b>isAbstract:</b><span className={"ms-1"}>{''+data.abstract}</span></div>,
         <div className={""}><b>Instances:</b><span className={"ms-1"}>{data.instances.length}</span></div>,
         <div className={""}>{[
             data.attributes.length ? data.attributes.length + " attributes" : '',
             data.references.length ? data.references.length + " references" : '',
             data.operations.length ? data.operations.length + " operations" : ''
            ].filter(v=>!!v).join(',')}</div>
         ]
        }
    </div>
    {decorators}
</div>`,
            'Enum':
`<div className={'root enumerator'}>
    <Input jsxLabel={<b className={'enumerator-name'}>EEnum:</b>} data={data} field={'name'} hidden={true} autosize={true} />
    <hr />
    <div className={'enumerator-children'}>
        {level >= 2 && data.children.map(c => <DefaultNode key={c.id} data={c}/>)
          || <div className={""}>{data.literals} literals</div>}
    </div>
    {decorators}
</div>`,
            'Operation':
`<div className={'root w-100'}>
    <Select className={'p-1 d-flex'} data={data} field={'type'} label={data.name + ' =>'} />
    {data.exceptions.length ? " throws " + data.exceptions.join(", ") : ''}
    <div className={"parameters"}>{
        level >= 3 && data.parameters.map(p => <DefaultNode data={p} key={p.id} />)
    }</div>
    {decorators}
</div>`,
            'Object':
`<div className={'root object'}>
    <Input jsxLabel={<b className={'object-name'}>{data.instanceof ? data.instanceof.name : "Object"}:</b>}
            data={data} field={'name'} hidden={true} autosize={true} />
    <hr/>
    <div className={'object-children'}>
        {level >= 2 && features.map(f => <DefaultNode key={f.id} data={f} />)}
    </div>
    {decorators}
</div>`
    }

    BEGIN();
    let views: LViewElement[] = [];
    for (let name in jsxList) {
        let original = (LPointerTargetable.wrap('Pointer_View'+name as any) as LViewElement);
        let doriginal = original.__raw;
        let v = original.duplicate();
        v.jsxString = jsxList[name];
        const udLevel = 'ret.level = '+(["Model", "Package"].includes(name) ? 'node' : 'node.graph')+'.state.level ?? 3';
        if (!doriginal.usageDeclarations) v.usageDeclarations = '(ret) => {\n' +
            '// ** preparations and default behaviour here ** //\n' +
            'ret.node = node\n' +
            'ret.view = view\n' +
            '// custom preparations:\n' +
            '// data, node, view are dependencies by default. delete them above if you want to remove them.\n' +
            '// add preparation code here (like for loops to count something), then list the dependencies below.\n' +
            '// ** declarations here ** //\n' +
            udLevel + (name === 'Package' ? '\nret.upperLevel = node.graph.state.level ?? 3\n' : '\n') +
            '}';
        else {
            let ud = doriginal.usageDeclarations.split('\n');
            let i = ud.indexOf('// ** declarations here ** //');
            ud.splice(i+1, 0, udLevel);
            if (name === 'Package') ud.splice(i+2, 0, 'ret.upperLevel = node.graph.state.level ?? 3');
            v.usageDeclarations = ud.join('\n');
        }/*
        if (name === 'Model') {
            v.onDataUpdate = 'node.state = {level: node.state.level || 0}'
        }*/
        views.push(v);
    }
    setTimeout(()=>{
        for (let v of views){
            (v as any).viewpoint = vp;
        }
    })
    END();

}
(window as any).makeDefaultZoomView = makeDefaultZoomView;

function makeDefaultGraphViews(vp: Pointer<DViewPoint>, validationVP: Pointer<DViewPoint>): DViewElement[] {

    let errorOverlayView: DViewElement = DViewElement.new2('Semantic error view', DV.semanticErrorOverlay(), (v) => {
        v.jsCondition = 'let nstate = node.state;\nObject.keys(nstate).filter(k => k.indexOf("error_")===0).map(k=>nstate[k]).join(\'\\n\').length>0';
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
        v.palette={'anchor-':['#77f', '#f77', '#007'],
            'anchor-hover-':['#7f7', '#a44', '#070']}
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
.Edge:hover .anchor, .Edge:focus-within .anchor{
    display: block;
    opacity: 0;
    //outline: none;
    r: 25;
    border-radius: 100%;
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
else if (!name.match(/^[A-Za-z_$]+[A-Za-z0-9$_\\s]+$/)) err = type + " names can only contain an alphanumeric chars or or $_ symbols";
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

    let edgePointView: DViewElement = DViewElement.new('EdgePoint', DV.edgePointView(), new GraphSize(0, 0, 25, 25), '', '', '',
        [], '', undefined, false, true, vp);
    edgePointView.appliableTo = 'edgePoint'; edgePointView.resizable = false;
    // edgePointView.edgePointCoordMode = CoordinateMode.relativePercent;
    edgePointView.edgePointCoordMode = CoordinateMode.absolute;

    let edgeViews: DViewElement[] = [];
    let size0: GraphPoint = new GraphPoint(0, 0), size1: GraphPoint = new GraphPoint(20, 20), size2: GraphPoint = new GraphPoint(20, 20);
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
        "\n"+
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
        "ret.segments = edge.segments\n"+
        "}";

    function makeEdgeView(name: string, type: EdgeHead, headSize: GraphPoint | undefined, tailSize: GraphPoint | undefined, dashing: boolean): DViewElement{
        let ev = DViewElement.new2("Edge"+name,
            DV.edgeView(type, DV.svgHeadTail("Head", type), DV.svgHeadTail("Tail", type), dashing ? "10.5,9,0,0" : undefined),
            (v: DViewElement) => {
                v.bendingMode = EdgeBendingMode.Line;
                v.appliableToClasses = [DVoidEdge.cname];
                v.edgeHeadSize = headSize || size0;
                v.edgeTailSize = tailSize || size0;
                v.constants = edgeConstants;
                v.palette = {anchorSize: {type: 'number', value:5, unit:'px'}};
                v.css =
`.anchor{ r:var(--anchorSize) }
`;
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
        ev.bendingMode = EdgeBendingMode.Line;
        ev.subViews = [edgePointView.id];
    }*/
    // nb: Error is not a view, just jsx. transform it in a view so users can edit it


    let dv_subviews = [DefaultViews.model(vp), DefaultViews.package(vp), DefaultViews.class(vp), DefaultViews.enum(vp),
        DefaultViews.attribute(vp), DefaultViews.reference(vp), DefaultViews.operation(vp), DefaultViews.parameter(vp),
        DefaultViews.literal(vp), DefaultViews.object(vp), DefaultViews.value(vp), anchorView, voidView, ...edgeViews, edgePointView];

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

