import {
    Dictionary,
    Pointer,
    IsActually,
    GObject,
    getWParams,
    Log,
    SetFieldAction,
    U,
    DtoL,
    DeleteElementAction,
    DGraphElement,
    Pointers,
    LtoD,
    LtoW,
    WPointerTargetable,
    Pack,
    Pack1,
    PackArr,
    CreateElementAction,
    Selectors,
    SetRootFieldAction,
    Leaf, Node, DUser, Constructors, store, IStore, PointedBy, BEGIN, END, unArr
} from "../../joiner";

import {
    RuntimeAccessible,
    DPointerTargetable,
    LPointerTargetable,
    DEdge,
    LEdge, RuntimeAccessibleClass, DRefEdge, LRefEdge, LGraphElement, GraphSize, LogicContext, DVoidVertex,
} from "../../joiner";
import LeaderLine from "leader-line-new";


@Node
@RuntimeAccessible
export class DModelElement extends DPointerTargetable{
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

    public static new(): DModelElement {
        return new Constructors(new DModelElement('dwc')).DPointerTargetable().DModelElement().end();
    }
}

/*
type Pack1<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L>, R = {D:D, L:L, P:P} > = P|D|L
type PackArr<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L> , ARR = Pack1<D>> = (ARR)[];
type Pack<D extends DPointerTargetable, L extends LPointerTargetable = DtoL<D>, P extends Pointer<D, 0, 1, L> = Pointer<D, 0, 1, L> , ARR = Pack1<D>> = ARR | (ARR)[];*/



@RuntimeAccessible
export class LModelElement<Context extends LogicContext<DModelElement> = any, D extends DModelElement = DModelElement> extends LPointerTargetable {
    // extends Mixin(DModelElement0, LPointerTargetable)
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
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
    father!: LModelElement; // annotations can be childrens of everything. except them fathers are: Model, Package, Classifier(class+enum), Operation
    annotations!: LAnnotation[];
    childrens!: (LPackage | LClassifier | LTypedElement | LAnnotation)[];
    nodes!: LGraphElement[];

    // utilities to go up in the tree (singular names)
    model!: LModel; // utility, follow father chain until get a Model parent or null
    package!: LPackage | null;
    class!: LClass | null;
    enum!: LEnumerator | null;
    operation!: LOperation | null;

    subNodes!: LGraphElement[] | null;




    property!: keyof DModelElement;
    containers!: LNamedElement[]; // list of fathers until the model is reached.

    protected set_containers(): boolean { return this.cannotSet('containers'); }
    public get_containers(context: Context): LModelElement["containers"]{
        let thiss: LModelElement = context.proxyObject;
        const ret: LModelElement[] = [thiss];
        while (true) {
            thiss = thiss.father;
            if (!thiss) break;
            ret.push(thiss);
        }
        return ret as LNamedElement[];
    }

    get_subNodes(context: LogicContext<LClass>, includingthis: boolean = false): LGraphElement[] {
        const lclass: LClass = context.proxyObject as any;
        let $class = $('[data-dataid="' + context.data.id + '"]');
        let $subnodes = $class.find('[data-nodeid]');
        function mapfunc(this: HTMLElement) { return this.dataset.nodeid; }
        let nodehtmlarr: HTMLElement[] = $subnodes.toArray();
        if (includingthis) nodehtmlarr.push($class[0]);
        let nodeidarr: string[] = nodehtmlarr.map( (html: HTMLElement) => html.dataset.nodeid ) as string[];
        let state = store.getState();
        let dnodes = nodeidarr.map( id => state.idlookup[id]).filter( (d) => !!d);
        return dnodes.map( d => LPointerTargetable.wrap(d)) as any;
    }


    // name -> redux (es. DClass -> classs)
    protected get_property(context: Context): this["property"]{
        return (this.className.substring(1) + "s").toLowerCase() as any;
    }
    protected targetRemoved(field: keyof DPointerTargetable): void {
        this.delete();
    }

    protected get_delete(context: Context): () => void {
        let ret = () => {};
        const proxyObject = context.proxyObject;
        const property = proxyObject.property;
        const father = proxyObject.father.__raw;
        for(let pointedBy of proxyObject.pointedBy) {
            const source: LModelElement = LPointerTargetable.from(pointedBy.source);
            //todo: fix pointedBy field
            //source.targetRemoved(pointedBy.field);
        }
        ret = () => {
            // al padre tolgo il nodo (perche property è keyof DModelElement e non keyof IStore ??)
            SetFieldAction.new(father, property, U.removeFromList(father[property] as string[], proxyObject.id));

            for (let child of proxyObject.childrens) { child.delete(); }

            // SetRootFieldAction.new(property, U.removeFromList(Selectors["getAll" + property.charAt(0).toUpperCase() + objName.slice(1)], data.id));
            DeleteElementAction.new(proxyObject.id);
        }

        return ret;
    }

    // @ts-ignore
    private get_until_parent<D extends Constructor, L extends DtoL<InstanceType<D>>>(l: LModelElement, d: DModelElement, father: D): L | null {
        while (true) {
            console.log('get_until_parent', {l, d, father}, {dname: d.className, fname: father.name});
            if (d.className === father.name) return l as L;
            l = l.father;
            let oldd = d;
            d = l.__raw;
            if (oldd === d) return null; // reached end of father chain (a model) without finding the desired parent.
        }
    }

