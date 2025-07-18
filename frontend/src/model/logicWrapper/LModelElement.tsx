import {
    LVoidVertex,
    PackagePointers,
    EdgePointers,
    AnnotationPointers,
    AttributePointers,
    EnumPointers,
    LiteralPointers,
    OperationPointers,
    ObjectPointers,
    GraphPointers,
    ParameterPointers,
    ReferencePointers,
    VertexPointers,
    ModelPointers,
    LtoD,
    LVertex, LEdgePoint, LGraph, MultiSelectOptGroup, UX, Function2, Any, MultiSelectOption, windoww, Uobj, D,
} from "../../joiner";
import {
    Abstract,
    ClassPointers,
    Constructor,
    Constructors,
    Debug,
    DEdge, DefaultNode,
    Dictionary,
    DocString,
    DPointerTargetable,
    DState,
    DtoL,
    getWParams,
    GObject,
    GraphSize,
    Instantiable,
    Leaf,
    LEdge,
    LGraphElement,
    Log,
    LogicContext,
    LPointerTargetable,
    Node,
    Pack,
    Pack1,
    PackArr,
    PointedBy,
    Pointer,
    Pointers,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    Selectors,
    SetFieldAction, SetRootFieldAction,
    ShortAttribETypes,
    ShortAttribSuperTypes,
    store,
    TargetableProxyHandler,
    L,
    TRANSACTION,
    U, Uarr
} from "../../joiner";
import type {Info, Json, ObjectWithoutPointers, orArr, PrimitiveType, unArr} from "../../joiner/types";

import {
    AccessModifier,
    ECoreAnnotation,
    ECoreAttribute,
    ECoreClass,
    ECoreEnum,
    EcoreLiteral,
    ECoreOperation,
    ECorePackage,
    EcoreParser,
    ECoreReference,
    ECoreRoot
} from "../../api/data";
import {ValuePointers} from "./PointerDefinitions";
import {ShortDefaultEClasses} from "../../common/U";
import {transientProperties} from "../../joiner/classes";
import React, {JSX, ReactNode} from "react";
import {UpdatingTimer} from "../../redux/reducer/reducer";

type outactions = {clear:(()=>void)[], set:(()=>void)[], immediatefire?: boolean};
export type SchemaMatchingScore = {
    id: Pointer<DClass>, score: number,
    excessFeatures: Dictionary<string>, matchingFeatures: Dictionary<string>, missingFeatures: Dictionary<string>,
    excessFeaturesCount: number, matchingFeaturesCount: number, missingFeaturesCount: number,
    isPartial: boolean,
    class:LClass, instantiable: boolean, namesMap: Dictionary<DocString<"feature name">>};


@Node
@RuntimeAccessible('DModelElement')
export class DModelElement extends DPointerTargetable {
    // static _super = DPointerTargetable;
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DModelElement, 1, 1, LModelElement>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // instances: Pointer<DModelElement, 0, 'N', LModelElement> = [];

    public static new(): DModelElement {
        Log.exx("DModelElement is abstract, cannot instantiate");
        return null as any;
        //return new Constructors(new DModelElement('dwc')).DPointerTargetable().DModelElement().end();
    }
    public static new3(...a:any): DModelElement {
        Log.exx("DModelElement is abstract, cannot instantiate");
        return null as any; }

    static LFromHtml(target?: Element | null): LModelElement | undefined { return LPointerTargetable.fromPointer(DModelElement.PtrFromHtml(target) as Pointer); }
    static DFromHtml(target?: Element | null): DModelElement | undefined { return DPointerTargetable.fromPointer(DModelElement.PtrFromHtml(target) as Pointer); }
    static PtrFromHtml(target?: Element | null): Pointer<DModelElement> | undefined {
        while (target) {
            if ((target.attributes as any).dataid) return (target.attributes as any).dataid.value;
            target = target.parentElement;
        }
        return undefined;
    }
}

@Leaf
@RuntimeAccessible('DAnnotationDetail')
export class DAnnotationDetail extends DPointerTargetable {
    // todo
}



@Abstract
@RuntimeAccessible('LModelElement')
export class LModelElement<Context extends LogicContext<DModelElement> = any, D extends DModelElement = DModelElement> extends LPointerTargetable {
    // extends Mixin(DModelElement0, LPointerTargetable)
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;

    /* Alfonso */
    static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    /*static ResolvePointer = resolvePointerFunction;
    private static ResolvePointers? = resolvePointersFunction;
    private resolvePointer<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, UB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>): RET | null {
        return LModelElement.ResolvePointer(ptr); }
    private resolvePointers<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, 'N', RET>)
        : (RET | null)[] { return resolvePointersFunction(ptr); }
    */
    public __raw!: DModelElement;
    id!: Pointer<DModelElement, 1, 1, LModelElement>;
    parent!: LModelElement[];
    father!: LModelElement; // annotations can be children of everything. except them fathers are: Model, Package, Classifier(class+enum), Operation

    private __info_of__father = {type: "LModelElement", txt:"<a href=\"https://github.com/DamianoNaraku/jodel-react/wiki/LModelElement\"><span>The element containing this object.</span></a>"};
    public fatherList!: LModelElement[]; // chain of fathers going up recursively
    annotations!: LAnnotation[];
    children!: (LPackage | LClassifier | LTypedElement | LAnnotation | LObject | LValue)[];
    __info_of__children__: Info = {type: "LModelElement[]", txt: <div>Merging of all the subelement collections (attributes, references, parameters...) except annotations</div>}
    nodes!: LGraphElement[];
    node!: LGraphElement | undefined;

    // utilities to go up in the tree (singular names)
    model!: LModel; // utility, follow father chain until get a Model parent or null
    package!: LPackage | null;
    class!: LClass | null;
    enum!: LEnumerator | null;
    operation!: LOperation | null;
    subNodes!: LGraphElement[] | null;


    property!: keyof DModelElement;
    containers!: LNamedElement[]; // list of fathers until the model is reached.
    //name?:string;


    [key: `@${string}`]: LModelElement;
    [key: `$${string}`]: LModelElement;

    // protected _defaultGetter(c: Context, k: keyof Context["data"]): any {}

    protected _defaultGetter(c: Context, k: keyof any): any {
        let targetObj = c.data;
        let proxyitself = c.proxyObject;
        // if not exist check for children names
        if (typeof k === "string" && k !== "children" && (!(k in c.data) && !(k in this))) { // __info_of_children__
            let lchildren: LPointerTargetable[];
            try { lchildren = this.get_children(c); }
            catch (e) { lchildren = []; }
            // let dchildren: DPointerTargetable[] = lchildren.map<DPointerTargetable>(l => l.__raw as any);
            let lc: GObject;
            let pk: string;
            if (TargetableProxyHandler.childKeys[k[0]]) { pk = k.substring(1); }
            else pk = k;
            if (Array.isArray(lchildren)) for (lc of lchildren) {
                let n = lc?.name;
                if (n && n.toLowerCase() === pk.toLowerCase()) return lc;
            }
        }
        return super.__defaultGetter(c, k);
    }

    // this one must return true or the js engine throws an exception
    protected _defaultSetter(val: any, c: GObject<Context>, k: string): true {
        if (this._setterFor$stuff_canReturnFalse(val, c as any, k as any)) return true;
        super._defaultSetter(val, c as any, k);
        return true;
    }
    // this one must be able to return false because is called by DObject and DValue default setters and return type is checked
    protected _setterFor$stuff_canReturnFalse(val: any, c: Context, k: keyof Context["data"] & string): boolean {
        // if (!["@", "$"].includes(k[0])) return false;
        if (!TargetableProxyHandler.childKeys[k[0]]) return false;
        let target: LPointerTargetable = (c.proxyObject as GObject)[k];
        if (!target) return false;
        let l;
        let tClassName: string = target.className;

        // messanger classNames (pass it to next sublevel)
        navigationloop: while(true) {
            switch (tClassName) {
                default: break navigationloop;
                case DPackage.cname:
                case DClass.cname:
                case DEnumerator.cname:
                case DObject.cname:
                    target = (target as LModelElement).children[0]; continue navigationloop;
            }
        }

        // actiong classNames
        switch (tClassName) {
            default: Log.exx("default setter not supported for model element: " + c.data.className, {c, k, val, target}); return false;
            case DEnumLiteral.cname:
                l = target as LEnumLiteral;
                switch (typeof val){
                    default: return false;
                    case "string": l.literal = val; return true;
                    case "number": l.ordinal = val; return true;
                }
                return false;
            case DValue.cname:
                // makes object.$x = 1      be equivalent to object.$x.value = 1 (or values if is arr)
                l = target as LValue;
                l.values = val;
                return true;
        }
    }

    get_getByFullPath(c: Context): this['getByFullPath'] {
        return (path: string | string[]): L | null => {
            let patharr = Array.isArray(path) ? path : path.split('.');
            let rootType: typeof D;
            let root: L | null = Selectors.getByName(DModel, patharr[0], true, true) as L;
            // NB: do not use .parent or .model because the first key because it is the model name, and it might not be the current one.
            if (!root) return null;
            if (patharr.length === 1) return root;
            patharr.splice(0, 1);
            return root.getByPath(patharr);
        }
    }

    fullname!:string;
    protected get_fullName(context: Context): this["fullname"] { return this.get_fullname(context); }
    protected get_fullname(context: Context): this["fullname"] {
        const containers = this.get_containers(context).reverse();
        // let sliceindex = (containers[0] as LModel).dependencies.length ? 1 : 0;
        let fullname: string = containers.slice(0, containers.length).map(c => c.name).join('.');
        return fullname;
    }


    protected _autofix_name(val: string, context: Context): string {
        // NB: NON fare autofix di univocità nome tra i children o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
        return val.replaceAll(/\s/g, '_');
    }

    protected get_autofix_name(val: string, context: Context): (val: string) => string {
        return (val: string) => this._autofix_name(val, context);
    }

    public autofix_name(val: string): string {
        return this.wrongAccessMessage("autofix_name");
    }

    public static M1Classes = ['DModel', 'DObject', 'DValue']; // Dstrudturalfeature in shapeless obj??
    public static AbstractClasses = ['DModelElement', 'DNamedElement', '...'];
    public static M2InstantiableClasses = ['DModel', 'DOperation', 'DClass', 'DReference', 'DAttribute'];
    isM1!: (()=>boolean);
    __info_of__isM1: Info = {type:'()=>boolean', txt:<div>Whether the element belong to the metamodel or the model.</div>}
    get_isM1(c: Context): ()=>boolean {
        // NB: if called with "abstract classes" like DModelElement, DTypedElement... responds they are in m2
        return (() => (!(c.data as DModel).isMetamodel && LModelElement.M1Classes.includes(c.data.className)));
    }
    isM2!: (()=>boolean);
    __info_of__isM2: Info = {type:'()=>boolean', txt:<div>Whether the element belong to the metamodel or the model.</div>}
    get_isM2(c: Context): ()=>boolean { return (() => !(this.get_isM1(c))); }

    isInstantiable!: boolean;
    instantiable!: boolean;
    __info_of__isInstantiable: Info = {type:'boolean', txt:<div>Whether the element type (DClass, DAttribute...) can produce an instance in the model.</div>}
    get_isInstantiable(c: Context): boolean { return this.get_instantiable(c); }
    get_instantiable(c: Context): boolean { return LModelElement.M2InstantiableClasses.includes(c.data.className); }

    childNames!: string[];
    __info_of__childNames: Info = {type: "(json: object, instanceof?: LClass) => LObject", txt: "Array containing the names of all children subelements."};
    get_childNames(c: Context): string[] { return this.get_children(c).map( (c: GObject<LModelElement>) => c.name).filter(c=>!!c) as string[]; }

    public generateEcoreJson(loopDetectionloopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        throw new Error("cannot be called directly, should trigger getter. this is only for correct signature");
    }

    private get_generateEcoreJson(context: Context): (loopdetectionobj: Dictionary<Pointer, DModelElement>) => Json {
        return (loopdetectionobj) => this.generateEcoreJson_impl(context, loopdetectionobj);
    }

    protected generateEcoreJson_impl(context: Context, loopDetectionObj?: Dictionary<Pointer, DModelElement>): Json {
        return Log.exDevv("generateEcoreJson() should be overridden", context);
    }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall(((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate() class is abstract");
    }

    public addAnnotation(source?: DAnnotation["source"], details?: DAnnotation["details"]): DAnnotation {
        return this.cannotCall("addAnnotation");
    }

    protected get_addAnnotation(context: Context): this["addAnnotation"] {
        return (source?: DAnnotation["source"], details?: DAnnotation["details"]) => DAnnotation.new(source, details, context.data.id, true);
    }

    protected set_containers(): boolean {
        return this.cannotSet('containers');
    }

    protected get_containers(context: Context): LModelElement["containers"] {
        let thiss: LModelElement = context.proxyObject;
        const ret: LModelElement[] = [thiss];
        while (true) {
            thiss = thiss.father;
            if (!thiss) break;
            ret.push(thiss);
        }
        return ret as LNamedElement[];
    }


    protected get_namespace(context: Context): string {
        throw new Error("?? get namespace ?? todo");
        return "";
    }

    protected get_subNodes(context: LogicContext<LClass>, includingthis: boolean = false): LGraphElement[] {
        const lclass: LClass = context.proxyObject as any;
        let $class = $('[data-dataid="' + context.data.id + '"]');
        let $subnodes = $class.find('[data-nodeid]');

        function mapfunc(this: HTMLElement) {
            return this.dataset.nodeid;
        }

        let nodehtmlarr: HTMLElement[] = $subnodes.toArray();
        if (includingthis) nodehtmlarr.push($class[0]);
        let nodeidarr: string[] = nodehtmlarr.map((html: HTMLElement) => html.dataset.nodeid) as string[];
        let state = store.getState();
        let dnodes = nodeidarr.map(id => state.idlookup[id]).filter((d) => !!d);
        return dnodes.map(d => LPointerTargetable.wrap(d)) as any;
    }


    // name -> redux (es. DClass -> classs)
    protected get_property(context: Context): this["property"] {
        return (context.data.className.substring(1) + "s").toLowerCase() as any;
    }

    protected targetRemoved(context: Context, field: keyof DPointerTargetable): void {
        context.proxyObject.delete();
    }


    protected get_fatherList(context: Context): LModelElement[] {
        let ret: LModelElement[] = [context.proxyObject];
        let loopdetection: Dictionary<Pointer, boolean> = {};
        loopdetection[context.data.id] = true;
        let current = this.get_father(context);
        while (current) {
            if (loopdetection[current.id]) { console.error("found loop", {loopdetection, ret, current}); return ret; }
            loopdetection[current.id] = true;
            ret.push(current);
            current = current.father;
        }
        return ret;
    }

    // @ts-ignore
    private get_until_parent<D extends Constructor, L extends DtoL<InstanceType<D>>>(l: LModelElement, d: DModelElement, father: typeof D): L | null {
        while (true) {
            // console.log('get_until_parent', {l, d, father}, {dname: d.className, fname: father.name});
            if (d.className === (father.cname || father.name)) return l as L;
            l = l.father;
            let oldd = d;
            d = l?.__raw;
            if (oldd === d || !l) return null; // reached end of father chain (a model) without finding the desired parent.
        }
    }

    __info_of__nodes:Info={type: 'LGraphElement[]', txt: "Return all kind of graphic elements representing this modelElement currently displayed in the graph, including edges"};
    protected get_nodes(context: Context): this["nodes"] {
        return Object.values(transientProperties.modelElement[context.data.id]?.nodes || {}).filter(n=>n&&n.html);/*
        const nodes: LGraphElement[] = [];
        const nodeElements = $('[data-dataid="' + context.data.id + '"]'); nope, this must become more efficient. when node is created set action to update data.nodes array? or to update a transient property (better)
        for (let nodeElement of nodeElements) {
            const nodeId = nodeElement.id;
            if (nodeId) {
                const lNode: LGraphElement | undefined = LPointerTargetable.wrap(nodeId);
                if (lNode) nodes.push(lNode);
            }
        }
        return nodes;*/
    }

    __info_of__node:Info={type: 'LGraphElement[]', txt: "Return the latest updated node representing this ModelElement, including those not currently displayed in the graph."};
    protected get_node(context: Context): this["node"] {
        return transientProperties.modelElement[context.data.id]?.node;
        // const nodes = context.proxyObject.nodes;
        // return nodes.filter( n => n.favoriteNode)[0] || nodes[0];
    }
    edges!: LEdge[];
    edge!: LEdge;
    __info_of__edges:Info={type: 'LEdge[]', txt: "The subset of \"nodes\" containing only edges."};
    __info_of__edge:Info={type: 'LEdge[]', txt: "The first element of the collection edges"};
    protected get_edges(context: Context): this["edges"] {
        return this.get_nodes(context).filter( l => l.className?.includes('Edge')) as any;
    }
    protected get_edge(context: Context): this["edge"] {
        return this.get_nodes(context).find( l => l.className?.includes('Edge')) as any;
    }
    notEdges!: LGraphElement[];
    notEdge!: LGraphElement;
    __info_of__notEdges:Info={type: 'LGraphElement[]', txt: "The subset of \"nodes\" excluding only edges."};
    protected get_notEdges(context: Context): this["notEdges"] {
        return this.get_nodes(context).filter( l => !(l.className?.includes('Edge'))) as any;
    }
    __info_of__notEdge:Info={type: 'LGraphElement', txt: "The first element of the collection notEdges"};
    protected get_notEdge(context: Context): this["notEdge"] {
        return this.get_nodes(context).find( l => !(l.className?.includes('Edge'))) as any;
    }
    vertexes!: LVertex[];
    vertex!: LVertex;
    __info_of__vertexes:Info={type: 'LVertex[]', txt: "The subset of \"nodes\" containing only vertexes."};
    __info_of__vertex:Info={type: 'LVertex', txt: "The first element of the collection vertexes"};
    protected get_vertexes(context: Context): this["vertexes"] {
        return this.get_nodes(context).filter( l => l.className?.includes('Vertex')) as any;
    }
    protected get_vertex(context: Context): this["vertex"] {
        return this.get_nodes(context).find( l => l.className?.includes('Vertex')) as any;
    }
    edgePoints!: LEdgePoint[];
    edgePoint!: LEdgePoint;
    __info_of__edgePoints:Info={type: 'LVertex[]', txt: "The subset of \"nodes\" containing only edgePoints."};
    __info_of__edgePoint:Info={type: 'LVertex', txt: "The first element of the collection edgePoints"};
    protected get_edgePoints(context: Context): this["edgePoints"] {
        return this.get_nodes(context).filter( l => l.className?.includes('EdgePoint')) as any;
    }
    protected get_edgePoint(context: Context): this["edgePoint"] {
        return this.get_nodes(context).find( l => l.className?.includes('EdgePoint')) as any;
    }
    graphs!: LGraph[];
    graph!: LGraph;
    __info_of__graphs:Info={type: 'LGraph[]', txt: "The subset of \"nodes\" containing only graphs."};
    __info_of__graph:Info={type: 'LGraph', txt: "The first element of the collection graphs"};
    protected get_graphs(context: Context): this["graphs"] {
        return this.get_nodes(context).filter( l => {
            let d = l.__raw;
            return d.className === 'DGraph' || d.className === 'DGraphVertex'
        }) as any;
    }
    protected get_graph(context: Context): this["graph"] {
        return this.get_nodes(context).find( l => {
            let d = l.__raw;
            return d.className === 'DGraph' || d.className === 'DGraphVertex'
        }) as any;
    }
    fields!: LGraphElement[];
    field!: LGraphElement;
    __info_of__fields:Info={type: 'LGraphElement[]', txt: "The subset of \"nodes\" containing only fields."};
    __info_of__field:Info={type: 'LGraphElement', txt: "The first element of the collection fields"};
    protected get_fields(context: Context): this["fields"] {
        return this.get_nodes(context).filter( l => l.className === 'DGraphElement') as any;
    }
    protected get_field(context: Context): this["field"] {
        return this.get_nodes(context).find( l => l.className === 'DGraphElement') as any;
    }

    /*
    protected get_nodes(context: Context): this["nodes"] {
        return context.data.nodes.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_nodes(val: PackArr<this["nodes"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'nodes', list);
        return true;
    }
    */

    protected get_model(context: Context): LModel {
        return this.get_until_parent(context.proxyObject, context.data, DModel) as LModel;
    }

    protected get_package(context: Context): LPackage {
        return this.get_until_parent(context.proxyObject, context.data, DPackage) as LPackage;
    }

    protected get_class(context: Context): LClass | null {
        return this.get_until_parent(context.proxyObject, context.data, DClass);
    } // todo: might be better for pergormance to erase this universal method and add implementations to every single L-class counting the correct amount of "father" navigations for each ( attrib to package? use attrib.father.father)
    protected get_operation(context: Context): LOperation | null {
        return this.get_until_parent(context.proxyObject, context.data, DOperation);
    }

    protected get_enum(context: Context): LEnumerator | null {
        return this.get_until_parent(context.proxyObject, context.data, DEnumerator);
    }

    protected get_father(context: Context): LModelElement {
        return LPointerTargetable.from(context.data.father);
    }

    protected get_children_idlist(context: Context): Pointer<DAnnotation | DPackage | DClassifier | DEnumerator | DEnumLiteral | DParameter | DStructuralFeature | DOperation | DObject | DValue, 1, 'N'> { // LPackage | LClassifier | LTypedElement | LAnnotation | LEnumLiteral | LParameter | LStructuralFeature | LOperation
        return context.data.annotations ? [...context.data.annotations] : [];
    }

    protected get_children(context: Context): this["children"] {
        // return this.get_children_idlist(context).map(e => LPointerTargetable.from(e));
        return LPointerTargetable.from(this.get_children_idlist(context));
    }

    protected set_children(a: never, context: Context): boolean {
        return Log.exx('children is a derived read-only collection', context.data);
    }

/*
    add_parent(val: Pack<this["parent"]>, c: Context): boolean { // will be used?
        const ptr = Pointers.from(val);
        TRANSACTION(this.get_name(c)+'.parent+=', ()=>{
            SetFieldAction.new(c.data, 'parent', ptr, '+=', true); // need to update children of the old and new parents
        })
        return true;
    }
    protected remove_parent(c: Context): boolean {
        return SetFieldAction.new(c.data, 'parent', [], '', true);
    }

    protected get_parent(c: Context): this["parent"] {
        return LPointerTargetable.from(c.data.id);
    }*/

    protected set_parent(val: Pack<LAnnotation>, c: Context): boolean { // val: Pack<DModelElement>
        const ptrs = Pointers.from(val);
        let ptr: Pointer;
        if (Array.isArray(ptrs)) ptr = ptrs[0];
        else ptr = ptrs;
        if (c.data.father === ptr) return true;
        TRANSACTION(this.get_name(c)+'.parent', ()=>{
            SetFieldAction.new(c.data, 'father', ptr, '', true);
            //SetFieldAction.new(c.data, 'parent', ptrs, '', true);
        }, this.get_father(c)?.name, LPointerTargetable.wrap(ptr)?.name)
        return true;
    }

    add_annotation(val: Pack<this["annotations"]>, c: Context): boolean {
        const ptrs = Pointers.from(val);
        TRANSACTION(this.get_name(c)+'.annotations+=', ()=>{
            SetFieldAction.new(c.data, 'annotations', ptrs, '+=', true);
        }, undefined, ptrs.length)
        return true;
    }

    remove_annotation(val: Pack<this["annotations"]>, c: Context): boolean { // todo: when this will be ever used? this should be triggered by LObject but only get_ / set_ and delete of whole elements should be triggerable.
        let ptrs: Pointer<DAnnotation, 1, 'N', LAnnotation> = Pointers.from(val) as any;
        if (!Array.isArray(ptrs)) ptrs = [ptrs] as any;
        let indexes = ptrs.map(ptr => c.data.annotations.indexOf(ptr)).filter(p => p >= 0);
        if (indexes.length === 0) return true;
        TRANSACTION(this.get_name(c)+'.annotations-=', ()=>{
            SetFieldAction.new(c.data, 'annotations', indexes, '-=', true);
        }, undefined, ptrs.length)
        return true;
    }

    protected get_annotations(context: Context): this["annotations"] {
        return LPointerTargetable.fromPointer(context.data.annotations);
    }

    protected set_annotations(val: Pack<LAnnotation>, c: Context): boolean {
        //  if (!Array.isArray(val)) val = [val];
        //         val = val.map( v => (v instanceof LAnnotation ? v.id : ( Pointers.filterValid(v) ? v : null ))) as Pointer<DAnnotation>[];
        let ptrs = Pointers.from(val);
        if (!Array.isArray(ptrs)) ptrs = [ptrs] as any;
        if (!ptrs.length) return true;
        TRANSACTION(this.get_name(c)+'.annotations', ()=>{
            SetFieldAction.new(c.data, 'annotations', ptrs, '', true);
        }, undefined, ptrs.length)
        return true;
    }

    protected get_addChild(c: Context): (type?: string, ...params: any[]) => LModelElement { // just for add new, not for add pre-existing.
        return (type?: string, ...args: any) => {
            let ret: undefined | ((...params: any[]) => LModelElement) = undefined;
            TRANSACTION(this.get_name(c)+'.addChild()', ()=>{
                let type0 = type;
                if (!type || type === "auto") {
                    switch(c.data.className){
                        case DModel.cname: if ((c.data as DModel).isMetamodel) type = "package"; else type = "object"; break;
                        case DObject.cname: type = "value"; break;
                        case DPackage.cname: type = "package"; break;
                        case DClass.cname: type = "attribute"; break;
                        case DEnumerator.cname: type = "literal"; break;
                        case DOperation.cname: type = "parameter"; break;
                        default: type = "annotation"; break;
                    }
                }
                let fatherElement;
                switch (type.toLowerCase()) {
                    default:
                        Log.ee('cannot find children type requested to add:', {type: (type || '').toLowerCase(), c});
                        ret = () => undefined as any;
                        break;
                    case "package":
                        ret = (this.get_package(c) || this.get_model(c))?.addPackage;
                        break;
                    case "class":
                        // let current = c.proxyObject;
                        fatherElement = this.get_package(c);
                        if (!fatherElement) {
                            let model = this.get_model(c);
                            //if (model && !model.isMetamodel) model = model.instanceof;
                            fatherElement = model.packages[0];
                            if (!fatherElement) fatherElement = model.addPackage();
                        }
                        ret = fatherElement.addClass;
                        //ret = (this as any).get_addClass(context as any);
                        break;
                    case "enum":
                    case "enumerator":
                        fatherElement = this.get_package(c);
                        if (!fatherElement) {
                            let model = this.get_model(c);
                            //if (model && !model.isMetamodel) model = model.instanceof;
                            fatherElement = model.packages[0];
                            if (!fatherElement) fatherElement = model.addPackage();
                        }
                        ret = fatherElement.addEnumerator;
                        break;
                    case "attribute":
                        ret = this.get_class(c)?.addAttribute;
                        break;
                    case "reference":
                        ret = this.get_class(c)?.addReference;
                        break;
                    case "literal":
                        ret = this.get_enum(c)?.addLiteral;
                        break;
                    case "operation":
                        ret = this.get_class(c)?.addOperation;
                        break;
                    case "parameter":
                        ret = this.get_operation(c)?.addParameter;
                        break;
                    case "object":
                        if (c.data.className === "DValue") {
                            ret = (this as any as LValue).get_addObject(c as any as LogicContext<DValue>);
                        }
                        else {
                            ret = this.get_model(c).addObject;
                        }

                    //case "exception": ret = ((exception: Pack1<LClassifier>) => { let rett = this.get_addException(context as any); rett(exception); }) as any; break;
                    /*case "exception": exceptions should not be "added" here, this is for creating objects. exceptions are not created but just linked. they are classes.
                        ret = (this as any).get_addException(c as any);
                        break; */
                }
                // console.log('x6 addchild()', {type0, type, args, fatherElement, ret, rts:ret?.toString()});
                ret = ret ? ret(...args) : null as any;
            })
            return ret as any;
        }
    }

    protected get_addException(c: Context): () => void {
        let ret = () => {};
        const dOperation: DOperation | null = (c.data?.className === "DOperation") ? c.data as DOperation : null;
        if (!dOperation) return ret;
        const dClass = DPointerTargetable.from(dOperation.father);
        if (!dClass) return ret;
        ret = () => {
            TRANSACTION(this.get_name(c)+'.exceptions+=', ()=>{
                SetFieldAction.new(dOperation, "exceptions", dClass.id, '+=', true);
            }, undefined, LPointerTargetable.fromD(dClass).name)
        }
        ret();
        // todo: test & fix this double call, i suspect if you call it
        //  from get_addChildren it triggers once (return is ignored) but twice if directly
        return ret;
    }

    // activated by user in JSX
    // todo: this.wrongAccessMessage("addClass");
    protected cannotCall(name: string, ...params: string[]): any {
        Log.exDevv(name + ' should never be called directly, but should trigger get_' + name + '(' + params.join(', ') + '), this is only a signature for type checking.');
    }

    public addClass(): void {
        this.cannotCall('addClass');
    }

    public addAttribute(): void {
        this.cannotCall('addAttribute');
    }

    public addReference(): void {
        this.cannotCall('addReference');
    }

    public addEnumerator(): void {
        this.cannotCall('addEnumerator');
    }

    public addParameter(): void {
        this.cannotCall('addParameter');
    }

    // chiedere al prof: cosa può lanciato come eccezione: se tutte le classi o se solo quelle che estendono Exception
    public addException(exception?: DClassifier): () => void {
        throw this.wrongAccessMessage("AddException");
    }

    public addChild(type: string): DModelElement {
        return this.cannotCall('addChild', type);
    }

}

/*function isValidPointer<T extends DPointerTargetable = DModelElement, LB extends number = 0, UB extends number = 1, RET extends LPointerTargetable = LModelElement>
(p: Pointer<T, LB, UB, RET>, constraintType?: typeof DPointerTargetable): boolean {
    const pointerval: RET | null = LModelElement.ResolvePointer(p);
    if (!pointerval) return false;
    if (!constraintType) return true;
    return (pointerval instanceof constraintType); }*/

/* todo:
nel proxy aggiungi regola di default, se prendi qualcosa che inizia con "set_X" esplicitamente (dovrebbe farlo solo il dev)
richiama _set_X(context, ...params)     <---- nuova funzione set di default, anche this.x = x richiama _set_x

il dev specifica set_x come public di sola firma senza implementazione (throw exception) e senza context
il dev specifica _set_x come implementazione private

per la get esiste solo _get_x, non "get_x"

 todo2: aggiungi readonly a tutti i campi L per non sbagliarsi e fare in modo che il dev usi sempre i "set_" che sono correttamente tipizzati
*
* */

/*todo:
* for every feature X: typed L, in CLASS_L0 with a side effects when they are edited (like need to update other data for consistency)
*
* dev will use this
* protected set_X(val: D | L | Pointer<D> ) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
* protected get_set_X( val: D | L | Pointer<D>, otherparams, ContextD>) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
*
*
* */
// export type WModelElement = DModelElement | LModelElement | _WModelElement;
RuntimeAccessibleClass.set_extend(DPointerTargetable, DModelElement);
RuntimeAccessibleClass.set_extend(DPointerTargetable, LModelElement);

@Leaf
@RuntimeAccessible('DAnnotation')
export class DAnnotation extends DModelElement { // extends Mixin(DAnnotation0, DModelElement)
    // static singleton: LAnnotation;
    // static logic: typeof LAnnotation;
    // static structure: typeof DAnnotation;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // inherit redefine
    id!: Pointer<DAnnotation, 1, 1, LAnnotation>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    source!: string;
    details!: DAnnotationDetail[];//Dictionary<string, string>;

    public static new(source?: DAnnotation["source"], details?: DAnnotation["details"], father?: Pointer, persist: boolean = true): DAnnotation {
        // if (!name) name = this.defaultname("annotation ", father);
        return new Constructors(new DAnnotation('dwc'), father, persist, undefined).DPointerTargetable().DModelElement().DAnnotation(source, details).end();
    }
}

@Node
@RuntimeAccessible('LAnnotation')
export class LAnnotation<Context extends LogicContext<DAnnotation> = any, D extends DAnnotation = DAnnotation> extends LModelElement {
    // Mixin(DAnnotation0, LModelElement)
    // @ts-ignore
    __namee!: "LAnnotation" = "LAnnotation";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DAnnotation;
    id!: Pointer<DAnnotation, 1, 1, LAnnotation>;
    // static singleton: LAnnotation;
    // static logic: typeof LAnnotation;
    // static structure: typeof DAnnotation;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    source!: string;
    details!: LAnnotationDetail[];// Dictionary<string, string> = {};

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        EcoreParser.write(json, ECoreAnnotation.source, context.data.source);
        // EcoreParser.write(json, ECoreAnnotation.references, context.proxyObject.referencesStr);
        EcoreParser.write(json, ECoreAnnotation.details, context.proxyObject.details.map(d => d.generateEcoreJson(loopDetectionObj)));
        return json;
    }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall(((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()");
    }

    protected get_duplicate(c: Context): ((deep?: boolean) => LAnnotation) {
        return (deep: boolean = false) => {
            let ret: LAnnotation = null as any;
            TRANSACTION('duplicate ' + this.get_name(c), ()=>{
                let de = c.proxyObject.father.addAnnotation(c.data.source, (deep ? c.proxyObject.details.map(ldet => ldet.duplicate().__raw) : c.data.details));
                let le: LAnnotation = LPointerTargetable.fromD(de);
                let we: WAnnotation = le as any;
                we.annotations = deep ? c.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : c.data.annotations;
                ret = le; // set ret = le only if the transaction is complete.
            })
            return ret;
        }
    }

    protected get_source(context: Context): this["source"] {
        return context.data.source;
    }

    protected set_source(val: this["source"], c: Context): boolean {
        if (val === c.data.source) return true;
        TRANSACTION(this.get_name(c)+'.source', ()=>{
            SetFieldAction.new(c.data, 'source', val, '', false);
        }, c.data.source, val);
        return true;
    }

    protected get_details(context: Context): this["details"] {
        return TargetableProxyHandler.wrapAll(context.data.details);
    }

    protected set_details(val: this["details"], c: Context): boolean {
        if (val === c.data.details) return true;
        TRANSACTION(this.get_name(c)+'.details', ()=>{
            SetFieldAction.new(c.data, 'details', val);
        }, c.data.details, val)
        return true;
    }
}

RuntimeAccessibleClass.set_extend(DModelElement, DAnnotation);
RuntimeAccessibleClass.set_extend(LModelElement, LAnnotation);
@Leaf
@RuntimeAccessible('LAnnotationDetail')
export class LAnnotationDetail<Context extends LogicContext<DAnnotationDetail> = any> extends LModelElement { // todo
    father!: LAnnotation;

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        // loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        // if (context.data.name !== null) EcoreParser.write(json, ECoreDetail.key, context.data.name);
        // if (context.data.value !== null) EcoreParser.write(json, ECoreDetail.value, context.data.value);
        return json;
    }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall(((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()");
    }

    protected get_duplicate(context: Context): ((deep?: boolean) => this) {
        Log.exDevv("LAnnotationDetail.getDuplicate(): todo");
        return () => this;
        // return (deep: boolean = false) => (context.proxyObject as LAnnotationDetail).father.addAnnotationDetail( {...context.data._subMaps})
    }
}

RuntimeAccessibleClass.set_extend(DModelElement, DAnnotationDetail);
RuntimeAccessibleClass.set_extend(LModelElement, LAnnotationDetail);
@Node
@RuntimeAccessible('DNamedElement')
export class DNamedElement extends DPointerTargetable { // Mixin(DNamedElement0, DAnnotation)
    // static _super = DAnnotation;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LNamedElement;
    // static logic: typeof LNamedElement;
    // static structure: typeof DNamedElement;

    // inherit redefine
    id!: Pointer<DNamedElement, 1, 1, LNamedElement>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    name!: string;

    public static new(name?: DNamedElement["name"]): DNamedElement {
        Log.exx("DNamedElement is abstract, cannot instantiate");
        return null as any;
        // return new Constructors(new DNamedElement('dwc')).DPointerTargetable().DModelElement().DNamedElement(name).end();
    }

}

@Abstract
@RuntimeAccessible('LNamedElement')
export class LNamedElement<Context extends LogicContext<DNamedElement> = any> extends LModelElement { // Mixin(DNamedElement0, DAnnotation)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // public __raw!: DNamedElement;
    id!: Pointer<DNamedElement, 1, 1, LNamedElement>;
    // static singleton: LNamedElement;
    // static logic: typeof LNamedElement;
    // static structure: typeof DNamedElement;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    name!: string;
    namespace!: string;

    protected set_containers(): boolean {
        return this.cannotSet('containers');
    }

    protected get_containers(context: Context): LNamedElement["containers"] {
        let thiss: LNamedElement = context.proxyObject;
        const ret: LNamedElement[] = [thiss];
        while (true) {
            thiss = thiss.father as LNamedElement;
            if (!thiss) break;
            ret.push(thiss);
        }
        return ret;
    }

    // protected get_namespace(context: Context): string { throw new Error("?? get namespace ?? todo"); return ""; }

}


// export type WNamedElement = DNamedElement | LNamedElement | _WNamedElement;
RuntimeAccessibleClass.set_extend(DModelElement, DNamedElement);
RuntimeAccessibleClass.set_extend(LModelElement, LNamedElement);
@RuntimeAccessible('DTypedElement')
export class DTypedElement extends DPointerTargetable { // Mixin(DTypedElement0, DNamedElement)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LTypedElement;
    // static logic: typeof LTypedElement;
    // static structure: typeof DTypedElement;

    // inherit redefine
    id!: Pointer<DTypedElement, 1, 1, LTypedElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    name!: string;
    instances!: Pointer<DValue, 0, 'N', LValue>;
    // personal
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?
    allowCrossReference!:boolean;


    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"], father?: Pointer, persist: boolean = true): DTypedElement {
        Log.exx("DTypedElement is abstract, cannot instantiate");
        return null as any;
        //return new Constructors(new DTypedElement('dwc'), father, persist, undefined).DPointerTargetable().DModelElement().DNamedElement(name).DTypedElement(type).end();
    }
}

@Abstract
@RuntimeAccessible('LTypedElement')
export class LTypedElement<Context extends LogicContext<DTypedElement> = any> extends LNamedElement { // extends Mixin(DTypedElement0, LNamedElement)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DTypedElement;
    id!: Pointer<DTypedElement, 1, 1, LTypedElement>;
    // static singleton: LTypedElement;
    // static logic: typeof LTypedElement;
    // static structure: typeof DTypedElement;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    instances!: LValue[];
    // personal
    type!: LClassifier;

    primitiveType?: LClass;
    classType?: LClass;
    enumType?: LEnumerator;

    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;
    allowCrossReference!: boolean;



    get_crossReference(c: Context): this['allowCrossReference'] { return this.get_allowCrossReference(c); }
    get_isCrossReference(c: Context): this['allowCrossReference'] { return this.get_allowCrossReference(c); }
    set_crossReference(v: this['allowCrossReference'], c: Context): boolean { return this.set_allowCrossReference(v, c); }
    set_isCrossReference(v: this['allowCrossReference'], c: Context): boolean { return this.set_allowCrossReference(v, c); }
    get_allowCrossReference(c: Context): boolean { return c.data.allowCrossReference; }
    set_allowCrossReference(v: this['allowCrossReference'], c: Context): boolean {
        v = !!v;
        if (v === c.data.allowCrossReference) return true;
        TRANSACTION(this.get_name(c)+'.allowCrossReference', ()=>{
            SetFieldAction.new(c.data, 'allowCrossReference', v);
        }, c.data.allowCrossReference, v)
        return true;
    }

    validTargetsJSX!: JSX.Element[];
    get_validTargetsJSX(c: Context): this['validTargetsJSX'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return UX.options(opts);
    }
    validTargetOptions!: MultiSelectOptGroup[];
    get_validTargetOptions(c: Context): this['validTargetOptions'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return opts;
    }
    validTargets!: (LObject | LEnumLiteral)[];
    get_validTargets(c: Context, out?: MultiSelectOptGroup[]): this['validTargets'] {
        let addClasses: boolean = false;
        let addModels: boolean = false;
        let addEnums: boolean = false;
        let addPrimitives: boolean = false;
        let addReturnTypes: boolean = false;
        let isCrossRef = this.get_isCrossReference(c);
        let d = c.data;
        switch (d.className){
            case DModel.cname:     addModels = true; break;
            case DReference.cname: addClasses = true; break;
            case DAttribute.cname:              addPrimitives = addEnums = true; break;
            case DParameter.cname: addClasses = addPrimitives = addEnums = true; break;
            case DOperation.cname: addClasses = addPrimitives = addEnums = addReturnTypes = true; break;
        }
        let m2: LModel = this.get_model(c);
        let map = (object: LNamedElement): MultiSelectOption => {
            let fname = object.fullname;
            return {value:object.id, label: isCrossRef ? fname : object.name, title: object.fullname}
        };
        let map2 = (object: LNamedElement): MultiSelectOption => {
            let name = object.name;
            return {value:object.id, label: name, title: name}
        };
        let sort = (a:MultiSelectOption, b: MultiSelectOption) => (a.label > b.label ? +1 : -1);
        let validClasses: LClass[] = [];
        let validEnums: LEnumerator[] = [];
        let validPrimitives: LClass[] = [];
        let validModels: LModel[] = [];
        let state: DState | null = null;
        if (addModels) {
            if (!state) state = store.getState();
            validModels = LPointerTargetable.fromPointer(state.m2models);
            if (out) out.push({label: 'Models', options: validModels.map(map2).sort(sort)});
        }
        if (addPrimitives) {
            if (!state) state = store.getState();
            validPrimitives = LPointerTargetable.fromPointer(state.primitiveTypes);
        }
        if (addReturnTypes) {
            if (!state) state = store.getState();
            U.arrayMergeInPlace(validPrimitives, LPointerTargetable.fromPointer(state.returnTypes));
        }
        if (out && validPrimitives.length) out.push({label: 'Primitives', options: validPrimitives.map(map2).sort(sort)});

        if (addClasses) {
            let m = this.get_model(c);
            let pkgs = isCrossRef ? m.allCrossSubPackages : m.allSubPackages;
            if (out) for (let pkg of pkgs){
                let classes = pkg.classes;
                if (classes.length === 0) continue;
                out.push({label: 'Classes ('+pkg.fullname+')', options: classes.map(map2).sort(sort)});
                U.arrayMergeInPlace(validClasses, classes);
            } else validClasses = (isCrossRef ? m2.crossClasses : m2.classes);
        }
        if (addEnums) {
            let m = this.get_model(c);
            let pkgs = isCrossRef ? m.allCrossSubPackages : m.allSubPackages;
            if (out) for (let pkg of pkgs){
                let enums = pkg.enumerators;
                if (enums.length === 0) continue;
                out.push({label: 'Enumerators ('+pkg.fullname+')', options: enums.map(map2).sort(sort)});
                U.arrayMergeInPlace(validEnums, enums);
            } else validEnums = (isCrossRef ? m2.crossEnumerators : m2.enumerators);
            //if (out) out.push({label: 'Enumerators', options: validEnums.map(map).sort(sort)});
        }
        return U.arrayMergeInPlace(validClasses as any[], validPrimitives, validEnums, validModels);
    }


    protected get_classType(context: Context): this["classType"] {
        let type = this.get_type(context);
        return type.isClass ? type as LClass : undefined;
    }

    protected get_enumType(context: Context): this["enumType"] {
        let type = this.get_type(context);
        return type.isEnum ? type as LEnumerator : undefined;
    }

    protected get_primitiveType(context: Context): this["primitiveType"] {
        let type = this.get_type(context);
        return type.isPrimitive ? type as LClass : undefined;
    }

    protected get_type(c: Context): this["type"] {
        let type = LPointerTargetable.from(c.data.type) as LClassifier;
        if (type) return type;
        if (c.data.className === 'DReference') return LPointerTargetable.from(c.data.father);
        else return LPointerTargetable.fromPointer('Pointer_ESTRING');
    }

    protected set_type(val: Pack1<this["type"]>, c: Context): boolean {
        // let instances: LValue[] = this.get_instances(c);
        let ptr = Pointers.from(val);
        if (c.data.type === ptr) return true;
        if (c.data.type === c.data.father && (c.data as DReference).composition) {
            Log.ww('Changing '+this.get_fullname(c)+' type is generating a composition loop. This class cannot be instantiated anymore.\nConsider switching to aggregation.');
        }
        TRANSACTION(this.get_name(c)+'.type', ()=>{
            SetFieldAction.new(c.data, 'type', ptr, "", true);
        }, this.get_type(c)?.fullname, LPointerTargetable.wrap(val)?.fullname);
        return true;
    }

    protected get_ordered(context: Context): this["ordered"] {
        return context.data.ordered;
    }

    protected set_ordered(val: this["ordered"], c: Context): boolean {
        val = !!val;
        if (c.data.ordered === val) return true;
        TRANSACTION(this.get_name(c)+'.ordered', ()=>{
            SetFieldAction.new(c.data, 'ordered', val);
        }, c.data.ordered, val)
        return true;
    }

    protected get_unique(context: Context): this["unique"] {
        return context.data.unique;
    }

    protected set_unique(val: this["unique"], c: Context): boolean {
        val = !!val;
        if (c.data.ordered === val) return true;
        TRANSACTION(this.get_name(c)+'.unique', ()=>{
            SetFieldAction.new(c.data, 'unique', val);
        }, c.data.unique, val)
        return true;
    }

    protected get_lowerBound(context: Context): this["lowerBound"] {
        return context.data.lowerBound;
    }

    protected set_lowerBound(val: this["lowerBound"], c: Context): boolean {
        val = +val;
        if (isNaN(val)) val = 0;
        else val = Math.max(0, val);
        if (val === c.data.lowerBound) return true;
        TRANSACTION(this.get_name(c)+'.lowerBound', ()=>{
            SetFieldAction.new(c.data, 'lowerBound', val);
            if (c.data.upperBound !=-1 && val > c.data.upperBound) SetFieldAction.new(c.data, 'upperBound', val);
        }, c.data.lowerBound, val)
        return true;
    }

    protected get_upperBound(context: Context): this["upperBound"] {
        return context.data.upperBound;
    }

    protected set_upperBound(val: this["upperBound"], c: Context): boolean {
        val = +val;
        if (isNaN(val)) val = -1;
        else val = Math.max(-1, val);

        TRANSACTION(this.get_name(c)+'.upperBound', ()=>{
            SetFieldAction.new(c.data, 'upperBound', val);
            if (val !== -1 && val < c.data.lowerBound) SetFieldAction.new(c.data, 'lowerBound', val);
        }, c.data.upperBound, val)
        return true;
    }

    protected get_many(context: Context): this["many"] {
        return context.data.many;
    }

    protected set_many(val: this["many"], c: Context): boolean {
        val = !!val;
        if (val === c.data.many) return true;
        TRANSACTION(this.get_name(c)+'.many', ()=>{
            SetFieldAction.new(c.data, 'many', val);
        }, c.data.many, val)
        return true;
    }

    protected get_required(context: Context): this["required"] {
        return context.data.required;
    }

    protected set_required(val: this["required"], c: Context): boolean {
        val = !!val;
        if (val === c.data.many) return true;
        TRANSACTION(this.get_name(c)+'.required', ()=>{
            SetFieldAction.new(c.data, 'required', val);
        }, c.data.many, val)
        return true;
    }

    public typeToEcoreString(): string {
        return this.cannotCall("typeToEcoreString");
    }

    protected get_typeToEcoreString(context: Context): () => string {
        // if (context.data.classType) return EcoreParser.classTypePrefix + context.proxyObject.classType.name;
        // if (context.data.enumType) return EcoreParser.classTypePrefix + context.proxyObject.enumType.name;
        // if (context.data.primitiveType) return context.proxyObject.primitiveType.long;
        return () => context.proxyObject.type.typeEcoreString;
    }

    public typeToShortString(): string {
        return this.cannotCall("typeToShortString");
    }

    protected get_typeToShortString(context: Context): () => string {
        // if (context.data.classType) return '' + context.data.classType.name;
        // if (context.data.enumType) return '' + context.data.enumType.name;
        // if (context.data.primitiveType) return '' + context.data.primitiveType.getName();
        return () => {
            return context.proxyObject.type.typeString;
        }
    }

    canOverride(context: Context, other: LTypedElement): boolean {
        // i primitivi identici sono compatibili
        if (context.data.type === other.type.id) return true;
        let t1 = context.proxyObject.type;
        let t2 = other.type;
        // se entrambi primitivi
        if (context.proxyObject.primitiveType && other.primitiveType) {
            ShortAttribSuperTypes[t1.name as ShortAttribETypes].includes(other.name as ShortAttribETypes);
        }
        if (context.proxyObject.enumType) return t1 === t2; // only if they are same enumerator
        // now assumed to be class type
        if (other.classType === other.classType) return true;
        return (context.proxyObject.classType as LClass).isExtending(other.classType as LClass);
    }

}

// @RuntimeAccessible('') export class _WTypedElement extends _WNamedElement { }
// export type WTypedElement = DTypedElement | LTypedElement | _WTypedElement;
RuntimeAccessibleClass.set_extend(DNamedElement, DTypedElement);
RuntimeAccessibleClass.set_extend(LNamedElement, LTypedElement);
@RuntimeAccessible('DClassifier')
export class DClassifier extends DPointerTargetable { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LClassifier;
    // static logic: typeof LClassifier;
    // static structure: typeof DClassifier;

    // inherit redefine
    id!: Pointer<DClassifier, 1, 1, LClassifier>;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    // personal
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: Pointer<DObject, 1, 1, LObject>[] | string[];
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;

    public static new(name?: DNamedElement["name"], father?: Pointer, persist: boolean = true): DClassifier {
        Log.exx("DClassifier is abstract, cannot instantiate");
        return null as any;
        // return new Constructors(new DClassifier('dwc'), father, persist, undefined).DPointerTargetable().DModelElement().DNamedElement(name).DClassifier().end();
    }
}

@Abstract
@RuntimeAccessible('LClassifier')
export class LClassifier<Context extends LogicContext<DClassifier> = any> extends LNamedElement { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DClassifier;
    id!: Pointer<DClassifier, 1, 1, LClassifier>;
    // static singleton: LClassifier;
    // static logic: typeof LClassifier;
    // static structure: typeof DClassifier;

    // inherit redefine
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    // personal
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: LObject[] | string[];
    isPrimitive!: boolean;
    isClass!: boolean;
    isEnum!: boolean;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;

    protected get_instanceClassName(context: Context): this["instanceClassName"] {
        return context.data.instanceClassName;
    }

    protected set_instanceClassName(val: this["instanceClassName"], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.instanceClassName', ()=>{
            SetFieldAction.new(c.data, 'instanceClassName', val, "", false);
        }, c.data.instanceClassName, val)
        return true;
    }

    protected set_isPrimitive(val: this["isPrimitive"], context: Context): boolean {
        return this.cannotSet("isPrimitive");
    }

    protected set_isClass(val: this["isClass"], context: Context): boolean {
        return this.cannotSet("isClass");
    }

    protected set_isEnum(val: this["isEnum"], context: Context): boolean {
        return this.cannotSet("isEnum");
    }

    protected get_isPrimitive(context: Context): this["isPrimitive"] {
        return !!((context.data as DClass).isPrimitive as unknown);
    }

    protected get_isClass(context: Context): this["isClass"] {
        return (context.data as DClass).isPrimitive ? false : context.data.className === DClass.cname;
    }

    protected get_isEnum(context: Context): this["isEnum"] {
        return context.data.className === DEnumerator.cname;
    }

    protected set_defaultValue(val: this["defaultValue"] | DClassifier["defaultValue"], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.defaultValue', ()=>{
            if (typeof val !== "object" && !Pointers.isPointer(val)) {
                // primitive default value for enums
                SetFieldAction.new(c.data, 'defaultValue', val, "", false);
            } else {
                SetFieldAction.new(c.data, 'defaultValue', Pointers.from(val as Pointer[]) || [], "", true);
            }
        })
        return true;
    }

    typeEcoreString!: string;
    typeString!: string;

    private get_typeEcoreString(c: Context) {
        return EcoreParser.classTypePrefix + c.data.name;
    }

    get_typeString(context: Context) {
        return context.data.name;
    }
}