    protected get_nodes(context: LogicContext<this>): LGraphElement[] {
        const nodes: LGraphElement[] = [];
        const nodeElements = $('[data-dataid="' + context.data.id + '"]');
        for (let nodeElement of nodeElements) {
            const nodeId = nodeElement.id;
            if(nodeId) {
                const lNode: LGraphElement | undefined = LPointerTargetable.wrap(nodeId);
                if (lNode) nodes.push(lNode);
            }
        }
        return nodes;
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

    protected get_model(context: Context): LModel { return this.get_until_parent(context.proxyObject, context.data, DModel) as LModel; }
    protected get_package(context: Context): LPackage { return this.get_until_parent(context.proxyObject, context.data, DPackage) as LPackage; }
    protected get_class(context: Context): LClass | null { return this.get_until_parent(context.proxyObject, context.data, DClass); } // todo: might be better for pergormance to erase this universal method and add implementations to every single L-class counting the correct amount of "father" navigations for each ( attrib to package? use attrib.father.father)
    protected get_operation(context: Context): LOperation | null { return this.get_until_parent(context.proxyObject, context.data, DOperation); }
    protected get_enum(context: Context): LEnumerator | null { return this.get_until_parent(context.proxyObject, context.data, DEnumerator); }

    protected get_father(context: Context): LModelElement { return LPointerTargetable.from(context.data.father); }
    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DPackage | DClassifier | DEnumerator | DEnumLiteral | DParameter | DStructuralFeature | DOperation, 1, 'N'>  { // LPackage | LClassifier | LTypedElement | LAnnotation | LEnumLiteral | LParameter | LStructuralFeature | LOperation
        return [...context.data.annotations];
    }
    protected get_childrens(context: Context): (LPackage | LClassifier | LTypedElement | LAnnotation | LEnumLiteral | LParameter | LStructuralFeature | LOperation)[] {
        // return this.get_childrens_idlist(context).map(e => LPointerTargetable.from(e));
        return LPointerTargetable.from(this.get_childrens_idlist(context));
    }

    protected set_childrens(a: never, context: Context): boolean { return Log.exx('childrens is a derived read-only collection', this); }


    add_parent(val: Pack<this["parent"]>, logicContext: Context): boolean { // todo: when will be used?
        const ptr = Pointers.from(val);
        return SetFieldAction.new(logicContext.data, 'parent', ptr, '+=', true); // todo: need to update childrens of the old and new parents
    }

    protected remove_parent(logicContext: Context): boolean { // todo: perchè senza bersaglio? perchè sempre elimina tutti?
        return SetFieldAction.new(logicContext.data, 'parent', [], '', true);
    }

    protected get_parent(context: Context): this["parent"] {
        return LPointerTargetable.from(context.data.id);
    }

    protected set_parent(val: Pack<LAnnotation>, context: Context): boolean { // val: Pack<DModelElement>
        const ptrs = Pointers.from(val);
        SetFieldAction.new(context.data, 'father', ptrs?.[0] || ptrs, '', true);
        return SetFieldAction.new(context.data, 'parent', ptrs, '', true);
    }

    add_annotation(val: Pack<this["annotations"]>, context: Context): boolean {
        const ptrs = Pointers.from(val);
        return SetFieldAction.new(context.data, 'annotations', ptrs, '+=', true);
    }

    remove_annotation(val: Pack<this["annotations"]>,  context: Context): boolean { // todo: when this will be ever used? this should be triggered by LObject but only get_ / set_ and delete of whole elements should be triggerable.
        //todo: remove as any
        const ptrs: Pointer<DAnnotation, 1, 'N', LAnnotation> = Pointers.from(val) as any;
        let indexes = ptrs.map( ptr => context.data.annotations.indexOf(ptr)).filter(p => p>=0);
        return SetFieldAction.new(context.data, 'annotations', indexes, '-=', true);
    }
    protected get_annotations(context: Context): this["annotations"] { return LPointerTargetable.fromPointer( context.data.annotations ); }

    protected set_annotations(val: Pack<LAnnotation>, context: Context): boolean {
        //  if (!Array.isArray(val)) val = [val];
        //         val = val.map( v => (v instanceof LAnnotation ? v.id : ( Pointers.filterValid(v) ? v : null ))) as Pointer<DAnnotation>[];
        const ptrs = Pointers.from(val);
        SetFieldAction.new(context.data, 'annotations', ptrs, '', true);
        return true;
    }

    protected get_addChild(context: Context): (type:string, exception?: Pack1<LClassifier>) => void { // just for add new, not for add pre-existing.
        return (type, exception?: Pack1<LClassifier>) => {
            let ret: (exception?: Pack1<LClassifier>) => void = () => {};
            switch ((type || '').toLowerCase()){
                default: Log.ee('cannot find children type requested to add:', {type: (type || '').toLowerCase(), context}); break;
                case "attribute": ret = this.get_addAttribute(context as any); break;
                case "class": ret = this.get_addClass(context as any); break;
                case "package": ret = this.get_addPackage(context as any); break;
                case "reference": ret = this.get_addReference(context as any); break;
                case "enumerator": ret = this.get_addEnumerator(context as any); break;
                case "literal": ret = this.get_addEnumLiteral(context as any); break;
                case "operation": ret = this.get_addOperation(context as any); break;
                case "parameter": ret = this.get_addParameter(context as any); break;
                //case "exception": ret = ((exception: Pack1<LClassifier>) => { let rett = this.get_addException(context as any); rett(exception); }) as any; break;
                case "exception": ret = this.get_addException(context as any); break;
            }
            return ret;
        }
    }

    protected get_addPackage(context: Context): (() => void) {
        let ret = () => {};
        switch (context.data?.className) {
            default: break;
            case "DModel": ret = () => LModelElement.addPackage(context.data as DModel); break;
            case "DPackage": ret = () => LModelElement.addSubPackage(context.data as DPackage); break;
        }
        ret();
        return ret;
    }

    private static addPackage(dModel: DModel): void {
        const lModel: LModel = LModelElement.from(dModel);
        let name = 'package_' + 0;
        let childrenNames: (string)[] = lModel.packages.map( p => p.name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
        const dPackage = DPackage.new(name);
        dPackage.parent = [dModel.id]; // not persistent yet, so this is allowed
        dPackage.father = dModel.id;
        LModelElement.addPackage_(dModel, dPackage);
    }

    private static addSubPackage(dPackage: DPackage): void {
        const lPackage: LPackage = LPackage.from(dPackage);
        let name = 'subpackage_' + 0;
        let childrenNames: (string)[] = lPackage.childrens.map( p => (p as LPackage).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
        const dSubPackage = DPackage.new(name);
        dSubPackage.parent = [dPackage.id];
        dSubPackage.father = dPackage.id;
        SetFieldAction.new(dPackage, "pointedBy", PointedBy.fromID(dSubPackage.id, "father"), '+=');
        SetFieldAction.new(dPackage, "pointedBy", PointedBy.fromID(dSubPackage.id, "parent"), '+=');
        LModelElement.addSubPackage_(dPackage, dSubPackage);
    }

    protected get_addClass(context: LogicContext<DPackage>): () => void {
        const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data : null;
        let ret = () => {};
        if (!dPackage) return ret;
        const lPackage: LPackage = LPointerTargetable.from(dPackage);
        let name = 'class_' + 0;

        ret = function(){
            BEGIN();
            let childrenNames: (string)[] = lPackage.childrens.map( c => (c as LClassifier).name);
            name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);
            const dClass = DClass.new(name);
            CreateElementAction.new(dClass);
            let wPackage = WPointerTargetable.fromD(dPackage);
            wPackage.classifiers = [...dPackage.classifiers, dClass];
            // lClass.parent = [dPackage.id]; // implied by dPackage.classifiers =
            // lClass.father = dPackage.id; // implied by dPackage.classifiers =
            // all pointedBy handled by Actions derived from L-object usage
            END();
        }
        ret();
        return ret;
    }

    protected get_addAttribute(context: LogicContext<DClass>): () => void {
        const dClass: DClass | null = (context.data?.className === "DClass") ? {...context.data} as DClass : null;
        if (!dClass) return () => {};
        const lClass: LClass = LPointerTargetable.from(dClass);
        let name = 'attribute_' + 0;
        let childrenNames: (string)[] = lClass.features.map( c => (c).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);
        const lString: LClassifier = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes());


        const ret = function () {
            BEGIN();
            const dAttribute = DAttribute.new(name, lString.id);
            dAttribute.parent = [dClass.id];
            dAttribute.father = dClass.id;
            dClass.pointedBy.push(PointedBy.fromID(dAttribute.id, "father"));
            dClass.pointedBy.push(PointedBy.fromID(dAttribute.id, "parent"));

            dClass.attributes.push(dAttribute.id);
            dAttribute.pointedBy.push(PointedBy.fromID(dClass.id, "attributes"));

            dAttribute.type = lString.id;
            lString.pointedBy.push(PointedBy.fromID(dAttribute.id, 'type'));

            CreateElementAction.new(dAttribute);
            CreateElementAction.new(dClass); // already exist, but replaces.
            CreateElementAction.new(lString);
            END()
        }
        ret();
        return ret;
    }


    protected get_addReference(context: LogicContext<DClass>): (() => void) {
        let ret = () => {};
        const dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
        if (!dClass) return ret;
        const lClass: LClass = LPointerTargetable.from(dClass);
        let name = 'reference_' + 0;
        const childrenNames: (string)[] = lClass.features.map( c => (c).name);
        name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
        const dReference = DReference.new(name);
        dReference.parent = [dClass.id];
        dReference.father = dClass.id;
        dReference.type = dClass.id;


        const dRefEdge: DRefEdge = DRefEdge.new(dReference.id, '', '', "", );
        dRefEdge.start = dReference.id;
        dRefEdge.end = dClass.id;

        ret = () => LModelElement.addReference_(dClass, dReference, dRefEdge);
        ret();
        return ret;
    }

    protected get_addEnumerator(context: LogicContext<DPackage>): () => void {
        let ret = () => {};
        const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data : null;
        if (!dPackage) return ret;
        const lPackage: LPackage = LPointerTargetable.from(dPackage);
        let name = 'enum_' + 0;
        const childrenNames: (string)[] = lPackage.childrens.map( c => (c as LNamedElement).name);
        name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
        const dEnumerator = DEnumerator.new(name);
        dEnumerator.parent = [dPackage.id];
        dEnumerator.father = dPackage.id;
        ret = () => LModelElement.addEnumerator_(dPackage, dEnumerator);
        ret();
        return ret;
    }

    protected get_addEnumLiteral(context: LogicContext<DEnumerator>): () => void {
        let ret = () => {};
        const dEnum: DEnumerator | null = (context.data?.className === "DEnumerator") ? context.data : null;
        if (!dEnum) return ret;
        const lEnum: LEnumerator = LPointerTargetable.from(dEnum);
        let name = 'literal_' + 0;
        const childrenNames: (string)[] = lEnum.childrens.map(c => (c as LNamedElement).name);
        name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
        const dLiteral = DEnumLiteral.new(name);
        dLiteral.parent = [dEnum.id];
        dLiteral.father = dEnum.id;
        ret = () => LModelElement.addEnumLiteral_(dEnum, dLiteral);
        ret();
        return ret;
    }

    protected get_addOperation(context: LogicContext<DClass>): () => void {
        let ret = () => {};
        const dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
        if(dClass) {
            const lClass: LClass = LPointerTargetable.from(dClass);
            let name = 'fx_' + 0;
            const childrenNames: (string)[] = lClass.childrens.map(c => (c as LNamedElement).name);
            name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            const dOperation = DOperation.new(name);
            dOperation.father = dClass.id;
            const dParameter = DParameter.new("return", Selectors.getReturnTypes()[0].id);
            dParameter.father = dOperation.id;
            ret = () => LModelElement.addOperation_(dClass, dParameter, dOperation);
        }
        ret();
        return ret;
    }

    protected get_addParameter(context: LogicContext<DOperation>): () => void {
        let ret = () => {};
        const dOperation: DOperation | null = (context.data?.className === "DOperation") ? context.data : null;
        if(dOperation) {
            const lOperation: LOperation = LPointerTargetable.from(dOperation);
            let name = 'param_' + 0;
            const childrenNames: (string)[] = lOperation.childrens.map(c => (c as LNamedElement).name);
            name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            const dParameter = DParameter.new(name);
            dParameter.father = dOperation.id;
            const lString: LClass = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes());
            dParameter.type = lString.id;
            ret = () => LModelElement.addParameter_(dOperation, dParameter);
        }
        ret();
        return ret;
    }

    // (exception: Pack1<LClassifier>) => void #prima era cosi
    protected get_addException(context: Context): () => void {
        let ret = () => {};
        const dOperation: DOperation | null = (context.data?.className === "DOperation") ? context.data as DOperation : null;
        if (dOperation) {
            const lOperation: LOperation = LPointerTargetable.from(dOperation);
            const dClass = DPointerTargetable.from(dOperation.father);
            //let name = 'except_' + 0;
            //const childrenNames: (string)[] = lOperation.childrens.map(c => (c as LNamedElement).name);
            //name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
            //const dException = DClass.new(name); // non credo che l'eccezione vada salvata qui, add_exception dovrebbe prendere una classe già esistente da usare come eccezione
            //dException.father = dOperation.id as any;
            //ret = (exception: Pack1<LClassifier>) => this._addException(dOperation, dException, context);
            ret = () => this._addException(dOperation, dClass);
        }
        ret();
        return ret;
    }

    /*
    protected _addException(operation: DOperation, exception: Pack1<LClassifier>, context: Context): void {
        SetFieldAction.new(operation, "exceptions", Pointers.from(exception), '+=', true);
    }
    */

    protected _addException(dOperation: DOperation, dClass: DClass): void {
        SetFieldAction.new(dOperation, "exceptions", dClass.id, '+=', true);
    }

    // activated by user in JSX
    // todo: this.wrongAccessMessage("addClass");
    protected cannotCall(name: string, ...params: string[]): void {
        Log.exDevv(name + ' should never be called directly, but should trigger get_' + name + '(' + params.join(', ') +'), this is only a signature for type checking.'); }
    public addClass(): void { this.cannotCall('addClass'); }
    public addPackage(): void { this.cannotCall('addPackage'); }
    public addAttribute(): void { this.cannotCall('addAttribute'); }
    public addReference(): void { this.cannotCall('addReference'); }
    public addEnumerator(): void { this.cannotCall('addEnumerator'); }
    public addEnumLiteral(): void { this.cannotCall('addLiteral'); }
    public addOperation(): void { this.cannotCall('addOperation'); }
    public addParameter(): void { this.cannotCall('addParameter'); }
    // chiedere al prof: cosa può lanciato come eccezione: se tutte le classi o se solo quelle che estendono Exception
    public addException(exception?: DClassifier): () => void { throw this.wrongAccessMessage("AddException"); }
    public addChild(type: string): void { this.cannotCall('addAttribute', type); }

    private static addOperation_ (dClass: DClass, dParameter: DParameter, dOperation: DOperation): void {
        CreateElementAction.new(dParameter);
        CreateElementAction.new(dOperation);
        SetFieldAction.new(dOperation, "parameters", dParameter.id, '+=', true);
        SetFieldAction.new(dClass, "operations", dOperation.id, '+=', true);
    }
    private static addParameter_(dOperation: DOperation, dParameter: DParameter): void {
        CreateElementAction.new(dParameter);
        SetFieldAction.new(dOperation, "parameters", dParameter.id, '+=', true);
    }
    private static addException_(dOperation: DOperation, dException: DClassifier): void {
        CreateElementAction.new(dException);
        SetFieldAction.new(dOperation, "exceptions", dException.id, '+=', true);
    }
    private static addReference_(dClass: DClass, dReference: DReference, dRefEdge: DRefEdge): void {
        CreateElementAction.new(dReference);
        SetFieldAction.new(dClass, "references", dReference.id, '+=', true);
        CreateElementAction.new(dRefEdge);
        // new SetRootFieldAction("refEdges", dRefEdge.id, '+=', true); // todo: la creazione di una ref non dovrebbe automaticamente implicare la creazione di un arco, ma per test per ora ok
    }
    private static addAttribute_(dClass: DClass, dAttribute: DAttribute): void {
        CreateElementAction.new(dAttribute);
        SetFieldAction.new(dClass, 'attributes', dAttribute.id, '+=', true);
    }
    private static addClass_(dPackage: DPackage, dClass: DClass): void {
        CreateElementAction.new(dClass);
        SetFieldAction.new(dPackage, 'classifiers', dClass.id, '+=', true);
    }
    private static addPackage_(dModel: DModel, dPackage: DPackage): void {
        CreateElementAction.new(dPackage);
        SetFieldAction.new(dModel, 'packages', dPackage.id, '+=', true);
    }
    private static addSubPackage_(dPackage: DPackage, dSubPackage: DPackage): void {
        CreateElementAction.new(dSubPackage);
        SetFieldAction.new(dPackage, 'subpackages', dSubPackage.id, '+=', true);
    }
    private static addEnumerator_(dPackage: DPackage, dEnumerator: DEnumerator): void {
        CreateElementAction.new(dEnumerator);
        SetFieldAction.new(dPackage, 'classifiers', dEnumerator.id, '+=', true);
    }
    private static addEnumLiteral_(dEnum: DEnumerator, dLiteral: DEnumLiteral): void {
        CreateElementAction.new(dLiteral);
        SetFieldAction.new(dEnum, "literals", dLiteral.id, '+=', true);
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
* public set_X(val: D | L | Pointer<D> ) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
* public get_set_X( val: D | L | Pointer<D>, otherparams, ContextD>) { throw new Error("set_X should never be executed, the proxy should redirect to get_set_X."); }
*
*
* */
// @RuntimeAccessible export class _WModelElement extends LModelElement { }
// export type WModelElement = DModelElement | LModelElement | _WModelElement;
DPointerTargetable.subclasses.push(DModelElement);
DPointerTargetable.subclasses.push(LModelElement);





@Leaf
@RuntimeAccessible
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
    details!: Dictionary<string, string>;

    public static new(source?: DAnnotation["source"], details?: DAnnotation["details"]): DAnnotation {
        return new Constructors(new DAnnotation('dwc')).DPointerTargetable().DModelElement().DAnnotation(source, details).end();
    }
}

@RuntimeAccessible
export class LAnnotation<Context extends LogicContext<DAnnotation> = any> extends LModelElement { // Mixin(DAnnotation0, LModelElement)
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
    details: Dictionary<string, string> = {};

    protected get_source(context: Context): this["source"] { return context.data.source; }
    protected set_source(val: this["source"], context: Context): boolean {
        SetFieldAction.new(context.data, 'source', val, '', false);
        return true;
    }
    protected get_details(context: Context): this["details"] { return context.data.details }
    protected set_details(val: this["details"], context: Context): boolean {
        SetFieldAction.new(context.data, 'details', val);
        return true;
    }
}

DModelElement.subclasses.push(DAnnotation);
LModelElement.subclasses.push(LAnnotation);

/*
type unarr<T extends any[] | number> = T extends any[] ? T[0] : T;
let aaa: unarr<number> = null as any;
let pck: Pack<LClass[]> = null as any;

let val = null as any;
const ptr1 = Pointers.from(val as any as Pack1<LClass[]>);
const ptra = Pointers.from(val as any as PackArr<LClass[]>);
const ptr0 = Pointers.from(val as any as Pack<LClass[]>);
type PC1<T> = DClass | LClass | WClass | Pointer<DClass, 1, 1, LClass>;
type PCArr<T> = PC1<T>[];
type PC<T> = PC1<T> | PCArr<T>;*/
/*
let p1: Pack1<DClass> = null as any;
let pp: Pack<DClass> = null as any;
let pa: PackArr<DClass> = null as any;
p1 = pp; // no
p1 = pa; // no
pp = p1;
pp = pa;
pa = p1; // no
pa = pp; // no*/
/*
function frompack<
    T extends Packk1<LClassifier>,
    L extends LModelElement | 'errorL' = T extends Packk1<infer L> ? L : 'errorL'>(v: T): L {
    return null as any;

}
type Packk1<L extends LPointerTargetable, D extends LtoD<L> = LtoD<L>, W extends LtoW<L> = LtoW<L>, P extends Pointer<D, any, any, L> = Pointer<D, any, any, L>> = L | D | W | P;*/
/*
@RuntimeAccessible class _WAnnotation extends LModelElement{ //extends _WModelElement {
    source!: Parameters<LAnnotation["set_source"]>[0];
}*/

// export type WAnnotation = DAnnotation | LAnnotation | _WAnnotation;
// todo no: Proxyclass con i get/set che viene istanziata once come singleton senza structure static. copia L con tutto ma non può esistere. quindi unica soluzione de-tipizza singleton e structure

// search typescript typing proxy











@Node
@RuntimeAccessible
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
        return new Constructors(new DNamedElement('dwc')).DPointerTargetable().DModelElement().DNamedElement(name).end();
    }

}

@RuntimeAccessible
export class LNamedElement<Context extends LogicContext<DNamedElement> = any> extends LModelElement { // Mixin(DNamedElement0, DAnnotation)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // public __raw!: DNamedElement;
    id!: Pointer<DNamedElement, 1, 1, LNamedElement>;
    // static singleton: LNamedElement;
    // static logic: typeof LNamedElement;
    // static structure: typeof DNamedElement;

    // inherit redefine
    parent!: LModelElement[]; // todo:     parent!: LNamedElement[];
    father!: LModelElement;   // todo:     father!: LNamedElement;
    annotations!: LAnnotation[];
    // personal
    name!: string;
    fullname!:string;

    protected set_containers(): boolean { return this.cannotSet('containers'); }
    public get_containers(context: Context): LNamedElement["containers"]{
        let thiss: LNamedElement = context.proxyObject;
        const ret: LNamedElement[] = [thiss];
        while (true) {
            thiss = thiss.father as LNamedElement;
            if (!thiss) break;
            ret.push(thiss);
        }
        return ret;
    }


    protected get_fullname(context: Context): this["fullname"] {
        const containers = this.get_containers(context);
        let fullname: string = containers.reverse().slice(1, containers.length).map(c => c.name).join('.');
        return fullname; }


    protected get_name(context: Context): this["name"] { return context.data.name; }
    protected set_name(val: this["name"],  context: Context): boolean {
        if (val.match(/\s/)) val = this._autofix_name(val, context);
        // todo: validate if operation can be completed or need autocorrection, then either return false (invalid parameter cannot complete) or send newVal at redux
        const fixedVal: string = val;
        SetFieldAction.new(context.data, 'name', fixedVal, '', false);
        return true;
    }
    protected _autofix_name(val: string, context: Context): string {
        // NB: NON fare autofix di univocità nome tra i childrens o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
        return val.replaceAll(/\s/g, '_');
    }
    protected get_autofix_name(val: string, context: Context): (val: string, context: Context) => string { return this._autofix_name; }
    public autofix_name(val: string): string { return this.wrongAccessMessage("autofix_name"); }
}
// @RuntimeAccessible export class _WNamedElement extends _WModelElement { }
// export type WNamedElement = DNamedElement | LNamedElement | _WNamedElement;
DModelElement.subclasses.push(DNamedElement);
LModelElement.subclasses.push(LNamedElement);