// @RuntimeAccessible('') export class _WClassifier extends _WNamedElement { }
// export type WClassifier = DClassifier | LClassifier | _WClassifier;
RuntimeAccessibleClass.set_extend(DNamedElement, DClassifier);
RuntimeAccessibleClass.set_extend(LNamedElement, LClassifier);

@Leaf
@RuntimeAccessible('DPackage')
export class DPackage extends DPointerTargetable { // extends DNamedElement
    // static _super = DNamedElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LPackage;
    // static logic: typeof LPackage;
    // static structure: typeof DPackage;

    // inherit redefine
    id!: Pointer<DPackage, 1, 1, LPackage>;
    parent: Pointer<DPackage | DModel, 0, 'N', LPackage | LModel> = [];
    father!: Pointer<DPackage | DModel, 1, 1, LPackage | LModel>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    // personal
    classifiers: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    subpackages: Pointer<DPackage, 0, 'N', LPackage> = [];
    uri!: string;
    prefix!: string;

    public static new(name?: DNamedElement["name"], uri?: DPackage["uri"], prefix?: DPackage["prefix"], father?: Pointer, persist: boolean = true, fatherType?: Constructor): DPackage {
        let dmodel: DModel | undefined;
        if (!name) {
            dmodel = father && DPointerTargetable.from(father);
            name = this.defaultname("pkg_", dmodel);
        }
        /*if (!uri) {
            dmodel = dmodel || father && DPointerTargetable.from(father);
            uri = ('org.jodel-react.') + (dmodel?.name || "username"); // (DPointerTargetable.from(DUser.current)).name) todo: when DUser is done
        }*/
        return new Constructors(new DPackage('dwc'), father, persist, fatherType).DPointerTargetable().DModelElement()
            .DNamedElement(name).DPackage(uri, prefix).end();
    }/*
    static new15(setter: (d: DPackage) => void, father: DPackage["father"], fatherType: Constructor, name?: string): DPackage {
        if (!name) name = this.defaultname("pkg_", father);
        return new Constructors(new DPackage('dwc'), father, true, fatherType).DPointerTargetable().DModelElement()
            .DNamedElement(name).DPackage().end(setter);
    }
    static new2(setter: Partial<ObjectWithoutPointers<DPackage>>, fatherType: Constructor, persist: boolean = true): DPackage {
        if (!name) name = this.defaultname("pkg_", father);
        return new Constructors(new DPackage('dwc'), father, true, fatherType).DPointerTargetable().DModelElement()
            .DNamedElement(name).DPackage().end((d)=> { Object.assign(d, setter); });
    }*/
    static new3(a: Partial<PackagePointers>, callback: undefined | ((d: DPackage, c: Constructors) => void), fatherType: Constructor, persist: boolean = true): DPackage {
        if (!a.name) a.name = this.defaultname("pkg_", a.father);
        return new Constructors(new DPackage('dwc'), a.father, persist, fatherType, a.id).DPointerTargetable().DModelElement()
            .DNamedElement(a.name).DPackage().end(callback);
    }
}

@Leaf
@RuntimeAccessible('LPackage')
export class LPackage<Context extends LogicContext<DPackage> = any, C extends Context = Context, D extends DPackage = DPackage> extends LNamedElement { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DPackage;
    id!: Pointer<DPackage, 1, 1, LPackage>;
    // static singleton: LPackage;
    // static logic: typeof LPackage;
    // static structure: typeof DPackage;
    // inherit redefine
    parent!: (LPackage| LModel)[];  // ype 'LPackage' is missing the following properties from type 'LModelElement': get_set_parent, set_parent
    father!: LPackage | LModel;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    // personal
    classifiers!: LClassifier[];
    subpackages!: LPackage[];
    uri!: string;
    prefix: string = '';
    // derived
    classes!: LClass[] & Dictionary<DocString<"$name">, LClass>;
    enums!: LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>;
    enumerators!: LEnumerator[];

    // utilities to go down in the tree (plural names)
    allSubPackages!: LPackage[];
    allSubEnums!: LEnumerator[];
    allSubClasses!: LClass[];
    operations!: LOperation[];
    parameters!: LParameter[];
    exceptions!: LClassifier[];
    attributes!: LAttribute[];
    references!: LReference[];
    literals!: LEnumLiteral[];