@RuntimeAccessible
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
    // personal
    type!: Pointer<DClassifier, 1, 1, LClassifier>;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean; // ?
    required!: boolean; // ?


    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DTypedElement {
        return new Constructors(new DTypedElement('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).end();
    }
}

@RuntimeAccessible
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
    // personal
    type!: LClassifier;
    ordered!: boolean;
    unique!: boolean;
    lowerBound!: number;
    upperBound!: number;
    many!: boolean;
    required!: boolean;

    protected get_type(context: Context): this["type"] { return LPointerTargetable.from(context.data.type); }
    protected set_type(val: Pack1<this["type"]>, context: Context): boolean {
        SetFieldAction.new(context.data, 'type', Pointers.from(val), "", true);
        return true;
    }

    protected get_ordered(context: Context): this["ordered"] { return context.data.ordered; }
    protected set_ordered(val: this["ordered"], logicContext: Context): boolean {
        return SetFieldAction.new(logicContext.data, 'ordered', val);
    }

    protected get_unique(context: Context): this["unique"] { return context.data.unique; }
    protected set_unique(val: this["unique"], logicContext: Context): boolean {
        return SetFieldAction.new(logicContext.data, 'unique', val);
    }

    protected get_lowerBound(context: Context): this["lowerBound"] { return context.data.lowerBound; }
    protected set_lowerBound(val: this["lowerBound"], context: Context): boolean {
        SetFieldAction.new(context.data, 'lowerBound', val);
        return true;
    }

    protected get_upperBound(context: Context): this["upperBound"] { return context.data.upperBound; }
    protected set_upperBound(val: this["upperBound"], context: Context): boolean {
        SetFieldAction.new(context.data, 'upperBound', val);
        return true;
    }

    protected get_many(context: Context): this["many"] { return context.data.many; }
    protected set_many(val: this["many"], context: Context): boolean {
        SetFieldAction.new(context.data, 'many', val);
        return true;
    }

    protected get_required(context: Context): this["required"] { return context.data.required; }
    protected set_required(val: this["required"], context: Context): boolean {
        SetFieldAction.new(context.data, 'required', val);
        return true;
    }


    protected get_delete(context: Context): () => void {
        // todo: aggiusta questo e fai 90% in una funzione in LModelElement che aggiusta i pointedBy
        //  e fa le eliminazioni a cascata, e ridefinisci solo se devi fare azioni particolari incasi rari o cambiare il comportamento default (set to something else instead of delete?)
        const ret = () => { alert("todo classifier's delete"); } // potrebbe essere generalizzato invece di fare class.delete(), aggiustando modelElement.delete() che iteri i sottoelementi per eliminarli tutti.
        return ret;
    }
}

let wtyped: WTypedElement = null as any;

// @RuntimeAccessible export class _WTypedElement extends _WNamedElement { }
// export type WTypedElement = DTypedElement | LTypedElement | _WTypedElement;
DNamedElement.subclasses.push(DTypedElement);
LNamedElement.subclasses.push(LTypedElement);





@RuntimeAccessible
export /*abstract*/ class DClassifier extends DPointerTargetable { // extends DNamedElement
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;

    public static new(name?: DNamedElement["name"]): DClassifier {
        return new Constructors(new DClassifier('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().end();
    }
}

@RuntimeAccessible
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
    // personal
    instanceClassName!: string;
    // instanceClass: EJavaClass // ?
    defaultValue!: LObject;
    // isInstance(object: EJavaObject): boolean; ?
    // getClassifierID(): number;

    protected get_instanceClassName(context: Context): this["instanceClassName"] { return context.data.instanceClassName; }
    protected set_instanceClassName(val: this["instanceClassName"], context: Context): boolean {
        SetFieldAction.new(context.data, 'instanceClassName', val, "", false);
        return true;
    }

    protected get_defaultValue(context: Context): this["defaultValue"] { return LPointerTargetable.from(context.data.defaultValue); }
    protected set_defaultValue(val: Pack<this["defaultValue"]>, context: Context): boolean {
        SetFieldAction.new(context.data, 'defaultValue', Pointers.from(val), "", true);
        return true;
    }

}
// @RuntimeAccessible export class _WClassifier extends _WNamedElement { }
// export type WClassifier = DClassifier | LClassifier | _WClassifier;
DNamedElement.subclasses.push(DClassifier);
LNamedElement.subclasses.push(LClassifier);






@RuntimeAccessible
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

    public static new(name?: DNamedElement["name"], uri?: DPackage["uri"], prefix?: DPackage["prefix"]): DPackage {
        return new Constructors(new DPackage('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DPackage(uri, prefix).end();
    }
}


@Leaf
@RuntimeAccessible
export class LPackage<Context extends LogicContext<DPackage> = any, C extends Context = Context> extends LNamedElement { // extends DNamedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DPackage;
    id!: Pointer<DPackage, 1, 1, LPackage>;
    // static singleton: LPackage;
    // static logic: typeof LPackage; todo: fixa questo con una funzione statica fuori dalle classi con tipo condizionale incasinato che gli dai costruttore e ti ridà istanza  getSingleton(LPackage)
    // static structure: typeof DPackage;
    // inherit redefine
    parent!: (LPackage| LModel)[];  // ype 'LPackage' is missing the following properties from type 'LModelElement': get_set_parent, set_parent
    father!: LPackage | LModel;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    classifiers!: LClassifier[];
    subpackages!: LPackage[];
    uri!: string;
    prefix: string = '';
    // derived
    classes!: LClass[];
    enums!: LEnumerator[];
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


    private get_classes(context: Context): LClass[] {
            let classifiers = DPointerTargetable.fromPointer(context.data.classifiers as Pointer<DClassifier, 1, 1, LClassifier>[]);
            let enumerators = classifiers.filter(dc => dc?.className === DClass.name ) as DClass[];
            return LPointerTargetable.from(enumerators.map(e=> e.id)); }
    private get_enums(context: Context): LEnumerator[] { return this.get_enumerators(context); }
    private get_enumerators(context: Context): LEnumerator[] {
        let classifiers = DPointerTargetable.fromPointer(context.data.classifiers as Pointer<DClassifier, 1, 1, LClassifier>[]);
        let enumerators = classifiers.filter(dc => dc?.className === DEnumerator.name ) as DEnumerator[];
        return LPointerTargetable.from(enumerators.map(e=> e.id)); }

    private get_allSubClasses(context: Context): LClass[] {
        const s: IStore = store.getState();
        return this.get_allSubPackages(context, s).flatMap(p => p.classes || []); }
    private get_allSubEnums(context: Context): LEnumerator[] { return this.get_allSubEnumerators(context); }
    private get_allSubEnumerators(context: Context): LEnumerator[] {
        const s: IStore = store.getState();
        return this.get_allSubPackages(context, s).flatMap(p => (p.enums || []));
    }

    private get_allSubPackages(context: Context, state?: IStore): LPackage[] {
        // return context.data.packages.map(p => LPointerTargetable.from(p));
        state = state || store.getState();
        let tocheck: Pointer<DPackage>[] = context.data.subpackages || [];
        let checked: Dictionary<Pointer, true> = {};
        checked[context.data.id] = true;
        while (tocheck.length) {
            let newtocheck: Pointer<DPackage>[] = [];
            for (let ptr of tocheck) {
                if (checked[ptr]) throw new Error("loop in packages containing themselves");
                checked[ptr] = true;
                let dpackage: DPackage = DPointerTargetable.from(ptr, state);
                U.arrayMergeInPlace(newtocheck, dpackage?.subpackages);
            }
            tocheck = newtocheck;
        }
        return LPointerTargetable.from(Object.keys(checked), state);
    }

    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DPackage | DClassifier, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DPackage | DClassifier, 1, 'N'>, ...context.data.subpackages, ...context.data.classifiers]; }

    protected get_classifiers(context: Context): this["classifiers"] {
        return context.data.classifiers.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    /**
     * damiano todo: riscrivere tutti i set_subelements (settare parent e father che sono derivati e mai setatti direttamente)
     * e tutti i add_element (per pointedby problem qunado aggiornati fuori dallo stato)
     * */
    protected set_classifiers(val: PackArr<this["classifiers"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        let oldclassifiers = context.data.classifiers;
        // const darr = DPointerTargetable.from(list, store.getState());
        // damiano todo: alternative: o setti redundant field map impostato come pointedby. o qui e in ogni set_subelementcollection imposti update parent
        const diff = U.arrayDifference(oldclassifiers, list);
        const state = store.getState();
        BEGIN();
        SetFieldAction.new(context.data, 'classifiers', list, "", true);
        for (let id of diff.added) {
            SetFieldAction.new(id, 'father', context.data.id, '', true);
            SetFieldAction.new(id, 'parent', context.data.id, '+=', true);
        }
        for (let id of diff.removed as Pointer<DModelElement>[]) {
            SetFieldAction.new(id, 'father', undefined, '', true);
            let parentarr = DPointerTargetable.from(id).parent;
            U.arrayRemoveAll(parentarr, context.data.id);
            SetFieldAction.new(id, 'parent', parentarr, '', true);
        }
        END();
        return true;
    }

    protected get_subpackages(context: Context): this["subpackages"] {
        return context.data.subpackages.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_subpackages(val: PackArr<this["subpackages"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'subpackages', list, "", true);
        return true;
    }

    protected get_uri(context: Context): this["uri"] { return context.data.uri; }
    protected set_uri(val: this["uri"], context: Context): boolean {
        SetFieldAction.new(context.data, 'uri', val, "", false);
        return true;
    }

    protected get_delete(context: Context): () => void {
        let ret = () => {};
        const dPackage: DPackage = context.data;
        const dFather: (DModel | DPackage) & GObject = Selectors.getDElement<DModel>(dPackage.father);
        const children = new Set([...dPackage.classifiers, ...dPackage.subpackages]);
        for (let dChild of children) {
            const lChild: LClass | LEnumerator | LPackage = LPointerTargetable.from(dChild);
            lChild._delete(context);
        }
        if (dFather.className === "DModel") {
            ret = () => {
                SetFieldAction.new(dFather, "packages", U.removeFromList(dFather.packages, dPackage.id), '', true);
                //new SetRootFieldAction("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id));
                new DeleteElementAction(dPackage);
            }
        }
        if (dFather.className === "DPackage") {
            ret = () => {
                if (dFather.subpackages) SetFieldAction.new(dFather, "subpackages", U.removeFromList(dFather.subpackages, dPackage.id));
                // if (dFather.packages) SetRootFieldAction.new("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id, '', true));
                new DeleteElementAction(dPackage);
            }
        }
        ret();
        return ret;
    }
}
// @RuntimeAccessible export class _WPackage extends _WNamedElement { }
// export type WPackage = DPackage | LPackage | _WPackage;
DNamedElement.subclasses.push(DPackage);
LNamedElement.subclasses.push(LPackage);


@Leaf
@RuntimeAccessible
export class DOperation extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
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

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"], exceptions: DOperation["exceptions"] = [], parameters: DOperation["parameters"] = []): DOperation {
        return new Constructors(new DOperation('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DOperation(exceptions, parameters).end();
    }
}

@RuntimeAccessible
export class LOperation<Context extends LogicContext<DOperation> = any, C extends Context = Context>  extends LTypedElement { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DOperation;
    id!: Pointer<DOperation, 1, 1, LOperation>;
    // static singleton: LOperation;
    // static logic: typeof LOperation;
    // static structure: typeof DOperation;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LClass[];
    father!: LClass;
    name!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    exceptions!: LClassifier[];
    parameters!: LParameter[];


    get_childrens_idlist(context: Context): Pointer<DAnnotation | DClassifier | DParameter, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DParameter | DClassifier, 1, 'N'>, ...context.data.exceptions, ...context.data.parameters]; }

    protected get_exceptions(context: Context): this["exceptions"] {
        return context.data.exceptions.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_exceptions(val: PackArr<this["exceptions"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'exceptions', list, "", true);
        return true;
    }

    protected get_parameters(context: Context): this["parameters"] {
        return context.data.parameters.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_parameters(val: PackArr<this["parameters"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'parameters', list, "", true);
        return true;
    }

    protected get_delete(context: Context): () => void {
        const dOperation: DOperation = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dOperation.father);
        const children = new Set([...dOperation.parameters, ...dOperation.exceptions]);
        for (let dChild of children) {
            const lChild: LParameter | LClass = LPointerTargetable.from(dChild);
            lChild.delete(); // be carefull! here we're deleting the return type too
        }
        const ret = () => {
            SetFieldAction.new(dClass, "operations", U.removeFromList(dClass.operations, dOperation.id), '', true);
            // SetRootFieldAction.new("operations", U.removeFromList(Selectors.getAllOperations(), dOperation.id), '', true);
            new DeleteElementAction(dOperation);
        }
        ret();
        return ret;
    }
    protected get_type(context: Context): this["type"] {
        return context.proxyObject.parameters[0].type;
    }

    _mark(b: boolean, superchildren: LOperation, override: string) {

    }

    _canOverride(superchildren: LOperation) {
        return undefined;
    }

    _canPolymorph(superchildren: LOperation) {
        return undefined;
    }
}
DTypedElement.subclasses.push(DOperation);
LTypedElement.subclasses.push(LOperation);




@Leaf
@RuntimeAccessible
export class DParameter extends DPointerTargetable { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
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
    // personal

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DParameter {
        return new Constructors(new DParameter('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DParameter().end();
    }
}
@RuntimeAccessible
export class LParameter<Context extends LogicContext<DParameter> = any, C extends Context = Context>  extends LTypedElement { // extends DTypedElement
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DParameter;
    id!: Pointer<DParameter, 1, 1, LParameter>;
    // static singleton: LParameter;
    // static logic: typeof LParameter;
    // static structure: typeof DParameter;

    // inherit redefine
    annotations!: LAnnotation[];
    parent!: LOperation[];
    father!: LOperation;
    name!: string;
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal


    protected get_delete(context: LogicContext<DParameter>): () => void {
        let ret = () => {};
        const dParameter: DParameter = context.data;
        const dOperation: DOperation = Selectors.getDElement<DOperation>(dParameter.father);
        if (dOperation.parameters.indexOf(dParameter.id) !== 0) {
            const dClassifier: DClassifier | undefined = Selectors.getDElement<DClass>(dParameter.type as string); //first parameter is return type so his type is undefined
            ret = () => {
                SetFieldAction.new(dOperation,"parameters", U.removeFromList(dOperation.parameters, dParameter.id), '', true);
                if (dClassifier) {
                    // SetFieldAction.new(dClassifier, "pointedBy", U.removeFromList(dClassifier.pointedBy, dParameter.id));
                }
                // SetRootFieldAction.new("parameters", U.removeFromList(Selectors.getAllParameters(), dParameter.id), '', true);
                new DeleteElementAction(dParameter);
            }
        } else {
            // when deleting return type (null = void)
            ret = () => {
                SetFieldAction.new(dParameter, "type", null as any); // todo while reworking .delete(): null = void, questo setta void e deve essere tenuto come azione diversa dal default delete
            };
        }
        ret();
        return ret;
    }
}
DTypedElement.subclasses.push(DParameter);
LTypedElement.subclasses.push(LParameter);





var todoret: any;

@RuntimeAccessible
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // personal
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract: boolean = false;
    interface: boolean = false;
    instances: Pointer<DObject, 0, 'N', LObject> = [];
    operations: Pointer<DOperation, 0, 'N', LOperation> = [];
    features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
    references: Pointer<DReference, 0, 'N', LReference> = [];
    attributes: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    referencedBy: Pointer<DReference, 0, 'N', LReference> = [];
    extends: Pointer<DClass, 0, 'N', LClass> = [];
    extendedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    public static new(name?: DNamedElement["name"], isInterface: DClass["interface"] = false, isAbstract: DClass["abstract"] = false): DClass {
        return new Constructors(new DClass('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DClass(isInterface, isAbstract).end();
    }

}
@RuntimeAccessible
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
    defaultValue!: LObject;
    // personal
    isSuperTypeOf(someClass: DClassifier): boolean { return todoret; }
    getEstructuralFeatureByID(featureID: number): DStructuralFeature { return todoret; }
    getEstructuralFeature(featureName: string): DStructuralFeature { return todoret; }
    abstract!: boolean;
    interface!: boolean;
    instances!: LObject[];
    operations!: LOperation[];
    features!: LStructuralFeature[];
    references!: LReference[];
    attributes!: LAttribute[];
    referencedBy!: LReference[];
    extends!: LClass[];
    extendedBy!: LClass[];
    nodes!: LGraphElement[]; // ipotesi, non so se tenerlo

    // mia aggiunta:
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // utilities to go down in the tree (plural names)
    exceptions!: LClassifier[] | null;
    parameters!: LParameter[] | null;

    get_childrens_idlist(context: Context): Pointer<DAnnotation | DStructuralFeature | DOperation, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DStructuralFeature, 1, 'N'>, ...context.data.attributes, ...context.data.references, ...context.data.operations]; }

    protected get_abstract(context: Context): this["abstract"] { return context.data.abstract; }
    protected set_abstract(val: this["abstract"], context: Context): boolean {
        SetFieldAction.new(context.data, 'abstract', val);
        return true;
    }
    protected get_interface(context: Context): this["interface"] { return context.data.interface; }
    protected set_interface(val: this["interface"], context: Context): boolean {
        SetFieldAction.new(context.data, 'interface', val);
        return true;
    }

    protected get_instances(context: Context): this["instances"] {
        return context.data.instances.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_instances(val: PackArr<this["instances"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'instances', list, "", true);
        return true;
    }

    protected get_operations(context: Context): this["operations"] {
        return context.data.operations.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_operations(val: PackArr<this["operations"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'operations', list, "", true);
        return true;
    }

    protected get_features(context: Context): this["features"] {
        return context.data.features.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_features(val: PackArr<this["features"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'features', list, "", true);
        return true;
    }

    protected get_references(context: Context): this["references"] {
        return context.data.references.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_references(val: PackArr<this["references"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'references', list, "", true);
        return true;
    }

    protected get_attributes(context: Context): this["attributes"] {
        return context.data.attributes.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_attributes(val: PackArr<this["attributes"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'attributes', list, "", true);
        return true;
    }

    protected get_referencedBy(context: Context): this["referencedBy"] {
        return context.data.referencedBy.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_referencedBy(val: PackArr<this["referencedBy"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'referencedBy', list, "", true);
        return true;
    }

    protected get_extends(context: Context): this["extends"] {
        return context.data.extends.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_extends(val: PackArr<this["extends"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'extends', list, "", true);
        return true;
    }
    protected add_extends(val: PackArr<this["extends"]>, context: Context): void {
        let ptrs: Pointer<DClass> = Pointers.from(val) as any;
        SetFieldAction.new(context.data, 'extends', [...context.data.extends, ...ptrs], '', true);
    }

    protected remove_extends(val: PackArr<this["extends"]> | number | number[], context: Context): void {
        if (!Array.isArray(val)) val = [val];
        if (!val.length) return;
        let finalVal: D["extends"];
        if (typeof val[0] === "number") { finalVal = context.data.extends.filter((elem,index,arr)=> { return (val as any[]).includes(index); }); }
        else {
            finalVal = [...context.data.extends];
            let ptrs: Pointer<DClass> = Pointers.from(val as PackArr<this["extends"]>) as any;
            for (let v of ptrs) { U.arrayRemoveAll(finalVal, v); }
        }
        SetFieldAction.new(context.data, 'extends', finalVal, '', true);
    }

    protected get_extendedBy(context: Context): this["extendedBy"] {
        return context.data.extendedBy.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_extendedBy(val: PackArr<this["extendedBy"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'extendedBy', list, "", true);
        return true;
    }

    protected get_implements(context: Context): this["implements"] { return context.data.implements; }
    protected set_implements(val: this["implements"], context: Context): boolean {
        SetFieldAction.new(context.data, 'implements', val, "", true);
        return true;
    }

    protected get_implementedBy(context: Context): this["implementedBy"] { return context.data.implementedBy; }
    protected set_implementedBy(val: this["implementedBy"], context: Context): boolean {
        SetFieldAction.new(context.data, 'implementedBy', val, "", true);
        return true;
    }



    protected get_delete(context: Context): () => void {
        const dClass: DClass = context.data;
        const dPackage: DPackage = Selectors.getDElement<DPackage>(dClass.father);
        const children = new Set([...dClass.attributes, ...dClass.references]);
        const pointedby = new Set(dClass.pointedBy);
        for(let dChild of children) {
            const lChild: LAttribute | LReference = LPointerTargetable.from(dChild);
            lChild._delete(context);
        }
        /*
        const ret = () => {  todo: rather than doing this, i think we should generalize using pointed_by. this would not work anyway for multiple operations sharing the same exception. nor for references.
            if(dFather.className === "DPackage") {
                const dPackage = dFather;
                new SetFieldAction(dPackage, "classifiers", U.removeFromList((dPackage as GObject).classifiers, dClass.id));
            }
            if(dFather.className === "DOperation") {
                const dOperation = dFather;
                new SetFieldAction(dOperation, "exceptions", U.removeFromList((dOperation as GObject).exceptions, dClass.id));
            }
            new SetRootFieldAction("classs", U.removeFromList(Selectors.getAllClasses(), dClass.id));
*/

        const ret = () => {
            SetFieldAction.new(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dClass.id), '', true);
            //new SetRootFieldAction("classs", U.removeFromList(Selectors.getAllClasses(), dClass.id));
            new DeleteElementAction(dClass);
        }
        ret();
        return ret;
    }

    public superclasses!: LClass[];
    public allSubClasses!: LClass[];

    public canExtend(superclass: LClass, output: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}): boolean {
        this.cannotCall("canExtend"); return false;
    }

    private get_canExtend(context: Context): (superclass: LClass, output: {reason: string, allTargetSuperClasses: LClass[]}) => boolean {
        return (superclass: LClass, output: {reason: string, allTargetSuperClasses: LClass[]} =
            {reason: '', allTargetSuperClasses: []}) => this._canExtend(context, superclass, output);
    }

    public isExtending(superclass: LClass, output: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}): boolean {
        this.cannotCall("isExtending"); return false;
    }

    private get_superclasses(context: Context, plusThis: boolean = false): LClass[] {
        let i: number;
        const thiss: LClass = context.proxyObject;
        const visited: Dictionary<Pointer, LClass> = {};
        let queue: LClass[] = thiss.extends;
        if (plusThis) queue = [thiss, ...queue];
        const ret: LClass[] = [];
        for (i = 0; i < queue.length; i++) {
            let elem: LClass = queue[i];
            if (visited[elem.id]) continue;
            visited[elem.id] = elem;
            ret.push(elem);
            queue.push(...elem.extends);
        }
        return ret;
    }

    private get_allSubClasses(context: Context, plusThis: boolean = false): LClass[] {
        const thiss: LClass = context.proxyObject;
        const set: Set<LClass> = plusThis ? new Set<LClass>([thiss]) : new Set();
        for (let i = 0; i < thiss.extendedBy.length; i++) {
            // todo: would this access get_extendedBy 2*N times?? verify and optimize
            U.SetMerge(true, set, thiss.extendedBy[i].allSubClasses); }
        return [...set]; }


    private _canExtend(context: Context, superclass: LClass, output: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}): boolean {
        if (!superclass) { output.reason = 'Invalid extend target: ' + superclass; return false; }
        const thiss: LClass = context.proxyObject;
        if (superclass.id === thiss.id) { output.reason = 'Classes cannot extend themselves.'; return false; }
        // todo: se diversi proxy dello stesso oggetto sono considerati diversi questo fallisce, in tal caso fai thiss.extends.map( l => l.id).indexof(superclass.id)
        if (thiss.extends.map(sc=>sc.id).indexOf(superclass.id) >= 0) { output.reason = 'Target class is already directly extended.'; return false; }
        output.allTargetSuperClasses = superclass.superclasses;
        if (thiss.superclasses.map(sc=> sc.id).indexOf(superclass.id) >= 0) { output.reason = 'Target class is already indirectly extended.'; return false; }
        if (output.allTargetSuperClasses.map(sc=>sc.id).indexOf(thiss.id) >= 0) { output.reason = 'Cannot set this extend, it would cause a inheritance loop.'; return false; }
        if (thiss.interface && !superclass.interface) { output.reason = 'An interface cannot extend a class.'; return false; }
        // ora verifico se causa delle violazioni di override (attibuti omonimi string e boolean non possono overridarsi)
        let i: number;
        let j: number;
        let childrens: LOperation[] =  thiss.operations; //[...thiss.getBasicOperations()];
        let superchildrens: LOperation[] = superclass.operations; //[...superclass.getBasicOperations()];
        for (i = 0; i < childrens.length; i++) {
            let op: LOperation = childrens[i];
            for (j = 0; j < superchildrens.length; j++){
                let superchildren: LOperation = superchildrens[j];
                if (op.name !== superchildren.name) continue;
                if (op._canOverride(superchildren) || op._canPolymorph(superchildren)) continue;
                output.reason = 'Marked homonymous operations cannot override nor polymorph each others.';
                setTimeout( () => {
                    op._mark(true, superchildren, 'override'); //  mark op && superchildren
                    setTimeout( () => { op._mark(false, superchildren, 'override'); }, 3000); // unmark
                }, 1);
                return false;
            }
        }
        return true; }

    private _isExtending(context: Context, superclass: LClass, orEqual: boolean = true): boolean {
        if (!superclass) return false;
        return this.get_superclasses(context, orEqual).includes(superclass); }

    private add_Extends(context: Context, superclass: LClass, force: boolean = false): boolean {
        let out: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []};
        const thiss: LClass = context.proxyObject;
        if (!force && !this._canExtend(context, superclass, out)) {  return false; }
        SetFieldAction.new(thiss.__raw, 'extends', [superclass.id], '+=', true);
        SetFieldAction.new(superclass.__raw, 'extendedBy', [thiss.id], '+=', true);
        // const extendChildrens: LClass[] =  [thiss, ...thiss.superclasses];
        // console.log('calculateViolationsExtend childrens:'  + extendChildrens, this);
        // for (let extChild of extendChildrens) { extChild._checkViolations(false); } // after instances have their meta-class changed, they might need to change shape or values.
        return true; }

    unsetExtends(context: Context, superclass: LClass): void {
        if (!superclass) return;
        console.log('UnsetExtend:', context);
        // todo: when Object is loaded in m3, set him there for easy access.
        //  if (superclass.id === LClass.genericObjectid) { Log.w(true, 'Cannot un-extend "Object"'); return; }
        const thiss: LClass = context.proxyObject;
        let index: number = thiss.extends.indexOf(superclass);
        if (index < 0) return;

        let newextends = thiss.extends.map(l => l.id);
        let newextendedBy = superclass.extendedBy.map(l => l.id);
        U.arrayRemoveAll(newextends, superclass.id)
        U.arrayRemoveAll(newextendedBy, thiss.id)
        SetFieldAction.new(thiss, 'extends', (newextends), '', true); // -=
        SetFieldAction.new(superclass, 'extendedBy', (newextendedBy), '', true); // -=
        // todo: update instances for (i = 0; i < thiss.instances.length; i++) { thiss.instances[i].unsetExtends(superclass); }
        // todo: remove extend edge? here?

        // todo: check violations
        // const extendedby: LClass[] = [thiss, ...thiss.allSubClasses];
        // for (i = 0; i < extendedby.length; i++) { extendedby[i].checkViolations(true); }
    }
}
DClassifier.subclasses.push(DClass);
LClassifier.subclasses.push(LClass);


@RuntimeAccessible
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    // personal
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];


    public static new(name?: DNamedElement["name"]): DDataType {
        return new Constructors(new DDataType('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DDataType().end();
    }
}

@RuntimeAccessible
export class LDataType<Context extends LogicContext<DDataType> = any, C extends Context = Context>  extends LClassifier { // extends DClassifier
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
    defaultValue!: LObject
    // personal
    serializable!: boolean;


    protected get_serializable(context: Context): this["serializable"] { return context.data.serializable; }
    protected set_serializable(val: this["serializable"], context: Context): boolean {
        SetFieldAction.new(context.data, 'serializable', val);
        return true;
    }

}

DClassifier.subclasses.push(DDataType);
LClassifier.subclasses.push(LDataType);





@RuntimeAccessible
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
    unsettable: boolean = false;
    derived: boolean = false;
    defaultValueLiteral!: string;

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DStructuralFeature {
        return new Constructors(new DStructuralFeature('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().end();
    }
    // defaultValue!: GObject; //EJavaObject
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass
}
@RuntimeAccessible
export class LStructuralFeature<Context extends LogicContext<DStructuralFeature> = any, C extends Context = Context>  extends LTypedElement { // DTypedElement
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
    type!: LClassifier;
    ordered: boolean = true;
    unique: boolean = true;
    lowerBound: number = 0;
    upperBound: number = 1;
    many!: boolean;
    required!: boolean;
    // personal
    instances!: LValue[];
    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    derived!: boolean;
    defaultValueLiteral!: string;

    // defaultValue!: GObject; //EJavaObject
    // getFeatureID(): number;
    // getContainerClass(): EJavaClass

    protected get_instances(context: Context): this["instances"] {
        return context.data.instances.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_instances(val: PackArr<this["instances"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'instances', list, "", true);
        return true;
    }

    protected get_changeable(context: Context): this["changeable"] { return context.data.changeable; }
    protected set_changeable(val: this["changeable"], context: Context): boolean {
        SetFieldAction.new(context.data, 'changeable', val);
        return true;
    }

    protected get_volatile(context: Context): this["volatile"] { return context.data.volatile; }
    protected set_volatile(val: this["volatile"], context: Context): boolean {
        SetFieldAction.new(context.data, 'volatile', val);
        return true;
    }

    protected get_transient(context: Context): this["transient"] { return context.data.transient; }
    protected set_transient(val: this["transient"], context: Context): boolean {
        SetFieldAction.new(context.data, 'transient', val);
        return true;
    }

    protected get_unsettable(context: Context): this["unsettable"] { return context.data.unsettable; }
    protected set_unsettable(val: this["unsettable"], context: Context): boolean {
        SetFieldAction.new(context.data, 'unsettable', val);
        return true;
    }

    protected get_derived(context: Context): this["derived"] { return context.data.derived; }
    protected set_derived(val: this["derived"], context: Context): boolean {
        SetFieldAction.new(context.data, 'derived', val);
        return true;
    }

    protected get_defaultValueLiteral(context: Context): this["defaultValueLiteral"] { return context.data.defaultValueLiteral; }
    protected set_defaultValueLiteral(val: this["defaultValueLiteral"], context: Context): boolean {
        SetFieldAction.new(context.data, 'defaultValueLiteral', val, "", false);
        return true;
    }

}
DTypedElement.subclasses.push(DStructuralFeature);
LTypedElement.subclasses.push(LStructuralFeature);


@RuntimeAccessible
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
    derived: boolean = false;
    defaultValueLiteral!: string;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    instances: Pointer<DValue, 0, 'N', LValue> = [];

    // personal
    containment: boolean = true;
    container: boolean = false; // ?
    resolveProxies: boolean = true; // ?
    opposite: Pointer<DReference, 0, 1, LReference> = null;
    target: Pointer<DClass, 0, 'N', LClass> = [];
    edges: Pointer<DEdge, 0, 'N', LEdge> = [];

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DReference {
        return new Constructors(new DReference('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DReference().end();
    }

}

@RuntimeAccessible
export class LReference<Context extends LogicContext<DReference> = any, C extends Context = Context>  extends LStructuralFeature {
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
    derived!: boolean;
    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    containment!: boolean;
    container!: boolean;
    resolveProxies!: boolean;
    opposite?: LReference;
    target!: LClass[];
    edges!: LEdge[];

    protected get_containment(context: Context): this["containment"] { return context.data.containment; }
    protected set_containment(val: this["containment"], context: Context): boolean {
        SetFieldAction.new(context.data, 'containment', val);
        return true;
    }

    protected get_container(context: Context): this["container"] { return context.data.container; }
    protected set_container(val: this["container"], context: Context): boolean {
        SetFieldAction.new(context.data, 'container', val);
        return true;
    }

    protected get_resolveProxies(context: Context): this["resolveProxies"] { return context.data.resolveProxies; }
    protected set_resolveProxies(val: this["resolveProxies"], context: Context): boolean {
        SetFieldAction.new(context.data, 'resolveProxies', val);
        return true;
    }

    protected get_opposite(context: Context): this["opposite"] { return LPointerTargetable.from(context.data.opposite); }
    protected set_opposite(val: Pack<LReference | undefined>, context: Context): boolean {
        SetFieldAction.new(context.data, 'opposite', Pointers.from(val) as any as LAnnotation["id"], "", true);
        return true;
    }

    protected get_target(context: Context): this["target"] {
        return context.data.target.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_target(val: PackArr<this["target"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'target', list, "", true);
        return true;
    }

    protected get_edges(context: Context): this["edges"] {
        return context.data.edges.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_edges(val: PackArr<this["edges"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'edges', list, "", true);
        return true;
    }


    protected get_delete(context: Context): () => void {
        const dReference: DReference = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dReference.father);
        const dType: DClass = Selectors.getDElement<DClass>(dReference.type as string);
        const dEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
        const ret = () => {
            SetFieldAction.new(dClass, "references", U.removeFromList(dClass.references, dReference.id), '', true);
            // SetFieldAction.new(dType, "pointedBy", U.removeFromList(dType.pointedBy, dReference.id));
            // SetRootFieldAction.new("references", U.removeFromList(Selectors.getAllReferences(), dReference.id));
            // todo: this kind of deletion might fail if there are multiple ones of this kind fired at once. you remove elements 2° and 5°,
            //  assigning [elem1, undefined, elem3, elem4, elem5, ...], then assigning [elem1, elem2, elem3, elem4, undefined,...], the first deletion will be erased by the second.
            //  similar problem would happen deleting with indexes (even worse, removing twice the same index can remove 2 different elements.
            //  a possible ** conflict-free ** solution would be deleting subelements by deleted element id when possible.
            //  if it's not DPointerTargetable the only solution might be never actually erasing but keeping fixed permanent indexes (they never shift position on delete) + deletion by index or by setting undef.
            //  (if a delete like in the example would turn undefined index to something with content, it will keep undefined, doing AND-wise for every element to check who should remain alive)
            if(dEdge) {
                // new SetRootFieldAction("refEdges", U.removeFromList(Selectors.getAllReferenceEdges(), dEdge.id, '', true));
            }
            new DeleteElementAction(dReference);
        }
        ret();
        return ret;
    }
}
DStructuralFeature.subclasses.push(DReference);
LStructuralFeature.subclasses.push(LReference);




@RuntimeAccessible
export class DAttribute extends DPointerTargetable { // DStructuralFeature
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LAttribute;
    // static logic: typeof LAttribute;
    // static structure: typeof DAttribute;

    // inherit redefine
    id!: Pointer<DAttribute, 1, 1, LAttribute>;
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
    derived: boolean = false;
    defaultValueLiteral!: string;
    parent: Pointer<DClass, 0, 'N', LClass> = [];
    father!: Pointer<DClass, 1, 1, LClass>;
    instances: Pointer<DValue, 0, 'N', LValue> = [];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DAttribute {
        return new Constructors(new DAttribute('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().DAttribute().end();
    }
}
@RuntimeAccessible
export class LAttribute <Context extends LogicContext<DAttribute> = any, C extends Context = Context> extends LStructuralFeature { // DStructuralFeature
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
    derived!: boolean;
    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?

    protected get_ID(context: Context): this["isID"] { return context.data.isID; }
    protected set_ID(val: this["isID"], context: Context): boolean {
        SetFieldAction.new(context.data, 'isID', val);
        return true;
    }

    protected get_delete(context: Context): () => void {
        const dAttribute: DAttribute = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dAttribute.father);
        const dClassifier: DClassifier = Selectors.getDElement<DClass>(dAttribute.type as string);
        const ret = () => {
            SetFieldAction.new(dClass, "attributes", U.removeFromList(dClass.attributes, dAttribute.id), '', true);
            // SetFieldAction.new(dClassifier, "pointedBy", U.removeFromList(dClassifier.pointedBy, dAttribute.id));
            // SetRootFieldAction.new("attributes", U.removeFromList(Selectors.getAllAttributes(), dAttribute.id));
            new DeleteElementAction(dAttribute);
        }
        ret();
        return ret;
    }

}
DStructuralFeature.subclasses.push(DAttribute);
LStructuralFeature.subclasses.push(LAttribute);

@Leaf
@RuntimeAccessible
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
    value: number = 0;

    public static new(name?: DNamedElement["name"], value: DEnumLiteral["value"] = 0): DEnumLiteral {
        return new Constructors(new DEnumLiteral('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumLiteral(value).end();
    }
}
@RuntimeAccessible
export class LEnumLiteral<Context extends LogicContext<DEnumLiteral> = any, C extends Context = Context>  extends LNamedElement { // DNamedElement
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
    // personal
    value!: number;

    protected get_value(context: Context): this["value"] { return context.data.value; }
    protected set_value(val: this["value"], context: Context): boolean {
        SetFieldAction.new(context.data, 'value', val);
        return true;
    }

    protected get_delete(context: Context): () => void {
        const dEnumLiteral: DEnumLiteral = context.data;
        const dEnumerator: DEnumerator = Selectors.getDElement<DEnumerator>(dEnumLiteral.father);
        const ret = () => {
            SetFieldAction.new(dEnumerator, "literals", U.removeFromList(dEnumerator.literals, dEnumLiteral.id), '', true);
            // SetRootFieldAction.new("enumliterals", U.removeFromList(Selectors.getAllEnumLiterals(), dEnumLiteral.id));
            new DeleteElementAction(dEnumLiteral);
        }
        ret();
        return ret;
    }
}
DNamedElement.subclasses.push(DEnumLiteral);
LNamedElement.subclasses.push(LEnumLiteral);

@Leaf
@RuntimeAccessible
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>;
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];
    // personal
    literals: Pointer<DEnumLiteral, 0, 'N', LEnumLiteral> = [];

    public static new(name?: DNamedElement["name"], literals: DEnumerator["literals"] = []): DEnumerator {
        return new Constructors(new DEnumerator('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DEnumerator(literals).end();
    }
}
@RuntimeAccessible
export class LEnumerator<Context extends LogicContext<DEnumerator> = any, C extends Context = Context>  extends LDataType { // DDataType
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
    defaultValue!: LObject;
    serializable!: boolean;
    usedBy!: LAttribute[];
    // personal
    literals!: LEnumLiteral[];

    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DEnumLiteral, 1, 'N'>, ...context.data.literals]; }

    protected get_literals(context: Context): this["literals"] {
        return context.data.literals.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_literals(val: PackArr<this["literals"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'literals', list, "", true);
        return true;
    }

    protected get_delete(context: Context): () => void {
        const dEnumerator: DEnumerator = context.data;
        const dPackage: DPackage = Selectors.getDElement<DPackage>(dEnumerator.father);
        const dFather: DPackage | DOperation = dPackage;
        const children = new Set([...dEnumerator.literals]);
        const pointedBy = new Set([...dEnumerator.pointedBy]);

        for(let dChild of children) {
            const lChild: LEnumLiteral | LAttribute = LPointerTargetable.from(dChild);
            lChild._delete(context);
        }


        const ret = () => {
            if(dFather.className === "DPackage") {
                const dPackage = dFather;
                SetFieldAction.new(dPackage, "classifiers", U.removeFromList((dPackage as GObject).classifiers, dEnumerator.id), '', true);
            }
            SetFieldAction.new(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dEnumerator.id), '', true);
            SetRootFieldAction.new("enumerators", U.removeFromList(Selectors.getAllEnumerators(), dEnumerator.id), '', true);
            new DeleteElementAction(dEnumerator);
        }
        ret();

        return ret;
    }

/*
    protected get_delete2(context: Context): () => void {
        let ret = () => {};
        const data = context.proxyObject;
        const father = LPointerTargetable.from(data.father);
        const reduxName = U.classnameToReduxConverter(data.className); // DClass -> classs
        const objName = U.classnameToObjConverter(data.className); // DClass -> classes
        if (reduxName && objName) {
            ret = () => {
                // tolgo al padre il figlio            SetFieldAction.new(father.id, reduxName, U.removeFromList(father[objName], data.id));
                // tolgo i figli al nodo
                for (let child of data.childrens) { child.delete(); }
                //tolgo il  nodo
                SetRootFieldAction.new(reduxName, U.removeFromList(Selectors["getAll" + objName.charAt(0).toUpperCase() + objName.slice(1)] as any[], data.id));
                DeleteElementAction.new(data.id);
            }
        }
        return ret;
    }*/
}
DDataType.subclasses.push(DEnumerator);
LDataType.subclasses.push(LEnumerator);



@RuntimeAccessible
export class DObject extends DPointerTargetable { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LObject;
    // static logic: typeof LObject;
    // static structure: typeof DObject;

    // inherit redefine
    id!: Pointer<DObject, 1, 1, LObject>;
    parent: Pointer<DModel, 0, 'N', LModel> = []; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: Pointer<DModel, 1, 1, LModel>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    // personal
    instanceof: Pointer<DClass, 0, 'N'> = [];


    public static new(name?: DNamedElement["name"]): DObject {
        return new Constructors(new DObject('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DObject().end();
    }
}
@RuntimeAccessible
export class LObject<Context extends LogicContext<DObject> = any, C extends Context = Context>  extends LNamedElement { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DObject;
    id!: Pointer<DObject, 1, 1, LObject>;
    // static singleton: LObject;
    // static logic: typeof LObject;
    // static structure: typeof DObject;

    // inherit redefine
    parent!: LModel[]; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: LModel;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    instanceof!: LClass[];

    protected get_instanceof(context: Context): this["instanceof"] {
        return context.data.instanceof.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_instanceof(val: PackArr<this["instanceof"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'instanceof', list, "", true);
        return true;
    }
}
DNamedElement.subclasses.push(DObject);
LNamedElement.subclasses.push(LObject);


@RuntimeAccessible
export class DValue extends DPointerTargetable { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    // static singleton: LValue;
    // static logic: typeof LValue;
    // static structure: typeof DValue;

    // inherit redefine
    id!: Pointer<DValue, 1, 1, LValue>;
    parent: Pointer<DObject, 0, 'N', LObject> = [];
    father!: Pointer<DObject, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    // personal
    instanceof: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];

    public static new(name?: DNamedElement["name"]): DValue {
        return new Constructors(new DValue('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DValue().end();
    }
}
@RuntimeAccessible
export class LValue<Context extends LogicContext<DValue> = any, C extends Context = Context>  extends LModelElement { // extends DModelElement, m1 value (attribute | reference)
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DValue;
    id!: Pointer<DValue, 1, 1, LValue>;
    // static singleton: LValue;
    // static logic: typeof LValue;
    // static structure: typeof DValue;

    // inherit redefine
    parent!: LObject[]; // todo: problema m1 model can contain objects without package, it's only a web of objects with a object root actually.
    father!: LObject;
    annotations!: LAnnotation[];
    // personal
    instanceof!: LStructuralFeature [];

    protected get_instanceof(context: Context): this["instanceof"] {
        return context.data.instanceof.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_instanceof(val: PackArr<this["instanceof"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'instanceof', list, "", true);
        return true;
    }
}
DNamedElement.subclasses.push(DValue);
LNamedElement.subclasses.push(LValue);



@RuntimeAccessible
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
    // modellingElements: Pointer<DModelElement, 0, 'N', LModelElement> = [];

    public static new(name?: DNamedElement["name"], packages: DModel["packages"] = []): DModel {
        return new Constructors(new DModel('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DModel().end();
    }
}

@RuntimeAccessible
export class LModel<Context extends LogicContext<DModel> = any, C extends Context = Context>  extends LNamedElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DModel;
    id!: Pointer<DModel, 1, 1, LModel>;
    // static singleton: LModel;
    // static logic: typeof LModel;
    // static structure: typeof DModel;

    // inherit redefine
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    name!: string;
    // personal
    packages!: LPackage[];
    // modellingElements!: LModelElement[];

    // utilities to go down in the tree (plural names)
    enums!: LEnumerator[] | null;
    classes!: LClass[] | null;
    operations!: LOperation[] | null;
    parameters!: LParameter[] | null;
    exceptions!: LClassifier[] | null;
    attributes!: LAttribute[] | null;
    references!: LReference[] | null;
    literals!: LEnumLiteral[] | null;
    allSubAnnotations!: LAnnotation[] | null;
    allSubPackages!: LPackage[] | null;

    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DPackage, 1, 'N'> {
        return [...(super.get_childrens_idlist(context) as Pointer<DAnnotation | DPackage, 1, 'N'>), ...context.data.packages]; }

    protected get_delete(context: Context): () => void {
        const ret = () => { alert("todo delete LModel"); }
        return ret;
    }


     protected get_packages(context: Context): this["packages"] {
        return context.data.packages.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }

    protected set_packages(val: PackArr<this["packages"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'packages', list, "", true);
        return true;
    }
    /*
    protected get_classes(context: Context): this["classes"] {
        let classifiers: LClassifier[][] | LClassifier[] = context.proxyObject.packages.map((pkg) => { return pkg.classifiers; });
        classifiers = classifiers.reduce(function(prev, next) { return prev.concat(next); });
        return classifiers.filter((feature) => { return feature.className === DClass.name }).map((feature) => { return feature as LClass; })
    }

    protected get_enumerators(context: Context): this["enums"] {
        let classifiers: LClassifier[][] | LClassifier[] = context.proxyObject.packages.map((pkg) => { return pkg.classifiers; });
        classifiers = classifiers.reduce(function(prev, next) { return prev.concat(next); });
        return classifiers.filter((feature) => { return feature.className === DEnumerator.name }).map((feature) => { return feature as LEnumerator; })
    }
    */
     protected get_classes(context: Context): this["classes"] {
        const s: IStore = store.getState();
        return this.get_allSubPackages(context, s).flatMap(p => p.classes || []);
     }

    protected get_enums(context: Context): this["enums"] {
         return this.get_enumerators(context);
    }

    protected get_enumerators(context: Context): this["enums"] {
        const s: IStore = store.getState();
        return this.get_allSubPackages(context, s).flatMap(p => (p.enums || []));
    }

    protected get_allSubPackages(context: Context, state?: IStore): LPackage[] {
        // return context.data.packages.map(p => LPointerTargetable.from(p));
        state = state || store.getState();
        let tocheck: Pointer<DPackage>[] = context.data.packages || [];
        let checked: Dictionary<Pointer, true> = {};
        while (tocheck.length) {
            let newtocheck: Pointer<DPackage>[] = [];
            for (let ptr of tocheck) {
                if (checked[ptr]) throw new Error("loop in packages containing themselves");
                checked[ptr] = true;
                let dpackage: DPackage = DPointerTargetable.from(ptr, state);
                U.arrayMergeInPlace(newtocheck, dpackage?.subpackages);
            }
            tocheck = newtocheck;
        }
        return LPointerTargetable.from(Object.keys(checked), state);
    }
}
DNamedElement.subclasses.push(DModel);
LNamedElement.subclasses.push(LModel);




@RuntimeAccessible
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
@RuntimeAccessible
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

@RuntimeAccessible
export class EJavaObject{

}// ??? EDataType instance?


@RuntimeAccessible
export class DMap extends Object { // DPointerTargetable
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

@RuntimeAccessible
export class LMap<Context extends LogicContext<DMap> = any, C extends Context = Context>  extends LPointerTargetable {
    // static logic: typeof LModelElement;
    // static structure: typeof DModelElement;
    // static singleton: LModelElement;
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    __isLMap!: true;
    // id!: Pointer<DModelElement, 1, 1, LModelElement>;
}
DPointerTargetable.subclasses.push(DMap as any);
LPointerTargetable.subclasses.push(LMap);




/*
function makeKeyf<NS extends string, N extends string>(n1: NS, n2: N) {
    return n1 + '' + n2 as `${NS}${N}`
}
type makeKey<NS extends string, N extends string> =`${NS}${N}`;
type filter_set_keys<T> = { [K in keyof T]: K extends `set_${string}` ? T[K] : never };
*/









/*

let a = ``  // ... get from export in index.ts
a = a.replaceAll(',,', ",")
let aa = a.split(",").map(a => a.trim().substring(1));

function onlyUnique(value, index, self) { return self.indexOf(value) === index; }

aa = aa.filter(onlyUnique).filter( a=> !!a)
let r = aa.filter(onlyUnique).filter( a=> !!a).map( a=> `export type W${a} = getWParams<L${a}, D${a}>;`).join('\n')
document.body.innerText = r;
*/



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


let alld: GObject = {
    DModelElement,
    DModel,
    DValue,
    DNamedElement,
    DObject,
    DEnumerator,
    DEnumLiteral,
    DAttribute,
    DReference,
    DStructuralFeature,
    DClassifier,
    DDataType,
    DClass,
    DParameter,
    DOperation,
    DPackage,
    DTypedElement,
    DAnnotation,
    DFactory_useless_, DMap};
let alll: GObject = {
    LModelElement,
    LModel,
    LValue,
    LNamedElement,
    LObject,
    LEnumerator,
    LEnumLiteral,
    LAttribute,
    LReference,
    LStructuralFeature,
    LClassifier,
    LDataType,
    LClass,
    LParameter,
    LOperation,
    LPackage,
    LTypedElement,
    LAnnotation,
    LFactory_useless_, LMap};

// let all: any = [...alld, ...alll, EJavaObject,];