    protected get_name(c: Context): this['name'] {
        let l = c.proxyObject;
        let ret: string = (l as GObject)['$name']?.value || c.data.name;
        if (ret === 'default') {
            let model = this.get_model(c);
            if (model.__raw.packages[0] === c.data.id) return model.name;
        }
        return ret;
    }
    protected generateEcoreJson_impltemplate(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: GObject = {};
        return json; }

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const model: GObject = {};
        const d = context.data;
        let classarr = context.proxyObject.classes.map( c => c.generateEcoreJson(loopDetectionObj));
        let enumarr = context.proxyObject.enums.map(e => e.generateEcoreJson(loopDetectionObj));
        const classifiers: Json[] = Array.prototype.concat.call(classarr, enumarr);
        model[ECorePackage.xmiversion] = '2.0';
        model[ECorePackage.xmlnsxmi] = 'http://www.omg.org/XMI';
        model[ECorePackage.xmlnsxsi] = 'http://www.w3.org/2001/XMLSchema-instance';
        model[ECorePackage.xmlnsecore] = 'http://www.eclipse.org/emf/2002/Ecore';
        model[ECorePackage.namee] = d.name;
        model[ECorePackage.nsURI] = d.uri;
        model[ECorePackage.nsPrefix] = d.prefix;//getModelRoot().namespace();
        model[ECorePackage.eClassifiers] = classifiers;
        return model; }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(c: Context): ((deep?: boolean) => LPackage) {
        return (deep: boolean = false) => {
            let ret: LPackage = null as any;
            TRANSACTION('duplicate ' + this.get_name(c), ()=>{
                let le: LPackage = c.proxyObject.father.addPackage(c.data.name, c.data.uri, c.data.prefix);
                let de: D = le.__raw as D;
                let we: WPackage = le as any;
                we.subpackages = deep ? c.proxyObject.subpackages.map( lchild => lchild.duplicate(deep).id) : c.data.subpackages;
                we.classifiers = deep ? c.proxyObject.classifiers.map( lchild => lchild.duplicate(deep).id) : c.data.classifiers;
                we.annotations = deep ? c.proxyObject.annotations.map( lchild => lchild.duplicate(deep).id) : c.data.annotations;
                ret = le;
            })
            return ret;
        }
    }

    public addPackage(name?: D["name"], uri?: D["uri"], prefix?: D["prefix"]): LPackage { return this.cannotCall("addPackage"); }

    protected get_addPackage(context: Context): this["addPackage"] {
        console.log("Package.get_addPackage()", {context, thiss:this});
        return (name?: D["name"], uri?: D["uri"], prefix?: D["prefix"]) => {
            return LPointerTargetable.fromD(DPackage.new(name, uri, prefix, context.data.id, true, DPackage));
        }
    }

    public addClass(name?: DClass["name"], isInterface?: DClass["interface"], isAbstract?: DClass["abstract"], isPrimitive?: DClass["isPrimitive"],
                    isPartial?: DClass["partial"], partialDefaultName?: DClass["partialdefaultname"]): LClass {
        return this.cannotCall("addClass"); }
    protected get_addClass(context: Context): this["addClass"] {
        return (name?: DClass["name"], isInterface?: DClass["interface"], isAbstract?: DClass["abstract"], isPrimitive?: DClass["isPrimitive"],
                isPartial?: DClass["partial"], partialDefaultName?: DClass["partialdefaultname"]
        ) => LPointerTargetable.fromD(DClass.new(name, isInterface, isAbstract, isPrimitive, isPartial, partialDefaultName, context.data.id, true));
    }

    public addEnum(...p:Parameters<this["addEnumerator"]>): LEnumerator { return this.addEnumerator(...p); }
    protected get_addEnum(context: Context): this["addEnumerator"] {
        return this.get_addEnumerator(context); }
    public addEnumerator(name?: DEnumerator["name"]): LEnumerator { return this.cannotCall("addEnumerator"); }
    protected get_addEnumerator(context: Context): this["addEnumerator"] {
        return (name?: DEnumerator["name"]) => LPointerTargetable.fromD(DEnumerator.new(name, context.data.id, true));
    }

    protected get_classes(context: Context, state?: DState, setNameKeys: boolean = true): LClass[] & Dictionary<DocString<"$name">, LClass> {
        if (!context.data.classifiers.length) return [] as any;
        if (!state) state = store.getState();
        let classifiers = DPointerTargetable.fromPointer(context.data.classifiers as Pointer<DClassifier, 1, 1, LClassifier>[], state);
        let dclasses = classifiers.filter(dc => dc?.className === DClass.cname) as DClass[];
        let lclasses: LClass[] & Dictionary<DocString<"$name">, LClass> = LPointerTargetable.fromD(dclasses) as any;
        if (setNameKeys) for (let i = 0; i < dclasses.length; i++) lclasses["$"+dclasses[i].name] = lclasses[i];
        return lclasses;
    }
    protected get_enums(context: Context): (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) { return this.get_enumerators(context); }
    protected get_enumerators(context: Context, state?: DState, setNameKeys: boolean = true): (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) {
        if (!context.data.classifiers.length) return [] as any;
        if (!state) state = store.getState();
        let classifiers = DPointerTargetable.fromPointer(context.data.classifiers as Pointer<DClassifier, 1, 1, LClassifier>[], state);
        let denums = classifiers.filter(dc => dc?.className === DEnumerator.cname) as DEnumerator[];
        let lenums: LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator> = LPointerTargetable.fromD(denums) as any;
        if (setNameKeys) for (let i = 0; i < denums.length; i++) (lenums as GObject)["$"+denums[i].name] = lenums[i];
        return lenums;
    }
    //private get_allClasses(context: Context): LClass[] & Dictionary<DocString<"$name">, LClass> { return this.get_allSubClasses(c); }
    private get_allSubClasses(context: Context): LClass[] & Dictionary<DocString<"$name">, LClass> {
        // if (!context.data.isMetamodel) return (context.data.instanceof?.allSubClasses(context) || [] as any);
        const s: DState = store.getState();
        let arr = this.get_allSubPackages(context, s);
        let ret: (LClass[] & Dictionary<DocString<"$name">, LClass>) = [] as any;
        // this.get_allSubPackages(context, s).flatMap(p => (p.classes || [])); this was losing the naming $keys!
        for (let a of arr) {
            let classarr: LClass[] & Dictionary<DocString<"$name">, LClass> = (a.classes || []) as any;
            U.mergeNamedArray(ret, classarr);
        }
        return ret; }

    private get_allSubEnums(context: Context): (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) { return this.get_allSubEnumerators(context); }
    private get_allSubEnumerators(context: Context): (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) {
        const s: DState = store.getState();
        let arr = this.get_allSubPackages(context, s);
        let ret: (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) = [] as any;
        // this.get_allSubPackages(context, s).flatMap(p => (p.enums || [])); this was losing the naming $keys!
        for (let a of arr) {
            let enumarr: (LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>) = (a.enumerators || []) as any;
            U.mergeNamedArray(ret, enumarr);
        }
        return ret;
    }

    protected get_allSubPackages(c: Context, state?: DState): this["allSubPackages"] {
        // return context.data.packages.map(p => LPointerTargetable.from(p));
        state = state || store.getState();
        let tocheck: Pointer<DPackage>[] = c.data.subpackages || [];
        let checked: Dictionary<Pointer, DPackage> = {};
        checked[c.data.id] = c.data;
        while (tocheck.length) {
            let newtocheck: Pointer<DPackage>[] = [];
            for (let ptr of tocheck) {
                if (checked[ptr]) throw new Error("loop in packages containing themselves");
                let dpackage: DPackage = DPointerTargetable.from(ptr, state);
                checked[ptr] = dpackage;
                U.arrayMergeInPlace(newtocheck, dpackage?.subpackages);
            }
            tocheck = newtocheck;
        }
        let darr: DPackage[] = Object.values(checked);
        let larr: LPackage[] & Dictionary<DocString<"$name">, LPackage> = LPointerTargetable.fromArr(darr, state);
        U.toNamedArray(larr, darr);
        return larr;
    }

    protected get_children_idlist(context: Context): Pointer<DAnnotation | DPackage | DClassifier, 1, 'N'> {
        return [...super.get_children_idlist(context) as Pointer<DAnnotation | DPackage | DClassifier, 1, 'N'>, ...context.data.subpackages, ...context.data.classifiers]; }

    protected get_classifiers(context: Context): this["classifiers"] {
        return context.data.classifiers.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_classifiers(val: PackArr<this["classifiers"]>, c: Context): boolean {
        const list: Pointer<DClassifier>[] = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = c.data.classifiers;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(''+this.get_name(c)+'.classifiers', ()=>{
            SetFieldAction.new(c.data, 'classifiers', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', c.data.id, '', true);
                SetFieldAction.new(id, 'parent', c.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, c.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_subpackages(context: Context): this["subpackages"] {
        return context.data.subpackages.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_subpackages(val: PackArr<this["subpackages"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = c.data.subpackages;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(c)+'.packages', ()=>{
            SetFieldAction.new(c.data, 'subpackages', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', c.data.id, '', true);
                SetFieldAction.new(id, 'parent', c.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, c.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_uri(context: Context): this["uri"] {
        if (context.data.uri) return context.data.uri + "." + context.data.name;
        return ('org.jodel-react.') + (context.proxyObject.model?.name || "username") + "." + context.data.name;
    }
    protected set_uri(val: this["uri"], c: Context): boolean {
        val = val || '';
        let pos = val.lastIndexOf(c.data.name);
        if (pos) val = val.substring(0, pos - 1); // removes final name and dot, to keep the name part dinamically added in the getter.
        if (val === c.data.uri) return true;
        TRANSACTION(this.get_name(c)+'.uri', ()=>{
            SetFieldAction.new(c.data, 'uri', val, "", false);
        }, c.data.uri, val);
        return true;
    }
    protected get_prefix(context: Context): this["uri"] { return context.data.prefix; }
    protected set_prefix(val: this["prefix"], c: Context): boolean {
        if (c.data.prefix === val) return true;
        TRANSACTION(this.get_name(c)+'.prefix', ()=>{
            SetFieldAction.new(c.data, 'prefix', val, "", false);
        }, c.data.prefix, val)
        return true;
    }

}
// @RuntimeAccessible('') export class _WPackage extends _WNamedElement { }
// export type WPackage = DPackage | LPackage | _WPackage;
RuntimeAccessibleClass.set_extend(DNamedElement, DPackage);
RuntimeAccessibleClass.set_extend(LNamedElement, LPackage);


@Abstract
@RuntimeAccessible('DStructuralFeature')
export class DStructuralFeature extends DPointerTargetable { // DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LStructuralFeature;
    // static logic: typeof LStructuralFeature;
    // static structure: typeof DStructuralFeature;

    // inherit redefine
    id!: Pointer<DStructuralFeature, 1, 1, LStructuralFeature>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    name!: string;
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    instances: Pointer<DValue, 0, 'N', LValue> = [];
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;// if the feature can be "unsetted" aka undefined/deleted ?
    allowCrossReference!:boolean;
    public derived!: boolean;
    /*protected */derived_read?: string;
    /*protected */derived_write?: string;

    defaultValue!: (Pointer<DObject, 1, 1, LObject> | PrimitiveType)[];

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"], father?: Pointer, persist: boolean = true): DStructuralFeature {
        Log.exx("DStructuralFeature is abstract, cannot instantiate");
        return null as any;
        // if (!name) name = this.defaultname("feature ", father);
        // return new Constructors(new DStructuralFeature('dwc'), father, persist, undefined).DPointerTargetable().DModelElement().DNamedElement(name).DTypedElement(type).DStructuralFeature().end();
    }
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
}

@Abstract
@RuntimeAccessible('LStructuralFeature')
export class LStructuralFeature<Context extends LogicContext<DStructuralFeature> = any,
    C extends Context = Context, D extends DStructuralFeature = DStructuralFeature>  extends LTypedElement { // DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DStructuralFeature;
    id!: Pointer<DStructuralFeature, 1, 1, LStructuralFeature>;
    // static singleton: LStructuralFeature;
    // static logic: typeof LStructuralFeature;
    // static structure: typeof DStructuralFeature;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LClass[];
    father!: LClass;
    name!: string;
    namespace!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    public derived!: boolean;

    /*protected*/ __info_of__derived: Info = {type: 'string', txt:'A ECore flag to signal the values of this feature depend on other features.\n' +
            'To make it usable at runtime in jjodel check derived_read and derivedMap.'}



    // personal
    instances!: LValue[];
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    // defaultValueLiteral!: string;
    defaultValue!: (LObject[] | PrimitiveType[]);
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
    allowCrossReference!:boolean;

    protected get_instances(context: Context): this["instances"] {
        return context.data.instances.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }

    protected set_instances(val: PackArr<this["instances"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        TRANSACTION(this.get_name(c)+'.instances', ()=>{
            SetFieldAction.new(c.data, 'instances', list, "", true);
        })
        return true;
    }

    protected get_changeable(context: Context): this["changeable"] { return context.data.changeable; }
    protected set_changeable(val: this["changeable"], c: Context): boolean {
        val = !!val;
        if (c.data.changeable === val) return true;
        TRANSACTION(this.get_name(c)+'.changeable', ()=>{
            SetFieldAction.new(c.data, 'changeable', val);
        }, c.data.changeable, val)
        return true;
    }

    protected get_volatile(context: Context): this["volatile"] { return context.data.volatile; }
    protected set_volatile(val: this["volatile"], c: Context): boolean {
        val = !!val;
        if (c.data.volatile === val) return true;
        TRANSACTION(this.get_name(c)+'.volatile', ()=>{
            SetFieldAction.new(c.data, 'volatile', val);
        }, c.data.volatile, val)
        return true;
    }

    protected get_transient(context: Context): this["transient"] { return context.data.transient; }
    protected set_transient(val: this["transient"], c: Context): boolean {
        val = !!val;
        if (c.data.transient === val) return true;
        TRANSACTION(this.get_name(c)+'.transient', ()=>{
            SetFieldAction.new(c.data, 'transient', val);
        }, c.data.transient, val)
        return true;
    }

    protected get_unsettable(context: Context): this["unsettable"] { return context.data.unsettable; }
    protected set_unsettable(val: this["unsettable"], c: Context): boolean {
        val = !!val;
        if (c.data.unsettable === val) return true;
        TRANSACTION(this.get_name(c)+'.unsettable', ()=>{
            SetFieldAction.new(c.data, 'unsettable', val);
        }, c.data.unsettable, val)
        return true;
    }

    protected get_derived(context: Context): D["derived"] { return context.data.derived; }
    protected set_derived(val: D["derived"], c: Context): boolean {
        val = !!val;
        if (c.data.derived === val) return true;
        TRANSACTION(this.get_name(c)+'.derived', ()=>{
            SetFieldAction.new(c.data, 'derived', val);
        }, c.data.derived, val)
        return true;
    }
    /*
        protected get_defaultValueLiteral(context: Context): this["defaultValueLiteral"] { return context.data.defaultValueLiteral; }
        protected set_defaultValueLiteral(val: this["defaultValueLiteral"], context: Context): boolean {
            SetFieldAction.new(context.data, 'defaultValueLiteral', val, "", false);
            return true;
        }*/
}
RuntimeAccessibleClass.set_extend(DTypedElement, DStructuralFeature);
RuntimeAccessibleClass.set_extend(LTypedElement, LStructuralFeature);


@Leaf
@RuntimeAccessible('DOperation')
export class DOperation extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
    instances!: never[];
    id!: Pointer<DOperation, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    name!: string;
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    exceptions: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    parameters: Pointer<DParameter, 0, 'N', LParameter> = [];
    visibility: AccessModifier = AccessModifier.private;
    implementation!: string;

    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;// if the feature can be "unsetted" aka undefined/deleted ?
    allowCrossReference!:boolean;
    public derived!: boolean;
    defaultValue!: (Pointer<DObject, 1, 1, LObject> | PrimitiveType)[];
    __isDOperation!: boolean; // to avoid duck typing mistaking it for DStructuralFeature



    public static new(name?: DNamedElement["name"], type?: DOperation["type"], exceptions: DOperation["exceptions"] = [], father?: DOperation["father"], persist: boolean = true): DOperation {
        if (!name) name = this.defaultname("fx_", father);
        if (!type) type = father;
        return new Constructors(new DOperation('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DOperation(exceptions).end();
    }

    static new2(setter: Partial<ObjectWithoutPointers<DOperation>>, father: DOperation["father"], type?: DOperation["type"], name?: string): DOperation {
        if (!name) name = this.defaultname("fx_", father);
        if (!type) type = father;
        return new Constructors(new DOperation('dwc'), father, true).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DOperation().end((d)=> { Object.assign(d, setter); });
    }

    static new3(a: Partial<OperationPointers>, callback: undefined | ((d: DOperation, c: Constructors) => void), persist: boolean = true): DOperation {
        if (!a.name) a.name = this.defaultname("fx_", a.father);
        if (!a.type) a.type = a.father;
        return new Constructors(new DOperation('dwc'), a.father, persist, undefined, a.id).DPointerTargetable().DModelElement()
            .DNamedElement(a.name).DTypedElement(a.type).DOperation().end(callback);
    }


}

@Node
@RuntimeAccessible('LOperation')
export class LOperation<Context extends LogicContext<DOperation, LOperation> = any, C extends Context = Context, D extends DOperation = DOperation> extends LStructuralFeature { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DOperation;
    id!: Pointer<DOperation, 1, 1, LOperation>;
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
    instances!: never[];
    annotations!: LAnnotation[];
    parent!: LClass[];
    father!: LClass;
    name!: string;
    namespace!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    implementation!: string;
    signatureImplementation!: string; // (param1 /*type*/, param2 = value, ...) => /*return type*/
    exceptions!: LClassifier[];
    parameters!: LParameter[];
    visibility!: AccessModifier;
    allowCrossReference!: boolean;
    defaultValue!: (Pointer<DObject, 1, 1, LObject> | PrimitiveType)[];
    __isLOperation!: boolean; // to avoid duck typing mistaking it for LStructuralFeature


    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        json[ECoreOperation.eParameters] = context.proxyObject.parameters.map( par => par.generateEcoreJson(loopDetectionObj));
        EcoreParser.write(json, ECoreOperation.namee, context.data.name);
        EcoreParser.write(json, ECoreOperation.eType, context.proxyObject.type.typeEcoreString);
        EcoreParser.write(json, ECoreOperation.lowerBound, '' + context.data.lowerBound);
        EcoreParser.write(json, ECoreOperation.upperBound, '' + context.data.upperBound);
        EcoreParser.write(json, ECoreOperation.eexceptions, context.proxyObject.exceptions.map( (l: LClassifier) => l.typeEcoreString).join(' ')); // todo: not really sure it's this format
        EcoreParser.write(json, ECoreOperation.ordered, '' + context.data.ordered);
        EcoreParser.write(json, ECoreOperation.unique, '' + context.data.unique);
        return json; }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(context: Context): ((deep?: boolean) => LOperation) {
        return (deep: boolean = false) => {
            let ret: LOperation = null as any;
            TRANSACTION('duplicate ' + this.get_name(context), ()=>{
                let le: LOperation = context.proxyObject.father.addOperation(context.data.name, context.data.type);
                let de: D = le.__raw as D;
                de.many = context.data.many;
                de.lowerBound = context.data.lowerBound;
                de.upperBound = context.data.upperBound;
                de.ordered = context.data.ordered;
                de.required = context.data.required;
                de.unique = context.data.unique;
                de.visibility = context.data.visibility;
                de.exceptions = context.data.exceptions;
                let we: WOperation = le as any;
                we.annotations = deep ? context.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : context.data.annotations;
                we.parameters = deep ? context.proxyObject.parameters.map(lchild => lchild.duplicate(deep).id) : context.data.parameters;
                we.exceptions = context.data.exceptions;
                ret = le;
            })
            return ret; }
    }

    public addParameter(name?: DParameter["name"], type?: DParameter["type"]): LParameter { return this.cannotCall("addParameter"); }
    protected get_addParameter(context: Context): this["addParameter"] {
        return (name?: DParameter["name"], type?: DParameter["type"]) => LPointerTargetable.fromD(DParameter.new(name, type, context.data.id, true)); }

    public execute(thiss: LObject, ...params: any): any { return this.cannotCall("execute"); }
    protected get_execute(context: Context): ((thiss: LObject, ...params: any[])=>any) {
        return (thiss: LObject, ...params: any) => {
            let func: Function = eval(this.get_signatureImplementation(context, true) + " {\n"+ context.data.implementation + "\n}");
            func.apply(thiss, params);
        };
    }
    public set_implementation(val: this["implementation"], c: Context): boolean {
        TRANSACTION(this.get_fullname(c)+'.implementation', ()=>{
            SetFieldAction.new(c.data.id, "implementation", val, undefined, false);
        })
        return true;
    }
    public get_implementation(context: Context): this["implementation"] { return context.data.implementation; }
    public set_signatureImplementation(val: this["signatureImplementation"], context: Context): boolean { return this.cannotSet("signatureImplementation"); }
    public get_signatureImplementation(context: Context, typedComments: boolean = true): this["signatureImplementation"] {
        let operation = context.proxyObject;
        let typedcommentpre = typedComments ? "/* :" : ': ' ;
        let typedcommentpost = typedComments ? " */" : '';
        return "(" +
            operation.parameters.map(
                (p) => p.name + (p.defaultValue !== undefined ? "=" + p.defaultValue : typedcommentpre + p.typeToShortString() + typedcommentpost)
            ).join(", ")
            + ") => " +typedcommentpre.replace(":", "") + operation.type + typedcommentpost;
    }
    public get_signature(context: Context): this["signatureImplementation"] { return this.get_signatureImplementation(context, false); }

    protected get_children_idlist(context: Context): Pointer<DAnnotation | DClassifier | DParameter, 1, 'N'> {
        return [...super.get_children_idlist(context) as Pointer<DAnnotation | DParameter | DClassifier, 1, 'N'>, ...context.data.exceptions, ...context.data.parameters]; }

    protected get_exceptions(context: Context): this["exceptions"] {
        return context.data.exceptions.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_exceptions(val: PackArr<this["exceptions"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        TRANSACTION(this.get_name(c)+'.exceptions', ()=>{
            SetFieldAction.new(c.data, 'exceptions', list, "", true);
        })
        return true;
    }

    protected get_parameters(context: Context): this["parameters"] {
        return context.data.parameters.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_parameters(val: PackArr<this["parameters"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = c.data.parameters;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(c)+'.parameters', ()=>{
            SetFieldAction.new(c.data, 'parameters', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', c.data.id, '', true);
                SetFieldAction.new(id, 'parent', c.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, c.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    // protected get_type(context: Context): this["type"] { return context.proxyObject.parameters[0].type; }
    // protected set_type(val: Pack1<this["type"]>, context: Context): this["type"] { return super.set_type(val, context); }

    _mark(b: boolean, superchildren: LOperation, override: string) {

    }

    _canOverride(superchildren: LOperation) {
        return undefined;
    }

    _canPolymorph(superchildren: LOperation) {
        return undefined;
    }
}
RuntimeAccessibleClass.set_extend(DTypedElement, DOperation);
RuntimeAccessibleClass.set_extend(LTypedElement, LOperation);

@Leaf
@RuntimeAccessible('DParameter')
export class DParameter extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
    instances!: never[];
    id!: Pointer<DParameter, 1, 1, LParameter>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    parent: Pointer<DOperation, 0, 'N', LOperation> = [];
    father!: Pointer<DOperation, 1, 1, LOperation>;
    name!: string;
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    defaultValue!: any;
    // personal
    allowCrossReference!: boolean;

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"], father?: Pointer, persist: boolean = true): DParameter {
        if (!type) type = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes()).id; // default type as string
        if (!name) name = this.defaultname("arg", father);
        return new Constructors(new DParameter('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DParameter().end();
    }

    static new2(setter: Partial<ObjectWithoutPointers<DParameter>>, father: DParameter["father"], type?: DParameter["type"], name?: DParameter["name"]): DParameter {
        if (!name) name = this.defaultname((name || "arg"), father);
        return new Constructors(new DParameter('dwc'), father, true).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).end((d) => { Object.assign(d, setter); });
    }

    static new3(a: Partial<ParameterPointers>, callback: undefined | ((d: DParameter, c: Constructors) => void), persist: boolean = true): DParameter {
        if (!a.name) a.name = this.defaultname("arg", a.father);
        return new Constructors(new DParameter('dwc'), a.father, persist, undefined, a.id).DPointerTargetable().DModelElement()
            .DNamedElement(a.name).DTypedElement(a.type).DOperation().end(callback);
    }
}

@Leaf
@RuntimeAccessible('LParameter')
export class LParameter<Context extends LogicContext<DParameter> = any, C extends Context = Context, D extends DParameter = DParameter>  extends LTypedElement { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DParameter;
    id!: Pointer<DParameter, 1, 1, LParameter>;
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
    instances!: never[];
    annotations!: LAnnotation[];
    parent!: LOperation[];
    father!: LOperation;
    name!: string;
    namespace!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    defaultValue!: any;
    allowCrossReference!: boolean;

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        const l = context.proxyObject;
        const d = context.data;
        EcoreParser.write(json, ECoreOperation.lowerBound, '' + d.lowerBound);
        EcoreParser.write(json, ECoreOperation.upperBound, '' + d.upperBound);
        EcoreParser.write(json, ECoreOperation.ordered, '' + d.ordered);
        EcoreParser.write(json, ECoreOperation.unique, '' + d.unique);
        EcoreParser.write(json, ECoreOperation.eType, '' + l.type.typeEcoreString);
        return json; }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(context: Context): ((deep?: boolean) => LParameter) {
        return (deep: boolean = false) => {
            let ret: LParameter = null as any;
            TRANSACTION('duplicate ' + this.get_name(context), ()=>{
                let le: LParameter = context.proxyObject.father.addParameter(context.data.name, context.data.type);
                let de: D = le.__raw as D;
                de.many = context.data.many;
                de.lowerBound = context.data.lowerBound;
                de.upperBound = context.data.upperBound;
                de.ordered = context.data.ordered;
                de.required = context.data.required;
                de.unique = context.data.unique;
                let we: WParameter = le as any;
                we.annotations = deep ? context.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : context.data.annotations;
                ret = le;
            })
            return ret; }
    }
}
RuntimeAccessibleClass.set_extend(DTypedElement, DParameter);
RuntimeAccessibleClass.set_extend(LTypedElement, LParameter);
export class ClassReferences{
    id?: Pack1<LClass>
    parent?: this["father"][];
    father?: Pack1<LPackage>;
    instances?: Pointer<DObject, 0, 'N', LObject> = [];
    operations?: Pointer<DOperation, 0, 'N', LOperation> = [];
    features?: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    references?: Pointer<DReference, 0, 'N', LReference> = [];
    attributes?: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    referencedBy?: Pointer<DReference, 0, 'N', LReference> = [];
    extends?: Pointer<DClass, 0, 'N', LClass> = [];
    //extendedBy?: Pointer<DClass, 0, 'N', LClass> = [];
    implements?: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy?: Pointer<DClass, 0, 'N', LClass> = [];
}

@RuntimeAccessible('DClass')
export class DClass extends DPointerTargetable { // extends DClassifier
    // static _super = DClassifier;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LClass;
    // static logic: typeof LClass;
    // static structure: typeof DClass;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DClass, 1, 1, LClass>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    defaultValue!: Pointer<DObject, 1, 1, LObject>[];
    // personal
    // isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    // getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    // getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract: boolean = false;
    interface: boolean = false;
    instances: Pointer<DObject, 0, 'N', LObject> = [];
    operations: Pointer<DOperation, 0, 'N', LOperation> = [];
    features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    references: Pointer<DReference, 0, 'N', LReference> = [];
    attributes: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    referencedBy: Pointer<DReference, 0, 'N', LReference> = [];
    extends: Pointer<DClass, 0, 'N', LClass> = [];
    // extendedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // mia aggiunta:
    isPrimitive!: boolean;
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];
    partial!: boolean;
    partialdefaultname!: string;

    isSingleton!: boolean;
    rootable?: boolean;
    sealed!: Pointer<DClass>[];
    final!: boolean;
    allowCrossReference!: boolean;//for extend

    // for m1:
    // hideExcessFeatures: boolean = true; // isn't it like partial?? // old comment: se attivo questo e creo una DClass di sistema senza nessuna feature e di nome Object, ho creato lo schema di un oggetto schema-less a cui tutti sono conformi

    public static new(name?: DNamedElement["name"], isInterface: DClass["interface"] = false, isAbstract: DClass["abstract"] = false, isPrimitive: DClass["isPrimitive"] = false, partial?: DClass["partial"],
                      partialDefaultName?: DClass["partialdefaultname"], father?: Pointer, persist: boolean = true, id?: string): DClass {
        if (!name) name = this.defaultname("Concept ", father);

        // console.log('x6 addchild() new class', {father, arguments, name});
        return new Constructors(new DClass('dwc'), father, persist, undefined, id).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DClass(isInterface, isAbstract, isPrimitive, partial, partialDefaultName).end();
    }

    static new2(setter: Partial<ObjectWithoutPointers<DClass>>, father: DClass["father"], name?: DClass["name"]): DClass {
        if (!name) name = this.defaultname((name || "Concept "), father);
        return new Constructors(new DClass('dwc'), father, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DClass().end((d) => { Object.assign(d, setter); });
    }

    static new3(a: Partial<ClassPointers>, callback: undefined | ((d: DClass, c: Constructors) => void), persist: boolean = true): DClass {
        if (!a.name) a.name = this.defaultname("Concept ", a.father);
        return new Constructors(new DClass('dwc'), a.father, persist, undefined, a.id).DPointerTargetable().DModelElement()
            .DNamedElement(a.name).DClassifier().DClass().end(callback);
    }

}

(window as any).dc = DClassifier;
(window as any).c = DClass;
@Instantiable // (LObject)
@Node
@RuntimeAccessible('LClass')
export class LClass<D extends DClass = DClass, Context extends LogicContext<DClass> = any, C extends Context = Context>  extends LClassifier{ // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DClass;
    id!: Pointer<DClass, 1, 1, LClass>;
    // static singleton: LClass;
    // static logic: typeof LClass;
    // static structure: typeof DClass;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    defaultValue!: LObject[];
    // personal
    // isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    // getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    // getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract!: boolean;
    interface!: boolean;
    instances!: LObject[];
    operations!: LOperation[];
    features!: LStructuralFeature[];
    references!: LReference[];
    attributes!: LAttribute[];
    referencedBy!: LReference[];
    extends!: LClass[];


    extendsChain!: LClass[];  // list of all super classes (father, father of father, ...)  todo: isn't this the same as "superclasses" ? check implementation differeces, eventually remove one.
    extendedBy!: LClass[];
    nodes!: LGraphElement[]; // ipotesi, non so se tenerlo
    allowCrossReference!: boolean;
    sealed!: LClass[];
    __info_of__sealed: Info = {type: 'LClass[]', txt:'A sealed class can specify a list of other classes that are allowed to extend it.' +
            '\n A sealed class that does not allow any class to extend it is a "final" class.'}

    final!: boolean;
    __info_of__final: Info = {type: 'boolean', txt:'A final class cannot be extended.'}

    rootable!: boolean;
    __info_of__roootable: Info = {type: 'boolean', txt:'Specifies if the class can become a m1 model root, overriding the usual restriction of not being target of a containment reference.'}

    isSingleton!: boolean;
    __info_of__singleton: Info = {type: 'boolean', txt:'A singleton element is always present exactly 1 time in every model.' +
            '\n A single instance is created dynamically and cannot be created by the user.'}

    // fittizi:

    instantiable!: boolean;
    __info_of__intantiable: Info = {type: 'boolean', txt:'Whether the class can be instantiated.'}

    aggregated!: boolean;
    __info_of__aggregated: Info = {type: 'boolean', txt:'Whether the class is targeted by an aggregation relationship.'}

    composed!: boolean;
    __info_of__composed: Info = {type: 'boolean', txt:'Whether the class is targeted by a composition relationship.'}

    contained!: boolean;
    __info_of__contained: Info = {type: 'boolean', txt:'Whether the class is targeted by a composition or aggregation relationship.'}

    public superclasses!: LClass[];

    __info_of__extendedBy: Info = {type: 'Class[]', txt: 'All subclasses directly extending this. does not include subclasses of a subclass, check also: subclasses.' }
    __info_of__extends: Info = {type: 'Class[]', txt: 'All superclasses directly extended by this. does not include superclasses of a superclass, check also: superclasses.' }
    __info_of__subclasses: Info = {type: 'Class[]', txt: 'All subclasses directly and indirectly extending this, direct or indirect. includes subclasses of a subclass recursively, check also: extendedBy'}
    __info_of__superclasses: Info = {type: 'Class[]', txt: 'All classes directly and indirectly extended by this. includes superclasses of a superclass recursively, check also: extends.' }
    allSubClasses!: LClass[];
    allSuperClasses!: LClass[];
    allSubclasses!: LClass[]; allSuperclasses!: LClass[]; // those 2 are alias of the fully capitalized ones

    partialdefaultname!: string;
    isPrimitive!: boolean;
    isClass!: boolean; // false if it's primitive type
    isEnum!: false;
    implements: Pointer<DClass, 0, 'N', LClass> = [];  //todo: interface
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    ownAttributes!: LAttribute[];
    ownReferences!: LReference[];
    ownOperations!: LOperation[];
    ownChildren!: (LStructuralFeature|LOperation)[];

    inheritedAttributes!: LAttribute[];
    inheritedReferences!: LReference[];
    inheritedOperations!: LOperation[];
    inheritedChildren!: (LStructuralFeature|LOperation)[];

    allAttributes!: LAttribute[];
    allReferences!: LReference[];
    allOperations!: LOperation[]; // includes inherited and shadowed features
    allChildren!: (LStructuralFeature|LOperation)[];



    // utilities to go down in the tree (plural names)
    exceptions!: LClassifier[] | null;
    parameters!: LParameter[] | null;
    // [`@${string}`]: LModelElement; todo: try to put it


    validTargetsJSX!: JSX.Element[];
    get_validTargetsJSX(c: Context): this['validTargetsJSX'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return UX.options(opts);
    }
    validTargetOptions!: MultiSelectOptGroup[];
    get_validTargetOptions(c: Context): this['validTargetOptions'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return opts;
    }
    validTargets!: LClass[];
    get_validTargets(c: Context, out?: MultiSelectOptGroup[]): this['validTargets'] {
        let lclass: LClass = c.proxyObject as any;
        // let extendOptions: {value: string, label: string}[] lclass.extends.map(lsubclass=> ({value: lsubclass.id, label: lsubclass.name}));
        let m2: LModel = lclass.model;
        let dclass = c.data;
        let extendsarr = lclass.extendsChain.map(l=>l.id); //dclass.extends;
        let pkgs = dclass.allowCrossReference ? m2.allCrossSubPackages : m2.allSubPackages;
        let extendValue: {value: string, label: string}[] = [];
        if (!out) out = [];
        let ret: LClass[] = [];
        out.push(...pkgs.map(p => (
            {label: p.fullname, options: p.classes.map(c => {
                    let opt = {value:c.id, label: c.name};
                    if (opt.value === dclass.id) return undefined;
                    if (!extendsarr.includes(opt.value)) return opt;
                    extendValue.push(opt);
                    ret.push(c);
                    return undefined;
                }).filter(e=>!!e) as {value: string, label: string}[]})));
        return ret;
    }

    get_childNames(c: Context): string[] { return this.get_allChildren(c).map( c => c.name).filter(c=>!!c) as string[]; }
    //get_isSealed(c: Context): LClass['sealed'] { return this.get_sealed(c); }
    get_sealed(c: Context): LClass['sealed'] { return LPointerTargetable.wrapAll(c.data.sealed); }
    set_sealed(val: PackArr<LClass>, c: Context): boolean{
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        const ptrs = [...new Set(val.map((val) => { return val && Pointers.from(val) }).filter(e=>!!e))];
        if (Uarr.equalsUnsorted(c.data.sealed, ptrs)) return true;
        TRANSACTION(this.get_name(c)+'.sealed ', ()=>{
            SetFieldAction.new(c.data, 'sealed', ptrs, '', true);
            if (ptrs.length) {
                SetFieldAction.new(c.data, 'isSingleton', false);
                SetFieldAction.new(c.data, 'final', false);
            } else {
                SetFieldAction.new(c.data, 'final', true);
            }
        });
        return true;
    }
    get_isFinal(c: Context): LClass['final'] { return this.get_final(c); }
    get_final(c: Context): LClass['final']{ return c.data.final; }
    set_final(val: boolean, c: Context): boolean{
        val = !!val;
        if (val === c.data.final) return true;
        if (this.get_extendedBy(c).length > 0) { U.alert('e', 'Class cannot become final as it is currently extended.', 'Remove the subclasses before.'); return true; }
        TRANSACTION(this.get_name(c)+'.final', ()=>{
            SetFieldAction.new(c.data, 'final', val);
            SetFieldAction.new(c.data, 'sealed', [], '', true);
            if (!val) SetFieldAction.new(c.data, 'isSingleton', false);
        }, c.data.final, val);
        return true;
    }
    get_isSingleton(c: Context): LClass['isSingleton'] { return this.get_singleton(c); }
    get_singleton(c: Context): LClass['isSingleton'] { return c.data.isSingleton; }
    set_isSingleton(val: boolean, c: Context): boolean { return this.set_singleton(val, c); }
    set_singleton(val: boolean, c: Context): boolean {
        val = !!val;
        if (c.data.instances.length > 1) { U.alert('e', 'Class cannot become a singleton since there are multiple instances already.','Delete some and retry.'); return true; }
        if (this.get_extendedBy(c).length > 0) { U.alert('e', 'Class cannot become a singleton unless is also final, and is currently extended.', 'Remove the subclasses before.'); return true; }
        TRANSACTION(this.get_name(c)+'.singleton', ()=>{
            SetFieldAction.new(c.data, 'isSingleton', val);
            if (val) {
                SetFieldAction.new(c.data, 'final', true);
                let m2 = this.get_model(c);
                let instances: LObject[] = this.get_instances(c);
                let modelsWithInstance: Pointer<DModel>[] = instances.map( o => o.model?.id );
                for (let m1 of m2.instances) {
                    if (modelsWithInstance.includes(m1.id)) continue;
                    m1.addObject({name: c.data.name}, c.data, true);
                }
            }
        }, c.data.isSingleton, val);
        return true;
    }
    get_instantiable(c: Context): LClass['instantiable']{ return !(c.data.abstract || c.data.interface || c.data.isSingleton); }
    get_isInstantiable(c: Context): LClass['instantiable'] { return this.get_instantiable(c); }
    get_isComposed(c: Context): LClass['composed'] { return this.get_composed(c); }
    get_isAggregated(c: Context): LClass['aggregated'] { return this.get_aggregated(c); }
    get_isContained(c: Context): LClass['contained'] { return this.get_contained(c); }
    get_contained(c: Context): LClass['contained']{
        let refs = this.get_referencedBy(c);
        for (let r of refs) { if (r && (r.aggregation || r.composition)) return true; }
        return false;
    }
    get_aggregated(c: Context): LClass['aggregated']{
        let refs = this.get_referencedBy(c);
        for (let r of refs) if (r&&r.aggregation) return true;
        return false;
    }
    get_composed(c: Context): LClass['composed']{
        let checkSelfComposition: boolean = false; // made it impossible in 2.0 t2m version
        if (checkSelfComposition){
            let refs = this.get_isComposedBy(c);
            // if it's composed by itself, i ignore it.
            return refs.filter((r)=>(r?.__raw||r as any).father === c.data.id).length > 1;
        }
        let refs = this.get_referencedBy(c);
        for (let r of refs) if (r&&r.composition) return true;
        return false;
    }
    get_isComposedBy(c: Context): LReference[]{
        let refs = this.get_referencedBy(c);
        let ret: LReference[] = [];
        for (let r of refs) if (r&&r.composition) ret.push(r);
        return ret;
    }
    get_isRootable(c: Context): LClass['rootable'] { return this.get_rootable(c); }
    protected get_rootable(c: Context): this["rootable"] {
        console.log('isRootable', {rootable: c.data.rootable, instantiable:this.get_instantiable(c), composed:this.get_isComposed(c)})
        if (c.data.rootable !== undefined) return c.data.rootable;
        else return this.get_instantiable(c) && !this.get_isComposed(c);
    }
    protected set_rootable(val: this["rootable"], c: Context): boolean {
        if (c.data.rootable === val) return true;

        TRANSACTION(this.get_name(c)+'.rootable', ()=>{
            SetFieldAction.new(c.data, 'rootable', val);
        }, c.data.rootable, val);
        return true;
    }

    protected get_ownAttributes(context: Context): this['ownAttributes'] {
        return LAttribute.fromPointer(context.data.attributes);
    }
    protected get_ownReferences(context: Context): this['ownReferences'] {
        return LReference.fromPointer(context.data.references);
    }
    protected get_ownOperations(context: Context): this['ownOperations'] {
        return LOperation.fromPointer(context.data.operations);
    }
    protected get_ownChildren(context: Context): this['ownChildren'] {
        return U.arrayMergeInPlace<any>(this.get_ownAttributes(context), this.get_ownReferences(context),
            this.get_ownOperations(context));
    }



    public isSubClassOf(superClass?: LClass, returnIfSameClass: boolean = true): boolean { return this.cannotCall("isSubClassOf"); }
    public isSuperClassOf(subClass?: LClass, returnIfSameClass: boolean = true): boolean { return this.cannotCall("isSuperClassOf"); }
    protected get_isSubClassOf(c: Context): ((superClass?: LClass, returnIfSameClass?: boolean) => boolean) {
        return (superClass?: LClass, returnIfSameClass: boolean = true) => {
            superClass = LPointerTargetable.wrap(superClass);
            if (!superClass) return false;
            if (superClass.id === c.data.id) return returnIfSameClass;
            for (let subclass of this.get_extendsChain(c)) {
                if (subclass.id === superClass.id) return true;
            }
            return false;
        }
    }
    protected get_isSuperClassOf(c: Context): ((subClass?: LClass, returnIfSameClass?: boolean) => boolean) {
        return (subClass?: LClass, returnIfSameClass: boolean = true) => {
            if (!subClass) return false;
            if (subClass.id === c.data.id) return returnIfSameClass;
            return subClass.isSubClassOf(c.proxyObject, returnIfSameClass);
        }
    }

    protected get_inheritedAttributes(context: Context): this['inheritedAttributes'] {
        return this.get_extendsChain(context).flatMap((superClass) => superClass.ownAttributes);
    }
    protected get_inheritedReferences(context: Context): this['inheritedReferences'] {
        return this.get_extendsChain(context).flatMap((superClass) => superClass.ownReferences);
    }
    protected get_inheritedOperations(context: Context): this['inheritedOperations'] {
        return this.get_extendsChain(context).flatMap((superClass) => superClass.ownOperations);
    }
    protected get_inheritedChildren(context: Context): this['inheritedChildren'] {
        return U.arrayMergeInPlace<any>(this.get_inheritedAttributes(context), this.get_inheritedReferences(context),
            this.get_inheritedOperations(context));
    }

    protected get_allAttributes(context: Context): this['allAttributes'] {
        return U.arrayMergeInPlace<any>(this.get_ownAttributes(context), this.get_inheritedAttributes(context));
    }
    protected get_allReferences(context: Context): this['allReferences'] {
        return U.arrayMergeInPlace<any>(this.get_ownReferences(context), this.get_inheritedReferences(context));
    }
    protected get_allOperations(context: Context): this['allOperations'] {
        return U.arrayMergeInPlace<any>(this.get_ownOperations(context), this.get_inheritedOperations(context));
    }
    protected get_allChildren(context: Context): this['allChildren'] {
        return U.arrayMergeInPlace<any>(this.get_ownChildren(context), this.get_inheritedChildren(context));
    }

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: GObject = {};
        const featurearr: Json[] = [];
        const operationsarr: Json[] = [];
        let supertypesstr = [];
        const d = context.data;
        const l = context.proxyObject;
        for (let att of l.attributes) { featurearr.push(att.generateEcoreJson(loopDetectionObj)); }
        for (let ref of l.references) { featurearr.push(ref.generateEcoreJson(loopDetectionObj)); }
        for (let op of l.operations) { operationsarr.push(op.generateEcoreJson(loopDetectionObj)); }

        json[ECoreClass.xsitype] = 'ecore:EClass';
        json[ECoreClass.namee] = d.name;
        json[ECoreClass.interface] = U.toBoolString(d.interface, false);
        json[ECoreClass.abstract] = U.toBoolString(d.abstract, false);
        if (d.instanceClassName) json[ECoreClass.instanceTypeName] = d.instanceClassName;
        json[ECoreClass.eSuperTypes] = l.extends.map( superclass => superclass.typeEcoreString).join(" ");
        if (featurearr) json[ECoreClass.eStructuralFeatures] = featurearr;
        if (operationsarr) json[ECoreClass.eOperations] = operationsarr;
        return json; }


    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(context: Context): ((deep?: boolean) => LClass) {
        return (deep: boolean = false) => {
            let ret: LClass = null as any;
            TRANSACTION('duplicate '+this.get_name(context), () => {
                let le: LClass = context.proxyObject.father.addClass(context.data.name, context.data.interface, context.data.abstract, context.data.isPrimitive);
                let de: D = le.__raw as D;
                // de.hideExcessFeatures = context.data.hideExcessFeatures;
                let we: WClass = le as any;
                we.defaultValue = context.data.defaultValue;
                we.extends = context.data.extends;
                we.attributes = deep ? context.proxyObject.attributes.map(lchild => lchild.duplicate(deep).id) : context.data.attributes;
                we.references = deep ? context.proxyObject.references.map(lchild => lchild.duplicate(deep).id) : context.data.references;
                we.operations = deep ? context.proxyObject.operations.map(lchild => lchild.duplicate(deep).id) : context.data.operations;
                ret = le; // set ret = le only if the transaction is complete.
            });
            return ret; }
    }

    protected get_children_idlist(context: Context): Pointer<DAnnotation | DStructuralFeature | DOperation, 1, 'N'> {
        return [...super.get_children_idlist(context) as Pointer<DAnnotation | DStructuralFeature, 1, 'N'>,
            ...context.data.attributes,
            ...context.data.references,
            ...context.data.operations];
    }


    protected set_name(val: this["name"], context: Context): boolean {
        if (context.data.name === val) return true;
        super.set_name(val, context);
        SetRootFieldAction.new('ClassNameChanged.'+context.data.id, val, '', false); // it is pointer, but related to transient stuff, so don't need pointedBy's
        return true;
    }

    partial!: boolean;
    __info_of__partial: Info = {type: 'boolean', txt:'A partial object have can add unlisted features as a shapeless (schemaless) object does,' +
            ' on top of a set of fixed listed features.'}
    protected set_partial(val: D["partial"], c: Context): boolean {
        val = !!val;
        if (val === c.data.partial) return true;
        TRANSACTION(this.get_name(c)+'.partial', ()=>{
            SetFieldAction.new(c.data.id, "partial", val);
        }, c.data.partial, val)
        return true;
    }
    protected get_partial(context: Context): D["partial"] { return context.data.partial; }

    protected set_partialdefaultname(val: D["partialdefaultname"], c: Context): boolean {
        if (val === c.data.partialdefaultname) return true;
        TRANSACTION(this.get_name(c)+'.partialdefaultname', ()=>{
            SetFieldAction.new(c.data.id, "partialdefaultname", val, undefined, false);
        })
        return true;
    }
    protected get_partialdefaultname(context: Context): D["partialdefaultname"] { return context.data.partialdefaultname; }

    public addAttribute(name?: DAttribute["name"], type?: DAttribute["type"]): LAttribute { return this.cannotCall("addAttribute"); }
    protected get_addAttribute(context: Context): this["addAttribute"] {
        return (name?: DAttribute["name"], type?: DAttribute["type"]) => LPointerTargetable.fromD(DAttribute.new(name, type, context.data.id, true));
    }

    public addReference(name?: DReference["name"], type?: DReference["type"]): LReference { return this.cannotCall("addReference"); }
    protected get_addReference(context: Context): this["addReference"] {
        return (name?: DReference["name"], type?: DReference["type"]) => LPointerTargetable.fromD(DReference.new(name, type, context.data.id, true));
    }

    public addOperation(name?: DOperation["name"], type?: DOperation["type"]): LOperation { return this.cannotCall("addOperation"); }
    protected get_addOperation(context: Context): this["addOperation"] {
        return (name?: DOperation["name"], type?: DOperation["type"]) => LPointerTargetable.fromD(DOperation.new(name, type, [], context.data.id, true));
    }


    protected get_abstract(context: Context): this["abstract"] { return context.data.abstract; }
    protected set_abstract(val: this["abstract"], c: Context): boolean {
        const data = c.data;
        val = !!val;
        if (val === c.data.abstract) return true;
        if(val && data.instances.length > 0) {
            U.alert('e', 'Cannot change the abstraction level since there are instances.','');
        } else {
            TRANSACTION(this.get_name(c)+'.abstract', ()=>{
                SetFieldAction.new(data, 'abstract', val);
            }, c.data.abstract, val)
        }
        return true;
    }

    protected set_isPrimitive(val: this["isPrimitive"], c: Context): boolean {
        val = !!val;
        if (val === c.data.isPrimitive) return true;
        TRANSACTION(this.get_name(c)+'.isPrimitive', ()=>{
            SetFieldAction.new(c. data, 'isPrimitive', val);
        })
        return true;
    }
    // get is in classifier with all other "type"s getter and setter

    protected get_interface(context: Context): this["interface"] { return context.data.interface; }
    protected set_interface(val: this["interface"], c: Context): boolean {
        val = !!val;
        if (c.data.interface === val) return true;
        if (val && c.data.instances.length > 0) {
            U.alert('e', 'Class cannot become an interface since there are instances.', '');
        } else {
            TRANSACTION(this.get_name(c)+'.interface', ()=>{
                SetFieldAction.new(c.data, 'interface', val);
            }, c.data.interface, val)
        }
        return true;
    }

    allInstances!: LObject[];
    __info_of__allInstances: Info = {type: 'LObject[]', txt: "Instances in m1 of this class and of all subclasses."};
    protected get_allInstances(context: Context): this["instances"] {
        let sc = this.get_allSubClasses(context, true);
        return sc.flatMap( (c) => c.instances);
    }

    protected get_instances(context: Context): this["instances"] {
        return context.data.instances.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_instances(val: PackArr<this["instances"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        TRANSACTION(this.get_name(c)+'.instances', ()=>{
            SetFieldAction.new(c.data, 'instances', list, "", true);
        })
        return true;
    }

    protected get_operations(context: Context): this["operations"] {
        return context.data.operations.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_operations(val: PackArr<this["operations"]>, context: Context): boolean {
        const list: Pointer<DOperation>[] = val.map((lItem) => { return Pointers.from(lItem) })
            .filter(e=>!!e) as any;
        const oldList = context.data.operations;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(context)+'.operations', ()=>{
            SetFieldAction.new(context.data, 'operations', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_features(context: Context): this["features"] {
        return context.data.features.map((pointer) => { return LPointerTargetable.from(pointer) });
    }
    protected set_features(val: PackArr<this["features"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.features;
        const diff = U.arrayDifference(oldList, list);
        let le: this = null as any;
        TRANSACTION(this.get_name(context)+'.features', ()=>{
            SetFieldAction.new(context.data, 'features', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_references(context: Context): this["references"] {
        return context.data.references.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_references(val: PackArr<this["references"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.references;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(context)+'.references', ()=>{
            SetFieldAction.new(context.data, 'references', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_attributes(context: Context): this["attributes"] {
        return context.data.attributes.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_attributes(val: PackArr<this["attributes"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.attributes;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(context)+'.attributes', ()=>{
            SetFieldAction.new(context.data, 'attributes', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    public get_referencedBy(c: Context): this["referencedBy"] {
        let keystr: string;
        if (c.data.className === 'DClass'){ keystr = '.type'; }
        // @ts-ignore
        else if (c.data.className === 'DObject'){ return LObject.singleton.get_referencedBy(c); }
        // else if (c.data.className === 'DObject'){ keystr = '.values'; } nope, model also have .values+=
        // and lvalues might be under either ".values" | ".values+=" | ".values.0" (in rightbar)
        else return [];

        let ptrs = c.data.pointedBy.map(e=> {
            /*
            if (c.data.className === 'DObject'){
                let parent = this.get_father(c);
                return parent.className === 'DValue' ? [parent] : [];
            }*/
            let index = e.source.lastIndexOf(keystr);
            if (index !== (e.source.length - keystr.length)) return null;
            return e.source.substring('idlookup.'.length, index);

        }).filter(e=>!!e);

        return LPointerTargetable.fromArr(ptrs);
        // return context.data.referencedBy.map((pointer) => LPointerTargetable.from(pointer) );
    }
    protected set_referencedBy(val: PackArr<this["referencedBy"]>, context: Context): boolean {
        return this.cannotSet('referencedBy', 'is automatically updated through pointedBy');
        /*if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        const ptrs = [...new Set(val.map((val) => { return val && Pointers.from(val) })).filter(e=>!!e)];
        SetFieldAction.new(context.data, 'referencedBy', ptrs, "", true);
        return true;*/
    }

    protected get_extends(context: Context): this["extends"] {
        return context.data.extends.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_extends(val: PackArr<this["extends"]>, c: Context): boolean {
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        let ptrs: Pointer<DClass>[] = [...new Set(val.map((val) => { return val && Pointers.from(val) }).filter(e=>!!e))];
        let diff = Uarr.arrayDifference(c.data.extends, ptrs);
        let invalid: GObject[] = [];
        let invalidPtrs: Pointer[] = [];
        for (let ptr of diff.added){
            let reason: GObject = {ptr};
            if (this.get_canExtend(c)(ptr as any, reason as any)) continue;
            invalid.push(reason);
            invalidPtrs.push(ptr);
        }
        if (invalid.length) {
            Log.ww('tried to add invalid extends, they were ignored:', invalid);
            ptrs = ptrs.filter(e=>!invalid.includes(e));
        }
        if (diff.removed.length === 0 && diff.added.length === invalid.length) return true;

        TRANSACTION(this.get_name(c)+'.extends', ()=>{
            // adapt instances
            this._fixExtendInstances(c, ptrs);
            // finalize
            SetFieldAction.new(c.data, 'extends', ptrs, "", true);
        }, undefined, ('+'+diff.added.length+', -'+diff.removed.length))
        return true;
    }

    private _canExtend(c: Context, superclass0: LClass | DClass | Pointer<DClass>, output: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}): boolean {
        console.log('_canExtends', {c, superclass0, output});
        if (!output) output = {allTargetSuperClasses:[]} as any;
        let superclass: LClass = superclass0 && LPointerTargetable.wrap(superclass0) as any;
        let dsuperclass = superclass?.__raw;
        if (!superclass) { output.reason = 'Invalid extend target: ' + superclass; return false; }
        let sealed = superclass.sealed || [];
        if (sealed.length) {
            let inSealed = false;
            for (let allowed of sealed) if (allowed && allowed.isSubClassOf(c.proxyObject)) { inSealed = true; break; }
            if (!inSealed) {
                output.reason = 'sealed on attempted superclass';
                return false;
            }
        }
        if (superclass.final) {
            output.reason = 'final on attempted superclass';
            return false;
        }
        const thiss: LClass = c.proxyObject;
        if (dsuperclass.id === thiss.id) { output.reason = 'Classes cannot extend themselves.'; return false; }
        // todo: se diversi proxy dello stesso oggetto sono considerati diversi questo fallisce, in tal caso fai thiss.extends.map( l => l.id).indexof(superclass.id)
        if (thiss.extends.map(sc=>sc.id).indexOf(dsuperclass.id) >= 0) { output.reason = 'Target class is already directly extended.'; return false; }
        output.allTargetSuperClasses = superclass.superclasses;
        if (thiss.superclasses.map(sc=> sc.id).indexOf(dsuperclass.id) >= 0) { output.reason = 'Target class is already indirectly extended.'; return false; }
        if (output.allTargetSuperClasses.map(sc=>sc.id).indexOf(thiss.id) >= 0) { output.reason = 'Cannot set this extend, it would cause a inheritance loop.'; return false; }
        if (thiss.interface && !superclass.interface) { output.reason = 'An interface cannot extend a class.'; return false; }
        // ora verifico se causa delle violazioni di override (attibuti omonimi string e boolean non possono overridarsi)
        let i: number;
        let j: number;
        let children: LOperation[] =  thiss.operations; //[...thiss.getBasicOperations()];
        let superchildren: LOperation[] = superclass.operations; //[...superclass.getBasicOperations()];
        for (i = 0; i < children.length; i++) {
            let op: LOperation = children[i];
            for (j = 0; j < superchildren.length; j++){
                let superchild: LOperation = superchildren[j];
                if (op.name !== superchild.name) continue;
                if (op._canOverride(superchild) || op._canPolymorph(superchild)) continue;
                output.reason = 'Marked homonymous operations cannot override nor polymorph each others.';
                setTimeout( () => {
                    op._mark(true, superchild, 'override'); //  mark op && superchildren
                    setTimeout( () => { op._mark(false, superchild, 'override'); }, 3000); // unmark
                }, 1);
                return false;
            }
        }
        return true; }

    private _isExtending(context: Context, superclass: LClass, orEqual: boolean = true): boolean {
        if (!superclass) return false;
        return this.get_superclasses(context, orEqual).includes(superclass); }


    // adapt m1 instances after updating the extends in m2.
    private _fixExtendInstances(c: Context, neww: Pointer<DClass>[]): void{
        for (let thiss of this.get_allSubClasses(c, true)) {
            let ptrs = neww;
            //put everything below in the loop, and replace this.get_something(c) with subclass.something
            let c2 = new LogicContext(thiss, thiss.__raw) as Context;
            let idmap: Dictionary<Pointer, LClass> = {};
            let newDeepExtends: Pointer<DClass>[] = this.get_superclasses(c2, true, ptrs).map(e=> {let id = e.id; idmap[id] = e; return id; });
            let oldDeepExtends: Pointer<DClass>[] = this.get_superclasses(c2, true).map(e=> {let id = e.id; if(!idmap[id]) idmap[id] = e; return id; });
            let deepDiff = U.arrayDifference(oldDeepExtends, newDeepExtends);
            let deepAdded = deepDiff.added;
            let deepRemoved = deepDiff.removed;
            let deepFeatureAdded = deepAdded.map(ptr=>[idmap[ptr].attributes, idmap[ptr].references]).flat(2);
            let deepFeatureRemoved = deepRemoved.map(ptr=>[idmap[ptr].attributes, idmap[ptr].references]).flat(2);
            let deepFeatureAddedID = deepFeatureAdded.map(l=>l.id);
            let deepFeatureRemovedID = deepFeatureRemoved.map(l=>l.id);

            for (let o of c2.proxyObject.instances) {
                if (!o) continue;
                let allChildren: (LValue | LAnnotation)[] = o.allChildren;
                let allChildTypesId: (Pointer<DAttribute> | Pointer<DReference> | undefined)[] = allChildren.map(c=>((c as LValue)?.instanceof?.id));
                for (let added of deepFeatureAddedID) {
                    if (allChildTypesId.includes(added)) continue;
                    o.addValue(undefined, added, [], true);
                }
                for (let removed of deepFeatureRemovedID) {
                    let i = allChildTypesId.indexOf(removed);
                    if (i === -1) continue;
                    let lval: LValue = allChildren[i] as LValue;
                    if (!lval.isMirage) continue;
                    lval.delete();
                }
            }
        }
    }
    addExtend(val: Pack<this["extends"]>): void { this.cannotCall('addExtend'); }
    get_addExtend(context: Context): this['addExtend'] {
        return ((val: Pack<this["extends"]>)=>this.impl_addExtend(context, val as any));
    }

    impl_addExtend(c: Context, val: PackArr<this["extends"]>): void {
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        if (!val.length) return;
        let ptrs: Pointer<DClass>[] = [...new Set(val.map((val) => { return val && Pointers.from(val) }).filter(e=>!!e && !c.data.extends.includes(e)))] as Pointer<DClass>[];

        console.log('addExtend', {n:this.get_name(c), ptrs, val});
        let out0 = {reason: '', allTargetSuperClasses: []};
        let outArr: {reason: string, allTargetSuperClasses: LClass[]}[] = ptrs.map(p=>({...out0}));


        ptrs = ptrs.filter((ptr, i) => this._canExtend(c, ptr, outArr[i]));
        for (let i = 0; i < outArr.length; i++) {
            let out = outArr[i];
            Log.w(!!out.reason, "cannot add extend " + this.get_name(c) + " -> " + (L.fromPointer(ptrs[i]) as LClass)?.name + ".\n reason: " + out.reason);
        }

        if (!ptrs.length) {
            return;
        }
        // ptrs = [...c.data.extends, ...ptrs];
        // todo: extendedby? or make it derived from pointedby

        TRANSACTION(this.get_name(c)+'.extends+=', ()=>{
            // adapt instances
            this._fixExtendInstances(c, ptrs);
            // finalize
            for (let ptr of ptrs) SetFieldAction.new(c.data, 'extends', ptr, '+=', true);
        }, undefined, ptrs.length)
    }

    removeExtends(superclass: LClass): void { return this.cannotCall('removeExtends'); }
    unsetExtends(superclass: LClass): void { return this.cannotCall('unsetExtends'); }
    get_removeExtend(c: Context): (superclass: LClass)=>void { return this.get_unsetExtends(c); }
    get_unsetExtends(c: Context): (superclass: LClass)=>void {
        return (superclass: LClass)=>{
            superclass = LPointerTargetable.wrap(superclass) as any;
            if (!superclass) return;
            console.log('UnsetExtend:', c, superclass);
            // todo: when Object is loaded in m3, set him there for easy access.
            //  if (superclass.id === LClass.genericObjectid) { Log.w(true, 'Cannot un-extend "Object"'); return; }
            const thiss: LClass = c.proxyObject;
            let superclassid = superclass.id;
            let extendsarr = c.data.extends;
            let index: number = extendsarr.indexOf(superclassid);
            if (index < 0) return;
            // let extendedby = superclass.__raw.extendedBy;

            TRANSACTION(this.get_name(c)+'.extends-=', ()=>{
                // @ts-ignore
                SetFieldAction.new(thiss, 'extends', superclass.id, '-=', true);
                // @ts-ignore
                // SetFieldAction.new(superclass, 'extendedBy', thiss.id, '-=', true);
            }, undefined, superclass.fullname)
            // todo: update instances for (i = 0; i < thiss.instances.length; i++) { thiss.instances[i].unsetExtends(superclass); }
            // todo: check violations
            // const extendedby: LClass[] = [thiss, ...thiss.allSubClasses];
            // for (i = 0; i < extendedby.length; i++) { extendedby[i].checkViolations(true); }
        }
    }

    protected remove_extends_unused(val: PackArr<this["extends"]> | number | number[], c: Context): void {
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        if (!val.length) return;
        let finalVal: D["extends"];
        if (typeof val[0] === "number") { finalVal = c.data.extends.filter((elem,index,arr)=> { return (val as any[]).includes(index); }); }
        else {
            finalVal = [...c.data.extends];
            let ptrs: Pointer<DClass> = Pointers.from(val as PackArr<this["extends"]>) as any;
            for (let v of ptrs) { U.arrayRemoveAll(finalVal, v); }
        }

        TRANSACTION(this.get_name(c)+'.extends-=', ()=>{
            SetFieldAction.new(c.data, 'extends', finalVal, '', true);
        }, undefined, c.data.extends.length - finalVal.length)
    }

    protected get_extendedBy(c: Context): this["extendedBy"] {
        let ret: LClass[] = [];
        // to find triangles:
        // let e0 = this;
        // let e1Map = Dictionary.from(e0.extends)
        // for each(let e1 of newextends) for each (let e2 of e1.extends) if (e1Map[e2.id]) e0, e1, e2 are forming a loop, e2 can be removed
        for (let pby of c.data.pointedBy){
            if (!U.endsWith(pby.source, "extends")) continue;
            let arr = pby.source.split('.');
            if (arr.length === 3 && arr[0] === 'idlookup') {
                let l = L.from(arr[1]) as LClass;
                if (l) ret.push(l);
            }
        }
        return ret;

        /*return c.data.extendedBy.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });*/
    }
    protected set_extendedBy(val: PackArr<this["extendedBy"]>, c: Context): boolean {
        return this.cannotSet('extendedBy');
        /*
        if (!val) val = [];
        else if (!Array.isArray(val)) val = [val];
        const ptrs = [...new Set(val.map((val) => { return val && Pointers.from(val) }).filter(e=>!!e))];
        TRANSACTION(this.get_name(c)+'.extendedBy', ()=>{
            SetFieldAction.new(c.data, 'extendedBy', ptrs, "", true);
        })
        return true;*/
    }

    protected get_implements(context: Context): this["implements"] { return context.data.implements; }
    protected set_implements(val: this["implements"], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.implements', ()=>{
            SetFieldAction.new(c.data, 'implements', val, "", true);
        })
        return true;
    }

    protected get_implementedBy(context: Context): this["implementedBy"] { return context.data.implementedBy; }
    protected set_implementedBy(val: this["implementedBy"], c: Context): boolean {
        TRANSACTION(this.get_name(c)+'.implementedBy', ()=>{
            SetFieldAction.new(c.data, 'implementedBy', val, "", true);
        })
        return true;
    }


    public canExtend(superclass: LClass | DClass | Pointer<DClass>, output: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}): boolean {
        this.cannotCall("canExtend"); return false;
    }

    private get_canExtend(context: Context): (superclass: LClass | DClass | Pointer<DClass>, output: {reason: string, allTargetSuperClasses: LClass[]}) => boolean {
        return (superclass: LClass | DClass | Pointer<DClass>, output: {reason: string, allTargetSuperClasses: LClass[]} =
            {reason: '', allTargetSuperClasses: []}) => this._canExtend(context, superclass, output);
    }

    public isExtending(superclass: Pack1<LClass>, directly: boolean = false): boolean { return this.cannotCall("isExtending"); }
    public isSubclassOf(superclass: Pack1<LClass>, directly: boolean = false): boolean { return this.cannotCall("isSubclassOf"); }
    __info_of__isSubclassOf: Info = {type: "(superclass: Pointer | LClass, directly: boolean = false) => boolean", txt: "Alias for isExtending"};
    __info_of__isExtending: Info = {type: "(superclass: Pointer | LClass, directly: boolean = false) => boolean",
        txt:<div>Tells if "this" is a subclass of the "superclass" parameter.
            <br/>- If "directly" is set to true, it will only include direct subclassing as in "class A extends C" not considering chains.
            <br/>    If "directly" is set to true: "class A extends B" & "Class B extends C". In that case A.isExtending(C, true) will return false.</div>};

    private get_isSubclassOf(c: Context, plusThis: boolean = true): this["isExtending"] { return this.get_isExtending(c, plusThis); }
    private get_isExtending(c: Context, plusThis: boolean = true): this["isExtending"] {
        return (superclass: Pack1<LClass>, directly: boolean = false): boolean => {
            let ptr = Pointers.from(superclass);
            if (directly) return c.data.extends.includes(ptr);
            return this.get_superclasses(c, plusThis).map(classe=>classe.id).includes(ptr);
        }
    }

    private get_allSubClasses(c: Context, plusThis: boolean = false): LClass[] {return this.get_subclasses(c, true); }
    private get_allSuperClasses(c: Context, plusThis: boolean = false, initialExtends?: Pointer<DClass>[]): LClass[] {return this.get_superclasses(c, true, initialExtends); }
    private get_allSubclasses(c: Context, plusThis: boolean = false): LClass[] {return this.get_subclasses(c, true); }
    private get_allSuperclasses(c: Context, plusThis: boolean = false, initialExtends?: Pointer<DClass>[]): LClass[] {return this.get_superclasses(c, true, initialExtends); }
    __info_of__allSubclasses: Info = {type: 'Class[]', txt:'Same as this.subclasses, plus the current class.'}
    __info_of__allSuperclasses: Info = {type: 'Class[]', txt:'Same as this.superclasses, plus the current class.'}

    private get_subclasses(c: Context, plusThis: boolean = false): LClass[] {
        const visited: Dictionary<Pointer, LClass> = {};
        let queue: LClass[] = this.get_extendedBy(c);
        if (plusThis) queue.push(c.proxyObject);
        const ret: LClass[] = [];
        for (let i = 0; i < queue.length; i++) {
            let elem: LClass = queue[i];
            if (visited[elem.id]) continue;
            visited[elem.id] = elem;
            ret.push(elem);
            queue.push(...elem.extendedBy);
        }
        return ret;
    }
    private get_superclasses(c: Context, plusThis: boolean = false, initialExtends?: Pointer<DClass>[]): LClass[] {
        const visited: Dictionary<Pointer, LClass> = {};
        let queue: LClass[] = (initialExtends ? (L.fromArr(initialExtends) as LClass[]).filter((e)=>!!e) : this.get_extends(c));
        if (plusThis) queue.push(c.proxyObject);

        const ret: LClass[] = [];
        for (let i = 0; i < queue.length; i++) {
            let elem: LClass = queue[i];
            if (visited[elem.id]) continue;
            visited[elem.id] = elem;
            ret.push(elem);
            queue.push(...elem.extends);
        }
        return ret;
    }

    allExtends!: this['extendsChain'];
    get_allExtends(c:Context): this['extendsChain']{ return this.get_superclasses(c); }
    private get_extendsChain(c: Context): this['extendsChain'] { return this.get_superclasses(c); }

    public instance(): DObject { return this.cannotCall('instance'); }
    /*private get_instance_old(context: Context): () => DObject {
        return () => {
            const dClass: DClass = context.data;
            const lClass: LClass = LClass.from(dClass);
            const dObject = DObject.new(lClass.name.toLowerCase());
            CreateElementAction.new(dObject);
            BEGIN()
            SetFieldAction.new(dObject, 'instanceof', dClass.id, '', true);
            SetFieldAction.new(dClass, 'instances', dObject.id, '+=', true);

            let father: LClass|undefined = lClass;
            while(father) {
                for(let dFeature of [...father.attributes, ...father.references]) {
                    const dValue = DValue.new(dFeature.name); dValue.value = [U.initializeValue(dFeature.type)];
                    CreateElementAction.new(dValue);

                    SetFieldAction.new(dValue, 'father', dObject.id, '', true);
                    SetFieldAction.new(dValue, 'instanceof', dFeature.id, '', true);
                    SetFieldAction.new(dFeature, 'instances', dValue.id, '+=', true);
                    SetFieldAction.new(dObject, 'features', dValue.id, '+=', true);

                }
                father = (father.extends.length > 0) ? father.extends[0] : undefined;
            }
            END()
            return dObject;
        };
    }*/

}
RuntimeAccessibleClass.set_extend(DClassifier, DClass);
RuntimeAccessibleClass.set_extend(LClassifier, LClass);
@RuntimeAccessible('DDataType')
export class DDataType extends DPointerTargetable { // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LDataType;
    // static logic: typeof LDataType;
    // static structure: typeof DDataType;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DDataType, 1, 1, LDataType>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    defaultValue!: Pointer<DObject, 1, 1, LObject>[] | string[];
    // personal
    serializable: boolean = true;
    // usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];


    public static new(name?: DNamedElement["name"], father?: Pointer, persist: boolean = true): DDataType {
        Log.exx("DDataType is abstract, cannot instantiate");
        return null as any;
        // if (!name) name = this.defaultname("datatype_", father);
        // return new Constructors(new DDataType('dwc'), father, persist, undefined).DPointerTargetable().DModelElement().DNamedElement(name).DClassifier().DDataType().end();
    }
}

@Abstract
@RuntimeAccessible('LDataType')
export class LDataType<Context extends LogicContext<DDataType> = any, C extends Context = Context> extends LClassifier { // extends DClassifier
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DDataType;
    id!: Pointer<DDataType, 1, 1, LDataType>;
    // static singleton: LDataType;
    // static logic: typeof LDataType;
    // static structure: typeof DDataType;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage[];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    defaultValue!: LObject[] | string[];
    isPrimitive!: false;
    isClass!: false;
    isEnum!: true;
    // personal
    serializable!: boolean;


    protected get_serializable(context: Context): this["serializable"] { return context.data.serializable; }
    protected set_serializable(val: this["serializable"], c: Context): boolean {
        val = !!val;
        if (val === c.data.serializable) return true;
        TRANSACTION(this.get_name(c)+'.serializable', ()=>{
            SetFieldAction.new(c.data, 'serializable', val);
        }, c.data.serializable, val)
        return true;
    }

}

RuntimeAccessibleClass.set_extend(DClassifier, DDataType);
RuntimeAccessibleClass.set_extend(LClassifier, LDataType);


@Instantiable // DValue
@Leaf
@RuntimeAccessible('DReference')
export class DReference extends DPointerTargetable { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LReference;
    // static logic: typeof LReference;
    // static structure: typeof DReference;


    // inherit redefine
    id!: Pointer<DReference, 1, 1, LReference>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    type!: Pointer<DClass, 1, 1, LClass>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    defaultValueLiteral: string = '';
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    instances: Pointer<DValue, 0, 'N', LValue> = [];
    defaultValue!: Pointer<DObject, 1, 1, LObject>[];
    allowCrossReference!:boolean;
    public derived!: boolean;
    /*protected */derived_read?: string;
    /*protected */derived_write?: string;

    // personal
    rootable?:boolean;
    composition: boolean = false;
    aggregation: boolean = false; // exist in uml but not in ecore
    container: boolean = false;
    __info_of__container: Info = {type: 'boolean', txt: "A reference is a container if it has an opposite that is a containment."};
    opposite?: Pointer<DReference>;
    target: Pointer<DClass, 0, 'N', LClass> = [];
    edges: Pointer<DEdge, 0, 'N', LEdge> = [];

    public static new(name?: DReference["name"], type?: DReference["type"], father?: DReference["father"], persist: boolean = true): DReference {
        if (!type) type = father // default type is self-reference
        if (!name) name = this.defaultname("ref_", father);
        return new Constructors(new DReference('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DReference().end();
    }

    static new2(setter: Partial<ObjectWithoutPointers<DReference>>, father: DReference["father"], type?: DReference["type"], name?: DReference["name"]): DReference {
        if (!name) name = this.defaultname((name || "ref_"), father);
        return new Constructors(new DReference('dwc'), father, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DReference()
            .end((d) => { Object.assign(d, setter); });
    }

    static new3(a: Partial<ReferencePointers>, callback: undefined | ((d: DReference, c: Constructors) => void), persist: boolean = true): DReference {
        if (!a.name) a.name = this.defaultname("ref_", a.father);
        return new Constructors(new DReference('dwc'), a.father, persist, undefined, a.id).DPointerTargetable().DModelElement()
            .DPointerTargetable().DModelElement().DNamedElement(a.name)
            .DTypedElement(a.type).DStructuralFeature().DReference()
            .end(callback);
    }

}

@Instantiable // LValue
@Leaf
@RuntimeAccessible('LReference')
export class LReference<Context extends LogicContext<DReference> = any, C extends Context = Context, D extends DReference = DReference>  extends LStructuralFeature {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DReference;
    id!: Pointer<DReference, 1, 1, LReference>;
    // static singleton: LReference;
    // static logic: typeof LReference;
    // static structure: typeof DReference;

    // inherit redefine
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    type!: LClass;
    __info_of__type: Info = {type: "boolean", txt: "The type which the values must conform tp."}
    ordered!: boolean;
    __info_of__ordered: Info = {type: "boolean", txt: "Defines if the values are kept in a sorted fashion."}
    unique!: boolean;
    __info_of__unique: Info = {type: "boolean", txt: "The type which the values allow duplicates."}
    lowerBound!: number;
    __info_of__lowerBound: Info = {type: "boolean", txt: "The minimum number of values expected to have."}
    upperBound!: number;
    __info_of__upperBound: Info = {type: "boolean", txt: "The maximum number of values expected to have."}
    many!: boolean;
    __info_of__many: Info = {type: "boolean", txt: "A derived attribute, equivalent to data.upperBound !== 0."}
    required!: boolean;
    __info_of__required: Info = {type: "boolean", txt: "A derived attribute, equivalent to data.lowerBound > 0."}
    changeable!: boolean;
    __info_of__changeable: Info = {type: "boolean", txt: "If after the initial setup, the value is alllowed to change. similar to \"const\" in many languages. Not supported yet by jjodel."}
    volatile!: boolean;
    __info_of__volatile: Info = {type: "boolean", txt: "Indicates the value can be modified in a multi-threading scenario, and the compiler needs to avoid some optimizations to ensure different threads don't have unsynchronized cached copies."}
    transient!: boolean;
    __info_of__transient: Info = {type: "boolean", txt: "A transient feature is not persistently stored. His value can be lost between sessions."}
    unsettable!: boolean;
    __info_of__unsettable: Info = {type: "boolean", txt: "Not supported yet by jjodel, it is kept for compatibility with ecore. This is ecore's description."+
            "An unsettable feature explicitly models the state of being set verses being unset and so provides a direct implementation for the reflective eIsSet." +
            " It is only applicable single-valued features. One effect of this setting is that, in addition to generating the methods getXyz and setXyz (if the feature is changeable), a reflective generator will generate the methods isSetXyz and unsetXyz."}

    allowCrossReference!:boolean;
    public derived!: boolean;
    __info_of__derived: Info = {type: "boolean", txt: "A derived feature has is value computed by an expression on other values. This is not yet supported by jjodel."}

    /*protected */derived_read?: string;
    /*protected */derived_write?: string;

    get_many(c: Context): boolean{ return this.get_upperBound(c) !== 0; }
    get_required(c: Context): boolean{ return this.get_lowerBound(c) > 0; }

    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];
    defaultValue!: LObject[];

    // personal
    composition!: boolean; // aggregation || containment
    __info_of__composition: Info = {type: "boolean", txt: "A composed value is either an aggregation or a containment.\n In jjodel when a feature is a composition, the contained objects have their parents mapped to the containing features."}
    aggregation!: boolean;
    containment!: boolean;
    container!: boolean;

    rootable?:boolean;
    __info_of__rootable: Info = {type:"boolean | undefined",
        txt: "if missing, only classes not contained, not abstract and not interface can be a model root." +
            "\nWhen read it tells you if the object is rootable by those criteria. If set, the criteria are overriden by your choice."};
    __info_of__containment: Info = {type:"boolean",
        txt: "Defines a \"part of\" relationship where the target cannot exist without the source. Building -> Room \"A Room cannot exist without a Building\"." +
            "Containment implies composition.\n"};
    __info_of__aggregation: Info = {type:"boolean",
        txt: "Defines a \"part of\" relationship where the target can exist without the source. Building -> Student \"A Student can exist outside a Building\"." +
            "Aggregation implies composition. "};
    opposite?: LReference;
    __info_of__opposite: Info = {type:"boolean",
        txt: "This reference is a back-link of another reference stored by the values. It means the values are bidirectionally linked to the object containing this feature." +
            "Aggregation implies composition. Not implemented in jjodel."};
    // target!: LClass[]; replaced by type
    edges!: LEdge[];
    __info_of__edges: Info = {type:"boolean", txt: "The list of edges from the layouting model which are originating from this modelling element."};



    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const model: GObject = {};
        const d = context.data;
        const l = context.proxyObject;
        model[ECoreReference.xsitype] = 'ecore:EReference';
        model[ECoreReference.eType] = l.type.typeEcoreString;
        model[ECoreReference.namee] = d.name;
        if (d.lowerBound != null && !isNaN(+d.lowerBound)) { model[ECoreReference.lowerbound] = +d.lowerBound; }
        if (d.upperBound != null && !isNaN(+d.upperBound)) { model[ECoreReference.upperbound] = +d.upperBound; }
        let cont = d.aggregation || d.composition;
        if (cont != null) { model[ECoreReference.containment] = cont; }
        if (d.container != null) { model[ECoreReference.container] = d.container; }
        return model; }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(context: Context): ((deep?: boolean) => LReference) {
        return (deep: boolean = false) => {
            let ret: LReference = undefined as any;
            TRANSACTION('duplicate ' + this.get_name(context), ()=>{
                let le: LReference = context.proxyObject.father.addReference(context.data.name, context.data.type);
                let de: D = le.__raw as D;
                de.many = context.data.many;
                de.lowerBound = context.data.lowerBound;
                de.upperBound = context.data.upperBound;
                de.ordered = context.data.ordered;
                de.required = context.data.required;
                de.unique = context.data.unique;
                de.changeable = context.data.changeable;
                de.container = context.data.container;
                de.composition = context.data.composition;
                de.aggregation = context.data.aggregation;
                de.defaultValueLiteral = context.data.defaultValueLiteral;
                de.derived = context.data.derived;
                de.transient = context.data.transient;
                de.unsettable = context.data.unsettable;
                de.volatile = context.data.unsettable;
                let we: WReference = le as any;
                we.opposite = context.data.opposite || undefined;
                we.defaultValue = context.data.defaultValue;
                we.type = context.data.type;
                we.annotations = deep ? context.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : context.data.annotations;
                // we.target = deep ? context.proxyObject.target.map(lchild => lchild.duplicate(deep).id) : context.data.target;
                ret = le;
            })
            return ret; }
    }

    protected set_type(val: Pack1<this["type"]>, context: Context): boolean {
        super.set_type(val, context);
        return true;
    }

    public addClass(name?: DClass["name"], isInterface?: DClass["interface"], isAbstract?: DClass["abstract"], isPrimitive?: DClass["isPrimitive"],
                    isPartial?: DClass["partial"], partialDefaultName?: DClass["partialdefaultname"]): LClass {
        return this.cannotCall("LReference.addClass"); }
    protected get_addClass(c: Context): this["addClass"] {
        return (name?: DClass["name"], isInterface?: DClass["interface"], isAbstract?: DClass["abstract"], isPrimitive?: DClass["isPrimitive"],
                isPartial?: DClass["partial"], partialDefaultName?: DClass["partialdefaultname"]) => {
            let dclass: DClass = null as any
            TRANSACTION(this.get_name(c)+'.addClass()', ()=>{
                dclass = DClass.new(name, isInterface, isAbstract, isPrimitive, isPartial, partialDefaultName, c.proxyObject.package!.id, true);
                // SetFieldAction.new(context.data.id, "type", dclass.id);
                this.set_type(dclass.id as any, c);
            }, undefined, name)
            return LPointerTargetable.fromD(dclass);
        } }


    get_containment(context: Context): this["containment"] { return context.data.composition || context.data.aggregation; }
    set_containment(val: this["containment"], c: Context, mainkey:'composition'|'aggregation' = 'composition', altkey:'composition'|'aggregation' = 'aggregation'): boolean {
        // return this.cannotSet('containment', 'set aggregation or composition instead');
        val = !!val;
        if (val && mainkey === 'composition' && c.data.father === c.data.type) {
            // todo: discovere non-trivial loops
            Log.ww('setting ' + this.get_fullname(c) + ' as composition is generating a composition loop, the class has become not instantiable.\nConsider switching to aggregation.');
            return true;
        }

        if (!!c.data[mainkey] === val) return true;
        TRANSACTION(this.get_name(c)+'.'+mainkey, ()=>{
            // set composition and unset aggregation or viceversa
            SetFieldAction.new(c.data, mainkey, val);
            if (val && c.data[altkey]) SetFieldAction.new(c.data, altkey, !val);
            let containedObjects: Dictionary<Pointer, LObject> = {};
            let removedValues: Pointer[] = [];
            let parentChanges: LObject[] = [];
            console.log('containment set', {instances: this.get_instances(c)});
            for (let lval of this.get_instances(c) as LValue[]) {
                // todo: in set_values crop the arr to max upperbound
                let dval = lval.__raw
                let values = dval.values;
                let lmodel = lval.model;
                let dmodel = lmodel.__raw;
                console.log('containment set vals', {lval, values});
                for (let ptr of values) {
                    if (!Pointers.isPointer(ptr)) continue;
                    if (val && containedObjects[ptr]) { // check if element is found twice in the same collection --> one needs to be removed
                        // Log.ee('Cannot activate ' + mainkey+ ' on this reference because some objects are referenced twice in the model')
                        // todo: ask for confirmation if want to abort or delete those values.
                        SetFieldAction.new(dval, 'values', ptr as any, '-=', true); // if is containment=true prevent the targets from being contained twice}
                        removedValues.push(ptr);
                        continue;
                    }
                    // update parent
                    let pointedobj = containedObjects[ptr] = LPointerTargetable.fromPointer(ptr);
                    let newid = (val ? dval.id : dmodel.id) as any;
                    let oldparent = pointedobj.father;
                    console.log('containment set val update', {ptr, oldparent:oldparent.id, newid, modelid:dmodel.id, valid: dval.id, pointedobj});
                    if (oldparent?.id === newid) continue;
                    pointedobj.father = newid;
                    parentChanges.push(pointedobj);
                }
            }
            if (removedValues.length || parentChanges.length){
                Log.ww([
                    removedValues.length ? removedValues.length+' values were removed':undefined,
                    parentChanges.length ? parentChanges.length+' parents were changed':undefined
                ].filter(e=>!!e).join(' and ') + ' as result.',//\n If you want to check chem, write "containmentSideEffects[\''+c.data.id+'\']" in console.',
                {removedValues, parentChanges}
                );
            }
            //if (!windoww.containmentSideEffects) windoww.containmentSideEffects = {};
            //windoww.containmentSideEffects[c.data.id] = {removedValues, parentChanges};
        }, c.data[mainkey], val);
        return true;
    }

    protected get_aggregation(context: Context): this["aggregation"] { return context.data.aggregation; }
    protected get_composition(context: Context): this["composition"] { return context.data.composition; }
    /*
    protected get_container(context: Context): this["container"] { return context.data.container; }
    protected set_container(val: this["container"], context: Context): boolean { return SetFieldAction.new(context.data, 'container', val); }*/

    protected set_aggregation(val: this["aggregation"], c: Context): boolean { return this.set_containment(val, c, 'aggregation', 'composition'); }
    protected set_composition(val: this["composition"], c: Context): boolean { return this.set_containment(val, c, 'composition', 'aggregation'); }

    protected get_opposite(context: Context): this["opposite"] { return context.data.opposite && LPointerTargetable.from(context.data.opposite); }
    protected set_opposite(val: Pack<LReference | undefined>, c: Context): boolean {
        let ptr = Pointers.from(val) as any as LAnnotation["id"];
        if (ptr === c.data.opposite) return true;
        TRANSACTION(this.get_name(c)+'.opposite', ()=>{
            SetFieldAction.new(c.data, 'opposite', ptr, "", true);
        }, LPointerTargetable.wrap(c.data.opposite)?.fullname, LPointerTargetable.wrap(ptr)?.fullname)
        return true;
    }
    /*
        /// todo: why this exist?  why not type?
        protected get_target(context: Context): this["target"] { return context.data.target.map(pointer => LPointerTargetable.from(pointer)); }
        protected set_target(val: PackArr<this["target"]>, context: Context): boolean {
            const list = val.map((lItem) => { return Pointers.from(lItem) });
            SetFieldAction.new(context.data, 'target', list, "", true);
            return true;
        }*/

    protected get_defaultValue(context: Context): this["defaultValue"] { return LPointerTargetable.fromPointer(context.data.defaultValue); }
    protected set_defaultValue(val: PackArr<this["defaultValue"]>, c: Context): boolean {
        // @ts-ignore
        if (!val) (val) = []; else if (!Array.isArray(val)) val = [val];
        let ptrs = Pointers.from(val);
        TRANSACTION(this.get_name(c)+'.defaultValue', ()=>{
            SetFieldAction.new(c.data, 'defaultValue', ptrs, '', false);
        })
        return true; }

    protected get_edges(context: Context): this["edges"] {
        return context.data.edges.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_edges(val: PackArr<this["edges"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        TRANSACTION(this.get_name(c)+'.edges', ()=>{
            SetFieldAction.new(c.data, 'edges', list, "", true);
        })
        return true;
    }
}
RuntimeAccessibleClass.set_extend(DStructuralFeature, DReference);
RuntimeAccessibleClass.set_extend(LStructuralFeature, LReference);
function has_opposite(oppositename: string, ...comments: string[]): any {
    // return (c:Constructor, key:string, ):any =>{}
}
function obsolete_attribute(...comments: string[]) {
    return undefined as any; // function(c:Constructor, key:string,): any {}
}

@Leaf
@RuntimeAccessible('DAttribute')
export class DAttribute extends DPointerTargetable { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    id!: Pointer<DAttribute, 1, 1, LAttribute>;
    // @has_opposite("father")
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    changeable: boolean = true;
    volatile: boolean = true;
    transient: boolean = false;
    unsettable: boolean = false;
    defaultValueLiteral: string = '';
    allowCrossReference!:boolean;
    public derived!: boolean;
    /*protected */derived_read?: string;
    /*protected */derived_write?: string;

    //@obsolete_attribute()
    parent: Pointer<DClass, 0, 'N', LClass> = [];

    //@has_opposite("attributes")
    father!: Pointer<DClass, 1, 1, LClass>;

    //@has_opposite("instanceof")
    instances: Pointer<DValue, 0, 'N', LValue> = [];
    defaultValue!: PrimitiveType[];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?
    isIoT: boolean = false;

    public static new(name?: DAttribute["name"], type?: DAttribute["type"], father?: DAttribute["father"], persist: boolean = true): DAttribute {
        if (!name) name = this.defaultname("attr_", father);
        if (!type) type = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes()).id; // default type as string
        return new Constructors(new DAttribute('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DAttribute().end();
    }
    static new2(setter: Partial<ObjectWithoutPointers<DReference>>, father: DAttribute["father"], type?: DAttribute["type"], name?: DAttribute["name"]): DAttribute {
        if (!name) name = this.defaultname((name || "ref_"), father);
        return new Constructors(new DAttribute('dwc'), father, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DAttribute()
            .end((d) => { Object.assign(d, setter); });
    }
    static new3(a: Partial<AttributePointers>, callback: undefined | ((d: DAttribute, c: Constructors) => void), persist: boolean = true): DAttribute {
        if (!a.name) a.name = this.defaultname("attr_", a.father);
        return new Constructors(new DAttribute('dwc'), a.father, persist, undefined, a.id)
            .DPointerTargetable().DModelElement().DNamedElement(a.name)
            .DTypedElement(a.type).DStructuralFeature().DAttribute()
            .end(callback);
    }
}


@Leaf
@Instantiable // (LValue)
@RuntimeAccessible('LAttribute')
export class LAttribute <Context extends LogicContext<DAttribute> = any, C extends Context = Context, D extends DAttribute = DAttribute> extends LStructuralFeature { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DAttribute;
    id!: Pointer<DAttribute, 1, 1, LAttribute>;
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    type!: LClassifier;
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    // defaultValueLiteral!: string;
    defaultValue!: PrimitiveType[];
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?
    isIoT: boolean = false;
    allowCrossReference!:boolean;

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const model = {};
        const d = context.data;
        const l = context.proxyObject;
        EcoreParser.write(model, ECoreAttribute.xsitype, 'ecore:EAttribute');
        EcoreParser.write(model, ECoreAttribute.eType, l.type.typeEcoreString);
        EcoreParser.write(model, ECoreAttribute.namee, d.name);
        EcoreParser.write(model, ECoreAttribute.lowerbound, '' + d.lowerBound);
        EcoreParser.write(model, ECoreAttribute.upperbound, '' + d.upperBound);
        return model; }


    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(context: Context): ((deep?: boolean) => LAttribute) {
        return (deep: boolean = false) => {
            let ret: LAttribute = null as any;
            TRANSACTION('duplicate ' + this.get_name(context), ()=>{
                let le: LAttribute = context.proxyObject.father.addAttribute(context.data.name, context.data.type);
                let de: D = le.__raw as D;
                de.many = context.data.many;
                de.lowerBound = context.data.lowerBound;
                de.upperBound = context.data.upperBound;
                de.ordered = context.data.ordered;
                de.required = context.data.required;
                de.unique = context.data.unique;
                de.changeable = context.data.changeable;
                de.defaultValue = context.data.defaultValue;
                de.defaultValueLiteral = context.data.defaultValueLiteral;
                de.derived = context.data.derived;
                de.transient = context.data.transient;
                de.unsettable = context.data.unsettable;
                de.volatile = context.data.volatile;
                de.isID = context.data.isID;
                de.isIoT = context.data.isIoT;
                let we: WAttribute = le as any;
                we.type = context.data.type;
                we.annotations = deep ? context.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : context.data.annotations;
                ret = le;
            })
            return ret; }
    }

    public addEnum(...p:Parameters<this["addEnumerator"]>): LEnumerator { return this.addEnumerator(...p); }
    protected get_addEnum(context: Context): this["addEnumerator"] { return this.get_addEnumerator(context); }
    public addEnumerator(name?: DEnumerator["name"], father?: DEnumerator["father"]): LEnumerator { return this.cannotCall("Attribute.addEnumerator"); }
    protected get_addEnumerator(context: Context): this["addEnumerator"] {
        return (name?: DEnumerator["name"], father?: DEnumerator["father"]) => LPointerTargetable.fromD(DEnumerator.new(name, context.proxyObject.package?.id, true)); }

    protected get_isID(context: Context): this["isID"] { return context.data.isID; }
    protected set_isID(val: this["isID"], c: Context): boolean {
        val = !!val;
        if (!!c.data.isID === val) return true;
        TRANSACTION(this.get_name(c)+'.isID', ()=>{
            SetFieldAction.new(c.data, 'isID', val);
        }, c.data.isID, val)
        return true;
    }
    protected get_isIoT(context: Context): this["isIoT"] { return context.data.isIoT; }
    protected set_isIoT(val: this["isIoT"], c: Context): boolean {
        val = !!val;
        if (!!c.data.isIoT === val) return true;
        TRANSACTION(this.get_name(c)+'.isIoT', () => {
            for (const value of c.proxyObject.instances) {
                SetFieldAction.new(value, 'topic', '', '', false);
            }
            SetFieldAction.new(c.data, 'isIoT', val);
        }, c.data.isIoT, val)
        return true;
    }
    protected get_defaultValue(context: Context): this["defaultValue"] { return context.data.defaultValue; }
    protected set_defaultValue(val: unArr<this["defaultValue"]>, c: Context): boolean {
        // @ts-ignore
        if (!val) (val) = []; else if (!Array.isArray(val)) val = [val];
        TRANSACTION(this.get_name(c)+'.defaultValue', ()=>{
            SetFieldAction.new(c.data, 'defaultValue', val, '', false);
        })
        return true; }

}
RuntimeAccessibleClass.set_extend(DStructuralFeature, DAttribute);
RuntimeAccessibleClass.set_extend(LStructuralFeature, LAttribute);

@Leaf
@RuntimeAccessible('DEnumLiteral')
export class DEnumLiteral extends DPointerTargetable { // DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    id!: Pointer<DEnumLiteral, 1, 1, LEnumLiteral>;
    parent: Pointer<DEnumerator, 0, 'N', LEnumerator> = [];
    father!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    // personal
    value!: number;
    // ordinal: number=1; replaced by value
    literal!: string;

    public static new(name?: DNamedElement["name"], value?: DEnumLiteral["value"], father?: Pointer, persist: boolean = true): DEnumLiteral { //vv4
        if (!name) name = this.defaultname("literal ", father);
        return new Constructors(new DEnumLiteral('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumLiteral(value).end();
    }
    static new2(setter: Partial<ObjectWithoutPointers<DEnumLiteral>>, father: DEnumLiteral["father"], name?: DEnumLiteral["name"]): DEnumLiteral {
        if (!name) name = this.defaultname("literal ", father);
        return new Constructors(new DEnumLiteral('dwc'), father, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumLiteral()
            .end((d) => { Object.assign(d, setter); });
    }
    static new3(a: Partial<LiteralPointers>, callback: undefined | ((d: DEnumLiteral, c: Constructors) => void), persist: boolean = true): DEnumLiteral {
        if (!a.name) a.name = this.defaultname("literal_", a.father);
        return new Constructors(new DEnumLiteral('dwc'), a.father, persist, undefined, a.id)
            .DPointerTargetable().DModelElement().DNamedElement(a.name)
            .DEnumLiteral()
            .end(callback);
    }
}

@Leaf
@RuntimeAccessible('LEnumLiteral')
export class LEnumLiteral<Context extends LogicContext<DEnumLiteral> = any, C extends Context = Context, D extends DEnumLiteral = DEnumLiteral>  extends LNamedElement { // DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DEnumLiteral;
    id!: Pointer<DEnumLiteral, 1, 1, LEnumLiteral>;
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    parent!: LEnumerator[];
    father!: LEnumerator;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    // personal
    value!: this["ordinal"];
    ordinal!: number;
    literal!: string;

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        const d = context.data;
        json[EcoreLiteral.value] = d.value;
        json[EcoreLiteral.literal] = d.literal;
        json[EcoreLiteral.namee] = d.name;
        return json; }

    public generateEcoreJsonM1(): this["ordinal"] { return this.cannotCall("GenerateEcoreJsonM1"); }
    protected get_generateEcoreJsonM1(context: Context): () => this["ordinal"] { return this.impl_generateEcoreJsonM1(context); }
    protected impl_generateEcoreJsonM1(context: Context): () => this["ordinal"] {
        // loopDetectionObj[context.data.id] = context.data; no loop detection here, the same literal can be exported multiple times in m1
        // return context.data.literal;
        // return context.data.name;
        return () => context.data.value; }


    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(c: Context): ((deep?: boolean) => LEnumLiteral) {
        return (deep: boolean = false) => {
            let ret: LEnumLiteral = null as any;
            TRANSACTION(this.get_name(c)+'.duplicate()', ()=>{
                let le: LEnumLiteral = c.proxyObject.father.addLiteral(c.data.name, c.data.value);
                let de: D = le.__raw as D;
                de.literal = c.data.literal;
                de.value = c.data.value;
                let we: WEnumLiteral = le as any;
                we.annotations = deep ? c.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : c.data.annotations;
                ret = le;
            })
            return ret; }
    }


    protected get_ordinal(context: Context): this["ordinal"] { return this.get_value(context); }
    protected set_ordinal(val: this["ordinal"], context: Context): boolean { return this.set_value(val, context); }

    protected get_value(context: Context): this["value"] {
        let ordinalAssumedByPosition = true; // per ottimizzazione forse è disattivabile
        if (!ordinalAssumedByPosition) return context.data.value || 0;
        return context.proxyObject.father.ordinals.map( o => o?.id).indexOf(context.data.id);
    }
    protected set_value(val: this["value"], c: Context): boolean {
        if (val === c.data.value) return true;
        let ordinals = (this.get_father(c) as LEnumerator).ordinals;
        if (ordinals[val]) {
            Log.e(true, "that ordinal place is already taken by " + ordinals[val].name, {sameOrdinalLit:ordinals[val], ordinals, thiss:c.data});
            return true; }

        TRANSACTION(this.get_name(c)+'.value', ()=>{
            SetFieldAction.new(c.data, 'value', val);
        }, c.data.value, val)
        return true;
    }
    /*
        protected get_literal(context: Context): this["literal"] { return context.data.literal; }
        protected set_literal(val: this["literal"], context: Context): boolean {
            return SetFieldAction.new(context.data, 'literal', val, '', false); }*/
    protected get_literal(context: Context): this["literal"] { return context.data.name; }
    protected set_literal(val: this["literal"], c: Context): boolean {
        if (val === c.data.name) return true;
        TRANSACTION(this.get_name(c)+'.name', ()=>{
            return SetFieldAction.new(c.data, 'name', val, '', false);
        }, c.data.name, val)
        return true;
    }


}
RuntimeAccessibleClass.set_extend(DNamedElement, DEnumLiteral);
RuntimeAccessibleClass.set_extend(LNamedElement, LEnumLiteral);

@Leaf
@RuntimeAccessible('DEnumerator')
export class DEnumerator extends DPointerTargetable { // DDataType
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LEnumerator;
    // static logic: typeof LEnumerator;
    // static structure: typeof DEnumerator;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    id!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    instanceClassName!: string;
    parent: Pointer<DPackage, 0, 'N', LPackage> = [];
    father!: Pointer<DPackage, 1, 1, LPackage>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    defaultValue!: string[];
    serializable: boolean = true;
    // usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = []; obsolete?
    // personal
    literals: Pointer<DEnumLiteral, 0, 'N', LEnumLiteral> = [];

    public static new(name?: DNamedElement["name"], father?: DEnumerator["father"], persist: boolean = true): DEnumerator {
        if (!name) name = this.defaultname("enum ", father);
        return new Constructors(new DEnumerator('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumerator().end();
    }
    static new2(setter: Partial<ObjectWithoutPointers<DEnumerator>>, father: DEnumerator["father"], name?: DEnumerator["name"]): DEnumerator {
        if (!name) name = this.defaultname("enum ", father);
        return new Constructors(new DEnumerator('dwc'), father, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumerator().end((d) => { Object.assign(d, setter); });
    }

    static new3(a: Partial<EnumPointers>, callback: undefined | ((d: DEnumerator, c: Constructors) => void), persist: boolean = true): DEnumerator {
        if (!a.name) a.name = this.defaultname("enum ", a.father);
        return new Constructors(new DEnumerator('dwc'), a.father, persist, undefined, a.id)
            .DPointerTargetable().DModelElement().DNamedElement(a.name)
            .DEnumerator()
            .end(callback);
    }
}

@Leaf
@RuntimeAccessible('LEnumerator')
export class LEnumerator<Context extends LogicContext<DEnumerator> = any, C extends Context = Context, D extends DEnumerator = DEnumerator> extends LDataType { // DDataType
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DEnumerator;
    id!: Pointer<DEnumerator, 1, 1, LEnumerator>;
    // static singleton: LEnumerator;
    // static logic: typeof LEnumerator;
    // static structure: typeof DEnumerator;

    // inherit redefine
    // instanceClass: EJavaClass // ?
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;
    instanceClassName!: string;
    parent!: LPackage [];
    father!: LPackage;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    defaultValue!:string[];
    serializable!: boolean;
    // usedBy!: LAttribute[];
    isPrimitive!: false;
    isClass!: false;
    isEnum!: true;
    // personal
    literals!: LEnumLiteral[];
    ordinals!: LEnumLiteral[]; // literal array ordered by ordinal number

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        let d = context.data;
        if (d.instanceClassName) json[ECoreEnum.instanceTypeName] = d.instanceClassName;
        json[ECoreEnum.xsitype] = 'ecore:EEnum';
        json[ECoreEnum.namee] = d.name;
        json[ECoreEnum.serializable] = d.serializable ? "true" : "false";
        json[ECoreEnum.eLiterals] = context.proxyObject.literals.map(l => l.generateEcoreJson(loopDetectionObj));
        return json; }

    public duplicate(deep: boolean = true): this {
        return this.cannotCall( ((this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name) + "duplicate()"); }
    protected get_duplicate(c: Context): ((deep?: boolean) => LEnumerator) {
        return (deep: boolean = false) => {
            let ret: LEnumerator = null as any;
            TRANSACTION(this.get_name(c)+'.duplicate()', ()=>{
                let le: LEnumerator = c.proxyObject.father.addEnumerator(c.data.name);
                let de: D = le.__raw as D;
                de.defaultValue = c.data.defaultValue;
                de.serializable = c.data.serializable;
                let we: WEnumerator = le as any;
                we.annotations = deep ? c.proxyObject.annotations.map(lchild => lchild.duplicate(deep).id) : c.data.annotations;
                we.literals = deep ? c.proxyObject.literals.map(lchild => lchild.duplicate(deep).id) : c.data.literals;
                ret = le;
            })
            return ret; }
    }


    protected get_children_idlist(c: Context): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
        return [...super.get_children_idlist(c) as Pointer<DAnnotation | DEnumLiteral, 1, 'N'>, ...c.data.literals]; }

    public addLiteral(name?: DEnumLiteral["name"], value?: DEnumLiteral["value"]): LEnumLiteral { return this.cannotCall("addLiteral"); }
    protected get_addLiteral(c: Context): this["addLiteral"] {
        return (name?: DEnumLiteral["name"], value?: DEnumLiteral["value"]) => LPointerTargetable.fromD(DEnumLiteral.new(name, value, c.data.id, true)); }

    protected get_literals(context: Context): this["literals"] {
        return context.data.literals.map((pointer) => {
            return LPointerTargetable.from(pointer)
        }); }

    protected set_literals(val: PackArr<this["literals"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.literals;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(context)+'.literals', ()=>{
            SetFieldAction.new(context.data, 'literals', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true; }

    protected get_ordinals(context: Context): this["ordinals"]{
        let ret: LEnumLiteral[] = [];
        let literals: LEnumLiteral[] = context.proxyObject.literals;
        let dliterals: DEnumLiteral[] = literals.map(d => d.__raw);
        /*
        if it happens like:   second=2, third, fourth=4, fifth=3, sixth.(six would be 4 but 4 already exist)
        there are 2 problems:
        1) [3] is already occupied by third, but fith is correctly being the only one explicitly declaring his ordinal 3.
           fixed by first assigning all known ordinals, then starting with the assumed ordinals.
        2) sixth would get in position fourth, but that is already occupied
         */

        // adressing 1)
        for (let i = 0; i < dliterals.length; i++) {
            let v = dliterals[i].value;
            if (v) { ret[v] = literals[i]; }
        }

        // setting assumed literals
        let currentOrdinal = 0;
        for (let i = 0; i < dliterals.length; i++) {
            let v = dliterals[i].value;
            if (v) { currentOrdinal = v; continue; }
            while (ret[currentOrdinal]) currentOrdinal++; // adressing 2)
            ret[currentOrdinal] = literals[i];
        }
        return ret;
    }
}
RuntimeAccessibleClass.set_extend(DDataType, DEnumerator);
RuntimeAccessibleClass.set_extend(LDataType, LEnumerator);
@RuntimeAccessible('DModelM1')
export class DModelM1 extends DNamedElement{
    name!: string;
    roots!: Pointer<DObject, 1, 'N', LObject> // no package ma LObjects[] (solo quelli isRoot)
    children!: DModelM1["roots"];
}

@RuntimeAccessible('LModelM1')
export class LModelM1 extends LNamedElement{
    name!: string;
    roots!: LObject[];
    children!: LModelM1["roots"];

}
RuntimeAccessibleClass.set_extend(DModelM1, DNamedElement);
RuntimeAccessibleClass.set_extend(LModelM1, LNamedElement);
type DPrimitiveType = DClass;
type LPrimitiveType = LClass;


// problema: o costringo l'utente a fare sempre .value per ricevere il valore invece dei metadati
// oppure ritorno il valore da subito ma dal valore non posso accedere ai metadati (upperbound...) a meno che non trovi un altor sistema.

// possibile fix: LValue.toString() che ritorna il .value





@RuntimeAccessible('DModel')
export class DModel extends DNamedElement { // DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LModel;
    // static logic: typeof LModel;
    // static structure: typeof DModel;

    // inherit redefine
    id!: Pointer<DModel, 1, 1, LModel>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    // personal
    packages: Pointer<DPackage, 0, 'N', LPackage> = [];
    isMetamodel: boolean = true;
    objects: Pointer<DObject, 0, 'N', LObject> = [];
    models: Pointer<DModel, 0, 'N', LModel> = [];
    instanceof?: Pointer<DModel>;
    instances!: Pointer<DModelElement>[];
    dependencies!: Pointer<DModel>[];

    public static new(name?: DNamedElement["name"], instanceoff?: DModel["instanceof"], isMetamodel?: DModel["isMetamodel"], persist: boolean = true): DModel {
        let dmodels: DModel[] = Selectors.getAll(DModel, undefined, undefined, true, false);
        let dmodelnames: string[] = dmodels.map((d: DModel) => d.name);
        if (!name) name = this.defaultname("model_", ((name: string) => dmodelnames.includes(name)));
        return new Constructors(new DModel('dwc'), undefined, persist, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DModel(instanceoff, isMetamodel).end();
    }
    static new2(setter: Partial<ObjectWithoutPointers<DModel>>, name?: DModel["name"], instanceoff?: DModel["instanceof"]): DModel {
        let dmodels: DModel[] = Selectors.getAll(DModel, undefined, undefined, true, false);
        let dmodelnames: string[] = dmodels.map((d: DModel) => d.name);
        if (!name) name = this.defaultname("model_", ((name: string) => dmodelnames.includes(name)));
        return new Constructors(new DModel('dwc'), undefined, true, undefined).DPointerTargetable().DModelElement()
            .DNamedElement(name).DModel(instanceoff).end((d) => { Object.assign(d, setter); });
    }

    static new3(a: Partial<ModelPointers>, callback: undefined | ((d: DModel, c: Constructors) => void), persist: boolean = true): DModel {
        let dmodels: DModel[] = Selectors.getAll(DModel, undefined, undefined, true, false);
        let dmodelnames: string[] = dmodels.map((d: DModel) => d.name);
        if (!a.name) a.name = this.defaultname("model_", ((name: string) => dmodelnames.includes(name)));
        return new Constructors(new DModel('dwc'), a.father, persist, undefined, a.id)
            .DPointerTargetable().DModelElement().DNamedElement(a.name)
            .DModel(a.instanceof, !a.instanceof)
            .end(callback);
    }
}

@RuntimeAccessible('EdgeStarter')
export class EdgeStarter<T1=any, T2=any>{ // <T1 extends LPointerTargetable = LPointerTargetable, T2 extends LPointerTargetable = LPointerTargetable>{
    id: string; // suggested id & key for the element.
    start: LModelElement;
    end: LModelElement;
    startNode: LGraphElement;
    endNode: LGraphElement;
    startVertex: LVoidVertex;
    endVertex: LVoidVertex;
    startGraph: LGraph;
    endGraph: LGraph;
    startSize: GraphSize;
    endSize: GraphSize;
    startVertexSize: GraphSize;
    endVertexSize: GraphSize;
    otherEnds: LGraphElement[];
    extendTargets: LGraphElement[];
    sameGraph: boolean;
    isSameGraph: boolean;
    overlaps: boolean;
    vertexOverlaps: boolean;/*
    firstRenderedStartNode: LGraphElement;
    firstRenderedEndNode: LGraphElement;*/
    // todo: if you want to get the first visible parent node (like for pkg dependencies), use edgestarter.startNode.firstRenderedNode
    constructor(start: LModelElement, end: LModelElement, sn: LGraphElement, en: LGraphElement,
                otherPossibleEnds: LGraphElement[], m1refindex: number, type:string) {
        this.start = start;
        this.end = end;
        this.startNode = sn;
        this.endNode = en;
        this.otherEnds = this.extendTargets = otherPossibleEnds;// || end.nodes;
        //console.log('edgestarter ss', {end, start, sn, en});

        this.startSize = sn.outerSize;
        this.endSize = en.outerSize;
        this.startVertex = sn.vertex as any;
        this.endVertex = en.vertex as any;
        this.startGraph = this.startVertex?.root;
        this.endGraph = this.endVertex?.root;
        this.sameGraph = this.isSameGraph = this.endGraph?.id === this.startGraph?.id;
        //this.firstRenderedStartNode = this.startNode.firstRenderedNode;
        //this.firstRenderedEndNode = this.startNode.firstRenderedNode;
        // this.firstVisibleStart = this.startNode.firstRenderedNode;
        //console.log('edgestarter evs', {end, start, sn, en});
        this.startVertexSize = this.startVertex === sn ? this.startSize : this.startVertex.outerSize;
        this.endVertexSize = this.endVertex === en ? this.endSize : this.endVertex.outerSize;
        this.overlaps = this.startSize?.isOverlapping(this.endSize);
        this.vertexOverlaps = this.startVertexSize?.isOverlapping(this.endVertexSize);
        //console.log('edgestarter end', {end, start, sn, en});
        // how to pick edgeid:
        // using nodeid is useless, as a ref might be hidden and take the node of a class or upper, it must be resolved at conceptual model-level
        // mid = model id
        // NB: mid -> mid is safe for extends, why:
        // if a->b1->c && a->b2->c and both b1,b2 are hidden, extend edges might become both a->c, but in that case is fine to have it only once (filter it in suggestions)
        // mid -> mid                   is safe for package-dependencies for the same reason as class inheritance.
        // mid -> mid                   is not safe for dvalues which might have duplicate references. (DValue.a -> [Object.b, Object.b])
        // mid + (valueindex) -> mid    is safe for everything i think.
        // !!!! REMEMBER, DOTS AND ~ ARE NOT ALLOWED IN ID (css selector char) !!!
        this.id = start.id + ('_' + m1refindex) + '-' + end.id + type;
    }
    /*
    static oneToMany<T1 extends LModelElement = LModelElement, T2 extends LModelElement = LModelElement>(start: T1, ends:T2[]): EdgeStarter<T1, T2>[] {
        let sn = start.node;
        if (!sn) return [];
        let rett: (EdgeStarter | undefined)[] = ends.map( (e) => {
            if(!e) return undefined;
            let en = e.node;
            return en ? new EdgeStarter(start, e, sn as LGraphElement, en) : undefined;
        });
        let ret: (EdgeStarter)[] = rett.filter<EdgeStarter>(function(e: EdgeStarter|undefined): e is EdgeStarter { return !!e });
        // let ret: (EdgeStarter)[] = rett.filter<EdgeStarter>((e): (e is EdgeStarter) => { return !!e });
        return ret;
    }*/
}

@RuntimeAccessible('LModel')
export class LModel<Context extends LogicContext<DModel> = any, C extends Context = Context, D extends DModel = DModel> extends LNamedElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DModel;
    id!: Pointer<DModel, 1, 1, LModel>;
    // static singleton: LModel;
    // static logic: typeof LModel;
    // static structure: typeof DModel;

    // inherit redefine
    parent!: LModel[];
    father!: LModel;
    annotations!: LAnnotation[];
    name!: string;
    namespace!: string;
    // personal
    isMetamodel!: boolean;

    // Metamodel
    packages!: LPackage[];
    models!: LModel[];
    instances!: LModel[];
    dependencies!: LModel[]; // points to other models of the same level
    allDependencies!: LModel[];
    __info_of__dependencies: Info = {type: 'LModel[]',
        txt:'Include other models as prerequisite for this model, it is as if this model is "extending" other models.'};
    __info_of__allDependencies: Info = {type: 'LModel[]', txt:'Same as dependencies, but it solves recursively the dependencies of his dependencies.'};

    // Model
    instanceof?: LModel;
    objects!: LObject[];
    crossObjects!: LObject[];
    roots!: LObject[];

    // utilities to go down in the tree (plural names)
    enums!: LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>; // alias for enumerators
    enumerators!: LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>;
    crossEnumerators!: LEnumerator[] & Dictionary<DocString<"$name">, LEnumerator>;
    classes!: LClass[] & Dictionary<DocString<"$name">, LClass>;
    crossClasses!: LClass[] & Dictionary<DocString<"$name">, LClass>;
    operations!: LOperation[];
    parameters!: LParameter[];
    exceptions!: LClassifier[];
    attributes!: LAttribute[];
    references!: LReference[];
    literals!: LEnumLiteral[];
    values!: LValue[];
    allSubAnnotations!: LAnnotation[];
    allCrossSubAnnotations!: LAnnotation[];
    allSubPackages!: LPackage[];
    allCrossSubPackages!: LPackage[];
    allSubObjects!: LObject[];
    allCrossSubObjects!: LObject[];
    allSubValues!: LValue[];
    allCrossSubValues!: LValue[];
    suggestedEdges!: {extend: EdgeStarter[], reference:EdgeStarter[], packageDependencies: EdgeStarter[]}; //, model: EdgeStarter[], package:EdgeStarter[], class:EdgeStarter[]};
    __info_of__suggestedEdges: Info = {type: 'Dictionary<"extend" | "reference" | "packageDependencies" | DmodelName, EdgeStarter[]>', txt: "A map to access all possible kind of edges based on model data." +
            "<br/>extend and reference are the most commonly used for horizontal references (outside the containment tree schema)." +
            "<br/>packageDependencies links packages using classes from other packages." +
            // "<br/>other keys are the names of container data types (mode, package, class, object...) from them to their childrens rendered as Nodes (vertical tree schema)." +
            // todo: implement the commented part as LGrahElement.vertexs.map(v=>{start:v.parentnode.isVertex ? v.parentnode.id : undefined, end:v.id}).filter(e=>e.start) instead. it's a thing of graph more than model.
            "<br/> EdgeStarter is a collection of data useful to start a &lt;Edge /&gt; in JSX."}

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: GObject = {};

        // if it's M2 metamodel
        if (context.data.isMetamodel) {
            const packageArr: Json[] = [];
            for (let pkg of context.proxyObject.packages) { packageArr.push(pkg.generateEcoreJson(loopDetectionObj)); }
            // return (context.proxyObject.packages[0])?.generateEcoreJson(loopDetectionObj);
            json[ECoreRoot.ecoreEPackage] = packageArr;
            return json;
        }

        // if it's M1 model
        // let serializeasroot = context.proxyObject.isRoot && loopDetectionObj.length; // if rootobj is nested because you started the serialization from another node, i prevent it generating root content
        for (let obj of context.proxyObject.roots) { json[obj.ecoreRootName] = obj.generateEcoreJson(loopDetectionObj); }

        return json; }

    public addPackage(name?: DPackage["name"], uri?: DPackage["uri"], prefix?: DPackage["prefix"]): LPackage { return this.cannotCall("addPackage"); }
    public get_addPackage(context: Context): ((name?: DPackage["name"], uri?: DPackage["uri"], prefix?: DPackage["prefix"]) => LPackage) {
        console.log("Model.addPackage()", {context, thiss: this});
        return (name?: DPackage["name"], uri?: DPackage["uri"], prefix?: DPackage["prefix"]) => {
            return LPointerTargetable.fromD(DPackage.new(name, uri, prefix, context.data.id, true, DModel));
        }
    }

    public get_dependencies(c: Context): this['dependencies']{
        return LPointerTargetable.fromPointer(c.data.dependencies);
    }
    public get_allDependencies(c: Context): this['allDependencies']{
        let targets: LModel[] = L.fromArr(c.data.dependencies);
        return U.iterateChildProperties(targets, (e)=>e.dependencies);
        /*let alreadyParsed: Dictionary<Pointer, LModel> = {};
        while (targets.length) {
            let nextTargets = [];
            for (let target of targets){
                if (alreadyParsed[target.id]) continue;
                alreadyParsed[target.id] = target;
                U.arrayMergeInPlace(nextTargets, target.dependencies);
            }
            targets = nextTargets;
        }
        return Object.values(alreadyParsed);*/
    }
    /*public set_dependencies(c: Context): this['dependencies']{
        default setter is fine, should automatically do the difference of pointers and trigger -= or +=
    }*/

    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(a: T): Pointer<T>[];
    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(a: T[]): Pointer<T>[];
    public static namesORDObjectsToID<L extends LPointerTargetable = LPointerTargetable>(a: L): Pointer<LtoD<L>>[];
    public static namesORDObjectsToID<L extends LPointerTargetable = LPointerTargetable>(a: L[]): Pointer<LtoD<L>>[];
    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(a: Pointer<T>): Pointer<T>[];
    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(a: Pointer<T>[]): Pointer<T>[];
    public static namesORDObjectsToID(a: string, namedCandidates: LModelElement[]): Pointer[];
    public static namesORDObjectsToID(a: string[], namedCandidates: LModelElement[]): Pointer[];
    public static namesORDObjectsToID(a: string | LClass | DClass | Pointer, namedCandidates: LModelElement[]): Pointer[];
    public static namesORDObjectsToID(a: (string | LClass | DClass | Pointer)[], namedCandidates: LModelElement[]): Pointer[];
    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(a: orArr<(string | T | Pointer<T>)>): Pointer<T>[];
    // return the first array parameter converted in an array of pointers. The second parameter is the scope where names are allowed to match. if empty all class.names will fail mapping to id's.
    // second parameter is mandatory when the array contain names, to prevent looking into class names of different models.
    public static namesORDObjectsToID<T extends DPointerTargetable = DPointerTargetable>(targets: orArr<(string | T | Pointer<T>)>, namedCandidates?: LModelElement[]): Pointer<T>[] {
        // let targets = any[] = (!Array.isArray(targets0)) ? targets0 : [targets0];
        if (!targets) return [];
        let ret: Pointer<T>[] = [];
        let state: DState = store.getState();
        if (targets && !Array.isArray(targets)) targets = [targets];
        let dnamedcandidates: DNamedElement[] = namedCandidates ? DPointerTargetable.fromArr(namedCandidates as any) as DNamedElement[] : [];
        let dAllowedNamesMap: Dictionary<DocString<"name">, Pointer<T>> = (dnamedcandidates as any[]).reduce( (acc, val) => { acc[val.name] = val.id; return acc; }, {});
        //let dtargets: DNamedElement[] = targets ? DPointerTargetable.fromArr(targets) as DNamedElement[] : [];
        let tmp: Pointer<T> | undefined;
        for (let target of targets) {
            // try as name
            tmp = dAllowedNamesMap[target as string];
            if (tmp) { ret.push(tmp); continue; }
            // try as $name
            tmp = dAllowedNamesMap["$" + target as string];
            if (tmp) { ret.push(tmp); continue; }
            // try as id
            let d: DNamedElement = DPointerTargetable.from(target as Pointer, state);
            if (d && dAllowedNamesMap[d.name]) { ret.push(target as Pointer<T>); continue; }
            Log.ww("namesORDObjectsToID() could not resolve name:", {name: target, namedCandidates, targets});
        }
        return ret;
    }

    _defaultGetter(c: Context, key: string): any {
        //console.log("$getter 000", {key, ism1:!c.data.isMetamodel, ism:c.data.isMetamodel, data:c.data});
        if (!c.data.isMetamodel) return this._defaultGetterM1(c, key);
        return this._defaultGetterM2(c, key);
    }
    _defaultGetterM2(c: Context, key: string): any{
        if ((TargetableProxyHandler.childKeys[key[0]])){
            // look for m1 matches
            let k = key.substring(1).toLowerCase();
            let s = store.getState();

            for (let subelement of this.get_allSubPackages(c, s)){
                let n = subelement.__raw.name;
                if (n && n.toLowerCase() === k) return subelement;
            }
            for (let subelement of this.get_classes(c, s)){
                let n = subelement.__raw.name;
                if (n && n.toLowerCase() === k) return subelement;
            }
        }
        return this.__defaultGetter(c, key);
        // Log.ee("Could not find property " + key + " on MetaModel", {c, key});
    }
    _defaultGetterM1(c: Context, key: string): any{
        // if m1.$m1RootObjectName then --> return that root object
        // if m1.$m1ObjectName then --> return that sub object nested somewhere in the model.
        // if m1.$m2classname"s" then --> this.instancesOf("m2classname")
        // if m1.$m2classname then ---> m2.$m2classname (lower priority, if there are 2 metaclasses differing only by final s,
        // the one with 1 more final "s" if shadowed by the instances of the one with 1 less final "s",
        // in that case you can access the shadowed one through m1.instanceof.$classnames
        // priorities: 1) m1 name natch --> m1object. 2) m2 exact name match --> m2item, 3) m2 name+"s" match --> instances
        // to access m2 classes within a package, need to navigate it like model.$packagename.Ssubcpackagename.$classname,
        // path + "s" won't work in that case, and need to use this.getInstancesOf instead
        if (TargetableProxyHandler.childKeys[key[0]]){
            // look for m1 matches
            let deepmatch: LObject | undefined;
            let k = key.substring(1).toLowerCase();

            const directSubObjects: Dictionary<Pointer, boolean> = U.objectFromArrayValues(c.data.objects);
            for (let subobject of this.get_allSubObjects(c)){
                let n = subobject.name;
                if (!n || n.toLowerCase() !== k) continue;
                // A0) perfect match with direct child object
                if (directSubObjects[subobject.id]) return subobject;
                else if (!deepmatch) deepmatch = subobject;
            }
            // A1) match with deep sub-object
            if (deepmatch) return deepmatch;

            // look for m2 matches
            let m2: LModel | undefined = this.get_instanceof(c);
            if (!m2) return Log.ee("Could not find m1 match for data.$name. And the metamodel is missing, so cannot get instances by type.", {c, key, m2});
            let m2item: LClass | LPackage;
            // check for a perfect m2 name match and return it
            m2item = (m2 as GObject)[key];
            if (m2item) return m2item; //this.instancesOf(key);
            if (!m2) Log.ee("Could not find property " + key + " on M1 Model", {c, key, m2});
            // if not a perfect name match, i try name+s match for instances
            if (key[key.length - 1] === "s") {
                let key1 = key.substring(0, key.length - 1);
                m2item = (m2 as GObject)[key1];
                if (m2item) {
                    if (m2item.className === "DClass") return (m2item as LClass).instances; // return this.get_instancesOf(c)(m2item as LClass);
                    else return Log.ee("Could not get instances of " + key1 + ".", {c, key, m2, className:m2item.className});
                }
            }
            if (!m2) return Log.ee("Could not find any subelement with name " + key + " on M1 or M2 Models", {c, key, m1: c.data, m2});
        }

        return this.__defaultGetter(c, key);
    }
    private static otherObjectsTemp: Dictionary<DocString<"className">, LObject[]> = undefined as any;
    private static otherObectsAccessedKeys: DocString<"className">[] = [];
    // public otherObjectsSetup(){ LModel.otherObjectsTemp = undefined; LModel.otherObectsAccessedKeys = []; }
    otherObjects!: (excludeInstances: orArr<(string | LClass | Pointer)>, excludeSubclasses?: boolean)=>LObject[];
    otherInstances!: (excludeInstances: orArr<(string | LClass | Pointer)>, excludeSubclasses?: boolean)=>LObject[];
    __info_of__otherObjects: Info = {type:"(...excludeInstances: (string|LClass|Pointer)[], excludeSubclasses: boolean = false)=>LObject[]", txt:<div>Alias for this.otherInstances.</div>};
    __info_of__otherInstances: Info = {type:"(...excludeInstances: (string|LClass|Pointer)[], excludeSubclasses: boolean = false)=>LObject[]", txt:<div>Read this.instancesOf documentation first.
            <br/>Retrieves all the objects not obtained between previous calls of this.instancesOf and the last call of this method.
            <br/>Meaning calling it twice without any instancesOf in between, it will return all objects.</div>};

    public get_otherObjects(c: Context): (excludeInstances: orArr<(string | LClass | Pointer)>, excludeSubclasses?: boolean)=>LObject[]{
        return this.get_otherInstances(c); }
    public get_otherInstances(c: Context): (excludeInstances: orArr<(string | LClass | Pointer)>, excludeSubclasses?: boolean)=>LObject[]{
        // todo:
        return (excludeInstances: orArr<(string | LClass | Pointer)>, includeSubclasses: boolean = false)=>{
            let ret: LObject[];
            this.get_instancesOf(c)(excludeInstances, includeSubclasses) // and drop the result
            if (!LModel.otherObjectsTemp) { ret = this.get_allSubObjects(c); }
            else {
                let dict = {...LModel.otherObjectsTemp};
                for (let key of LModel.otherObectsAccessedKeys) delete dict[key];
                delete (LModel as any).otherObjectsTemp;
                delete (LModel as any).otherObectsAccessedKeys;
                ret = Object.values(dict).flat();
            }
            return ret;
        }
    }
    // not meant to be called directly.
    private _populateOtherObjects(c:Context, classes?: LClass[]): void {
        // from names, DClass and ptrs, make them only ptrs. all classes of this model are valid name targets.
        // nb: cannot optimize getting only instantiated classes from this.get_allSubObjects because if a class have 0 instances should have an empty array instead of undefined (risk jsx crash)
        let state: DState = store.getState();
        let dinstancetypes: DClass[] = (classes || this.get_classes(c, state)).map(c => c.__raw);
        let namemap: Dictionary<DocString<"className">, DClass> = {};
        namemap = dinstancetypes.reduce( (acc, current) => { namemap[current.name] = current; return namemap; }, namemap);
        let idtoname: Dictionary<Pointer, string> = {};
        for (let n in namemap) {idtoname[namemap[n].id] = n; }
        // make it more general, first make a dictionary holding all selected types as keys, including "_other"
        // then a SEPARATE (split this) function to return only the selected keys, merging the subarrays in the global naming instance map.
        LModel.otherObjectsTemp = {};
        LModel.otherObectsAccessedKeys = [];
        // part 1: i add empty arrays for all instances, but not include shapeless objects.
        for (let name in namemap) { LModel.otherObjectsTemp[name] = []; } //LPointerTargetable.fromPointer(namemap[name].instances); }
        // part 2: for shapeless objs too
        LModel.otherObjectsTemp[undefined as any] = [];
        let allObjects: LObject[] = this.get_allSubObjects(c, state);
        // part 3: now i populate the Model.otherObjectsTemp dictionary arrays
        for (let o of allObjects) {
            // if (o.__instanceof) continue;
            let name: string = idtoname[o.__raw.instanceof || ''];
            if (!LModel.otherObjectsTemp[name]) {
                LModel.otherObjectsTemp[name] = [o];
                Log.eDevv("model._populateOtherObjects() this case should never happen", {name, o, allObjects, namemap, idtoname});
            }
            else LModel.otherObjectsTemp[name].push(o);
        }
    }

    public instancesOf(instancetypes0: orArr<(string | LClass | Pointer)>, includeSubclasses: boolean = false): LObject[]{ return this.cannotCall("instancesOf"); }
    public __info_of__instancesOf: Info = {type: "(instancetypes: orArr<(string | LClass | Pointer)>, includeSubclasses: boolean = false) => LObject[]",
        txt:<div>Retrieves all objects instancing a target class.
            <br/>The first parameter is the targeted class, which can be his name, pointer or object.
            <br/>The second parameter tells if instances of his subclasses needs to be retreieved as well.</div>
    }
    // M1
    /// DANGER: after each usage need to call .otherInstances() or the data is cached and not updated.
    public get_instancesOf(c:Context): (this["instancesOf"]){
        if (c.data.isMetamodel) { return (...a:any) => { Log.ww("cannot call instancesOf() on a metamodel"); return []; } }
        return (instancetypes0: orArr<(string | LClass | Pointer)>, includeSubclasses: boolean = false): LObject[] => {
            let state: DState = store.getState();
            let classes = this.get_classes(c, state);
            if (!LModel.otherObjectsTemp) this._populateOtherObjects(c, classes);
            if (!Array.isArray(instancetypes0)) instancetypes0 = [instancetypes0];
            // from names, DClass and ptrs, make them only ptrs. all classes of this model are valid name targets.
            let instancetypes: Pointer<DClass>[] = LModel.namesORDObjectsToID(instancetypes0, classes) as any;
            let dinstancetypes: DClass[] = DClass.fromPointer(instancetypes, state);
            if (includeSubclasses) {
                let arr: LClass[] = dinstancetypes.map(d => LPointerTargetable.fromD(d));
                for (let c of arr) dinstancetypes.push(...(c.allSubClasses.map(l => l.__raw) || []));
                dinstancetypes = [...new Set(dinstancetypes)];
            }
            let ret: LObject[] = [];
            for (let c of dinstancetypes) {
                let arr: LObject[] = LModel.otherObjectsTemp[c.name]; // ?.r; // force update.
                // update with .r is pointless because the array itself would need updating. elements might be removed/inserted if a call to .otherObjects() was skipped
                if (!arr || !arr.length) continue;
                ret.push(...arr);
                LModel.otherObectsAccessedKeys.push(c.name);
            }
            return ret;
        }
    }
/*
* instanceof === some class -> instantiate object and forces to conform to that class
instanceof === null  --> shapeless object
instanceof === undefined or missing  --> auto-detect and assign the type
 */
    addObject(json: GObject, instanceoff: Pack1<LClass> | DocString<"ClassName"> | undefined | null = undefined, forceCreation: boolean = false): ReturnType<LValue["addObject"]>{ return this.cannotCall("LValue.addObject"); }
    __info_of__addObject: Info = {type: "(json: object, instanceof?: LClass) => LObject",
        txt: "Appends an object instancing \"instanceof\" to the model.\n<br>Setting his own properties, and DValues according to the content of the parameter object."}
    get_addObject(c: Context): ReturnType<LValue["get_addObject"]> { return (LValue.singleton as LValue).get_addObject.call(this, c); }

    instantiableClasses(o?: GObject, loose: boolean = false, eligibleClasses?: LClass[], favoriteMatch?: LClass, allowNotInstantiables: boolean = true):LClass[] { return this.cannotCall("instantiableClasses"); }
    __info_of__instantiableClasses: Info = {type: "(o?: object, loose?: boolean) => LClass[]",
        txt: "List of all classes which can be used to instantiate an object." +
            "\n<br>Abstract and Interface classes are excluded." +
            "\n<br>If the parameter \"o\" is specified, it will filter only the instances conforming to the object schema." +
            "\n<br>Results are sorted from tightest fit to loosest fit." +
            "\n<br>loose parameter set to true makes return instead a list of matching scores of all subclasses.", hidden: true}
    // M1

    get_instantiableClasses(c: Context): this["instantiableClasses"] {
        if (c.data.isMetamodel) { return (...a:any)=> { Log.ww("cannot call instantiableClasses() on a metamodel"); return []; } }
        return (o?: GObject, loose: boolean = false, eligibleClasses?: LClass[], favoriteMatch?: LClass, allowNotInstantiables: boolean = true) =>
            LValue.getInstantiableClasses(this, c, o, loose, eligibleClasses, favoriteMatch, allowNotInstantiables); }


    public get_suggestedEdges(context: Context): this["suggestedEdges"]{
        let ret: this["suggestedEdges"];
        if (context.data.isMetamodel) ret = this.impl_get_suggestedEdgesM2(context);
        else ret = this.impl_get_suggestedEdgesM1(context);

        return ret;
    }

    private impl_get_suggestedEdgesM1(context: Context, state?: DState): this["suggestedEdges"]{
        let ret: this["suggestedEdges"] = {extend: [], reference: [], packageDependencies: []};
        if (context.data.isMetamodel) { Log.ww("cannot call suggestedEdgesM1() on a metamodel"); return ret; }
        if (Debug.lightMode) { return ret; }
        let s: DState = store.getState();
        let values: LValue[] = this.get_allSubValues(context, s);
        let map: Dictionary<DocString<"starting dvalue id">, EdgeStarter[]> = {};
        if (!state) state = store.getState();
        outer:
            for (let lval of values) {
                if (!lval) continue;
                let dval = lval.__raw;
                let values: any[] = dval.values || [];
                // NB: ELiterals can be pointers in L, but string or ordinal numbers in D, but they won't make edges, so i use .__raw
                inner:
                    for (let valindex = 0; valindex < values.length; valindex++) {
                        let v: any = values[valindex];
                        if (!Pointers.isPointer(v, state)) continue inner;
                        let snode = lval.notEdge;
                        if (!snode || !snode.html) continue outer;
                        if (v === dval.id) continue inner; // pointing to itself
                        let ltarget: undefined | LEnumLiteral | LObject = LPointerTargetable.fromPointer(v, state);
                        if (!ltarget) continue;
                        if (ltarget.className !== DObject.cname) continue inner;
                        let enode = ltarget.notEdge;
                        if (!enode || !enode.html) continue inner;
                        if (!map[dval.id]) map[dval.id] = [];
                        map[dval.id].push(new EdgeStarter(lval, ltarget, snode, enode, [], valindex, 'values'));
                    }
            }
        ret.reference = Object.values(map).flat();
        return ret;
    }
    private impl_get_suggestedEdgesM2(context: Context): this["suggestedEdges"]{
        let ret: this["suggestedEdges"] = {extend: [], reference: [], packageDependencies: []};
        if (!context.data.isMetamodel) { Log.ww("cannot call suggestedEdgesM2() on a model"); return ret; }
        let s: DState = store.getState();
        let classes: LClass[] = this.get_classes(context, s);
        let references: LReference[] = Debug.lightMode ? [] : classes.flatMap(c=>c.references);
        ret.reference = references.map( (r) => {
            let sn = r?.notEdge;
            if (!sn || !sn.html) return undefined;
            let end = r.type;
            // if (end.id === r.id) return undefined;
            let en = end?.notEdge;
            if (!en || !en.html) return undefined;
            //console.log('pre edgestarter', {r, end, sn, en});
            return new EdgeStarter(r, end, sn, en, [], 0, 'association');
        }).filter<EdgeStarter>(function(e):e is EdgeStarter{ return !!e});
        // ret.extend = classes.flatMap( c => EdgeStarter.oneToMany(c, c.extends));

        let alreadyAdded: Dictionary<Pointer, LClass> = {};
        // if A extends B1, B2;    B1 extends C1, C2;    and node B1 is hidden. instead of edge from A to B, i display edge from A~C1, A~C2, A~B2
        function SkipExtendNodeHidden(start: LClass): ({start: LClass, end: LClass, sn: LGraphElement, en: LGraphElement, oth:LGraphElement[]})[] {
            return SkipExtendNodeHidden_recstep(start);
        }
        function SkipExtendNodeHidden_recstep(start: LClass, sn?: LGraphElement, end?: LClass[], startgraphid: Pointer|null = null): ({start: LClass, end: LClass, sn: LGraphElement, en: LGraphElement, oth:LGraphElement[]})[] {
            let ret: {start: LClass, end: LClass, sn: LGraphElement, en: LGraphElement, oth:LGraphElement[]}[] = [] as any;
            // ret.start = start;
            let isRootcall = !startgraphid;
            if (isRootcall) {
                // end classes can get added twice if from a different starting subclass path:
                // in classes.flatMap -> do not initialize the dict, it must be shared and initialized here locally
                alreadyAdded = {[start.id]: start};
                sn = start.nodes.find(node=>filternode(node, null)); // start.notEdge;
                if (!sn || !sn.html) return [];
                startgraphid = sn.graph?.id;
                if (!startgraphid) return [];
                if (!end) end = start.extends;
            }
            if (!end) return [];
            for (let e of end) {
                if (!e) continue;
                let eid = e.id;
                if (alreadyAdded[eid]) continue; // without this there might be duplicates if A extends B1, B2;  and both B1 & B2 extends C
                alreadyAdded[eid] = e;
                let nodes = e.nodes.filter(o=>filternode(o, startgraphid));// let en = e.notEdge; if (en && en.html) { ret.push({start, end:e, sn, en}); continue; }
                if (nodes.length) {
                    ret.push({start, sn:sn as LGraphElement, end:e, en:nodes[0], oth:nodes});
                    continue;
                }
                let secondTierExtends = e.extends;
                ret.push(...SkipExtendNodeHidden_recstep(start, sn, secondTierExtends, startgraphid));
            }
            return ret;
        }
        windoww.SkipExtendNodeHidden = SkipExtendNodeHidden;

        function filternode(c: LGraphElement, startgraphid: Pointer | null): boolean {
            if (!c || !c.rendered) return false;
            let qualify = U.categorizeNode(c);
            if (qualify.edge || qualify.edgepoint || qualify.puregraph) return false;
            if (startgraphid && startgraphid !== c.root?.id) return false;
            return true;
        }
        ret.extend = classes.flatMap( (c) => SkipExtendNodeHidden(c).map(es=>{
            return new EdgeStarter(es.start, es.end, es.sn, es.en, es.oth, 0, 'extend');
        }));

        if (false) ret.extend = classes.flatMap(c => SkipExtendNodeHidden(c)).map( (es) => {
            let otherEdgeEnds = es;/*.start.extendsChain.flatMap(c=>(c?.nodes||[])).filter(c=> {
                if (!c || !c.rendered) return false;
                let qualify = U.categorizeNode(c);
                if (qualify.edge || qualify.edgepoint || qualify.puregraph) return false;
                if (es.sn?.root?.id !== c.root?.id) return false;
                return true;
            }) as LGraphElement[];
*/
            return new EdgeStarter(es.start, es.end, es.sn, es.en, [], 0, 'extend');
        });

        let dependencies: {src:LModelElement, ends: LModelElement[]}[] =
            Debug.lightMode ? [] : [
                ...(classes.map(c=>{ return {src:c, ends:c.superclasses}})),
                ...(references.map(r=> { return {src:r, ends:[r.type]}}))
            ]
        let pkgdependencies: {src: LPackage, sn: LGraphElement, ends: Dictionary<Pointer, {end:LPackage, en:LGraphElement}>}[] = []; // transform form in dictionary to prevent duplicates
        //dependencies.map( d=> { let end = d.end.package; return {src:d.src.package, end, endid:end.id}})

        for (let d of dependencies) {
            let src: LPackage | null = d.src.package;
            if (!src) continue;
            let srcnode: LGraphElement | undefined = src.notEdge;
            if (!srcnode || !srcnode.html) continue;
            let ends: Dictionary<Pointer, {end:LPackage, en:LGraphElement}> = {};
            for (let end of d.ends) {
                let ep: LPackage|null = end.package;
                if (!ep) continue;
                let epnode: LGraphElement | undefined = ep.notEdge;
                if (!epnode || !epnode.html) continue;
                ends[ep.id] = {end:ep, en:epnode};
            }
            pkgdependencies.push( {src, sn:srcnode, ends});
        }
        // todo: check
        ret.packageDependencies = pkgdependencies.flatMap(
            (pd) => ( Object.values(pd.ends).map((end) => new EdgeStarter(pd.src, end.end, pd.sn, end.en, [], 0, 'pkg_dep')))
        );
        return ret;
    }


    protected get_models(context: Context): LModel[] { // todo: should this not be data.instances instead?
        return LModel.fromPointer(context.data.models);
    }
    protected set_models(val: PackArr<this['models']>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.models;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(context)+'.models', ()=>{
            SetFieldAction.new(context.data, 'models', list, '', true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', context.data.id, '', true);
                SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, context.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    public duplicate(deep: boolean = true): this { throw new Error("Model.duplicate(): use export/import ecore instead."); }

    set_instanceof(val: Pack1<this["instanceof"]>, c: Context): boolean {
        let ptr = Pointers.from<DNamedElement>(val as any);// as (undefined | Pointer<DNamedElement>);
        if (c.data.instanceof === ptr) return true;
        TRANSACTION(this.get_name(c)+'.instanceof', ()=>{
            SetFieldAction.new(c.data.id, "instanceof", ptr, undefined, true);
            // update father's collections (pointedby's here are set automatically)
            // todo: ptr && SetFieldAction.new(ptr, "instances", context.data.id, '+=', true);
        }, this.get_instanceof(c)?.fullname, LPointerTargetable.wrap(ptr)?.fullname)
        return true; }
    protected get_instanceof(c: Context): this["instanceof"] {
        return c.data.instanceof ? LPointerTargetable.fromPointer(c.data.instanceof) : undefined;
    }

    protected set_name(val: this['name'], c: Context): boolean {
        const models: LModel[] = LModel.fromPointer(store.getState()['models']);

        if (models.filter((model) => { return model.name === val }).length > 0) {
            U.alert('e', 'Cannot rename the selected model, this name is already taken.');
        } else {
            if (c.data.name === val) return true;
            TRANSACTION(this.get_name(c)+'.name', ()=>{
                SetFieldAction.new(c.data, 'name', val, '', false);
            }, undefined, val)
            let tab = document.querySelector('#rc-tabs-2-tab-'+c.data.id+' > .drag-initiator > .active-on-mouseenter');
            if (tab) tab.innerHTML = val;
        }
        return true;
    }
    protected get_children_idlist(context: Context): Pointer<DAnnotation | (DPackage|DObject), 1, 'N'> {
        let children: Pointer<(DPackage|DObject), 0, 'N', (LPackage|LObject)>;
        if(context.data.isMetamodel) children = context.data.packages;
        else children = context.proxyObject.allSubObjects.map(o => o.id);
        return [...super.get_children_idlist(context) as Pointer<DAnnotation | (DPackage|DObject), 1, 'N'>,
            ...children];
    }

    protected get_isMetamodel(context: Context): this['isMetamodel'] {
        return !!context.data.isMetamodel;
    }
    protected set_isMetamodel(val: this['isMetamodel'], c: Context): boolean {
        val = !!val;
        if (!!c.data.isMetamodel === val) return true;
        TRANSACTION(this.get_name(c)+'.isMetamodel', ()=>{
            SetFieldAction.new(c.data, 'isMetamodel', val, '', false);
        }, c.data.isMetamodel, val)
        return true;
    }

    protected get_crossObjects(context: Context): this["objects"] { return this.get_objects(context, true); }
    protected get_objects(context: Context, includeCrossReferences: boolean = false): this['objects'] {
        let ret: LObject[] = context.data.objects.map((pointer) => LPointerTargetable.from(pointer));
        if (includeCrossReferences) U.arrayMergeInPlace(ret, context.proxyObject.allDependencies.flatMap(dep=>dep.objects));
        return ret;
    }
    protected get_crossPackages(context: Context): this["packages"] { return this.get_packages(context, true); }

    protected get_packages(context: Context, includeCrossReferences: boolean = false): this["packages"] {
        if (!context.data.isMetamodel) { return context.data.instanceof ? (this.get_instanceof(context) as LModel).packages : []; }
        let ret: LPackage[] = context.data.packages.map((pointer) => LPointerTargetable.from(pointer));
        if (includeCrossReferences) U.arrayMergeInPlace(ret, context.proxyObject.allDependencies.flatMap(dep=>dep.packages));
        return ret;
    }

    protected set_packages(val: PackArr<this["packages"]>, c: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = c.data.packages;
        const diff = U.arrayDifference(oldList, list);
        TRANSACTION(this.get_name(c)+'.packages', ()=>{
            SetFieldAction.new(c.data, 'packages', list, "", true);
            for (let id of diff.added) {
                SetFieldAction.new(id, 'father', c.data.id, '', true);
                SetFieldAction.new(id, 'parent', c.data.id, '+=', true);
            }
            for (let id of diff.removed as Pointer<DModelElement>[]) {
                SetFieldAction.new(id, 'father', undefined, '', true);
                const parent = DPointerTargetable.from(id).parent;
                U.arrayRemoveAll(parent, c.data.id);
                SetFieldAction.new(id, 'parent', parent, '', true);
            }
        })
        return true;
    }

    protected get_crossRoots(context: Context): this["roots"] { return this.get_roots(context, true); }
    protected get_roots(context: Context, includeCross: boolean = false): this["roots"] {
        return this.get_objects(context, includeCross);//.filter( o => o.isRoot);
    }

    protected get_crossClasses(c: Context, s?: DState): this["classes"] { return this.get_classes(c, s, true); }
    protected get_classes(c: Context, s?: DState, includeCross: boolean = false): this["classes"] {
        let key = 'classes';
        let crossKey = 'crossClasses';
        let kind = DClass;
        if (!c.data.isMetamodel) {
            if (!c.data.instanceof) return [] as any;
            let meta = this.get_instanceof(c) as GObject<LModel>;
            if (includeCross && c.data.dependencies.length) return meta[crossKey];
            return meta[key];
        }
        return this._getallSub(c, s, kind, includeCross);
    }
    protected get_crossReferences(c: Context, s?: DState): this["references"] { return this.get_references(c, s, true); }
    protected get_references(c: Context, s?: DState, includeCross: boolean = false): this["references"] {
        let key = 'references';
        let crossKey = 'crossReferences';
        let kind = DReference;
        if (!c.data.isMetamodel) {
            if (!c.data.instanceof) return [] as any;
            let meta = this.get_instanceof(c) as GObject<LModel>;
            if (includeCross && c.data.dependencies.length) return meta[crossKey];
            return meta[key];
        }
        return this._getallSub(c, s, kind, includeCross);
    }

    protected get_crossEnums(context: Context): this["enums"] { return this.get_enumerators(context, undefined, true); }
    protected get_enums(context: Context): this["enums"] {
        if (!context.data.isMetamodel) { return context.data.instanceof ? (this.get_instanceof(context) as LModel).enumerators : [] as any; }
        return this.get_enumerators(context, undefined, false);
    }

    protected get_crossEnumerators(context: Context, s?: DState): this["enums"] { return this.get_enumerators(context, s, true); }
    protected get_enumerators(c: Context, s?: DState, includeCross:boolean = false): this["enums"] {
        let key = 'enumerators';
        let crossKey = 'crossEnumerators';
        let kind = DEnumerator;
        if (!c.data.isMetamodel) {
            if (!c.data.instanceof) return [] as any;
            let meta = this.get_instanceof(c) as GObject<LModel>;
            if (includeCross && c.data.dependencies.length) return meta[crossKey];
            return meta[key];
        }
        return this._getallSub(c, s, kind, includeCross);
    }
    protected get_allCrossSubPackages(c: Context, s?: DState): this["allCrossSubPackages"] { return this.get_allSubPackages(c, s, true); }

    protected get_allSubPackages(c: Context, s?: DState, includeCross: boolean = false): this["allSubPackages"] {
        let key = 'allSubPackages';
        let crossKey = 'allCrossSubPackages';
        let kind = DPackage;
        if (!c.data.isMetamodel) {
            if (!c.data.instanceof) return [] as any;
            let meta = this.get_instanceof(c) as GObject<LModel>;
            if (includeCross && c.data.dependencies.length) return meta[crossKey];
            return meta[key];
        }
        return this._getallSub(c, s, kind, includeCross);
        /*state = state || store.getState();
        let tocheck: Pointer<DPackage>[] = context.data.packages || [];
        let checked: Dictionary<Pointer, DPackage> = {};
        while (tocheck.length) {
            let newtocheck: Pointer<DPackage>[] = [];
            for (let ptr of tocheck) {
                if (checked[ptr]) throw new Error("loop in packages containing themselves");
                let dpackage: DPackage = DPointerTargetable.from(ptr, state);
                checked[ptr] = dpackage;
                U.arrayMergeInPlace(newtocheck, dpackage?.subpackages);
            }
            tocheck = newtocheck;
        }
        let darr: DPackage[] = Object.values(checked);
        let larr: LPackage[] & Dictionary<DocString<"$name">, LPackage> = LPointerTargetable.fromArr(darr, state);
        U.toNamedArray(larr, darr);
        return larr;*/
    }

    protected get_allCrossSubValues(c: Context, s?: DState): this["allCrossSubValues"] { return this.get_allSubValues(c, s, true); }
    protected get_allSubValues(c: Context, s?: DState, includeCross?:boolean): this["allSubValues"] { return this._getallSub(c, s, DValue, includeCross); }
    // allCrossSubAnnotations!: LAnnotation[];     allCrossSubPackages!: LPackage[];     allCrossObjects!: LObject[];     allCrossSubValues!: LValue[];
    protected get_allCrossSubObjects(c: Context, s?: DState): this["allCrossSubObjects"] { return this.get_allSubObjects(c, s, true); }

    protected get_allSubObjects(c: Context, s?: DState, includeCross?:boolean): this["allSubObjects"] {
        return this._getallSub(c, s, DObject, includeCross);
    }
    protected _getallSub(context: Context, state: DState|undefined, kind: Any<typeof DModelElement>, includeCross?:boolean): any[]&Dictionary<any, any> {
        state = state || store.getState();
        let darr = Selectors.getAll(kind, undefined, state, true, false) as DModelElement[];

        //console.log('get_allSubPackages', {includeCross, kind});
        // console.log("gao", {darr:[...darr]});
        let larr = [];
        // let validModels = includeCross ? [c.data.id, ...c.data.dependencies] : [c.data.id];
        let allDeps = includeCross ? this.get_allDependencies(context) : [];
        let allDepPtrs = allDeps.map(m=>m.id);
        for (let i = 0; i < darr.length; i++){
            let l = LPointerTargetable.fromD(darr[i]);
            if (!l) continue;
            let lmodel = l.model;
            // Log.exDev(!lmodel, "missing model in model element", {l, context}); normal for primitive types in "m3"
            if (!lmodel) continue;
            let lmodelid = l.model.id;
            if (lmodelid === context.data.id || includeCross && allDepPtrs.includes(lmodelid)) {
                larr.push(l);
            }
            darr[i] = undefined as any;
            continue;
        }
        // console.log("gao", {darr:[...darr], larr});
        darr = darr.filter(d=>!!d);
        // console.log("gao", {darr, larr});
        U.toNamedArray(larr, darr);
        return larr;
    }

    public getClassByNameSpace(namespacedclass: string): LClass | undefined { return this.cannotCall("getClassByNameSpace"); }
    protected get_getClassByNameSpace(context: Context): this["getClassByNameSpace"] {
        if (!context.data.isMetamodel) { return context.data.instanceof ? (this.get_instanceof(context) as LModel).getClassByNameSpace : undefined as any; }
        return (namespacedclass: string): LClass | undefined => {
            let pos = namespacedclass.lastIndexOf(":");
            let pkguri = namespacedclass.substring(0, pos);
            let classname = namespacedclass.substring(pos+1);
            let pkg: LPackage | undefined = this.get_getPackageByUri(context)(pkguri);
            if (!pkg) return undefined;
            // return pkg["@" + classname];
            return pkg.classes.filter((c) => c.name === classname)[0];
        }; }
    public getPackageByUri(uri: string): LPackage | undefined { return this.cannotCall("getPackageByUri"); }
    protected get_getPackageByUri(context: Context): this["getPackageByUri"] {
        return (uri: string)=>context.proxyObject.allSubPackages.filter((p)=>p.uri === uri)[0]; }


    /* See src/api/persistance/save.ts */

    protected get_attributes(context: Context): this['attributes'] {
        if (!context.data.isMetamodel) { return context.data.instanceof ? (this.get_instanceof(context) as LModel).attributes : []; }
        return context.proxyObject.classes.flatMap(c => c.attributes);
    }

    protected get_literals(context: Context): this['literals'] {
        if (!context.data.isMetamodel) { return context.data.instanceof ? (this.get_instanceof(context) as LModel).literals : []; }
        return context.proxyObject.enumerators.flatMap(e => e.literals);
    }

    protected get_values(context: Context): this['values'] {
        return context.proxyObject.objects.flatMap(o => o.features);
    }
}
RuntimeAccessibleClass.set_extend(DNamedElement, DModel);
RuntimeAccessibleClass.set_extend(LNamedElement, LModel);


@RuntimeAccessible('DFactory_useless_')
export abstract class DFactory_useless_ extends DPointerTargetable { // DModelElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LFactory_useless_;
    // static logic: typeof LFactory_useless_;
    // static structure: typeof DFactory_useless_;

    // inherit redefine
    id!: Pointer<DFactory_useless_, 1, 1, LFactory_useless_>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    ePackage: Pointer<DPackage, 1, 1, LPackage> = '';
    abstract create(DClass: DClass): DObject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}
@RuntimeAccessible('LFactory_useless_')
export abstract class LFactory_useless_<Context extends LogicContext<DFactory_useless_> = any, C extends Context = Context>  extends LModelElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DFactory_useless_;
    id!: Pointer<DFactory_useless_, 1, 1, LFactory_useless_>;
    // static singleton: LFactory_useless_;
    // static logic: typeof LFactory_useless_;
    // static structure: typeof DFactory_useless_;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    ePackage!: LPackage;
    abstract create(DClass: DClass): DObject;
    abstract createFromString(eDataType: DDataType, literalValue: string): EJavaObject;
    abstract convertFromString(eDataType: DDataType, instanceValue: EJavaObject): string;
    // ********************** my additions inherited ********************* //
    // ********************** my additions personal ********************** //
}

// DModelElement.subclasses.push('DFactory_useless_'); // because it's abstract and cannot be used as a value, it's pure type definition
// DModelElement.subclasses.push('LFactory_useless_'); // because it's abstract and cannot be used as a value, it's pure type definition
// RuntimeAccessibleClass.set_extend(DModelElement, DFactory_useless_);
// RuntimeAccessibleClass.set_extend(LModelElement, LFactory_useless_);

@RuntimeAccessible('EJavaObject')
export class EJavaObject{

}// ??? EDataType instance?


@RuntimeAccessible('DMap')
export class DMap extends RuntimeAccessibleClass { // DPointerTargetable
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isDMap!: true;
    constructor() {
        super();
    }

    // id!: Pointer<DModelElement, 1, 1, LModelElement>;
}

@RuntimeAccessible('LMap')
export class LMap<Context extends LogicContext<DMap> = any, C extends Context = Context>  extends LPointerTargetable {
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isLMap!: true;
    // id!: Pointer<DModelElement, 1, 1, LModelElement>;

    get_getByFullPath(c: Context): this['getByFullPath'] { return this.wrongAccessMessage('LMap.getByFullPath'); }
}
RuntimeAccessibleClass.set_extend(DPointerTargetable, DMap as any);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LMap);


@Leaf
@RuntimeAccessible('DObject')
export class DObject extends DPointerTargetable { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    // inherit redefine
    annotations!: never[];
    id!: Pointer<DObject, 1, 1, LObject>;
    parent: Pointer<DModel | DValue, 0, 'N', LModel | LValue> = [];
    father!: Pointer<DModel, 1, 1, LModel> |  Pointer<DValue, 1, 1, LValue>;
    // annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;

    // personal
    instanceof?: Pointer<DClass>; // actually nullable now, but takes too much type refactoring. be careful to check if it's present
    features: Pointer<DValue>[] = [];

    partial!: boolean | undefined;
    __info_of__partial: Info = {type:'boolean | undefined', txt: 'whether the object is allowed to have extra features other than the ones specified by the metamodel.\n' +
            'shapeless objects are always partial.\n' +
            'undefined means the property is inherited by his metamodel class, a boolean value means it overrides it.'}

    public static new(instanceoff?: DObject["instanceof"], father?: DObject["father"], fatherType?: typeof DModel | typeof DValue, name?: DNamedElement["name"], persist: boolean = true): DObject {
        // if (!name) name = this.defaultname(((meta: LNamedElement) => meta.name + " "), father);
        if (!name) name = this.defaultname(((meta: LNamedElement) => (meta?.name || "obj") + "_"), father, instanceoff);
        let ret = new Constructors(new DObject('dwc'), father, persist, fatherType).DPointerTargetable().DModelElement()
            .DNamedElement(name).DObject(instanceoff).end();
        return ret;
    }

    public static new3(ptrs:Partial<ObjectPointers>, then:(d:DObject, c: Constructors)=>void, fatherType?: typeof DModel | typeof DValue, persist: boolean = true): DObject{
        if (!ptrs.name) ptrs.name = this.defaultname(((meta: LNamedElement) => (meta?.name || "obj") + "_"), ptrs.father, ptrs.instanceof);
        return new Constructors(new DObject('dwc'), ptrs.father, persist, fatherType, ptrs.id)
            .DPointerTargetable().DModelElement()
            .DNamedElement(ptrs.name).DObject(ptrs.instanceof).end(then);
    }


}

@RuntimeAccessible('LObject')
export class LObject<Context extends LogicContext<DObject> = any, C extends Context = Context, D extends DObject = DObject> extends LNamedElement { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DObject;
    id!: Pointer<DObject, 1, 1, LObject>;

    // inherit redefine
    annotations!: never[];
    children!: LValue[];
    allChildren!: LValue[]; // including hidden values
    truechildren!: LValue[]; // real shape without "mirage" values
    parent!: (LModel | LValue)[];
    father!: LModel | LValue;
    model!: LModel;
    // annotations!: LAnnotation[];
    // from LClass

    name!: string;
    ecoreRootName!: string;
    namespace!: string;
    defaultValue!: LClass["defaultValue"];
    // abstract!: boolean;
    // interface!: boolean;
    // references!: LReference[];
    // attributes!: LAttribute[];
    // operations!: LOperation[];

    // personal
    deepSubObjects!: LObject[]; // todo: itera features (lvalue[]) deep e vitando di inserire doppioni (salva una mappatura di di già aggiunti e skip se ricompaiono)
    subObjects!: LObject[];
    referenceFeatures!: LValue[]; // subset of features that are references.
    attributeFeatures!: LValue[]; // subset of features that are attributes.
    shapelessFeatures!: LValue[]; // subset of features that are not mapped and can have any kind of values.
    // + tutte le funzioni di comodità navigazionale del modello, trattarlo un pò come se fosse un modello (e quasi può esserlo)
    instanceof?: LClass;
    features!: LValue[];
    isRoot!: boolean;
    readonly partial!: boolean;

    protected get_name(context: Context): this['name'] {
        return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
    }

    composed!:boolean;
    aggregated!:boolean;
    contained!:boolean;
    referencedBy!: LValue[];
    protected get_composed(c: Context): this['composed'] { return (LClass.singleton as LClass).get_composed(c as any); }
    protected get_aggregated(c: Context): this['aggregated'] { return (LClass.singleton as LClass).get_aggregated(c as any); }
    protected get_contained(c: Context): this['contained'] { return (LClass.singleton as LClass).get_contained(c as any); }
    /*
    protected get_referencedBy(c: Context): this["referencedBy"] { return (LClass.singleton as LClass).get_referencedBy(c as any) as any; }
    */
    get_referencedBy(context: Context): LObject["referencedBy"] {
        let state: DState = store.getState();
        let targeting: LValue[] = LPointerTargetable.fromArr(context.data.pointedBy.map( p => {
            let s: GObject = state;
            for (let key of PointedBy.getPathArr(p)) {
                s = s[key];
                if (!s) return null;
                if (s.className === DValue.cname) return s.id;
            }
        }));
        return targeting;
    }

    protected get_truechildren(context: Context): this["children"] {
        let childs: LValue[] = super.get_children(context);
        if (!context.data.instanceof) return childs;
        return childs.filter((c) => !c.isMirage);
    }


    __info_of__isKindOf: Info = {type:  '(Class | fullpath) => bool', txt: 'checks wether the object\'s type is a subclass or equals the target class.' +
            '\nIf an array is provided, it checks if it\'s "kindOf" at least one of them.' +
            '\nShapeless objects, or invalid parameter always returns false'}
    isKindOf(c: LClass | DClass | Pointer<DClass> | DocString<"class.name or fullname">): boolean { return this.cannotCall('isKindOf'); }
    get_isKindOf(cc: Context): this["isKindOf"] { return (c: LClass | DClass | Pointer<DClass> | DocString<"class.name or fullname">): boolean => {
        let target: LClass | null = null as any;
        if (!c) return false;
        let type: LClass = this.get_instanceof(cc) as any as LClass;
        if (!type || type.className !== 'DClass') return false;
        if (Array.isArray(c)) return (c as any as LClass[]).every(cc => this.get_isKindOf(cc as any)(c));

        if ((c as any).__isProxy) target = c as any as LClass;
        if (typeof c === 'object') target = L.fromD(c);
        if (Pointers.isPointer(c)) target = L.fromPointer(c);
        else { // by name or fullname
            let name: string = typeof c === 'string' ? c : '';
            let fullnamepath: string[] = Array.isArray(c) ? c : (name.split('.') || []);
            if (fullnamepath.length > 1) target = this.getByFullPath(fullnamepath) as LClass;
            if (!target && name) {
                let model: GObject<LModel> = this.get_model(cc);
                target = model[name]; // try to get by name in current model
                if (!target && name[0] !== '$') target = model['$'+name]; // try to get by name in current model
                // in this case should always return false because if it's in crossReferences, it was returned above. if not it should not be instantiable
                // if (!target) target = Selectors.getAllClasses().find(...);
            }

        }
        if (!target || target.className !== 'DClass') return false;
        let sc = target.allSuperclasses;
        return sc.some(c => c.id === type.id);
    }}

    protected get_allChildren(context: Context): this["children"] { return super.get_children(context); }

    protected get_children(context: Context, sort: boolean = true): this["children"] {
        const pointers = [...(new Set(super.get_children(context).map(c => c.id)))];
        let childs: LValue[] = LValue.fromArr(pointers);
        let meta: LClass | undefined = context.proxyObject.instanceof;
        // if (!sort && (!meta || meta.partial)) return childs;
        let conformchildren: undefined | Pointer[] = meta && !meta.partial ? meta.allChildren.map(c => c.id) : undefined;
        if (!sort) {
            // console.log("return get features:", {context, meta, childs, conformchildren, ret:childs.filter((c) => (c.instanceof?.id) && conformchildren!.includes(c.instanceof?.id))});
            if (!conformchildren) return childs;
            return childs.filter((c) => (c.instanceof?.id) && conformchildren!.includes(c.instanceof?.id));
        }

        let bymetaparent: Dictionary<DocString<"metaparent pointer">, LValue[]> = {};
        for (let v of childs) {
            let vmeta = v.instanceof;
            // console.log("get features filtering:", {context, meta, vmeta, v, childs, conformchildren});

            if (conformchildren && (!vmeta || !conformchildren.includes(vmeta.id))) continue;
            let vmetaid: string = vmeta?.id as string; // undef as key is fine even if compiler complains, so i cast it
            if (!bymetaparent[vmetaid]) bymetaparent[vmetaid] = [v]; else bymetaparent[vmetaid as any].push(v);
        }
        // console.log("return get features:", {context, meta, childs, conformchildren, ret:Object.values(bymetaparent).flat()});
        return Object.values(bymetaparent).flat();
    }

    typeStr!:string; // derivate attribute, abstract
    typeString!:string; // derivate attribute, abstract
    __info_of__typeStr: Info = {type: ShortAttribETypes.EString, txt: <div>Alias of<i>this.typeString</i></div>}
    __info_of__typeString: Info = {type: ShortAttribETypes.EString, txt: <div>Stringified version of <i>this.type</i></div>}
    protected get_typeString(c: Context): string { return this.get_typeStr(c); }
    protected get_typeStr(c: Context): string {
        let thiss: GObject<this> = this as any;
        if (!thiss.get_instanceof) return 'shapeless';
        let meta: any = thiss.get_instanceof(c);
        return meta?.typeToShortString?.() || "shapeless";
    }

    __info_of__apply: Info = {type: 'Function(json) => this',
        txt: 'updates the current and subobjects according to the json content.' +
            '\nto update subelements use $[child-name] or their id as json key.'}
    __info_of__t2m: Info = this.__info_of__apply;

    public apply(json: GObject): this { this.cannotCall('LModelElement.apply'); return this; }
    public t2m(json: GObject): this { this.cannotCall('LModelElement.t2m'); return this; }

    public get_apply(c: Context): LObject['apply'] { return this.get_t2m(c); }
    // NB: only usable if this is LObject or LValue, make a fallback if this is model to create/recover a new root object
    public static maxDepth = 30;
    public get_t2m(c: Context): LObject['t2m'] {
        return (json: GObject, out_global_useless: {objectCreated: LObject[]} = {objectCreated: []}): this => {
            if (!LObject.maxDepth--) return c.proxyObject as this;
            TRANSACTION(this.get_name(c) + '.t2m()', ()=> {
                let l = c.proxyObject;
                let s = store.getState();
                if (!json) { Log.eDevv('t2m deletion still unsupported'); return this; }

                let childNames = this.get_childNames(c);
                let isPartial: boolean = false;
                switch (c.data.className) {
                    default: Log.ee('L'+c.data.className.substring(1)+'.t2m() todo, still unsupported.'); return this;
                    case 'DObject': isPartial = (this as any as LObject).get_partial(c); break;
                }
                console.log(c.data.className+'.t2m()  called.', {d: c.data, json});
                let fout : {featureCreated: LValue[], featureRemoved: Pointer<DValue>[]} = {featureCreated: [], featureRemoved: []};
                let newFeatures: Dictionary< Pointer | DocString<'feature.name'>, LValue> = {};
                // START: check if it's necessary to change type
                let parent = this.get_father(c);
                let validMatches: SchemaMatchingScore[] = (parent as LValue|LModel).instantiableClasses(json, true, undefined, undefined, false) as any;
                /*LValue.getInstantiableClasses(this, c maybe real problem here, json, true, undefined, undefined, false) as any;*/
                let bestmatch = validMatches[0];

                console.log('L'+c.data.className.substring(1)+'.t2m() change type', {bestmatch, validMatches, d: c.data, json});
                if ((c.data as DObject | DValue).instanceof !== bestmatch.id) {
                    if (bestmatch.instantiable) {
                        /* problema
                        ok, qui settare instanceof in lobject causa la creazione delle feature, ma solo al prossimo rerender.
                        adesso non ci sono, quindi verrebbero ricreate come shapeless nel PuntoB a doppio
                        invece dovrei crearle qui, tipizzate, e prevenire che vengano create quando setto set_instanceof?
                        maybe sta cosa va fatta non solo qui che setta object.instanceof ma dove dovrebbe settare value.instanceof
                        (che manca? dovrebbe almeno esistere perchè non viene settata in new)

                        post comment: forse ho risolto lasciandole creare a instanceof ma recuperandole per modificarle
                         */
                        (this).set_instanceof(bestmatch.id as Pointer<DClass>, c, fout);
                    } else {
                        // make a shapeless object
                        (this).set_instanceof(undefined, c);
                    }
                }
                //let lostFeatures: Dictionary< Pointer | DocString<'feature.name'>, LValue> = {}; should not be needed
                for (let lval of fout.featureCreated) {
                    let d = lval.__raw as DValue;
                    newFeatures[d.id] = lval;
                    newFeatures[d.name as string] = lval;
                }
                // END: check if it's necessary to change type

                // START: actually set the values
                for (let prefixed_k in json) {
                    let v = json[prefixed_k];
                    let isChildKey = TargetableProxyHandler.childKeys[prefixed_k[0]];
                    let k: string; // without $ or @ prefix
                    if (isChildKey) { k = prefixed_k.substring(1); }
                    else {
                        k = prefixed_k;
                        if (!(k in c.data) && k in childNames) isChildKey = true;
                        if (!(k in c.data) && k in newFeatures) isChildKey = true;
                    }
                    console.log(c.data.className+'.t2m() subkey', {isChildKey, k, v});

                    if (!isChildKey) {
                        console.log(c.data.className+'.t2m() set key', {k, k0: prefixed_k, isChildKey, json});
                        (l as any)[k] = v;
                    } else {
                        let isPointer = Pointers.isPointer(k);
                        let child: LValue = newFeatures[k] || (isPointer && L.from(k)) || (l as any)['$' + k];
                        if (!child && isPartial) {
                            let pointers: GObject = {father: c.data.id};
                            if (v.id) pointers.id = v.id;
                            child = (this as any as LObject).get_addValue(c, true)();//DValue.new3(pointers, ()=>{}, true);

                            console.log(c.data.className+'.t2m() add child value', {k, v});
                            // todo: support to create with correct pointer if the specified key is a pointer.
                        }
                        if (isPointer && (s.idlookup[k] as DValue)?.father !== c.data.id && s.idlookup[k].className === 'DValue') { // !!! NB: keep idloookup here, don't do D.from !!!
                            // if element was already existing and was identified by ptr, it might need to change parent.
                            // here child === L.from(s.idlookup[k]);
                            child.father = c.data.id as any; // SetFieldAction.new(k as Pointer, 'father', c.data.id, '', true);
                        }
                        //console.log(c.data.className+'.t2m() child_value.t2m()', {child, v});

                        child.t2m(v, out_global_useless);
                    }
                }


            })
            return c.proxyObject as this;
        }
    }



    // protected get_fromlclass<T extends keyof (LClass)>(meta: LClass, key: T): LClass[T] { return meta[key]; }
    protected get_model(context: Context): LModelElement["model"] {
        let l: LValue | LObject | LModel = context.proxyObject;
        while (l && l.className !== DModel.cname) l = l.father;
        return l as LModel; }
    // protected set_name(val: string, context: Context): boolean { return this.cannotSet("name"); }
    protected set_namespace(val: string, context: Context): boolean { return this.cannotSet("namespace"); }
    // protected get_namespace(context: Context): LClass["namespace"] { return context.proxyObject.instanceof.namespace; }
    protected set_fullname(val: string, context: Context): boolean { return this.cannotSet("fullname"); }
    // protected get_fullname(context: Context): LClass["fullname"] { return context.proxyObject.instanceof.fullname; }
    protected set_ecoreRootName(val: string, context: Context): boolean { return this.cannotSet("ecoreRootName"); }
    protected get_ecoreRootName(context: Context): LObject["ecoreRootName"] {
        let instanceoff: LClass | undefined = context.proxyObject.instanceof;
        if (!instanceoff) return "schemaless:Object";
        return this.get_uri(context) + ":" + instanceoff.name; // optimize later in instanceoff.namespace + ":" + instanceoff.name; and implement namespace all around
    }
    protected set_partialdefaultname(val: DClass["partialdefaultname"], context: Context): boolean { return this.cannotSet("DObject.partialdefaultname()"); }
    protected get_partialdefaultname(c: Context): DClass["partialdefaultname"] { return c.data.instanceof ? c.proxyObject.instanceof?.partialdefaultname || '' : "val_"; }
    protected set_partial(val: DObject["partial"], c: Context): boolean { SetFieldAction.new(c.data.id, 'partial', val, '', false); return true; }
    get_partial(c: Context): DClass["partial"] { // DClass["partial"] and not DObject because this one return is always bool, while dobject can be undef.
        if (!c.data.instanceof) return true;
        if (c.data.partial !== undefined) return c.data.partial;
        return c.proxyObject.instanceof?.partial || true;
    }

    /*    protected set_abstract(val: string, context: Context): boolean { return this.cannotSet("abstract"); }
        protected get_abstract(context: Context): LClass["abstract"] { return context.proxyObject.instanceof.abstract; }
        protected set_interface(val: string, context: Context): boolean { return this.cannotSet("interface"); }
        protected get_interface(context: Context): LClass["interface"] { return context.proxyObject.instanceof.interface; }*/
    protected set_defaultValue(val: string, context: Context): boolean { return this.cannotSet("defaultValue"); }
    protected get_defaultValue(context: Context): this["defaultValue"] { return context.proxyObject.instanceof?.defaultValue || []; }
    protected set_referencedBy(val: string, context: Context): boolean { return this.wrongAccessMessage("referencedBy cannot be set directly. It should be updated automatically as side effect"); }

    protected get_subObjects(context: Context): this["subObjects"] {
        let ref_features: LValue[] = this.get_referenceFeatures(context, false).filter( (f) => (f.instanceof as LReference)!.containment );
        let shapeless_features: LValue[] = this.get_shapelessFeatures(context);
        let vals: LObject[] = [
            ...ref_features.flatMap((f) => (f.values as LObject[])).filter((val)=>!!val),
            ...shapeless_features.flatMap((f) => (f.values as any))
                .filter((val)=>(!!val && val.className === DObject.cname)) as LObject[]
        ];
        return vals;
    }

    protected get_deepSubObjects(context: Context): this["deepSubObjects"] {
        let alreadyparsed: Dictionary<Pointer, LObject> = {};
        let arr: LObject[] = this.get_subObjects(context);
        while(arr.length) {
            let next: LObject[] = [];
            for (let obj of arr) {
                if (alreadyparsed[obj.id]) continue;
                alreadyparsed[obj.id] = obj;
                next.push(...obj.subObjects);
            }
            arr = next;
        }
        return Object.values(alreadyparsed) || [];
    }

    protected get_referenceFeatures(context: Context, includeshapeless: boolean = false): this["referenceFeatures"] {
        return context.proxyObject.features.filter((f) => (!f.instanceof ? includeshapeless : f.instanceof.className === DReference.cname));
    }
    protected get_attributeFeatures(context: Context, includeshapeless: boolean = false): this["attributeFeatures"] {
        return context.proxyObject.features.filter((f) => (!f.instanceof ? includeshapeless : f.instanceof.className === DAttribute.cname));
    }

    protected get_shapelessFeatures(context: Context): this["shapelessFeatures"] {
        return context.proxyObject.features.filter((f) => (!f.instanceof));
    }

    protected get_isRoot(context: Context): LObject["isRoot"] { return context.proxyObject.father.className === DModel.cname; }
    protected set_isRoot(val: never, context: Context): boolean { return this.wrongAccessMessage("isRoot cannot be set directly, change father element instead."); }

    public feature(name: string): (PrimitiveType|LObject)|(PrimitiveType|LObject)[] { this.cannotCall('feature'); return null; }
    private get_feature(context: Context): (name: string) => LValue["value"] | LValue["values"] {
        return (name: string) => {
            const lObject = context.proxyObject;
            const features = lObject.features.filter((value) => {
                return value.instanceof?.name === name
            });
            if(features.length > 0) {
                const matchedFeature = features[0];
                switch(matchedFeature.values.length) {
                    case 0: return '';
                    case 1: return matchedFeature.value;
                    default: return matchedFeature.values;
                }
            } return '';
        }
    }


    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        let asEcoreRoot = (context.proxyObject.isRoot);
        // todo: actually use this loopdetectionobj
        const json: GObject = {};
        if (asEcoreRoot) {
            console.log("generate object ecore", {context, asEcoreRoot, json});
            const lc = context.proxyObject.instanceof;
            json[ECorePackage.xmiversion] = '2.0';
            json[ECorePackage.xmlnsxmi] = 'http://www.omg.org/XMI';
            // json[ECorePackage.xmlnsxsi] = 'http://www.w3.org/2001/XMLSchema-instance';
            json["xmlns:" + ( lc ? (lc.father.uri + "." +lc.father.name) : "shapeless.model.uri")] = 'http://www.eclipse.org/emf/2002/Ecore';
        }

        let features = context.proxyObject.features || [];
        console.log("features", {features});
        for (let f of features) {
            if (!f) continue;
            let meta = f.instanceof;
            if (meta?.volatile) { continue; }
            (!json[f.name]) && (json[f.name] = f.generateEcoreJson(loopDetectionObj));
        }
        return json; }

    public addValue(name?: DValue["name"], instanceoff?: DValue["instanceof"], value?: DValue["values"], isMirage?: boolean): LValue { return this.cannotCall("addValue"); }
    public get_addValue(context: Context, isMirage: boolean = false): this["addValue"] {
        return (name?: DValue["name"], instanceoff?: DValue["instanceof"], value?: DValue["values"], isMirage?: boolean) => {
            return LPointerTargetable.fromD(DValue.new(name, instanceoff, value, context.data.id, true, isMirage));
        }
    }

    protected get_namespace(context: Context): string {
        return context.data.instanceof ? context.proxyObject.instanceof?.father.prefix || '' : "schemaless"; }
    protected get_uri(context: Context): string {
        if (!context.data.instanceof) return "schemaless";
        let pkg = context.proxyObject.instanceof!.father;
        return pkg.uri;// + "." + pkg.name;
    }
    // protected get_namespace(context: Context): string { if (!context.data.instanceof) return "schemaless"; return context.proxyObject.instanceof.namespace; }

    protected get_children_idlist(context: Context): Pointer<DAnnotation | DValue, 1, 'N'> {
        return [...super.get_children_idlist(context) as Pointer<DAnnotation | DValue, 1, 'N'>,
            ...context.data.features];
    }

    protected get_instanceof(context: Context): this["instanceof"] {
        const pointer = context.data.instanceof;
        return pointer && LPointerTargetable.from(pointer)
    }
    set_instanceof(val: LClass | DClass | Pointer<DClass> | undefined, c: Context, out?: {featureCreated: LValue[], featureRemoved: Pointer<DValue>[]}): boolean {
        if (Array.isArray(val)) return true;
        const metaptr: D["instanceof"] = Pointers.from(val as any) as Pointer<DClass>;
        if (metaptr === c.data.instanceof) return true;
        TRANSACTION(this.get_name(c)+'.instanceof', ()=>{
            this._removeConformity(c, out);
            SetFieldAction.new(c.data.id, "instanceof", metaptr, undefined, true);
            if (metaptr) {
                // update father's collections (pointedby's here are set automatically)
                SetFieldAction.new(metaptr as Pointer<DClass>, "instances", c.data.id, '+=', true);
                this._forceConformity(c, metaptr, out);
            }
        }, this.get_instanceof(c)?.fullname, LPointerTargetable.wrap(metaptr)?.fullname)
        return true;
    }

    private forceConformity(context: Context, meta: D["instanceof"]): void {
        let oldinstanceof = context.data.instanceof;
        // context.data.instanceof = meta;
        let ret = this._forceConformity(context, meta);
        // context.data.instanceof = oldinstanceof;
        return ret;
    }
    private _forceConformity(context: Context, meta: D["instanceof"], out?: {featureCreated: LValue[]}): void {
        let lmeta = meta && LPointerTargetable.wrap(meta) as this["instanceof"];
        if (!lmeta) return;
        let attrs = lmeta.allAttributes;
        let refs = lmeta.allReferences;
        let values: LValue[] = context.proxyObject.allChildren;
        let idmap: Dictionary<string, LAttribute | LReference> = {};
        for (let a of attrs) { idmap[a.id] = a; }
        for (let a of refs) { idmap[a.id] = a; }
        console.log({idmap, values, data: context.data, l:context.proxyObject});
        // damiano: todo quando viene cancellato una feature il puntatore in features e values rimane. use pointedby's
        // then remove attributes and references that are already instantiated in the object
        for (let v of values) { if(v && v.__raw.instanceof) delete idmap[v.__raw.instanceof]; }
        console.log("forceconformity", {attrs, refs, valuesPre: values.map(v => v && v.__raw.instanceof), toadd:idmap});
        for (let id in idmap) {
            // let l = idmap[id];
            let v = context.proxyObject.addValue(undefined, id, [], true);
            if (out) out.featureCreated.push(v);
        }
    }
    private _removeConformity(context: Context, out?: {featureRemoved: Pointer<DValue>[]}): void {
        let childs = context.proxyObject.features;
        for (let child of childs) if (child.isMirage) {
            if (out) out.featureRemoved.push(child.id);
            child.delete();
        }
    }


    protected get_delete(context: Context): () => void {
        return () => {
            let c: LClass | undefined = this.get_instanceof(context);
            if(c && c.isSingleton) {
                Log.ww('Object is a singleton and cannot be removed, remove his singleton flag in m2 first.', context.data);
                return;
            }
            super.get_delete(context)();
        }
    }
    protected get_features(context: Context): this['features'] {
        return this.get_children(context);
        // return context.data.features.map((feature) => { return LPointerTargetable.from(feature) });
    }

    public ecorePointer(): string { return this.cannotCall("ecorePointer"); }
    protected get_ecorePointer(context: Context): () => string {
        let lastvisited: Pointer<DObject, 1, 1, LObject> = context.data.id;
        return () => "@//" + this.get_fatherList(context).map( (f: LModelElement | LObject | LValue) => {
            if (f.className === DObject.cname) { lastvisited = (f as LObject).id; return ''; }
            if (f.className === DModel.cname) { return ''; }
            console.log("get_ecorepointer", f, f.__raw, lastvisited);
            return (f as LValue).name + "." + ((f as LValue).__raw.values.indexOf(lastvisited));
        }).filter(v=>!!v).join("@/");
    }

}
RuntimeAccessibleClass.set_extend(DNamedElement, DObject);
RuntimeAccessibleClass.set_extend(LNamedElement, LObject);

@Leaf
@RuntimeAccessible('DValue')
export class DValue extends DModelElement { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LValue;
    // static logic: typeof LModelElement;
    // static structure: typeof DValue;

    // inherit redefine
    id!: Pointer<DValue, 1, 1, LValue>;
    parent: Pointer<DObject, 0, 'N', LObject> = [];
    father!: Pointer<DObject, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    //name!: string; // nome opzionale solo per modelli schema-less//, ma se manca restsituisce 'DValue'

    // personal
    // value: PrimitiveType | Pointer<DObject, 1, 1, LObject>; // vv4
    // values: PrimitiveType[] | Pointer<DObject, 1, 'N', LObject> | Pointer<DEnumLiteral, 1, 'N', LEnumLiteral> = []; // vv4
    values: PrimitiveType[] | Pointer<DObject|DEnumLiteral, 1, 'N', LObject|LEnumLiteral> = [];
    instanceof!: Pointer<DAttribute, 1, 1, LAttribute > | Pointer<DReference, 1, 1, LReference> | undefined; // todo: maybe min lowerbound 0 if you want to allow free shape objects chiedere prof
    edges!: Pointer<DEdge, 0, 'N', LEdge>;
    // conformsTo!: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature>; // low priority to do: attributo fittizio controlla a quali elementi m2 è conforme quando viene richiesto
    isMirage!: boolean;
    allowCrossReference!: boolean;
    // IoT Section
    topic: string = '';

    public static new(name?: DNamedElement["name"], instanceoff?: DValue["instanceof"], val?: DValue["values"],
                      father?: DValue["father"] | DObject, persist: boolean = true, isMirage: boolean = false): DValue {
        let d_instanceof = D.wrap(instanceoff);
        if (!name) {
            if (d_instanceof) name = d_instanceof?.name || '';
            else if (!name) name = this.defaultname("property_", father);
        }
        return new Constructors(new DValue('dwc'), (typeof father === "string" ? father : (father as DObject)?.id), persist, undefined)
            .DPointerTargetable().DModelElement()
            .DNamedElement(name)
            .DValue(instanceoff, val, isMirage).end();
    }

    public static new3(a:Partial<ValuePointers>, then?:((d:DValue, c: Constructors)=>void), persist: boolean = true): DValue{
        let d_instanceof = D.wrap(a.instanceof);
        let name: string = a.name as any;
        if (!name) {
            if (d_instanceof) name = d_instanceof?.name || '';
            else if (!name) name = this.defaultname("property_", a.father);
        }

        return new Constructors(new DValue('dwc'), a.father, persist, undefined, a.id)
            .DPointerTargetable().DModelElement()
            .DNamedElement(name)
            .DValue(a.instanceof, a.values)
            .end(then);
    }
}
@RuntimeAccessible('LValue')
export class LValue<Context extends LogicContext<DValue> = any, C extends Context = Context, D extends DValue = DValue> extends LModelElement { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DValue;
    id!: Pointer<DValue, 1, 1, LValue>;

    // inherit redefine
    parent!: (LObject | LModel)[];
    father!: LObject | LModel;
    model!: LModel;
    // from namedelement
    name!: string;
    namespace!: string;
    fullname!:string;
    type!: LClassifier; // Classifiers describing PrimitiveTypes or the classes that can be pointed.
    primitiveType!: LClass;
    classType!: LClass;
    enumType!: LEnumerator;
// from structuralfeature (ref + attr)
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;
    allowCrossReference!: boolean;

    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    public derived!: boolean;
    defaultValue!: DStructuralFeature["defaultValue"];
    // defaultValueLiteral!: string;
    // target!: LClass[]; is value[]
    edges!: LEdge[];
    // IoT Section
    topic!: string;


    // personal
    value!: PrimitiveType | LObject | LEnumLiteral;
    isMirage!: boolean;
    // value!: PrimitiveType | LObject;
    values!: PrimitiveType[] | LObject[] | LEnumLiteral[];
    instanceof!: LAttribute | LReference | undefined;
    conformsTo!: (LAttribute | LReference)[]; // low priority to do: attributo fittizio controlla a quali elementi m2 è conforme quando viene richiesto


    length!: number;
    __info_of__length: Info = {type: 'number', txt: "shortcut for data.values.length."};
    get_length(c: Context): number{
        return this.get_values(c).length;
    }



    protected set___readonly(val: any, c: Context): boolean {
        val = !!val;
        if (val === !!c.data.__readonly) return true;
        super.set___readonly(val, c);
        let lref: LReference = this.get_instanceof(c) as LReference;
        if (!lref) return true;
        let dref = lref.__raw;
        if (dref.composition || dref.aggregation) for(let v0 of this.get_values(c)) {
            if (!v0) continue;
            let v: GObject = v0 as any;
            if (v.__isproxy) v.__readonly = val;
        }
        return true;
    }
    protected get_toPrimitive(c: Context): ()=>(string | number){
        return ()=>this.get_value(c) as any;
    }


// from reference
    container!: boolean;
    opposite?: LValue; // if DRef have opposite DRef, when you set a value ref you also set a opposite value ref from target to this src. they are always mirroring.
    containment!:boolean;
    aggregation!:boolean;
    composition!:boolean;
    upperbound!:boolean;
    lowerbound!:boolean;
    protected _defaultGetter(c: Context, k: string | number): any {
        if (k in c.data || typeof k === "symbol") return this.__defaultGetter(c, k);

        // get from values
        if (typeof k === "number") return this.get_values(c)[k];
        if (TargetableProxyHandler.childKeys[k[0]]) {
            k = k.substring(1);
            let vals: any[] = this.get_values(c);
            for (let v of vals) {
                if (!v) continue;
                let ret = v[k];
                if (ret !== undefined) return ret;
            }
        }

        // get from meta
        let getk = 'get_'+k;
        if (k in LReference.singleton || getk in LReference.singleton) return this.get_instanceof(c)?.[k as any];
        if (k in LAttribute.singleton || getk in LAttribute.singleton) return this.get_instanceof(c)?.[k as any];

        return this.__defaultGetter(c, k);
    }

    protected _defaultSetter(v: any, c: Context, k: keyof Context["data"] & string): true { //
        if (super._setterFor$stuff_canReturnFalse(v, c, k as string)) return true; // try setter for data.$feature = value; shortcut for data.$feature.value = value;
        this.__defaultSetter(v, c, k);
        return true;
    }

    __info_of__apply: Info = {type: 'Function(json) => this',
        txt: 'updates the current and subobjects according to the json content.' +
            '\nto update subelements use $[child-name] or their id as json key.'}
    __info_of__t2m: Info = this.__info_of__apply;

    public apply(json: GObject): this { this.cannotCall('LModelElement.apply'); return this; }
    public t2m(json: GObject, out: {objectCreated: LObject[]} = {objectCreated: []}): this { this.cannotCall('LModelElement.t2m'); return this; }

    public get_apply(c: Context): LValue['apply'] { return this.get_t2m(c); }
    // NB: only usable if this is LObject or LValue, make a fallback if this is model to create/recover a new root object
    public get_t2m(c: Context): LValue['t2m'] {
        return (json: GObject, out: {objectCreated: LObject[]} = {objectCreated: []}): this => {
            TRANSACTION(this.get_name(c) + '.t2m()', ()=>{
                console.log('L'+c.data.className.substring(1)+'.t2m() called.', {d:c.data, j:json});

                let json_4val!: GObject[];
                if (!json) { json = []; Log.eDevv('t2m deletion still unsupported'); return this; }
                switch (c.data.className) {
                    default: Log.ee('L'+c.data.className.substring(1)+'.t2m() todo, still unsupported.'); return this;
                    case 'DValue': json_4val = Array.isArray(json) ? json : [json]; break;
                }
                // let childNames = this.get_childNames(c);

                let m1: LModel = null as any;
                let m2: LModel = null as any;

                // filter typings
                let uniformedValues: (Pointer|PrimitiveType)[] = [];
                let type: LClassifier = (this as LValue).get_type(c);
                let validSubTypes: LClassifier[];
                let validTargets: (LObject|LEnumLiteral)[];
                const includeEnum: boolean = false;
                if (type?.className === 'DEnumerator') {
                    if (includeEnum) validSubTypes = [type];
                    else validSubTypes = [];
                    //validInstances = (type as LEnumerator).literals;
                } else {
                    if (!m1) m1 = this.get_model(c);
                    if (!m2) m2 = m1?.instanceof as LModel;
                    let dependencies = m2?.dependencies || [];
                    if (!type) {
                        validSubTypes = dependencies.flatMap(m=>m.classes).filter(c=>c.instantiable);
                        if (includeEnum) U.arrayMergeInPlace(validSubTypes, dependencies.flatMap(m=>m.enumerators));
                    } else {
                        validSubTypes = [type, ...(type as LClass).allSubClasses].filter(c=>c.instantiable);
                        // let validSubTypesPointers = validSubTypes.map(t=>t.id);
                        // let validInstances = m1.allSubObjects.filter(o => validSubTypesPointers.includes(o.type?.id));
                        // let linkedModels: LModel[] = dependencies.flatMap(m2=> m2.instances);
                        // let linkedModels_ptrs: Pointer<DModel>[] = linkedModels.map(m2=>m2.id);
                        // validInstances = validSubTypes.flatMap(e=>e.instances).filter(o => linkedModels_ptrs.includes(o.model.id));
                    }
                }
                const validSubTypesMap: Dictionary<Pointer, LClassifier> = {};
                for (let l of validSubTypes) validSubTypesMap[l.id] = l;

                console.log('L'+c.data.className.substring(1)+'.t2m() types found.', {d:c.data, j:json, validSubTypesMap, includeEnum, type});

                // START: actually set the values
                let i: number = -1;
                let oldValues: any[] = c.data.values; //this.get_values(c);
                for (let v of json_4val) {
                    ++i;
                    let child2: LObject | undefined = undefined;
                    if (!v) { uniformedValues.push(v); continue; }
                    let isPointer = Pointers.isPointer(v);
                    if (isPointer) { uniformedValues.push(v as Pointer); continue; }
                    let isD: boolean = !!(v.__isProxy || (v.className && v.id));
                    if (isD) { uniformedValues.push(v.id); continue; }
                    // if (typeof v === 'string') { set by $name but cannot happen in array? }
                    if (typeof v === 'object' && !Array.isArray(v)) {
                        if (v.id) {
                            child2 = L.fromPointer(v.id) || L.fromPointer(Pointers.prefix + v.id);
                        }
                        if (!child2 && v.name) {
                            child2 = (c.proxyObject as GObject<LValue>)['$'+v.name];
                        }
                        if (!child2) { // by index
                            if (Pointers.isPointer(oldValues[i])) {
                                child2 = L.fromPointer(oldValues[i]);
                            }
                        }

                        if (!child2) {
                            // create a subelement or update an existing one
                            let d = DObject.new3({id: v.id || undefined, father: c.data.id as Pointer<DValue>, 'instanceof': undefined}, ()=>{}, DValue);
                            console.log('L'+c.data.className.substring(1)+'.t2m() sub-object NEW', {d, v});
                            child2 = L.from(d); // (this as LValue).get_addObject(c)({});
                            if (!child2) continue;
                            out.objectCreated.push(child2);
                        }
                        uniformedValues.push(child2.id);
                        /*
                        let validMatches: SchemaMatchingScore[] = LValue.getInstantiableClasses(this,
                            c/*maybe problem here* /, v, true, undefined, undefined, false) as any;
                        validMatches = validMatches.filter(m => !!validSubTypesMap[m.id]);
                        let type: Pointer<DClass> | undefined = validMatches[0]?.instantiable ? validMatches[0].id as Pointer<DClass> : undefined;
                        if (type) child2.instanceof = type;
                        if (type) (LObject.singleton as LObject).set_instanceof(type, new LogicContext(d, child2) as any, fout);
                        */
                    }
                    else { uniformedValues.push(v as any as PrimitiveType); }
                    console.log('L'+c.data.className.substring(1)+'.t2m() sub-object t2m', {child2, v});

                    if (child2) {
                        // done in setvalues if (this.get_isContainment(c) && child2.__raw.father !== c.data.id) child2.father = c.data.id as any;
                        child2.t2m(v);
                    }
                }
                this.set_values(uniformedValues, c);

            })
            return c.proxyObject as this;
        }
    }


    protected get_derived(c: Context): this["derived"] { return (this.get_instanceof(c) as LReference).derived; }/*
    protected get_derived_read(c: Context): this["derived_read"] { return (this.get_instanceof(c) as LReference).derived_read; }
    protected get_derived_write(c: Context): this["derived_write"] { return (this.get_instanceof(c) as LReference).derived_write; }*/
    protected set_derived(val: this["derived"], context: Context): boolean { return this.cannotSet('LValue.derived'); }/*
    protected set_derived_read(val: this["derived_read"], context: Context): boolean { return this.cannotSet('LValue.derived_read'); }
    protected set_derived_write(val: this["derived_write"], context: Context): boolean { return this.cannotSet('LValue.derived_write'); }*/

    add(...val: any[]): void { return this.cannotCall("LValue.add"); }
    __info_of__add: Info = {type: "(...val: any|any[]) => void", txt: "Adds a value in the current value collection"}
    get_add(c: Context): (...val: any[] | this["values"])=>void{
        return (...val: any[] | this["values"]) => { this.set_values([...c.data.values, ...val.map(v => v?.id || v)], c); }
    }

    // if an element is contained twice and removed once, only 1 is removed. [1, 2, 2, 2, 3] - [2, 2] = [1, 2, 3]
    remove(...val: any[]): void{ return this.cannotCall("LValue.remove"); }
    __info_of__remove: Info = {type: "(...val: any) => void", txt: "Deletes a value in the current value collection, or none if the element is not found."}
    get_remove(c: Context): (...val: this["values"])=>void {
        return (...val: any[] | this["values"]) => {
            val = val.map(v => v?.id || v);
            let indices = [];
            let values = c.data.values;
            for (let i = 0; i < values.length; i++) {
                if (val.includes(values[i])) indices.push(i);
            }
            this.get_removeByIndex(c)(...indices); }
    }
    removeByIndex(...val: number[]): void{ return this.cannotCall("LValue.removeByIndex"); }
    __info_of__removeByIndex: Info = {type: "(...indices: number) => removed[]", txt: "Deletes a value in the current value collection, or none if the element is not found."}
    get_removeByIndex(c: Context): (...indices: number[])=>void{ return (...indices: number[]) => {
        // reducer is ill-typed, so must force typings
        const indexMap: GObject = indices.reduce<GObject|number>(((accumulator: GObject, currentValue: number) => { accumulator[currentValue] = true; return accumulator;}) as any, {} as GObject) as any;
        this.set_values(c.data.values.filter((v,index) => !indexMap[index]), c);
        // this.set_values(c.data.values.filter((v,index) => indices.includes(index)));
    }
    }

    instantiableClasses(o?: GObject, loose: boolean = false, eligibleClasses?: LClass[], favoriteMatch?: LClass, allowNotInstantiables: boolean = true):LClass[] { return this.cannotCall("instantiableClasses"); }
    __info_of__instantiableClasses: Info = {type: "(o?: object, loose?: boolean) => LClass[]",
        txt: "List of all subclasses of the specified type, which can be used as reference values." +
            "\n<br>Abstract and Interface classes are excluded." +
            "\n<br>If the parameter \"o\" is specified, it will filter only the instances conforming to the object schema." +
            "\n<br>Results are sorted from tightest fit to loosest fit." +
            "\n<br>loose parameter set to true makes return instead a list of matching scores of all subclasses.", hidden: true}

    // warning: this can be called through model, c.data might be either a value or a model.
    get_instantiableClasses(c: Context): this["instantiableClasses"] {
        return (o?: GObject, loose: boolean = false, eligibleClasses?: LClass[], favoriteMatch?: LClass, allowNotInstantiables: boolean = true) =>
            LValue.getInstantiableClasses(this, c, o, loose, eligibleClasses, favoriteMatch, allowNotInstantiables); }


    // @eligibleClasses: search only between those targets.
    // @favoritematch: if this class is a valid match, it is given topmost priority regardless of tightness of excess features over the schema.
    // if a class name actually starts with $ character, it needs to be placed twice to get a match, as in class.$$name
    public static getInstantiableClasses(thiss: GObject<LValue|LModel>, c: LogicContext<DValue> | LogicContext<DModel>,
                                         schema?: GObject, loose: boolean = false, eligibleClasses?: LClass[], favoriteMatch?: LClass, allowNotInstantiables: boolean = true): LClass[] {
        // find eligible classes
        let isDValue: boolean =  c.data.className === "DValue";
        let isDModel: boolean =  c.data.className === "DModel";
        let allowCrossRef: boolean;
        let m1: LModel | undefined;
        let m2: LModel | undefined;
        let dval: DModel | DValue = c.data;
        /*if (isDValue) */allowCrossRef = (dval as DValue).allowCrossReference;
        /*else*/ if (isDModel) {
            if (!m1) m1 = (thiss as any).get_model(c);
            if (!m2) m2 = m1?.instanceof;
            allowCrossRef = (dval as DModel).dependencies?.length > 0;
        }
        let isShapeless = !c.data.instanceof;
        let type: LClass | undefined = isShapeless || !isDValue ? undefined : thiss.get_type(c) as LClass;
        let isReference = !!type && type.className === "DClass";
        if (isDValue && !isReference && !isShapeless) return []; // case DValue<Attribute>
        if (!eligibleClasses) {
            if (isReference && !isShapeless) { eligibleClasses = [type as LClass, ...(type as LClass).allSubClasses]; }
            // @ts-ignore
            else {
                if (!m1) m1 = (thiss as any).get_model(c);
                if (!m2) m2 = m1?.instanceof;
                if (allowCrossRef) eligibleClasses = m2?.crossClasses || [];
                else eligibleClasses = m2?.classes || []; }
        }
        let scoreMap: Dictionary<Pointer, SchemaMatchingScore> = {};
        for (let c of eligibleClasses) {
            let raw = c.__raw as DClass;
            let instantiable = !(raw.abstract || raw.interface || raw.isSingleton);
            // if (!loose && instantiable) return false;
            if (scoreMap[raw.id]) continue;
            else if (!allowNotInstantiables && !instantiable) continue;
            else scoreMap[raw.id] = {class:c, instantiable, isPartial: raw.partial} as any;
        }
        if (schema) {
            // const fix$ = (vals: string[]) => vals.map(v=> (TargetableProxyHandler.childKeys[k[0]]) ? v.substring(1) : v);
            const fix$ = (obj: GObject) => {
                let ret: GObject = {};
                for (let k in obj) {
                    let k1 :string = (TargetableProxyHandler.childKeys[k[0]]) ? k.substring(1) : k;
                    ret[k1] = obj[k];
                }
                return ret;
            }
            schema = fix$(schema);
            let keys: string[] = Object.keys(schema);
            for (let ptr in scoreMap) {
                let score = scoreMap[ptr];
                let childNameArr = score.class.childNames;
                score.namesMap = U.objectFromArrayValues(childNameArr);
                let diff = Uobj.objdiff(score.namesMap, schema);
                console.log( "objDiff", {schema, names:score.namesMap, data:score.class});
                score.id = ptr;
                score.excessFeatures = diff.removed;
                score.missingFeatures = diff.added;
                score.matchingFeatures = {...diff.changed, ...diff.unchanged};
                score.excessFeaturesCount = Object.keys(score.excessFeatures).length;
                score.missingFeaturesCount = Object.keys(score.missingFeatures).length;
                score.matchingFeaturesCount = Object.keys(score.matchingFeatures).length;
                let scoretmp: number = 1;
                if (childNameArr.length) scoretmp -= score.missingFeaturesCount / childNameArr.length;
                if (keys.length) scoretmp -= score.excessFeaturesCount / keys.length;
                score.score = Math.round(((score.instantiable ? 0 : -1) + scoretmp)*100)/100;
            }
        }
        let sorted = Object.values(scoreMap);
        if (!loose) sorted = sorted.filter((s) => s.instantiable && (!s.missingFeaturesCount || s.isPartial));
        let favoriteMatchID: undefined | Pointer = favoriteMatch?.id;
        sorted = sorted.sort((a, b): number => {
            // return negative if a is less than b, positive if a is greater than b, and zero if they are equal.
            // but since default order is ascending and i want descending, o reverse it.
            if (a.instantiable && !b.instantiable) return -1;
            if (!a.instantiable && b.instantiable) return +1;
            if (a.missingFeaturesCount === 0 && b.missingFeaturesCount === 0) { // = 100% match case (might have excess, take tighter)
                // only if they are both valid full matches, explicit preference takes precedence. then tightness.
                if (a.id === favoriteMatchID) return -1;
                if (b.id === favoriteMatchID) return +1;
                if (a.matchingFeaturesCount !== b.matchingFeaturesCount) return -a.matchingFeaturesCount + b.matchingFeaturesCount;
                if (a.excessFeaturesCount !== b.excessFeaturesCount) return +a.excessFeaturesCount - b.excessFeaturesCount;
            }
            // < 100% match, but might be valid for partial classes.
            if (a.isPartial && !b.isPartial) return -1;
            if (!a.isPartial && b.isPartial) return +1;
            if (a.isPartial && b.isPartial) {
                // only if they are both valid partial matches, explicit preference takes precedence. then tightness.
                if (a.id === favoriteMatchID) return -1;
                if (b.id === favoriteMatchID) return +1;
            }
            // if both partials or none is partial
            // if (a.missingFeaturesCount !== b.missingFeaturesCount) return -a.missingFeaturesCount + b.missingFeaturesCount; should be same as matchingFeaturesCount
            if (a.matchingFeaturesCount !== b.matchingFeaturesCount) return -a.matchingFeaturesCount + b.matchingFeaturesCount;
            if (a.excessFeaturesCount !== b.excessFeaturesCount) return +a.excessFeaturesCount - b.excessFeaturesCount;
            return 0;
        });
        if (loose) return sorted as any;
        return sorted.map(score => score.class);
    }

    addObject(json?: GObject, metaclass: LClass | Pointer<DClass> | DocString<"ClassName"> | undefined | null = undefined): LObject{ return this.cannotCall("LValue.addObject"); }
    __info_of__addObject: Info = {type: "(json: object, instanceof?: LClass | string | null) => LObject",
        txt: "Appends an object instancing \"instanceof\" to the values.\n<br>Setting his own properties, and DValues according to the content of the parameter object.\n<br>" +
            "If instanceof is:<ul><li><b>a class or a class name</b>, it will instance that class, or a valid non-abstract subclass." +
            "\n<br/><b>null</b>, it will instantiate a shapeless object." +
            "\n<br/><b>undefined or missing</b>, it will first try to find a valid type in m2 or fail.</ul"}

    // warning: this can be called through model, c.data might be either a value or a model.
    /*
    @param metaclass: null means "shapeless", undefined means automatic or failure, never shapeless.
    type assignment priority:
    1) by explicit type argument
    1.1) treating it as a pointer
    1.2) treating it as a $class_name
    1.3) treating it as a DClass
*/
    public get_addObject(c: LogicContext<DValue> | LogicContext<DModel>): (json: GObject, metaclass?: Pack1<LClass> | DocString<"ClassName"> | null, forceCreation?:boolean)=>LObject{
        return (json: GObject = {}, metaclass: Pack1<LClass> | DocString<"ClassName"> | undefined | null = undefined, forceCreation:boolean = false): LObject => {
            let lobj: LObject = undefined as any;
            let father: Pointer<DValue> | Pointer<DModel> = '';
            let isDValue = c.data.className === "DValue";
            let isDModel = c.data.className === "DModel";

            TRANSACTION(this.get_name(c as any)+'.addObject()', () => {
                let instanceoff: undefined | LAttribute | LReference = isDValue ? this.get_instanceof(c as Context) : undefined;
                let dinstanceoff: undefined | DAttribute | DReference = instanceoff && instanceoff.__raw;
                // let ShapelessObjectID =
                let isShapeless: boolean = !dinstanceoff; // || dinstanceoff && ((dinstanceoff?.id | dinstanceoff) === ShapelessObjectID);
                let isReference: boolean = !!(dinstanceoff && dinstanceoff.className === "DReference");
                if (isDValue && !isReference && !isShapeless) return Log.ee("cannot call addObject() on a DValue implementing an attribute", {dinstanceoff, thiss:c.data});
                let isContainment: boolean = (isDValue && this.get_containment(c as Context)) || isDModel;
                // if (metaclass === undefined) metaclass = "object"; // in this case, i first check if a class "object" exist, then make a shapeless object if not.
                let state: DState = store.getState();

                father = isContainment ? c.data.id : this.get_model(c).id;
                let constructorPointers: Partial<ObjectPointers> = {...json, father};

                // if undefined = explicitly told to make it shapeless. if null, it's automatic selectyion by value.type or m2-model classes.
                //console.log('Object.new3', {metaclass, forceCreation, json});
                if (metaclass !== null) {
                    let lmetaclass: LClass | undefined;
                    // find instance schema: 1) by explicit type argument
                    if (metaclass) {
                        // find instance schema: 1.1) by pointer AND 1.3) by Dclass
                        lmetaclass = LPointerTargetable.from(metaclass, state);
                        // find instance schema: 1.2) by $class_name
                        if ((!lmetaclass || lmetaclass.className !== "DClass") && typeof metaclass === "string") {
                            let m2classes = c.proxyObject.model?.instanceof?.classes;
                            if (m2classes) lmetaclass = LPointerTargetable.from(m2classes["$" + metaclass] || m2classes[metaclass], state);
                            // if (!lmetaclass && typeof metaclass === "string" && metaclass.toLowerCase() === "object") lmetaclass = undefined;
                        }
                        //(window as any).debugg = LValue.getInstantiableClasses(this, c, json, true, lmetaclass ? [lmetaclass, ...lmetaclass.allSubClasses] : []);
                        // check if metaclass is found
                        if (!lmetaclass || lmetaclass.className !== "DClass") return Log.ee("provided schema type does not belong to a Class, cannot intantiate.", {lmetaclass, schema:metaclass, this:c.data});
                        // check if metaclass is valid (instantiable in the callee collection: .values or .objects)
                        // console.log("isExtending", {lmetaclass, type: isDValue && this.get_type?.(c as any)});
                        if (isDValue && !lmetaclass.isExtending(this.get_type(c as Context) as LClass)) return Log.ee("provided schema type does not extend this.type, cannot intantiate.", {lmetaclass, schema:metaclass, this:c.data});
                    }
                    // find instance schema: 2) by dvalue.type
                    else if (isDValue && !isShapeless) {
                        lmetaclass = this.get_type(c as Context) as LClass;
                    }
                    // phase 2: using lmetaclass (if found), i set constructorPointers.instanceof
                    // if requested type is found. but might be abstract, so i filter the best subclass match
                    if (lmetaclass) {
                        if (forceCreation && metaclass) {
                            constructorPointers.instanceof = (typeof metaclass === 'string' ? metaclass : (metaclass as any).id);
                        }
                        else {
                            constructorPointers.instanceof = LValue.getInstantiableClasses(this, c, json, false,
                                [lmetaclass, ...lmetaclass.allSubClasses], lmetaclass)[0] as any; // actually a L-class, but "ObjectPointers" can accept them too.
                        }
                        if (!constructorPointers.instanceof) { // the whole if is just printing error.
                            let matches = LValue.getInstantiableClasses(this, c, json, true, [lmetaclass, ...lmetaclass.allSubClasses]);
                            if (lmetaclass?.isSingleton) Log.ee("addObject(schema) cannot instantiate " + metaclass + " because it is a singleton.", {json, matches, this: c.data});
                            return Log.ee("addObject(schema) could not find a valid subtype of " + metaclass +
                                " conforming ot that schema to instantiate an object.\n" + (matches.length ? "closest match was: " + matches[0].name : ""),
                                {json, matches, this: c.data});
                        }
                    }
                    // if not found, i look among all m2classes
                    else if (!isDValue || isShapeless) {
                        // if shapelessvalue.addObject() --> infer schema from json keys and ref sub-types best match
                        // if model.addObject() --> find best match within all classes
                        (window as any).debugg = this.get_model(c).instantiableClasses(json, true);
                        constructorPointers.instanceof = this.get_model(c).instantiableClasses(json, false)[0] as any // actually a L-class, but "ObjectPointers" can accept them too.
                        if (!constructorPointers.instanceof) { // the whole if is just printing error.
                            let matches = isDValue ? this.get_instantiableClasses(c as Context)(json, true) : this.get_model(c).instantiableClasses(json, true);
                            let type: LClassifier = isDValue ? this.get_type(c as Context) : undefined as any;
                            return Log.ee("LValue.addObject(schema) could not find a valid " + (c.data.className === "DValue" ? "subtype of " + type.name : "type") +
                                " conforming ot that schema to instantiate an object.\n" + (matches.length ? "closest match was: " + (matches[0] as any)?.class.name : ""), {json, type, matches, thiss: c.data});
                        }
                    }
                    if (!constructorPointers.instanceof && isDValue && !isShapeless) {
                        return Log.ee("could not find an instantiable subtype for given schema and type " + instanceoff?.type?.name, {schema: json, type: instanceoff?.type})
                    }
                }
                // both dmodel.objects nad dvalue.values are updated by the Constructors by passing father parameter.
                // phase 3: create object according to schema (or shapeless) and update parent container collection.
                console.log("Object.new3", {constructorPointers});
                if (!constructorPointers.name && constructorPointers.instanceof){
                    let meta = L.from(constructorPointers.instanceof) as LClass;
                    if (meta.isSingleton){ constructorPointers.name = meta.name; }
                }
                let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);
                if (isReference && !isContainment){
                    // if is ref containment, object.father is set to value, which also appends the object to this.values
                    // if it's model, object.father = model, and it goes in model.objects and not in values.
                    // if it's non-containment value, it goes in model but also appended to this.values
                    // ? if schemaless acts like a containment ref so still fine ?
                    this.set_values([...(c as Context).data.values, dobj.id], c as Context)
                }
                // phase 4: set sub-DDalues.values according to json data provided, or create them if they were missing in partial class match.
                lobj = LPointerTargetable.fromD(dobj);
                let dobjkeys = Object.keys(dobj);

                // update lmetaclass from candidate root, to selected instance (sub-type)
                let lmetaclass: LClass | undefined = constructorPointers.instanceof && LPointerTargetable.wrap(constructorPointers.instanceof);
                let isPartial: boolean = !!lmetaclass?.partial;
                let childnames: Dictionary<string> = lmetaclass ? U.objectFromArrayValues(lmetaclass.childNames) : {};
                // because at current time Constructor.setPtr actions are not executed yet. so dobject.features is empty, even through LPoint.from(valueid) canaccess the "pending" local dvalue not in store.
                setTimeout(()=>TRANSACTION(this.get_name(c as any)+'.addObject() initializing values', ()=>{
                    for (let key in json) {
                        if (TargetableProxyHandler.childKeys[key[0]]) { // if $ is prepended, priority is first and only child values check
                            if (key in childnames) { // if child dvalue with that name including char $ exist, like in "$" + "$name"
                                (lobj as GObject<LObject>)["$" + key].values = json[key];
                                continue;
                            }
                            let key1 = key.substring(1);
                            if (key1 in childnames) { // if child dvalue with that name excluding char $ exist, like in "$" + "name" (as normal)
                                (lobj as GObject<LObject>)["$" + key1].values = json[key];
                                continue;
                            }
                            // if child dvalue with that name do not exist
                            if (isShapeless || isPartial) { lobj.addValue(key, undefined, json[key], false); continue; }
                            // this should never happen, if there is a mismatch in finding the correct type conforming to the schema, the function should have already stopped and returned before.
                            Log.eDevv('addObject(schema) error: cannot find value collection named "' + key + ' " as defined in the schema parameter.',
                                {lmetaclass, this:c.data, instanceof: constructorPointers.instanceof});
                            continue;
                        }
                        // if $ is NOT prepended, priority is inverted: first DObject properties, then child values
                        if (key in dobjkeys) { (lobj as GObject<LObject>)[key] = json[key]; continue; }
                        else {
                            // redoing the whole childmatch attempt for shaped and shapeless, when first char is not $, as a fallback.
                            if (key in childnames) { // if child dvalue with that name excluding char $ exist, like in "$" + "name" (as normal)
                                let feature = (lobj as GObject<LObject>)["$" + key];
                                // console.log("get_addObject() adding values", {lobj, key, feature, json, childnames, d:constructorPointers.instanceof});
                                feature.values = json[key];
                                continue;
                            }
                            else if (isShapeless || isPartial) { lobj.addValue(key, undefined, json[key], false); continue; }
                            Log.eDevv('addObject(schema) error: cannot find value collection named "' + key + ' " as defined in the schema parameter.',
                                {lmetaclass, this:c.data, instanceof: constructorPointers.instanceof, dobjkeys});
                            continue;
                        }
                    }
                }), UpdatingTimer * 2);
            });
            return lobj;
        }
    }


    protected get_edges(context: Context): this["edges"] { return LPointerTargetable.fromPointer(context.data.edges) || []; }
    protected get_fromlfeature<C, T extends keyof (NonNullable<C>)>(meta: C, key: T): NonNullable<C>[T] { return meta ? (meta as any)[key] : undefined as any; }
    protected get_opposite(context: Context): LReference["opposite"] { return this.get_fromlfeature(context.proxyObject.instanceof as LReference, "opposite"); }
    protected get_container(context: Context): LReference["container"] { return this.get_fromlfeature(context.proxyObject.instanceof as LReference, "container"); }
    protected get_isContainment(c: Context): LReference["containment"] { return this.get_containment(c); }
    protected get_containment(context: Context): LReference["containment"] {
        let iof = context.proxyObject.instanceof;
        if (!iof) return true; // shapeless
        return this.get_fromlfeature(iof as LReference, "containment"); }
    // protected get_defaultValueLiteral(context: Context): LStructuralFeature["defaultValueLiteral"] { return this.get_fromlfeature(context.proxyObject.instanceof, "defaultValueLiteral"); }
    protected get_defaultValue(context: Context): LStructuralFeature["defaultValue"] { return this.get_fromlfeature(context.proxyObject.instanceof, "defaultValue"); }
    protected get_defaultderived(context: Context): DStructuralFeature["derived"] { return this.get_fromlfeature(context.proxyObject.instanceof, "derived"); }
    protected get_defaultunsettable(context: Context): LStructuralFeature["unsettable"] { return this.get_fromlfeature(context.proxyObject.instanceof, "unsettable"); }
    protected get_defaulttransient(context: Context): LStructuralFeature["transient"] { return this.get_fromlfeature(context.proxyObject.instanceof, "transient"); }
    protected get_isVolatile(c: Context): LReference["volatile"] { return this.get_volatile(c); }
    protected get_volatile(context: Context): LStructuralFeature["volatile"] { return this.get_fromlfeature(context.proxyObject.instanceof, "volatile"); }
    protected get_isChangeable(context: Context): LStructuralFeature["changeable"] { return this.get_changeable(context); }
    protected get_changeable(context: Context): LStructuralFeature["changeable"] { return this.get_fromlfeature(context.proxyObject.instanceof, "changeable"); }
    protected get_isRequired(context: Context): LStructuralFeature["required"] { return this.get_required(context); }
    protected get_required(context: Context): LStructuralFeature["required"] { return this.get_fromlfeature(context.proxyObject.instanceof, "required"); }
    protected get_isUnique(context: Context): LStructuralFeature["unique"] { return this.get_unique(context); }
    protected get_unique(context: Context): LStructuralFeature["unique"] { return this.get_fromlfeature(context.proxyObject.instanceof, "unique"); }
    protected get_isMany(context: Context): LStructuralFeature["many"] { return this.get_many(context); }
    protected get_many(context: Context): LStructuralFeature["many"] { return this.get_fromlfeature(context.proxyObject.instanceof, "many"); }
    protected get_upperBound(context: Context): LStructuralFeature["upperBound"] { return this.get_fromlfeature(context.proxyObject.instanceof, "upperBound"); }
    protected get_lowerBound(context: Context): LStructuralFeature["lowerBound"] { return this.get_fromlfeature(context.proxyObject.instanceof, "lowerBound"); }
    protected get_ordered(context: Context): LStructuralFeature["ordered"] { return this.get_fromlfeature(context.proxyObject.instanceof, "ordered"); }
    protected get_enumType(context: Context): LStructuralFeature["enumType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "enumType"); }
    protected get_classType(context: Context): LStructuralFeature["classType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "classType"); }
    protected get_primitiveType(context: Context): LStructuralFeature["primitiveType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "primitiveType"); }
    get_type(context: Context): LStructuralFeature["type"] { return this.get_fromlfeature(context.proxyObject.instanceof, "type"); }
    // protected get_fullname(context: Context): LStructuralFeature["fullname"] { return this.get_fromlfeature(context.proxyObject.instanceof, "fullname"); }
    protected get_namespace(context: Context): LStructuralFeature["namespace"] { return this.get_fromlfeature(context.proxyObject.instanceof, "namespace"); }
    protected get_name(context: Context): LStructuralFeature["name"] { return context.data.instanceof ? this.get_fromlfeature(context.proxyObject.instanceof, "name") : context.data.name || ''; }

    protected get_instanceof(context: Context): this["instanceof"] {
        const pointer = context.data.instanceof;
        if (!pointer) return undefined;
        return LPointerTargetable.from(pointer)
    }
    set_instanceof(val: Pack1<this["instanceof"]>, c: Context): boolean {
        // const list = val.map((lItem) => { return Pointers.from(lItem) });
        let ptr = Pointers.from<DNamedElement>(val as any);
        if (ptr === c.data.instanceof) return true;
        TRANSACTION(this.get_name(c)+'.instanceof', ()=>{
            SetFieldAction.new(c.data, 'instanceof', ptr, "", true);
        }, this.get_instanceof(c)?.fullname, LPointerTargetable.wrap(ptr)?.fullname)
        return true;
    }

    protected get_isMirage(context: Context): this["isMirage"] { return !!context.data.isMirage; }
    protected set_isMirage(val: this["isMirage"], c: Context): boolean {
        val = !!val;
        if (val === !!c.data.isMirage) return true;
        TRANSACTION(this.get_name(c)+'.isMirage', ()=>{
            SetFieldAction.new(c.data, 'isMirage', val, "", false);
        }, c.data.isMirage, val)
        return true;
    }

    typeStr!:string; // derivate attribute, abstract
    typeString!:string; // derivate attribute, abstract
    __info_of__typeStr: Info = {type: ShortAttribETypes.EString, txt: <div>Alias of<i>this.typeString</i></div>}
    __info_of__typeString: Info = {type: ShortAttribETypes.EString, txt: <div>Stringified version of <i>this.type</i></div>}
    protected get_typeString(c: Context): string { return this.get_typeStr(c); }
    // @ts-ignore
    protected get_typeStr(c: Context): string { return LObject.singleton.get_typeStr.call(this, c); }

    // individual value getters
    // if withMetaInfo, returns a wrapper for the first non-empty value found containing his index and metainfo
    protected get_value<T extends boolean>(context: Context, namedPointers: boolean = false, ecorePointers: boolean = false,
                                           shapeless: boolean = false, keepempties: boolean = true, withmetainfo: T = false as T): T extends true ? ValueDetail : this["value"]{
        return this.get_values(context, true, namedPointers, ecorePointers, shapeless, keepempties, withmetainfo, 1)[0] as any;
    }
    public getValue<T extends boolean>(namedPointers: boolean = false, ecorePointers: boolean = false, shapeless: boolean = false, keepempties: boolean = true,
                                       withmetainfo: T = false as T): T extends true ? ValueDetail : this["value"]{ return this.cannotCall("getValue"); }
    protected get_getValue(context: Context): this["getValue"] {
        return function (namedPointers: boolean = false, ecorePointers: boolean = false, shapeless: boolean = false,
                         keepempties: boolean = true, withmetainfo: boolean = false) {
            return LValue.prototype.get_value(context, namedPointers, ecorePointers, shapeless, keepempties, withmetainfo) as any;
        }
    }

    // multiple value getters
    protected get_values<T extends boolean>(context: Context, fitSize: boolean = true, namedPointers: boolean = false, ecorePointers: boolean = false,
                                            shapeless: boolean = false, keepempties: boolean = true, withmetainfo?: T, maxlimit?: number,
                                            solveLiterals: "ordinals" | "literal_obj" | "literal_str" | "original" = "literal_obj")
        : (T extends undefined ? this["values"] : T extends false ? this["values"] : ValueDetail[]) & {type?: string}  {
        const ldata = context.proxyObject;
        const ddata = context.data;
        let typestr: string = this.get_typeString(context);
        let ret: any[];

        if (ddata.topic) {/*
            let value: any = store.getState()['topics'];
            const path = data.topic.split('.');
            for(const field of path) value = value[field];
            let ret: any = [value];*/
            const topics = store.getState()['topics'];
            const val = U.extractValueFromTopic(topics, ddata.topic);
            ret = Array.isArray(val) ? val : [val];
            //return ret;
        }
        else ret = [...ddata.values];
        (ret as any).type = typestr; // 'topic';

        let meta: LAttribute | LReference | undefined = shapeless ? undefined : ldata.instanceof;
        let dmeta: undefined | DAttribute | DReference = meta?.__raw;

        // if (meta && meta.className === DReference.name) ret = LPointerTargetable.fromArr(ret as DObject[]);


        if (dmeta?.derived) {
            let td = transientProperties.modelElement[dmeta.id];
            if (!td.derived_read) {
                try {
                    let txt = dmeta.derived_read || '(data, originalValues)=>{return originalValues}';
                    // data.derived examples: '(d, o)=>3', '(ddd, ooo)=>{return 3}',
                    td.derived_read = new Function('data, originalValues', 'return ('+txt+')(data, originalValues)') as Function2;
                }
                catch (error: any) {
                    Log.ee('invalid derived (get) attribute expression: ' + dmeta.name, {error, derivedText:dmeta.derived_read});
                }
                if (td.derived_read) try {
                    ret = td.derived_read(ldata, ret);
                    if (ret === undefined) ret = [];
                    if (!Array.isArray(ret)) ret = [ret];
                }
                catch (error: any) {
                    Log.ee('Error during derived (get) attribute evaluation: ' + dmeta.name, {error, derivedText:dmeta.derived_read});
                }
            }
        }


        (ret as GObject).type = typestr;
        if (!Array.isArray(ret)) ret = [];
        if (dmeta && fitSize && ret.length < dmeta.lowerBound && dmeta.lowerBound > 0) {
            let times = dmeta.lowerBound - ret.length;
            while (times-- > 0) ret.push(undefined);
            // ret.length = meta.lowerBound; not really working for expanding, it says "emptyx10" or so. doing .map() only iterates "existing" elements. behaves like as it's smaller.
        }
        if (maxlimit !== undefined) ret.length = maxlimit;
        else if (dmeta && fitSize && ret.length > dmeta.upperBound && dmeta.upperBound >= 0) ret.length = dmeta.upperBound;

        // console.log("get_values sizefixed", {fitSize, arguments, upperbound:dmeta?.upperBound, lowerbound: dmeta?.lowerBound, len: ret.length, len0: context.data.values.length});
        let numbermax = 0, numbermin = 0, round = true;
        // ret is always an array of raw values before this point, eventually padded with lowerbound or trimmed at upperbound

        let index = 0;
        if (withmetainfo) { ret = ret.map(r => {return {value:r, rawValue: r, index: index++, hidden: false} as ValueDetail}); }
        let mapperfunc: (a:any)=>any = undefined as any;
        let numbercasting = (v: any): number => {
            if (typeof v !== "number") {
                if (!v) v = 0;
                else if (v === "true") v = 1;
                else if (v.constructor?.name=== "Date") v = v.getTime();
                else if (typeof v === "string") {
                    // console.log("number casting:", v,  U.getFirstNumber(v+'', true), {numbermax, numbermin});
                    v = U.getFirstNumber(v+'', !round);
                } else return NaN;
            }
            v = Math.min(numbermax, Math.max(numbermin, v));
            return round ? Math.round(v) : v;
        };
        switch (typestr) {
            case "shapeless":
                let state: DState = store.getState();
                mapperfunc = (val: any) => {
                    if (!val || typeof val !== "string") return val;
                    let l: any = LPointerTargetable.fromPointer(val, state);
                    if (!l) return val;
                    if (l.className === DEnumLiteral.cname) { l = (l as DEnumLiteral).literal; } else
                    if (namedPointers) { l = (l.name ? ("@" + l.name) : (l as GObject)["@"+l.name]?.__raw?.values?.[0] || ("#" + l.className));}
                    else if (ecorePointers){ l = l.ecorePointer(); }
                    return l;
                };
                if (withmetainfo) ret.forEach((struct: ValueDetail) => { struct.value = mapperfunc(struct.value); });
                else ret = ret.map(mapperfunc);
                break;
            default: // it's a reference or enum
                let lenum: LEnumerator = undefined as any;
                let type: LClassifier = (meta as LStructuralFeature)?.type;
                if (type?.className === DEnumerator.cname) {
                    lenum = type as LEnumerator;
                    mapperfunc = (r: any) => {
                        if (solveLiterals === "original") return r;
                        numbermin = 0;
                        numbermax = (solveLiterals === "ordinals") ? Number.POSITIVE_INFINITY : 0;
                        let lit: LEnumLiteral | undefined
                        if (typeof r === "string") lit = Pointers.isPointer(r) ? LPointerTargetable.fromPointer(r) : (lenum as any)["@"+r];
                        else if (typeof r === "number") lit = lenum.ordinals[r];
                        switch (solveLiterals) {
                            default:
                            case "literal_obj": return lit;
                            // if r was a number and a valid ordinal (found literal through him) return r. if r was a string, don't return r but lenum["@"+r].ordinal
                            case "ordinals": return (typeof r === "number" ? (lit ? r : undefined) : lit?.ordinal);
                            case "literal_str": return (typeof r === "string" ? (lit ? r : undefined) : lit?.literal);
                        }
                    }
                } else if (!type.isPrimitive && type?.className === DClass.cname) mapperfunc = (r: any) => r && LPointerTargetable.fromPointer(r);
                else mapperfunc = (r: any) => r;
                if (withmetainfo) ret.forEach((struct: ValueDetail) => { struct.value = mapperfunc(struct.value); });
                else ret = ret.map(mapperfunc);

                // now ret is pointed DEnumLiteral or DObject or MetaInfoStructure<>
                if (type?.className === DEnumerator.cname) {
                    // replace numeric literals, mapped to literal ordinal. can happen with type switches
                    /*
                    if (solveLiterals) {
                        mapperfunc = (lit: LEnumLiteral|number) => {
                            numbermax = Number.POSITIVE_INFINITY;
                            numbermin = 0;
                            let ordinal = numbercasting(lit);
                            return isNaN(ordinal) ? lit : (meta!.type as LEnumerator).ordinals[ordinal];
                        }
                        if (withmetainfo) ret.forEach((struct: ValueDetail) => { struct.value = mapperfunc(struct.value); });
                        else ret = ret.map(mapperfunc);
                    }*/
                    let filterfunc = (l: LEnumLiteral) => { if (!l) return keepempties; return l.father?.id === (meta as LAttribute).type.id; };
                    if (withmetainfo) for(let struct of ret as ValueDetail[]) { struct.hidden = !filterfunc(struct.value as LEnumLiteral); } // && 'literal target is not of the correct type requested by metamodel'; }
                    else ret = ret.filter(filterfunc);
                    // todo: questo comportamento implica che quando importo un literal come testo da .ecore, devo assegnargli
                    //  il puntatore al suo literal se trovato, altrimenti resta val[i] di tipo string/shapeless
                    if (namedPointers) {
                        mapperfunc = (lit?: LEnumLiteral) => lit?.name;
                        if (withmetainfo) ret.forEach((struct: ValueDetail) => { struct.value = mapperfunc(struct.value); });
                        else ret = ret.map(mapperfunc);
                    }
                    break;
                }
                // is reference with assigned shape (and type) -> filter correct typed targets
                if (meta) {
                    let filterfunc = (l: LObject) => {
                        // hide values with a value that is not a pointer to correct type (but keep empties if requested)
                        //let isExtending = l.instanceof?.isExtending((meta as LReference).type); // damiano: todo test & debug isextending
                        let isExtending = true;
                        return keepempties && !l ? true : isExtending;
                    };
                    if (withmetainfo) for(let struct of ret as ValueDetail[]) { struct.hidden = !filterfunc(struct.value as LObject); } // && "ref target is not of correct type"; }
                    else ret = ret.filter(filterfunc);
                }
                // shaped (with m2-reference) but pointing to a shapeless object. can happen
                if (namedPointers) {
                    let mapperfunc = (l:LObject) => l && (l.name ? ("@" + l.name) : (l as GObject)["@"+l.name]?.__raw?.values?.[0] || ("#" + l.className));
                    if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = mapperfunc(struct.value as LObject); });
                    else ret = ret.map(mapperfunc);
                }
                else if (ecorePointers && !(meta as LReference).containment){
                    mapperfunc = (lval: LObject) => lval && lval.ecorePointer();
                    if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = mapperfunc(struct.value as LObject); });
                    else ret = ret.map(mapperfunc);
                    // throw new Error("values as EcorePointers: todo. for containment do nothing, just nest the obj. for non-containment put the ecore reference string in array vals")
                }
                break;
            case ShortAttribETypes.EByte:
                numbermin = -128;
                numbermax = 127;
                break;
            case ShortAttribETypes.EShort:
                numbermin = -32768;
                numbermax = 32767;
                break;
            case ShortAttribETypes.EInt:
                numbermin = -2147483648;
                numbermax = 2147483647;
                break
            case ShortAttribETypes.ELong:
                numbermin = -9223372036854775808;
                numbermax = 9223372036854775807;
                break;
            case ShortAttribETypes.EFloat:
            case ShortAttribETypes.EDouble:
                numbermin = Number.NEGATIVE_INFINITY;
                numbermax = Number.POSITIVE_INFINITY;
                round = false;
                break;
            case ShortAttribETypes.EString:
            case ShortAttribETypes.EDate:
                mapperfunc = v => v ? v + '' : ''
                if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = mapperfunc(struct.value); });
                else ret = ret.map(mapperfunc);
                break;
            case ShortAttribETypes.EChar:
                mapperfunc = v => v ? (v + '')[0] : 'A';
                if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = mapperfunc(struct.value); });
                else ret = ret.map(mapperfunc);
                break;
            case ShortAttribETypes.EBoolean:
                mapperfunc = v => typeof v === "boolean" ? v : U.fromBoolString(v+'', v?.length>0, false);
                if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = mapperfunc(struct.value); });
                else ret = ret.map(mapperfunc);
                break;
            case ShortAttribETypes.EVoid:
                if (withmetainfo) ret.forEach((struct: ValueDetail)=>struct.hidden = true);
                else ret = [];
                break;
        }
        // some kind of numeric type
        if (numbermax !== 0) {
            if (withmetainfo) ret.forEach((struct: ValueDetail)=>{ struct.value = numbercasting(struct.value); });
            else ret = ret.map(numbercasting);
        }
        return ret as any;
    }

    public getValues<T extends boolean>(fitSize: boolean = true, namedPointers: boolean = false, ecorePointers: boolean = false, shapeless: boolean = false,
                                        keepempties: boolean = true, withmetainfo?: T, maxlimit?: number)
        : (T extends undefined ? this["values"] : T extends false ? this["values"] : ValueDetail[]) & {type?: string} {
        return this.cannotCall("getValues"); }
    protected get_getValues(context: Context): this["getValues"] {
        return function (fitSize: boolean = true, namedPointers: boolean = true, ecorePointers: boolean = false,
                         shapeless: boolean = false, keepempties: boolean = false, withmetainfo: any = false, limit?: number) {
            return LValue.prototype.get_values(context, fitSize, namedPointers, ecorePointers, shapeless, keepempties, withmetainfo, limit) as any;
        }
    }
    // stringified value getters
    public valuesString(keepemptyquotes?: boolean): string { return this.cannotCall("valuestring"); }
    public valuestring(keepemptyquotes?: boolean): string { return this.cannotCall("valuestring"); }
    private get_valuestring(context: Context): this["valuestring"] { return (keepemptyquotes?: boolean) => this.valuestring_impl(context, keepemptyquotes); }
    private get_valuesString(context: Context): this["valuestring"] { return (keepemptyquotes?: boolean) => this.valuestring_impl(context, keepemptyquotes); }
    private valuestring_impl(context: Context, keepemptyquotes?: boolean): string {
        let val = this.get_values(context, true, true, false, false, true);
        // console.log("valuestring_impl", {val});
        let ret: any;
        switch (val.length) {
            case 0: ret = ''; break;
            case 1: ret = val[0]; break;
            default:
                let havestrings: boolean = val.type === ShortAttribETypes.EString;
                let havechars: boolean = val.type === ShortAttribETypes.EChar;
                let havepointers: boolean = false;
                let haveLelements: boolean = false;
                for (let vall of [val[0]]) {
                    if ((vall as any)?.__isProxy) haveLelements = true;
                    /*else if (typeof vall === "string") { havestrings = true; havepointers = havepointers || vall.includes("Pointer"); }}
                     */
                }
                /*if (havepointers) {
                    val = LPointerTargetable.wrapAll(val);
                    haveLelements = true;
                }*//*
                if (haveLelements) {
                    val = val.map( l => l && (l.name ? ("@" + l.name) : ("#" + l.className)));
                }*/
                if (havestrings || havechars) {
                    let valstr = JSON.stringify(val);
                    if (!keepemptyquotes) valstr = U.replaceAll(valstr, "\"\"", "");
                    ret = valstr.substring(1, valstr.length-1);
                    break;
                }
                else ret = val.join(', ');
        }
        return (ret === undefined || ret === null ? '' : ret) + '';
    }

    public setValueAtPosition(index: number, val: this["values"][0], info?: Partial<SetValueAtPositionInfoType>): {success: boolean, reason?: string} {
        return this.cannotCall("setValueAtPosition"); }

    // only use through setValueAtPosition
    protected _clearValueAtPosition(context: Context, index: number, info0?: Partial<SetValueAtPositionInfoType>, skipSettingUndefined: boolean = false) {
        // if (!outactions) outactions = {clear:[], set:[]};
        if (index < 0) return;
        let info = (info0 || {}) as unknown as SetValueAtPositionInfoType;
        let oldVal = context.data.values[index];
        let oldTarget: LObject | undefined = typeof oldVal === "string" ? LObject.fromPointer(oldVal) : undefined;
        /////////////////////// if oldTarget is LObject, update his pointedBy
        // if (oldTarget) SetFieldAction.new(oldTarget, "pointedBy" '-=", ... no need? reducer should do this)

        /////////////////////// if ref is containment assign oldTarget father to DModel

        if (info.isContainment === undefined) {
            if (info.instanceof === undefined) info.instanceof = context.proxyObject.instanceof;
            if (info.instanceof){
                if (info.instanceof.className === DReference.cname) { info.isContainment = (info.instanceof as LReference).containment; }
                else info.isContainment = false;
            }
            else { info.isContainment = true; }
        }
        if (info.isContainment && oldTarget?.className === "DObject") {
            SetFieldAction.new(oldVal as Pointer<DObject>, "father", context.proxyObject.model.id, undefined, true);
        }
        if (!skipSettingUndefined) SetFieldAction.new(context.data, 'values.' + index as any, undefined, '', info.isPtr);
    }
    protected get_setValueAtPosition(c: Context): ((index: number, val: this["values"][0], info?: Partial<SetValueAtPositionInfoType>, outactions?:outactions) => {success: boolean, reason?: string}) {
        return (index: number, val: this["values"][0] | any, info0?: Partial<SetValueAtPositionInfoType>, outactions?: outactions): { success: boolean, reason?: string } => {
            if (!outactions) outactions = {clear:[], set:[], immediatefire: true}
            let isPtr: boolean = undefined as any;
            let lval: LObject | LEnumLiteral = undefined as any;
            if (val === null) val = undefined;
            let oldval = c.data.values[index];
            if (oldval === val) return { success: false, reason: "identical assignment" };
            let tmpval_id = Pointers.from(val);
            if (tmpval_id !== undefined && oldval === tmpval_id) return { success: false, reason: "identical object assignment" };
            let state = store.getState();
            if (tmpval_id && (val as any)?.className) {
                lval = LPointerTargetable.wrap<DObject>(val, state) as LObject | LEnumLiteral;
                isPtr = !!(lval || Pointers.isPointer(oldval));//LPointerTargetable.wrap(oldval, state));
                val = tmpval_id;
            }
            let info = (info0 || {}) as unknown as SetValueAtPositionInfoType;
            if (isPtr === undefined) isPtr = (info.isPtr === undefined ? Pointers.isPointer(val) || Pointers.isPointer(oldval) : info.isPtr);


            // set sideeffect part
            if (val !== undefined) {
                if (isPtr) {
                    if (info.type === undefined) info.type = c.proxyObject.type;
                    if (info.instanceof === undefined) info.instanceof = c.proxyObject.instanceof;
                    if (info.isContainment === undefined) {
                        info.isContainment = !info.instanceof || (info.instanceof.className === DReference.cname && (info.instanceof as LReference).containment);
                    }
                    lval = LPointerTargetable.fromPointer(val);
                    if (!lval) return {success: false, reason: "invalid pointer: " + lval};
                    // is enum
                    if (lval.className === DEnumLiteral.cname) {
                        let lvale: LEnumLiteral = lval as LEnumLiteral;
                        if (info.instanceof && info.type && (lvale.father.id !== info.type.id)) return {success: false, reason: "target is not of correct literal type"};
                        // no need to do checks / other sideeffects other than pointedBy i think.
                    }
                    console.log('set_value_' + index, {isContainment: info.isContainment, isRef: lval.className === DObject.cname, val})
                    // is ref
                    if (lval.className === DObject.cname){

                        let lvalo = lval as LObject;
                        //let lvalmeta: LClassifier | undefined = lvalo.instanceof;
                        // if (info.instanceof && info.type && (!(lvalmeta as LClass)?.isExtending(info.type))) return {success: false, reason: "target is not of correct type"}; damiano todo: enable and implement isExtending
                        if (info.fatherList === undefined) info.fatherList = c.proxyObject.fatherList;
                        if (info.isContainment) {
                            if ((info.fatherList as LPointerTargetable[]).map(father => father.id).includes(val))
                                return {success: false, reason: "cannot create a containment loop"}; // todo: in LReference.set_containment need to forbid setting to true if there is a loop
                            let oldContainer: LValue | LModel = lvalo.father;
                            let oldContainerValue: LValue = (oldContainer.className === DModel.cname) ? undefined as any : (oldContainer as LValue);
                            // detach contaied object from old parent
                            if (oldContainerValue && oldContainerValue.id !== c.data.id) outactions.clear.push(()=>{
                                let valarr: any[] = oldContainerValue.__raw.values;

                                for (let i = 0; i < valarr.length; i++) {
                                    let v = valarr[i];
                                    if (v === val) oldContainerValue.setValueAtPosition(i, undefined as any, undefined);
                                }

                            });
                            outactions.set.push(()=> {
                                SetFieldAction.new(val as Pointer<DObject>, "father", c.data.id, undefined, true)
                            });
                        }
                    }
                    // automatic? SetFieldAction.new(val as Pointer<DObject>, "pointedBy", PointedBy.fromID(c.data.id, "values." + index as any), "+=");
                } else {
                    // loose checks, i can assign any primitive to any primitive (will cast on get)
                    if (info.instanceof === undefined) info.instanceof = c.proxyObject.instanceof;
                    let metatype: string = (info.instanceof as LAttribute)?.typeToShortString() || "shapeless";
                    if (typeof val === "object") {
                        if (val.constructor === Date && (metatype !== "EString" && metatype !== "EDate" && metatype !== "shapeless"))
                            return {
                                success: false,
                                reason: "dates can only be assigned to values of type string or Date"
                            };
                        // return {success: false, reason: "objects are not assignable except for dates"}; maybe i allow this instead
                    }
                }
            }

            TRANSACTION(this.get_name(c)+'.setValue('+index+': index)', ()=>{
                if (!outactions) return;
                // clear sideeffect part
                outactions.clear.push(()=>this._clearValueAtPosition(c, index, info, true));
                // console.log('set value index', {index, val, isPtr});
                // actual set
                outactions.set.push(()=>SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr));
                if (info.setMirage !== false) SetFieldAction.new(c.data, 'isMirage', false, '', false);

                if (outactions.immediatefire) {
                    for (let a of outactions.clear) a();
                    for (let a of outactions.set) a();
                }
            }, c.data.values[index], val)
            // todo: wrap this func and set toaster with failure message if it fails or better launch Log.w and bind toasts of different colors to Log funcs
            return {success: true};
        }
    }
    protected set_values(val0: orArr<D["values"]>, c: Context): boolean {
        let val: any = val0 as any;
        let modified = false;
        let meta = this.get_instanceof(c);
        let dmeta: DReference | DAttribute | undefined = meta?.__raw;
        if (dmeta?.derived) {
            let td = transientProperties.modelElement[dmeta.id];
            if (!td.derived_write) {
                try {
                    let txt = dmeta.derived_write || '(values, data, oldValues)=>{ data.values = values; }';
                    td.derived_write = new Function('values, data, oldValues', 'return ('+txt+')(data, originalValues)') as Function2;
                }
                catch (error: any) {
                    Log.ee('invalid derived (set) attribute expression: ' + dmeta.name, {error, derivedText:dmeta.derived_write});
                }
                if(td.derived_write) try {
                    TRANSACTION('changed ' + this.get_name(c)+' derived attributes', ()=>{
                        let ret = td?.derived_write?.(val, c.proxyObject, c.data.values);
                        if (ret !== undefined) {
                            val = ret;
                            modified = true;
                        }
                    })
                }
                catch (error: any) {
                    Log.ee('Error during derived (set) attribute evaluation: ' + dmeta.name, {error, derivedText:dmeta.derived_write});
                }
            }
        }

        val = (Array.isArray(val0) ? val0 : [val0]) as D["values"];
        // val.length = Math.max(val.length, c.data.values.length);
        let isContainment = this.get_isContainment(c);
        if (isContainment) { // remove duplicates in containment
            val = val.map((v: any) => v?.id || v);
            let idmap: Dictionary<string, true> = {}
            val = val.filter((e: any)=> { if (typeof e !== 'string' || !idmap[e]) return true; idmap[e] = true; return true;} )
        }
        TRANSACTION(this.get_fullname(c)+'.values', ()=>{
            let outactions: outactions = {clear:[], set:[], immediatefire: false};
            for (let i = 0; i < val.length; i++) {
                let out = this.get_setValueAtPosition(c)(i, val[i], {setMirage: false} as any, outactions);
                modified = out.success || modified;
                // console.log('set_values', {val, i, modifiedreason:out});
            }
            let excess = c.data.values.length - val.length; // add - outactions.set.length + outactions.set.length ??
            while (excess-- > 0) {
                SetFieldAction.new(c.data.id, 'values', undefined as any, '-=', true);
            }
            for (let a of outactions.clear) a();
            for (let a of outactions.set) a();
            if (modified) c.data.isMirage && SetFieldAction.new(c.data, 'isMirage', false, '', false);
        });
        return true;

        // old implementation
        let list: any = val;
        let context = c;
        let l = context.proxyObject;
        let instanceoff: LReference | LAttribute | undefined = l.instanceof;
        let isRef: boolean | undefined = (!instanceoff ? undefined : instanceoff?.className === DReference.cname);
        SetFieldAction.new(context.data, 'values', list as any, '', false);
        // console.log("pre set_values actions", l, list, val, context);

        if (!l.instanceof || isRef && (instanceoff as LReference).containment) {
            let i = 0;

            for (let v0 of list) {
                // console.log("loop set_value actions", v, context.data, isRef, instanceoff, Pointers.isPointer(v));
                i++;
                if ((isRef || instanceoff === undefined) && Pointers.isPointer(v0)) { // if shapeless obj need to check val by val
                    let v = v0 as Pointer<DModelElement> //Pointer<DObject> | Pointer<DEnumLiteral>;
                    // console.log("loop set_value actions SET", {v, data:context.data, isRef, instanceoff, isPtr:Pointers.isPointer(v)});
                    let lval: LObject = LPointerTargetable.fromPointer(v);
                    let oldContainer: LValue | LModel = lval.father;
                    SetFieldAction.new(v, "pointedBy", PointedBy.fromID(context.data.id, "values." + i as any), "+=");
                    SetFieldAction.new(v, "father", context.data.id, undefined, true);
                    if (oldContainer.className === DModel.cname) continue;
                    let containerValue = (oldContainer as LValue);
                    // let oldContainerValues = [...containerValue.__raw.value]; U.arrayRemoveAll(oldContainerValues, v);
                    let oldContainerValues: Pointer[] = containerValue.__raw.values.map( va => va===v ? undefined as any : va);
                    SetFieldAction.new(containerValue.id, "values", oldContainerValues, "", true);

                    // todo: verify if works: remove val from old container
                    let oldv = context.data.values[i];
                    // if (Pointers.isPointer(oldv)) SetFieldAction.new(context.data.id, "contains", U.arrayRemoveAll([...context.data.contains], oldv), '', true);
                    // SetFieldAction.new(context.data.id, "contains", oldv as DObject["id"], undefined, true);

                }
            }
        }
        context.data.isMirage && SetFieldAction.new(context.data, 'isMirage', false, '', false);
        return true;
    }

    protected set_value(val: D["values"][0], c: Context): boolean {
        let v: ValueDetail = this.get_value(c, false, false, false, true, true);
        let val_id = (val as any)?.id || val;
        if (Pointers.isPointer(val_id) && c.data.values.includes(val_id as any) && this.get_isContainment(c)) { return true; }
        let r = this.get_setValueAtPosition(c)(v?.index || 0, val_id || val);
        Log.e(!r.success,  r.reason);
        return r.success;
    }

    get_crossReference(c: Context): this['allowCrossReference'] { return this.get_allowCrossReference(c); }
    get_isCrossReference(c: Context): this['allowCrossReference'] { return this.get_allowCrossReference(c); }
    set_crossReference(v: this['allowCrossReference'], c: Context): boolean { return this.set_allowCrossReference(v, c); }
    set_isCrossReference(v: this['allowCrossReference'], c: Context): boolean { return this.set_allowCrossReference(v, c); }
    get_allowCrossReference(c: Context): boolean { return c.data.instanceof ? !!c.proxyObject.instanceof?.allowCrossReference : true; }
    set_allowCrossReference(v: this['allowCrossReference'], c: Context): boolean { return this.cannotSet('LValue.allowCrossReference'); }


    validTargetOptions!: MultiSelectOptGroup[];
    get_validTargetOptions(c: Context): this['validTargetOptions'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return opts;
    }
    validTargetsJSX!: JSX.Element[];
    get_validTargetsJSX(c: Context): this['validTargetsJSX'] {
        let opts: MultiSelectOptGroup[] = [];
        this.get_validTargets(c, opts);
        return UX.options(opts);
    }
    validTargets!: (LObject | LEnumLiteral)[];
    get_validTargets(c: Context, out?: MultiSelectOptGroup[]): this['validTargets'] {
        let meta: LReference | LAttribute = this.get_instanceof(c) as LReference | LAttribute;
        let isShapeless = !meta;
        let isReference = isShapeless || meta.className === 'DReference';
        let isAttribute = isShapeless || meta.className === 'DAttribute';
        let isCrossRef = this.get_isCrossReference(c);
        let freeObjects: LObject[] = [];
        let boundObjects: LObject[] = [];
        let literals: LEnumLiteral[] = [];
        let m1: LModel = this.get_model(c);
        let m2 = m1.instanceof;
        // let map = (object: LNamedElement) => ({value:object.id, label: object.name});
        let map = (object: LNamedElement): MultiSelectOption => {
            let fname = object.fullname;
            return {value:object.id, label: isCrossRef ? fname : object.name, title: object.fullname}
        };
        if (isReference) {
            let isContainment: boolean = this.get_containment(c);
            let containerObjectsID: Pointer[] = this.get_fatherList(c).map(lm => lm.id);
            let validObjects = (isCrossRef ? m1.allCrossSubObjects : m1.allSubObjects)
            if (isContainment) validObjects = validObjects.filter(obj => !containerObjectsID.includes(obj.id));
            let type = meta.type;
            if (!isShapeless) validObjects = validObjects.filter((obj) => (type as LClass).isSuperClassOf(obj.instanceof, true))
            // avoiding containment loops damiano todo: put this filter in set_value too
            for (let o of validObjects) {
                //  continue; // no self contain
                if (o.isRoot) freeObjects.push(o);
                else boundObjects.push(o);
            }
            if (out) out.push({label: 'Free     Objects', options: freeObjects.map(map)});
            if (out) out.push({label: 'Bound Objects', options: boundObjects.map(map)});
        }
        if (isAttribute) {
            let enumm: LEnumerator[];
            if (isShapeless){
                if (!m2) enumm = LPointerTargetable.from(Selectors.getAllEnumerators());
                else enumm = (isCrossRef && m2) ? m2.crossEnumerators : m2.enumerators;
            }
            else {
                let type = meta.type;
                enumm = (type.className === 'DEnumerator') ? [type as LEnumerator] : [];
            }
            for (let e of enumm) {
                let currLiterals = e.literals;
                literals.push(...currLiterals);
                if (out) out.push({label: 'Literals of ' + e.name, options: currLiterals.map(map)});
            }}
        return U.arrayMergeInPlace(freeObjects, boundObjects, literals as any);
    }

    protected generateEcoreJson_impl(c: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[c.data.id] = c.data;
        let values = this.get_values(c, true, false, true, false, false);//, false, undefined, "literal_str");
        delete values["type"];
        let ret: any = [];
        the_loop: for (let v of values){
            let l: LObject | LEnumLiteral = v as any;
            if (!l?.__isProxy) { ret.push(l); continue; }
            switch (l.className){
                case "DOperation": continue the_loop;
                case "DEnumLiteral": ret.push((l as LEnumLiteral).generateEcoreJsonM1()); break;
                default: ret.push(l.generateEcoreJson(loopDetectionObj)); break;
            }
        }
        // ret = ret.filter((j: any) => (j !== undefined || j !== ''));
        return (ret.length <= 1) ? ret[0] : ret; }

    protected get_toString(context: Context): () => string { return () => this._toString(context); }
    protected _toString(context: Context): string {
        let val: any = this.get_values(context, true, true, false, false, true);
        if (!val) return val + '';
        if (!Array.isArray(val)) val = [val];
        // if (!context.proxyObject.instanceof) val = val.map( (e: GObject) => { return  e.name ? "@" + e.name : e; });
        // else if (context.proxyObject.instanceof?.className === DReference.name) val = val.map( (e: GObject) => { return e.name ? "@" + e.name : e; });
        switch(val.length) {
            case 0: return '';
            case 1: return val[0] + '';
            default: return val + '';
        }
    }

    public rawValues(): void { super.cannotCall('rawValues'); }
    public get_rawValues(context: Context): this["values"]{
        return (this.get_getValues(context))(false, false, false, true, true, false, undefined);
    }

    protected get_topic(context: Context): this["topic"] {
        return context.data.topic;
    }
    protected set_topic(val: string, c: Context): boolean {
        if (c.data.topic === val) return true;
        TRANSACTION(this.get_name(c)+'.topic', ()=>{
            SetFieldAction.new(c.data, 'topic', val, '', false);
        }, c.data.topic, val)
        return true;
    }
}
RuntimeAccessibleClass.set_extend(DNamedElement, DValue);
RuntimeAccessibleClass.set_extend(LNamedElement, LValue);

export type ValueDetail = {
    value: LValue['value'];
    rawValue: DValue['values'][0]; // PrimitiveType | Pointer<DObject> | Pointer<DEnumLiteral>
    index: number;
    hidden: boolean;
};
export type SetValueAtPositionInfoType = {setMirage: boolean, isPtr: boolean, type: LValue['type'], instanceof: LValue['instanceof'], isContainment: boolean, fatherList: LValue['fatherList']};

export type WModelElement = getWParams<LModelElement, DModelElement>;
export type WModel = getWParams<LModel, DModel>;
export type WValue = getWParams<LValue, DValue>;
export type WNamedElement = getWParams<LNamedElement, DNamedElement>;
export type WObject = getWParams<LObject, DObject>;
export type WEnumerator = getWParams<LEnumerator, DEnumerator>;
export type WEnumLiteral = getWParams<LEnumLiteral, DEnumLiteral>;
export type WAttribute = getWParams<LAttribute, DAttribute>;
export type WReference = getWParams<LReference, DReference>;
export type WStructuralFeature = getWParams<LStructuralFeature, DStructuralFeature>;
export type WClassifier = getWParams<LClassifier, DClassifier>;
export type WDataType = getWParams<LDataType, DDataType>;
export type WClass = getWParams<LClass, DClass>;
export type WParameter = getWParams<LParameter, DParameter>;
export type WOperation = getWParams<LOperation, DOperation>;
export type WPackage = getWParams<LPackage, DPackage>;
export type WTypedElement = getWParams<LTypedElement, DTypedElement>;
export type WAnnotation = getWParams<LAnnotation, DAnnotation>;
// export type WJavaObject = getWParams<LJavaObject, DJavaObject>;
export type WMap = getWParams<LMap, DMap>;
export type WFactory_useless_ = getWParams<LFactory_useless_, DFactory_useless_>;

DModelElement.cname = 'DModelElement';
LModelElement.cname = 'LModelElement';
DAnnotationDetail.cname = 'DAnnotationDetail';
LAnnotationDetail.cname = 'LAnnotationDetail';
DAnnotation.cname = 'DAnnotation';
LAnnotation.cname = 'LAnnotation';
DNamedElement.cname = 'DNamedElement';
LNamedElement.cname = 'LNamedElement';
DTypedElement.cname = 'DTypedElement';
LTypedElement.cname = 'LTypedElement';
DClassifier.cname = 'DTypedElement';
LClassifier.cname = 'LTypedElement';
DPackage.cname = 'DPackage';
LPackage.cname = 'LPackage';
DOperation.cname = 'DOperation';
LOperation.cname = 'LOperation';
DParameter.cname = 'DParameter';
LParameter.cname = 'LParameter';
DClass.cname = 'DClass';
LClass.cname = 'LClass';
// ClassReferences.cname = 'ClassReferences';
DDataType.cname = 'DDataType';
LDataType.cname = 'LDataType';
DStructuralFeature.cname = 'DStructuralFeature';
LStructuralFeature.cname = 'LStructuralFeature';
DReference.cname = 'DReference';
LReference.cname = 'LReference';
DAttribute.cname = 'DAttribute';
LAttribute.cname = 'LAttribute';
DEnumLiteral.cname = 'DEnumLiteral';
LEnumLiteral.cname = 'LEnumLiteral';
DModelM1.cname = 'DModelM1';
LModelM1.cname = 'LModelM1';
DEnumerator.cname = 'DEnumerator';
LEnumerator.cname = 'LEnumerator';
DModel.cname = 'DModel';
LModel.cname = 'LModel';
DMap.cname = 'DMap';
LMap.cname = 'LMap';
DObject.cname = 'DObject';
LObject.cname = 'LObject';
DValue.cname = 'DValue';
LValue.cname = 'LValue';















