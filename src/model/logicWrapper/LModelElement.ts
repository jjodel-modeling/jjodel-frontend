import {
    BEGIN,
    Constructors,
    CreateElementAction,
    DEdge,
    DeleteElementAction,
    Dictionary,
    DPointerTargetable,
    DtoL,
    END,
    getWParams, GObject,
    IStore,
    Leaf,
    LEdge,
    LGraphElement,
    Log,
    LogicContext,
    LPointerTargetable,
    Node, orArr,
    Pack,
    Pack1,
    PackArr, PointedBy,
    Pointer,
    Pointers,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    Selectors,
    SetFieldAction,
    SetRootFieldAction, ShortAttribETypes, ShortAttribSuperTypes,
    store, Subtract, TargetableProxyHandler,
    U, unArr,
    UX,
    WPointerTargetable
} from "../../joiner";
import {Json, PrimitiveType} from "../../joiner/types";

import {
    AccessModifier, ECoreAnnotation, ECoreAttribute,
    ECoreClass, ECoreDetail,
    ECoreEnum,
    EcoreLiteral, ECoreOperation,
    ECorePackage,
    EcoreParser,
    ECoreReference,
    ECoreRoot
} from "../../api/data";


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

@Leaf
@RuntimeAccessible
export class DAnnotationDetail extends DPointerTargetable{
    // todo
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
    childrens!: (LPackage | LClassifier | LTypedElement | LAnnotation | LObject | LValue)[];
    nodes!: LGraphElement[];
    node!: LGraphElement | null;

    // utilities to go up in the tree (singular names)
    model!: LModel; // utility, follow father chain until get a Model parent or null
    package!: LPackage | null;
    class!: LClass | null;
    enum!: LEnumerator | null;
    operation!: LOperation | null;
    subNodes!: LGraphElement[] | null;




    property!: keyof DModelElement;
    containers!: LNamedElement[]; // list of fathers until the model is reached.

    public generateEcoreJson(loopDetectionloopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json { throw new Error("cannot be called directly, should trigger getter. this is only for correct signature"); }
    private get_generateEcoreJson(context: Context): (loopdetectionobj: Dictionary<Pointer, DModelElement>) => Json { return (loopdetectionobj) => this.generateEcoreJson_impl(context, loopdetectionobj); }
    protected generateEcoreJson_impl(context: Context, loopDetectionObj?: Dictionary<Pointer, DModelElement>): Json{ return Log.exDevv("generateEcoreJson() should be overridden", context); }



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


    protected get_namespace(context: Context): string { throw new Error("?? get namespace ?? todo"); return ""; }

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
        return (context.data.className.substring(1) + "s").toLowerCase() as any;
    }
    protected targetRemoved(context: Context, field: keyof DPointerTargetable): void {
        context.proxyObject.delete();
    }

    public superDelete(): void {}
    protected get_superDelete(context: Context): () => void {
        const obj = context.proxyObject;

        let property = obj.property;
        const father = obj.father.id;
        const pointerPairs = new Set<string[]>();

        for(let pointedBy of obj.pointedBy) {
            const str = pointedBy.source;
            const pointer = str.substring(str.indexOf(".") + 1, str.lastIndexOf("."));
            const label = str.substring(str.lastIndexOf(".") + 1);
            if(pointer) { pointerPairs.add([pointer, label]); }
        }

        for(let pair of pointerPairs) {
            const pointer = pair[0]; const label = pair[1];
            const deleted = Selectors.getDeleted();
            const lPointer: LPointerTargetable = LPointerTargetable.fromPointer(pointer);
            const ignoredLabels = ['extendedBy', 'instances', 'value'];
            if(lPointer && lPointer.id !== father && !deleted.includes(pointer)) {
                if(!ignoredLabels.includes(label)) {
                    SetRootFieldAction.new("deleted", pointer, "+=", false);
                    lPointer.delete();
                }
                if(label === 'value') {
                    const dValue: DValue = DValue.fromPointer(lPointer.id);
                    SetFieldAction.new(dValue, 'value', dValue.value.indexOf(obj.id as string), '-=', true);
                }
                if(label === 'extendedBy') {
                    const dClass: DClass = DClass.fromPointer(lPointer.id);
                    SetFieldAction.new(dClass, label, dClass.extendedBy.indexOf(obj.id as string), '-=', true);
                }
            }
        }

        const dFather = DPointerTargetable.fromPointer(father);
        const fatherProperties = dFather[property] as string[];
        const list = fatherProperties.filter((prop) => { return prop !== obj.id });
        const ret = () => {
            BEGIN();
            SetFieldAction.new(dFather, property, list, '', false);
            DeleteElementAction.new(obj.id);
            END();
        }
        return ret;
    }


    protected get_delete(context: Context): () => void {
        const ret = () => { context.proxyObject.superDelete() }
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

    protected get_nodes(context: Context): LGraphElement[] {
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

    protected get_node(context: Context): LGraphElement|null {
        const nodes = context.proxyObject.nodes;
        const node = (nodes.length > 0) ? nodes[0] : null;
        return node;
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
    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DPackage | DClassifier | DEnumerator | DEnumLiteral | DParameter | DStructuralFeature | DOperation | DObject | DValue, 1, 'N'>  { // LPackage | LClassifier | LTypedElement | LAnnotation | LEnumLiteral | LParameter | LStructuralFeature | LOperation
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
        CreateElementAction.new(dPackage);
        let wModel = WPointerTargetable.fromD(dModel);
        wModel.packages = [...dModel.packages, dPackage];
    }

    private static addSubPackage(dPackage: DPackage): void {
        const lPackage: LPackage = LPackage.from(dPackage);
        let name = 'subpackage_' + 0;
        let childrenNames: (string)[] = lPackage.childrens.map( p => (p as LPackage).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
        const dSubPackage = DPackage.new(name);
        CreateElementAction.new(dSubPackage);
        let wPackage = WPointerTargetable.fromD(dPackage);
        wPackage.subpackages = [...dPackage.subpackages, dSubPackage];
    }

    protected get_addClass(context: LogicContext<DPackage>): () => void {
        const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data : null;
        let ret = () => {};
        if (!dPackage) return ret;
        const lPackage: LPackage = LPointerTargetable.from(dPackage);
        let name = 'class_' + 0;
        let childrenNames: (string)[] = lPackage.childrens.map( c => (c as LClassifier).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);

        ret = function(){
            //BEGIN()
            const dClass = DClass.new(name);
            CreateElementAction.new(dClass);
            let wPackage = WPointerTargetable.fromD(dPackage);
            wPackage.classifiers = [...dPackage.classifiers, dClass];
            //END()
        }
        ret();
        return ret;
    }

    protected get_addAttribute(context: LogicContext<DClass>): () => void {
        const dClass: DClass | null = (context.data?.className === "DClass") ? {...context.data} as DClass : null;
        if (!dClass) return () => {};
        const lClass: LClass = LPointerTargetable.from(dClass);
        let name = 'attribute_' + 0;
        let childrenNames: (string)[] = lClass.attributes.map( c => (c).name);
        name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);
        const lString: LClassifier = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes());

        const ret = function () {
            const dAttribute = DAttribute.new(name, lString.id);
            // BEGIN()
            CreateElementAction.new(dAttribute);

            const wClass = WPointerTargetable.fromD(dClass);
            wClass.attributes = [...dClass.attributes, dAttribute];
            // const wAttribute = WPointerTargetable.fromD(dAttribute);
            // END()
            /**
             * damiano: it was like this in your version??
             BEGIN()
             SetFieldAction.new(dAttribute, 'type', lType.id, '', true);
             SetFieldAction.new(dAttribute, 'father', dClass.id, '', true);
             SetFieldAction.new(dClass, 'attributes', dAttribute.id, '+=', true);
             END()
             const targets: Set<DClass> = new Set(); targets.add(dClass);
             for(let target of targets) {
                for(let ext of target.extendedBy) {
                    targets.add(DClass.fromPointer(ext));
                }
            }
             for(let target of targets) {
                for(let instance of target.instances) {
                    const dValue: DValue = DValue.new(dAttribute.name);
                    const dObject: DObject = DObject.fromPointer(instance);
                    CreateElementAction.new(dValue);
                    BEGIN()
                    SetFieldAction.new(dValue, 'value', U.initializeValue(lType.id), '+=', false);
                    SetFieldAction.new(dValue, 'father', dObject.id, '', true);
                    SetFieldAction.new(dValue, 'instanceof', dAttribute.id, '', true);
                    SetFieldAction.new(dAttribute, 'instances', dValue.id, '+=', true);
                    SetFieldAction.new(dObject, 'features', dValue.id, '+=', true);
                    END()
                }
            }
             */

        }
        ret();
        return ret;
    }

    protected get_addReference(context: LogicContext<DClass>): (() => void) {
        const dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
        if (!dClass) return () => {};
        const lClass: LClass = LPointerTargetable.from(dClass);
        let name = 'reference_' + 0;
        const childrenNames: (string)[] = lClass.references.map( c => (c).name);
        name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)

        const ret = () =>  {
            const dReference = DReference.new(name);
            // BEGIN()
            CreateElementAction.new(dReference);
            const wReference = WPointerTargetable.fromD(dReference);
            wReference.type = dClass.id;
            const wClass = WPointerTargetable.fromD(dClass);
            wClass.references = [...dClass.references, dReference];
            // END()
        }
        /*damiano: it was like this in your version

        const ret = function () {
            const dReference = DReference.new(name);
            CreateElementAction.new(dReference);
            BEGIN()
            SetFieldAction.new(dReference, 'type', dClass.id, '', true);
            SetFieldAction.new(dReference, 'father', dClass.id, '', true);
            SetFieldAction.new(dClass, 'references', dReference.id, '+=', true);
            SetFieldAction.new(dClass, 'referencedBy', dReference.id, '+=', true);
            END()
            const targets: Set<DClass> = new Set(); targets.add(dClass);
            for(let target of targets) {
                for(let ext of target.extendedBy) { targets.add(DClass.fromPointer(ext)); }
            }
            for(let target of targets) {
                for (let instance of target.instances) {
                    const dValue: DValue = DValue.new(dReference.name);
                    const dObject: DObject = DObject.fromPointer(instance);
                    CreateElementAction.new(dValue);
                    BEGIN()
                    SetFieldAction.new(dValue, 'value', U.initializeValue(dReference.type), '+=', false);
                    SetFieldAction.new(dValue, 'father', dObject.id, '', true);
                    SetFieldAction.new(dValue, 'instanceof', dReference.id, '', true);
                    SetFieldAction.new(dReference, 'instances', dValue.id, '+=', true);
                    SetFieldAction.new(dObject, 'features', dValue.id, '+=', true);
                    END()
                }
            }
        * */
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
        ret = () => {
            const dEnumerator = DEnumerator.new(name);
            CreateElementAction.new(dEnumerator);
            const wPackage = WPointerTargetable.fromD(dPackage);
            wPackage.classifiers = [...dPackage.classifiers, dEnumerator];
        }
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
        ret = () => {
            const dLiteral = DEnumLiteral.new(name);
            CreateElementAction.new(dLiteral);
            const wEnum = WPointerTargetable.fromD(dEnum);
            wEnum.literals = [...dEnum.literals, dLiteral];
        }
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

            ret = () => {
                const dOperation = DOperation.new(name);
                CreateElementAction.new(dOperation);
                const wClass = WPointerTargetable.fromD(dClass);
                wClass.operations = [...dClass.operations, dOperation];

                const dParameter = DParameter.new("return", Selectors.getReturnTypes()[0].id);
                CreateElementAction.new(dParameter);
                const wOperation = WPointerTargetable.fromD(dOperation);
                wOperation.parameters = [...dOperation.parameters, dParameter];
            }
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
            const lString: LClass = LPointerTargetable.from(Selectors.getFirstPrimitiveTypes());

            ret = () => {
                const dParameter = DParameter.new(name);
                CreateElementAction.new(dParameter);
                const wParameter = WPointerTargetable.fromD(dParameter);
                wParameter.type = lString.id;
                const wOperation = WPointerTargetable.fromD(dOperation);
                wOperation.parameters = [...dOperation.parameters, dParameter];
            }
        }
        ret();
        return ret;
    }

    protected get_addException(context: Context): () => void {
        let ret = () => {};
        const dOperation: DOperation | null = (context.data?.className === "DOperation") ? context.data as DOperation : null;
        if (dOperation) {
            const dClass = DPointerTargetable.from(dOperation.father);
            ret = () => {
                SetFieldAction.new(dOperation, "exceptions", dClass.id, '+=', true);
            }
        }
        ret();
        return ret;
    }

    // activated by user in JSX
    // todo: this.wrongAccessMessage("addClass");
    protected cannotCall(name: string, ...params: string[]): any {
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
/* damiano: why removed? or just moved?
    protected _addException(dOperation: DOperation, dClass: DClass): void {
        SetFieldAction.new(dOperation, "exceptions", dClass.id, '+=', true);
    }

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

 */
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
    details!: DAnnotationDetail[];//Dictionary<string, string>;

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
    details!: LAnnotationDetail[];// Dictionary<string, string> = {};

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        EcoreParser.write(json, ECoreAnnotation.source, context.data.source);
        // EcoreParser.write(json, ECoreAnnotation.references, context.proxyObject.referencesStr);
        EcoreParser.write(json, ECoreAnnotation.details, context.proxyObject.details.map( d => d.generateEcoreJson(loopDetectionObj)));
        return json; }

    protected get_source(context: Context): this["source"] { return context.data.source; }
    protected set_source(val: this["source"], context: Context): boolean {
        SetFieldAction.new(context.data, 'source', val, '', false);
        return true;
    }
    protected get_details(context: Context): this["details"] { return TargetableProxyHandler.wrapAll(context.data.details); }
    protected set_details(val: this["details"], context: Context): boolean {
        SetFieldAction.new(context.data, 'details', val);
        return true;
    }
}

DModelElement.subclasses.push(DAnnotation);
LModelElement.subclasses.push(LAnnotation);

@Leaf
@RuntimeAccessible
export class LAnnotationDetail<Context extends LogicContext<DAnnotationDetail> = any> extends LModelElement{ // todo
    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        // loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        // if (context.data.name !== null) EcoreParser.write(json, ECoreDetail.key, context.data.name);
        // if (context.data.value !== null) EcoreParser.write(json, ECoreDetail.value, context.data.value);
        return json; }
}
DModelElement.subclasses.push(DAnnotationDetail);
LModelElement.subclasses.push(LAnnotationDetail);

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
    parent!: LModelElement[];
    father!: LModelElement;
    annotations!: LAnnotation[];
    // personal
    name!: string;
    namespace!: string;
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

    protected get_namespace(context: Context): string { throw new Error("?? get namespace ?? todo"); return ""; }

    protected get_fullname(context: Context): this["fullname"] {
        const containers = this.get_containers(context);
        let fullname: string = containers.reverse().slice(1, containers.length).map(c => c.name).join('.');
        return fullname; }


    protected get_name(context: Context): this["name"] { return context.data.name; }
    protected set_name(val: this["name"],  context: Context): boolean {
        let name = val;
        const father = context.proxyObject.father;
        if(father) {
            const check = father.childrens.filter((child) => {
                return child.className !== 'DAnnotation' &&
                    (DNamedElement.fromPointer(child.id) as DNamedElement).name === name
            });
            if(check.length > 0){
                alert('This name is already taken!');
                return true
            }
        }
        SetFieldAction.new(context.data, 'name', name, '', false);
        return true;

        /*
        // this autofix removes spaces with _
        if (val.match(/\s/)) val = this._autofix_name(val, context);
        // todo: validate if operation can be completed or need autocorrection, then either return false (invalid parameter cannot complete) or send newVal at redux
        const fixedVal: string = val;
        SetFieldAction.new(context.data, 'name', fixedVal, '', false);
        return true;
        */
    }
    protected _autofix_name(val: string, context: Context): string {
        // NB: NON fare autofix di univocità nome tra i childrens o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
        return val.replaceAll(/\s/g, '_');
    }
    protected get_autofix_name(val: string, context: Context): (val: string) => string { return (val: string) => this._autofix_name(val, context); }
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
    instances!: Pointer<DValue, 0, 'N', LValue>;
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


    protected get_classType(context: Context): this["classType"] { let type = this.get_type(context); return type.isClass ? type as LClass : undefined; }
    protected get_enumType(context: Context): this["enumType"] { let type = this.get_type(context); return type.isEnum ? type as LEnumerator : undefined; }
    protected get_primitiveType(context: Context): this["primitiveType"] { let type = this.get_type(context); return type.isPrimitive ? type as LClass : undefined; }
    protected get_type(context: Context): this["type"] { return LPointerTargetable.from(context.data.type); }
    protected set_type(val: Pack1<this["type"]>, context: Context): boolean {
        const data = context.data;
        let instances: LValue[] = context.proxyObject.instances;
        /* damiano: riscritto nel rigo di sopra
        if(data.className === 'DAttribute') {
            const lAttribute: LAttribute = LAttribute.fromPointer(data.id);
            instances = [...lAttribute.instances];
        }
        if(data.className === 'DReference') {
            const lReference: LReference = LReference.fromPointer(data.id);
            instances = [...lReference.instances];
        }*/

        /* non più necessario: tenta di effettuare un cast autonomamente
        for(let instance of instances) {
            const wInstance = WPointerTargetable.fromL(instance);
            wInstance.value = [U.initializeValue(val)];
        }*/
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

    public typeToEcoreString(): string { return this.cannotCall("typeToEcoreString"); }
    protected get_typeToEcoreString(context: Context): () => string {
        // if (context.data.classType) return EcoreParser.classTypePrefix + context.proxyObject.classType.name;
        // if (context.data.enumType) return EcoreParser.classTypePrefix + context.proxyObject.enumType.name;
        // if (context.data.primitiveType) return context.proxyObject.primitiveType.long;
        return ()=> context.proxyObject.type.typeEcoreString; }

    public typeToShortString(): string { return this.cannotCall("typeToShortString"); }
    protected get_typeToShortString(context: Context): () => string {
        // if (context.data.classType) return '' + context.data.classType.name;
        // if (context.data.enumType) return '' + context.data.enumType.name;
        // if (context.data.primitiveType) return '' + context.data.primitiveType.getName();
        return () => context.proxyObject.type.typeString; }

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
        return (context.proxyObject.classType as LClass).isExtending(other.classType as LClass); }

}

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
    defaultValue!: Pointer<DObject, 1, 1, LObject>[] | string[];
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

    protected get_instanceClassName(context: Context): this["instanceClassName"] { return context.data.instanceClassName; }
    protected set_instanceClassName(val: this["instanceClassName"], context: Context): boolean {
        SetFieldAction.new(context.data, 'instanceClassName', val, "", false);
        return true;
    }

    protected set_isPrimitive(val: this["isPrimitive"], context: Context): boolean { return this.cannotSet("isPrimitive"); }
    protected set_isClass(val: this["isClass"], context: Context): boolean { return this.cannotSet("isClass"); }
    protected set_isEnum(val: this["isEnum"], context: Context): boolean { return this.cannotSet("isEnum"); }
    protected get_isPrimitive(context: Context): this["isPrimitive"] { return !!((context.data as DClass).isPrimitive as unknown); }
    protected get_isClass(context: Context): this["isClass"] { return (context.data as DClass).isPrimitive ? false : context.data.className === DClass.name; }
    protected get_isEnum(context: Context): this["isEnum"] { return context.data.className === DEnumerator.name; }
    protected set_defaultValue(val: this["defaultValue"] | DClassifier["defaultValue"], context: Context): boolean {
        if (typeof val !== "object" && !Pointers.isPointer(val)) {
            // primitive default value for enums
            SetFieldAction.new(context.data, 'defaultValue', val, "", false);
        }
        else {
            SetFieldAction.new(context.data, 'defaultValue', Pointers.from(val as Pointer[]) || [], "", true);
        }
        return true;
    }

    typeEcoreString!: string;
    typeString!: string;
    private get_typeEcoreString(context: Context) {
        return EcoreParser.classTypePrefix + context.data.name;
    }
    private get_typeString(context: Context) {
        return context.data.name;
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
        const oldList = context.data.classifiers;
        const diff = U.arrayDifference(oldList, list);
        //BEGIN();
        SetFieldAction.new(context.data, 'classifiers', list, "", true);
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
        //END();
        return true;
    }

    protected get_subpackages(context: Context): this["subpackages"] {
        return context.data.subpackages.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_subpackages(val: PackArr<this["subpackages"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.subpackages;
        const diff = U.arrayDifference(oldList, list);
        //BEGIN();
        SetFieldAction.new(context.data, 'subpackages', list, "", true);
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
        //END();
        return true;
    }

    protected get_uri(context: Context): this["uri"] { return context.data.uri; }
    protected set_uri(val: this["uri"], context: Context): boolean {
        SetFieldAction.new(context.data, 'uri', val, "", false);
        return true;
    }

    protected get_delete(context: Context): () => void {
        const ret = () => {
            const classes = context.proxyObject.classes;
            let check = false
            for(let lClass of classes) {
                check = lClass.instances.length > 0;
                if(check) break;
            }
            if(check) alert('Cannot delete the package since there are instances');
            else context.proxyObject.superDelete();
        };
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
    exceptions!: LClassifier[];
    parameters!: LParameter[];
    visibility!: AccessModifier;


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
        const oldList = context.data.parameters;
        const diff = U.arrayDifference(oldList, list);
        //BEGIN();
        SetFieldAction.new(context.data, 'parameters', list, "", true);
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
        //END();
        return true;
    }
    /*
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
    */
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
/*
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
                SetFieldAction.new(dParameter, "type", null as any); // while reworking .delete(): null = void, questo setta void e deve essere tenuto come azione diversa dal default delete
            };
        }
        ret();
        return ret;
    }
    */
}
DTypedElement.subclasses.push(DParameter);
LTypedElement.subclasses.push(LParameter);






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
    extendedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // mia aggiunta:
    isPrimitive!: boolean;
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // for m1:
    hideExcessFeatures: boolean = true; // damiano: se attivo questo e creo una DClass di sistema senza nessuna feature e di nome Object, ho creato lo schema di un oggetto schema-less a cui tutti sono conformi

    public static new(name?: DNamedElement["name"], isInterface: DClass["interface"] = false, isAbstract: DClass["abstract"] = false, isPrimitive: DClass["isPrimitive"] = false): DClass {
        return new Constructors(new DClass('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DClass(isInterface, isAbstract, isPrimitive).end();
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
    extendedBy!: LClass[];
    nodes!: LGraphElement[]; // ipotesi, non so se tenerlo

    // mia aggiunta:
    isPrimitive!: boolean;
    isClass!: boolean; // false if it's primitive type
    isEnum!: false;
    implements: Pointer<DClass, 0, 'N', LClass> = [];
    implementedBy: Pointer<DClass, 0, 'N', LClass> = [];

    // utilities to go down in the tree (plural names)
    exceptions!: LClassifier[] | null;
    parameters!: LParameter[] | null;


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

    get_childrens_idlist(context: Context): Pointer<DAnnotation | DStructuralFeature | DOperation, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DStructuralFeature, 1, 'N'>, ...context.data.attributes, ...context.data.references, ...context.data.operations]; }

    protected get_abstract(context: Context): this["abstract"] { return context.data.abstract; }
    protected set_abstract(val: this["abstract"], context: Context): boolean {
        const data = context.data;
        if(val && data.instances.length > 0) {
            alert('Cannot change the abstraction level since there are instances of this class');
        } else {
            SetFieldAction.new(data, 'abstract', val);
        }
        return true;
    }

    protected set_isPrimitive(val: this["isPrimitive"], context: Context): boolean { SetFieldAction.new(context. data, 'isPrimitive', val); return true; }
    // get is in classifier with all other "type"s getter and setter

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
        const oldList = context.data.operations;
        const diff = U.arrayDifference(oldList, list);
        //BEGIN();
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
        //END();
        return true;
    }

    protected get_features(context: Context): this["features"] {
        return context.data.features.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_features(val: PackArr<this["features"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.features;
        const diff = U.arrayDifference(oldList, list);
        //BEGIN();
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
        //END();
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
        //BEGIN();
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
        //END();
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
        //BEGIN();
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
        //END();
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
        /// what if there are multiple operations sharing the same exception? exception should not be deleted if operation is.
        const data = context.data;
        const lData = context.proxyObject;

        let childInstances = 0;
        for(let child of lData.extendedBy) { childInstances += child.instances.length; }

        const ret = () => {
            if(data.instances.length > 0 || childInstances > 0) {
                alert('Cannot delete the class since there are instances');
            } else lData.superDelete();
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

    public instance(): DObject { return this.cannotCall('instance'); }
    private get_instance(context: Context): () => DObject {
        return () => {
            const dClass: DClass = context.data;
            const lClass: LClass = LClass.from(dClass);
            const dObject = DObject.new('instance');
            CreateElementAction.new(dObject);
            BEGIN()
            SetFieldAction.new(dObject, 'instanceof', dClass.id, '', true);
            SetFieldAction.new(dClass, 'instances', dObject.id, '+=', true);
            END()
            // damiano: weird transaction placement. double-check it
            let father: LClass|undefined = lClass;
            while(father) {
                for(let dFeature of [...father.attributes, ...father.references]) {
                    const dValue = DValue.new(dFeature.name); dValue.value = [U.initializeValue(dFeature.type)];
                    CreateElementAction.new(dValue);
                    BEGIN()
                    SetFieldAction.new(dValue, 'father', dObject.id, '', true);
                    SetFieldAction.new(dValue, 'instanceof', dFeature.id, '', true);
                    SetFieldAction.new(dFeature, 'instances', dValue.id, '+=', true);
                    SetFieldAction.new(dObject, 'features', dValue.id, '+=', true);
                    END()
                }
                father = (father.extends.length > 0) ? father.extends[0] : undefined;
            }
            return dObject;
        };
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>[] | string[];
    // personal
    serializable: boolean = true;
    usedBy: Pointer<DAttribute, 0, 'N', LAttribute> = [];


    public static new(name?: DNamedElement["name"]): DDataType {
        return new Constructors(new DDataType('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DClassifier().DDataType().end();
    }
}

@RuntimeAccessible
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
    defaultValue!: (Pointer<DObject, 1, 1, LObject> | PrimitiveType)[];

    public static new(name?: DNamedElement["name"], type?: DTypedElement["type"]): DStructuralFeature {
        return new Constructors(new DStructuralFeature('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DTypedElement(type).DStructuralFeature().end();
    }
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
    namespace!: string;
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
    // defaultValueLiteral!: string;
    defaultValue!: (LObject[] | PrimitiveType[]);
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
/*
    protected get_defaultValueLiteral(context: Context): this["defaultValueLiteral"] { return context.data.defaultValueLiteral; }
    protected set_defaultValueLiteral(val: this["defaultValueLiteral"], context: Context): boolean {
        SetFieldAction.new(context.data, 'defaultValueLiteral', val, "", false);
        return true;
    }*/
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
    defaultValue!: Pointer<DObject, 1, 1, LObject>[];

    // personal
    containment: boolean = false;
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
    derived!: boolean;
    defaultValueLiteral!: string;
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];
    defaultValue!: LObject[];

    // personal
    containment!: boolean;
    container!: boolean;
    resolveProxies!: boolean;
    opposite?: LReference;
    target!: LClass[];
    edges!: LEdge[];



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
        if (d.containment != null) { model[ECoreReference.containment] = d.containment; }
        return model; }

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

    protected get_target(context: Context): this["target"] { return context.data.target.map(pointer => LPointerTargetable.from(pointer)); }
    protected set_target(val: PackArr<this["target"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'target', list, "", true);
        return true;
    }

    protected get_defaultValue(context: Context): this["defaultValue"] { return LPointerTargetable.fromPointer(context.data.defaultValue); }
    protected set_defaultValue(val: PackArr<this["defaultValue"]>, context: Context): boolean {
        // @ts-ignore
        if (!val) (val) = []; else if (!Array.isArray(val)) val = [val];
        let ptrs = Pointers.from(val);
        SetFieldAction.new(context.data, 'defaultValue', ptrs, '', false);
        return true; }

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

    /*
    protected get_delete(context: Context): () => void {
        const dReference: DReference = context.data;
        const dClass: DClass = Selectors.getDElement<DClass>(dReference.father);
        const dType: DClass = Selectors.getDElement<DClass>(dReference.type as string);
        const dEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
        const ret = () => {
            SetFieldAction.new(dClass, "references", U.removeFromList(dClass.references, dReference.id), '', true);
            // SetFieldAction.new(dType, "pointedBy", U.removeFromList(dType.pointedBy, dReference.id));
            // SetRootFieldAction.new("references", U.removeFromList(Selectors.getAllReferences(), dReference.id));
            ///////// this kind of deletion might fail if there are multiple ones of this kind fired at once. you remove elements 2° and 5°,
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
    */
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
    defaultValue!: PrimitiveType[];

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
    derived!: boolean;
    // defaultValueLiteral!: string;
    defaultValue!: PrimitiveType[];
    parent!: LClass[];
    father!: LClass;
    instances!: LValue[];

    // personal
    isID: boolean = false; // ? exist in ecore as "iD" ?

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

    protected get_ID(context: Context): this["isID"] { return context.data.isID; }
    protected set_ID(val: this["isID"], context: Context): boolean {
        SetFieldAction.new(context.data, 'isID', val);
        return true;
    }
    protected get_defaultValue(context: Context): this["defaultValue"] { return context.data.defaultValue; }
    protected set_defaultValue(val: unArr<this["defaultValue"]>, context: Context): boolean {
        // @ts-ignore
        if (!val) (val) = []; else if (!Array.isArray(val)) val = [val];
        SetFieldAction.new(context.data, 'defaultValue', val, '', false);
        return true; }

    /*
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

     */

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
    ordinal: number=1;
    literal!: string;

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
    namespace!: string;
    // personal
    value!: number;
    ordinal!: number;
    literal!: string;

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        const json: Json = {};
        const d = context.data;
        json[EcoreLiteral.value] = d.ordinal;
        json[EcoreLiteral.literal] = d.literal;
        json[EcoreLiteral.namee] = d.name;
        return json; }


    protected get_value(context: Context): this["value"] { return context.data.value; }
    protected set_value(val: this["value"], context: Context): boolean {
        SetFieldAction.new(context.data, 'value', val);
        return true;
    }

    /*
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

     */
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
    defaultValue!: string[];
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
export class LEnumerator<Context extends LogicContext<DEnumerator> = any, C extends Context = Context> extends LDataType { // DDataType
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
    usedBy!: LAttribute[];
    isPrimitive!: false;
    isClass!: false;
    isEnum!: true;
    // personal
    literals!: LEnumLiteral[];

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

    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DEnumLiteral, 1, 'N'>, ...context.data.literals]; }

    protected get_literals(context: Context): this["literals"] {
        return context.data.literals.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }
    protected set_literals(val: PackArr<this["literals"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.literals;
        const diff = U.arrayDifference(oldList, list);
        BEGIN();
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
        END();
        return true;
    }
/*
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

 */
}
DDataType.subclasses.push(DEnumerator);
LDataType.subclasses.push(LEnumerator);


// damianoo:_ you deleted everything from DObject to LValue included? or just moved them?

@RuntimeAccessible
export class DModelM1 extends DNamedElement{
    name!: string;
    roots!: Pointer<DObject, 1, 'N', LObject> // no package ma LObjects[] (solo quelli isRoot)
    childrens!: DModelM1["roots"];
}

@RuntimeAccessible
export class LModelM1 extends LNamedElement{
    name!: string;
    roots!: LObject[];
    childrens!: LModelM1["roots"];
}
DModelM1.subclasses.push(DNamedElement);
LModelM1.subclasses.push(LNamedElement);
type DPrimitiveType = DClass;
type LPrimitiveType = LClass;


// problema: o costringo l'utente a fare sempre .value per ricevere il valore invece dei metadati
// oppure ritorno il valore da subito ma dal valore non posso accedere ai metadati (upperbound...) a meno che non trovi un altor sistema.

// possibile fix: LValue.toString() che ritorna il .value





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
    isMetamodel: boolean = true;
    objects: Pointer<DObject, 0, 'N', LObject> = [];
    models: Pointer<DModel, 0, 'N', LModel> = [];

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

    // Model
    objects!: LObject[];

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
        for (let obj of context.proxyObject.objects) { json[obj.ecoreRootName] = obj.generateEcoreJson(loopDetectionObj); }

        return json; }

    protected get_models(context: Context): LModel[] {
        return LModel.fromPointer(context.data.models);
    }
    protected set_models(val: PackArr<this['models']>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.models;
        const diff = U.arrayDifference(oldList, list);
        BEGIN();
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
        END();
        return true;
    }

    protected set_name(val: this['name'], context: Context): boolean {
        const models: LModel[] = LModel.fromPointer(store.getState()['models']);
        if(models.filter((model) => { return model.name === val }).length > 0) {
            alert('This name is already taken!');
        } else {
            SetFieldAction.new(context.data, 'name', val, '', false);
        }
        return true;
    }
    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | (DPackage|DObject), 1, 'N'> {
        let children: Pointer<(DPackage|DObject), 0, 'N', (LPackage|LObject)>;
        if(context.data.isMetamodel) children = context.data.packages;
        else children = context.data.objects;
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | (DPackage|DObject), 1, 'N'>,
            ...children];
    }

    protected get_delete(context: Context): () => void {
        const ret = () => { alert('Cannot delete the metamodel!'); }
        return ret;
    }

    protected get_isMetamodel(context: Context): this['isMetamodel'] {
        return context.data.isMetamodel;
    }
    protected set_isMetamodel(val: this['isMetamodel'], context: Context): boolean {
        SetFieldAction.new(context.data, 'isMetamodel', val, '', false);
        return true;
    }

    protected get_objects(context: Context): this['objects'] {
        return context.data.objects.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }

    protected get_packages(context: Context): this["packages"] {
        return context.data.packages.map((pointer) => {
            return LPointerTargetable.from(pointer)
        });
    }

    protected set_packages(val: PackArr<this["packages"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        const oldList = context.data.packages;
        const diff = U.arrayDifference(oldList, list);
        BEGIN();
        SetFieldAction.new(context.data, 'packages', list, "", true);
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
        END();
        return true;
    }
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

@RuntimeAccessible
export class DObject extends DPointerTargetable { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    // inherit redefine
    annotations!: never[];
    id!: Pointer<DObject, 1, 1, LObject>;
    parent: Pointer<DModel | DObject, 0, 'N', LModel | LObject> = [];
    father!: Pointer<DModel | DObject, 1, 1, LModel | LObject>;
    // annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;

    // personal
    instanceof!: Pointer<DClass, 1, 1, LClass>;
    features: Pointer<DValue, 0, 'N', LValue> = [];

    public static new(name?: DNamedElement["name"]): DObject {
        return new Constructors(new DObject('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DObject().end();
    }

}

@RuntimeAccessible
export class LObject<Context extends LogicContext<DObject> = any, C extends Context = Context> extends LNamedElement { // extends DNamedElement, m1 class instance
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    public __raw!: DObject;
    id!: Pointer<DObject, 1, 1, LObject>;

    // inherit redefine
    annotations!: never[];
    childrens!: LValue[];
    parent!: (LModel | LObject)[];
    father!: LModel | LObject;
    model!: LModel;
    // annotations!: LAnnotation[];
    // from LClass

    name!: string;
    ecoreRootName!: string;
    namespace!: string;
    fullname!:string;
    defaultValue!: DClass["defaultValue"];
    abstract!: boolean;
    interface!: boolean;
    // references!: LReference[];
    // attributes!: LAttribute[];
    // operations!: LOperation[];

    // personal
    deep_subobjects!: LObject[]; // damiano: itera features (lvalue[]) deep e vitando di inserire doppioni (salva una mappatura di di già aggiunti e skip se ricompaiono)
    subobjects!: LObject[];
    // damiano: + tutte le funzioni di comodità navigazionale del modello, trattarlo un pò come se fosse un modello (e quasi può esserlo)
    instanceof!: LClass;
    features!: LValue[];
    referencedBy!: LObject[];
    isRoot!: boolean;

    // protected get_fromlclass<T extends keyof (LClass)>(meta: LClass, key: T): LClass[T] { return meta[key]; }
    public get_model(context: Context): LModelElement["model"] {
        let l: LObject | LModel = context.proxyObject;
        while (l && l.className !== DModel.name) l = l.father;
        return l as LModel; }
    protected set_name(val: string, context: Context): boolean { return this.cannotSet("name"); }
    protected get_name(context: Context): LClass["name"] { return context.proxyObject.instanceof.name; }
    protected set_namespace(val: string, context: Context): boolean { return this.cannotSet("namespace"); }
    // protected get_namespace(context: Context): LClass["namespace"] { return context.proxyObject.instanceof.namespace; }
    protected set_fullname(val: string, context: Context): boolean { return this.cannotSet("fullname"); }
    protected get_fullname(context: Context): LClass["fullname"] { return context.proxyObject.instanceof.fullname; }
    protected set_ecoreRootName(val: string, context: Context): boolean { return this.cannotSet("ecoreRootName"); }
    protected get_ecoreRootName(context: Context): LObject["ecoreRootName"] {
        let instanceoff: LClass = context.proxyObject.instanceof;
        return context.proxyObject.namespace + ":" + instanceoff.name; // optimize later in instanceoff.namespace + ":" + instanceoff.name; and implement namespace all around
    }
    protected set_abstract(val: string, context: Context): boolean { return this.cannotSet("abstract"); }
    protected get_abstract(context: Context): LClass["abstract"] { return context.proxyObject.instanceof.abstract; }
    protected set_interface(val: string, context: Context): boolean { return this.cannotSet("interface"); }
    protected get_interface(context: Context): LClass["interface"] { return context.proxyObject.instanceof.interface; }
    protected set_defaultValue(val: string, context: Context): boolean { return this.cannotSet("defaultValue"); }
    protected get_defaultValue(context: Context): LClass["defaultValue"] { return context.proxyObject.instanceof.defaultValue; }
    protected set_referencedBy(val: string, context: Context): boolean { return this.wrongAccessMessage("referencedBy cannot be set directly. It should be updated automatically as side effect"); }
    protected get_referencedBy(context: Context): LObject["referencedBy"] {
        let state: IStore = store.getState();
        let targeting: LObject[] = LPointerTargetable.fromArr(context.data.pointedBy.map( p => {
            let s: GObject = state;
            for (let key of PointedBy.getPathArr(p)) {
                s = s[key];
                if (!s) return null;
                if (s.className === DObject.name) return s.id;
            }
        }));
    return targeting; }

    // damiano: do get childrens id, verifica che lobject.childrens funzioni
    protected get_isRoot(context: Context): LObject["isRoot"] { return context.proxyObject.father.className === DModel.name; }
    protected set_isRoot(val: never, context: Context): boolean { return this.wrongAccessMessage("isRoot cannot be set directly, change father element instead."); }

    public feature(name: string): (PrimitiveType|LObject)|(PrimitiveType|LObject)[] { this.cannotCall('feature'); return null; }
    private get_feature(context: Context): (name: string) => (PrimitiveType|LObject)|(PrimitiveType|LObject)[] {
        return (name: string) => {
            const lObject = context.proxyObject;
            const features = lObject.features.filter((value) => {
                return value.instanceof.name === name
            });
            if(features.length > 0) {
                const matchedFeature = features[0];
                switch(matchedFeature.value.length) {
                    case 0: return '';
                    case 1: return matchedFeature.value[0];
                    default: return matchedFeature.value;
                }
            } return '';
        }
    }
    /*
    * damiano todo:
    *          quando setti una ref containment, gli cambi il father.
    * perchè i value di ref iniziano con valore settato a [null]? fallo partire con []
    * values selector is bugged for lval. maybe uses instanceof.name as key but it's not unique. use pointer as key ad name as label
    * */

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        let asEcoreRoot = (context.proxyObject.isRoot);
        // todo: actually use this loopdetectionobj
        const json: GObject = {};
        if (asEcoreRoot) {
            console.log("generate object ecore", {context, asEcoreRoot, json});
            const lc: LClass = context.proxyObject.instanceof;
            json[ECorePackage.xmiversion] = '2.0';
            json[ECorePackage.xmlnsxmi] = 'http://www.omg.org/XMI';
            // json[ECorePackage.xmlnsxsi] = 'http://www.w3.org/2001/XMLSchema-instance';
            json["xmlns:" + (lc.father).prefix] = 'http://www.eclipse.org/emf/2002/Ecore';
        }

        let features = context.proxyObject.features;
        for (let f of features){
            json[f.name] = f.generateEcoreJson(loopDetectionObj);
        }


        return json; }

    protected get_namespace(context: Context): string { return context.proxyObject.instanceof.father.prefix; }

    protected get_childrens_idlist(context: Context): Pointer<DAnnotation | DValue, 1, 'N'> {
        return [...super.get_childrens_idlist(context) as Pointer<DAnnotation | DValue, 1, 'N'>,
            ...context.data.features];
    }

    protected get_instanceof(context: Context): this["instanceof"] {
        const pointer = context.data.instanceof;
        return LPointerTargetable.from(pointer)
    }
    protected set_instanceof(val: PackArr<this["instanceof"]>, context: Context): boolean {
        const list = val.map((lItem) => { return Pointers.from(lItem) });
        SetFieldAction.new(context.data, 'instanceof', list, "", true);
        return true;
    }

    protected get_features(context: Context): this['features'] {
        return context.data.features.map((feature) => {
            return LPointerTargetable.from(feature)
        });
    }


    protected get_delete(context: Context): () => void {
        const ret = () => {
            const lObject = context.proxyObject;
            const lClass = lObject.instanceof;
            const classes = lClass.__raw.instances;
            const objects = [...(Selectors.getObjects().map((obj) => {return obj.id}))]
            BEGIN()
            SetFieldAction.new(lClass.__raw, 'instances', classes.indexOf(lObject.id), '-=', true);
            SetRootFieldAction.new('objects', objects.indexOf(lObject.id), '-=', false);
            END()
            lObject.superDelete();
        }
        return ret;
    }

}
DNamedElement.subclasses.push(DObject);
LNamedElement.subclasses.push(LObject);

@RuntimeAccessible
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

    // personal
    value: PrimitiveType[] | Pointer<DObject, 1, 'N', LObject> = [];
    instanceof: Pointer<DAttribute, 1, 1, LAttribute > | Pointer<DReference, 1, 1, LReference> = ''; // todo: maybe min lowerbound 0 if you want to allow free shape objects chiedere prof
    edges!: Pointer<DEdge, 0, 'N', LEdge>;
    // conformsTo!: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature>; // low priority to do: attributo fittizio controlla a quali elementi m2 è conforme quando viene richiesto

    public static new(name?: DNamedElement["name"]): DValue {
        return new Constructors(new DValue('dwc')).DPointerTargetable().DModelElement()
            .DNamedElement(name).DValue().end();
    }
}
@RuntimeAccessible
export class LValue<Context extends LogicContext<DValue> = any, C extends Context = Context> extends LModelElement { // extends DModelElement, m1 value (attribute | reference)
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
    type!: LClassifier;
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

    changeable!: boolean;
    volatile!: boolean;
    transient!: boolean;
    unsettable!: boolean;
    derived!: boolean;
    defaultValue!: DStructuralFeature["defaultValue"];
    // defaultValueLiteral!: string;
// from reference
    containment!: boolean;
    container!: boolean;
    // resolveProxies!: boolean;
    opposite?: LValue; // if DRef have opposite DRef, when you set a value ref you also set a opposite value ref from target to this src. they are always mirroring.
    // target!: LClass[]; is value[]
    edges!: LEdge[];


    // personal
    value!: PrimitiveType[] | LObject[];
    instanceof!: LAttribute | LReference;
    conformsTo!:( LAttribute | LReference)[]; // low priority to do: attributo fittizio controlla a quali elementi m2 è conforme quando viene richiesto

    protected get_edges(context: Context): this["edges"] { return LPointerTargetable.fromPointer(context.data.edges) || []; }
    protected get_fromlfeature<C, T extends keyof (C)>(meta: C, key: T): C[T] { return meta[key]; }
    public get_opposite(context: Context): LReference["opposite"] { return this.get_fromlfeature(context.proxyObject.instanceof as LReference, "opposite"); }
    public get_container(context: Context): LReference["container"] { return this.get_fromlfeature(context.proxyObject.instanceof as LReference, "container"); }
    public get_containment(context: Context): LReference["containment"] { return this.get_fromlfeature(context.proxyObject.instanceof as LReference, "containment"); }
    // public get_defaultValueLiteral(context: Context): LStructuralFeature["defaultValueLiteral"] { return this.get_fromlfeature(context.proxyObject.instanceof, "defaultValueLiteral"); }
    public get_defaultValue(context: Context): LStructuralFeature["defaultValue"] { return this.get_fromlfeature(context.proxyObject.instanceof, "defaultValue"); }
    public get_defaultderived(context: Context): LStructuralFeature["derived"] { return this.get_fromlfeature(context.proxyObject.instanceof, "derived"); }
    public get_defaultunsettable(context: Context): LStructuralFeature["unsettable"] { return this.get_fromlfeature(context.proxyObject.instanceof, "unsettable"); }
    public get_defaulttransient(context: Context): LStructuralFeature["transient"] { return this.get_fromlfeature(context.proxyObject.instanceof, "transient"); }
    public get_volatile(context: Context): LStructuralFeature["volatile"] { return this.get_fromlfeature(context.proxyObject.instanceof, "volatile"); }
    public get_changeable(context: Context): LStructuralFeature["changeable"] { return this.get_fromlfeature(context.proxyObject.instanceof, "changeable"); }
    public get_required(context: Context): LStructuralFeature["required"] { return this.get_fromlfeature(context.proxyObject.instanceof, "required"); }
    public get_unique(context: Context): LStructuralFeature["unique"] { return this.get_fromlfeature(context.proxyObject.instanceof, "unique"); }
    public get_many(context: Context): LStructuralFeature["many"] { return this.get_fromlfeature(context.proxyObject.instanceof, "many"); }
    public get_upperBound(context: Context): LStructuralFeature["upperBound"] { return this.get_fromlfeature(context.proxyObject.instanceof, "upperBound"); }
    public get_lowerBound(context: Context): LStructuralFeature["lowerBound"] { return this.get_fromlfeature(context.proxyObject.instanceof, "lowerBound"); }
    public get_ordered(context: Context): LStructuralFeature["ordered"] { return this.get_fromlfeature(context.proxyObject.instanceof, "ordered"); }
    public get_enumType(context: Context): LStructuralFeature["enumType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "enumType"); }
    public get_classType(context: Context): LStructuralFeature["classType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "classType"); }
    public get_primitiveType(context: Context): LStructuralFeature["primitiveType"] { return this.get_fromlfeature(context.proxyObject.instanceof, "primitiveType"); }
    public get_type(context: Context): LStructuralFeature["type"] { return this.get_fromlfeature(context.proxyObject.instanceof, "type"); }
    public get_fullname(context: Context): LStructuralFeature["fullname"] { return this.get_fromlfeature(context.proxyObject.instanceof, "fullname"); }
    public get_namespace(context: Context): LStructuralFeature["namespace"] { return this.get_fromlfeature(context.proxyObject.instanceof, "namespace"); }
    public get_name(context: Context): LStructuralFeature["name"] { return this.get_fromlfeature(context.proxyObject.instanceof, "name"); }

    protected get_instanceof(context: Context): this["instanceof"] {
        const pointer = context.data.instanceof;
        return LPointerTargetable.from(pointer)
    }
    protected set_instanceof(val: Pack1<this["instanceof"]>, context: Context): boolean {
        // const list = val.map((lItem) => { return Pointers.from(lItem) });
        let ptr = Pointers.from(val); // damiano: verifica sia un puntatore singolo
        SetFieldAction.new(context.data, 'instanceof', ptr, "", true);
        return true;
    }

    protected get_getValue(context: Context): this["getValue"] {
        return function (fitSize, namedPointers, ecorePointers) {
            let contextt: any = arguments[arguments.length - 1]; // proxy parameter mapping might get crazy with variable arguments
            fitSize = fitSize === contextt ? true : fitSize;
            namedPointers = namedPointers === contextt ? true : namedPointers;
            ecorePointers = ecorePointers === contextt ? true : ecorePointers;
            LValue.prototype.get_value(contextt, fitSize, namedPointers, ecorePointers);
        }
    }
    public getValue(fitSize: boolean = true, namedPointers: boolean = true, ecorePointers: boolean = false) { this.cannotCall("getValue"); }

    protected get_value(context: Context, fitSize: boolean = true, namedPointers: boolean = true, ecorePointers: boolean = false): this["value"] & {type: string} {
        let ret: any[] = [...context.data.value] as [];
        if (context.proxyObject.instanceof.className === DReference.name) ret = LPointerTargetable.fromArr(ret as DObject[]);
        let meta: LAttribute | LReference = context.proxyObject.instanceof;
        let typestr: string = meta.typeToShortString();
        if (!Array.isArray(ret)) ret = [];
        if (fitSize && ret.length < meta.lowerBound) {
            let times = meta.lowerBound - ret.length;
            while (times--) ret.push(undefined);
            // ret.length = meta.lowerBound; not really working for expanding, it says "emptyx10" or so. doing .map() only iterates "existing" elements. behaves like as it's smaller.
        }
        if (fitSize && ret.length > meta.upperBound) ret.length = meta.upperBound;
        let numbermax = 0, numbermin = 0;
        switch (typestr) {
            default: // it's a reference
                ret = LPointerTargetable.wrapAll(ret);
                if (namedPointers) {
                    ret = ret.map( l => l && (l.name ? ("@" + l.name) : ("#" + l.className)));
                }
                else if (ecorePointers && !(meta as LReference).containment){
                    throw new Error("values as EcorePointers: todo. for containment do nothing, just nest the obj. for non-containment put the ecore reference string in array vals")
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
                numbermin = Number.NEGATIVE_INFINITY;
                numbermax = Number.POSITIVE_INFINITY;
                break;
            case ShortAttribETypes.EString:
            case ShortAttribETypes.EDate:
                ret = ret.map( v => v ? v + '' : '');
                break;
            case ShortAttribETypes.EChar:
                ret = ret.map( v => v ? (v + '')[0] : 'A');
                break;
            case ShortAttribETypes.EBoolean:
                ret = ret.map( v => typeof v === "boolean" ? v : U.fromBoolString(v+'', v?.length>0, false));
                break;
            case ShortAttribETypes.void: ret = []; break;
        }
        // some kind of numeric type
        if (numbermax !== 0) {
            ret = ret.map( v => {
                if (typeof v !== "number") {
                    if (!v) v = 0;
                    else if (v === "true") v = 1;
                    else if (v.constructor?.name=== "Date") v = v.getTime();
                    else {
                        console.log("number casting:", v,  U.getFirstNumber(v+'', true), {numbermax, numbermin});
                        v = U.getFirstNumber(v+'', true);
                    }
                }
                return Math.min(numbermax, Math.max(numbermin, v))
            });
        }
        (ret as GObject).type = typestr;
        // console.error("type value:", {ret, typestr, meta, fitSize});
        return ret as any;
    }

    public valuestring(keepemptyquotes?: boolean): string { return this.cannotCall("valuestring"); }
    private get_valuestring(context: Context): this["valuestring"] { return (keepemptyquotes?: boolean) => this.valuestring_impl(context, keepemptyquotes); }
    private valuestring_impl(context: Context, keepemptyquotes?: boolean): string {
        console.error("valuestring_impl", {context, data:context.data});
        let val = this.get_value(context, true, true, false);
        let ret: any;
        switch (val.length) {
            case 0: ret = ''; break;
            case 1: ret = val[0] || val[0] === 0 ? val[0] : ''; break;
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
        console.error("valuestring_impl()", {ret, context, data:context.data});
        return ret;
    }

    protected set_value(val: (string|LObject)|(string|LObject)[], context: Context): boolean {
        const list: (string|LObject)[] = (Array.isArray(val)) ? val : [val];
        SetFieldAction.new(context.data, 'value', list as any, '', false);
        return true;
    }

    protected generateEcoreJson_impl(context: Context, loopDetectionObj: Dictionary<Pointer, DModelElement> = {}): Json {
        loopDetectionObj[context.data.id] = context.data;
        let json: any = this.get_value(context, true, false, true);
        delete json["type"];

        json = json.map( (j: any) => { return j?.__isProxy ? j.generateEcoreJson(loopDetectionObj) : j;} );
        json = json.filter((j: any) => !!j);
        return json; }

    protected get_toString(context: Context): () => string { return () => this._toString(context); }
    protected _toString(context: Context): string {
        let val: any = this.get_value(context);
        if (!val) return val + '';
        if (!Array.isArray(val)) val = [val];
        if (context.proxyObject.instanceof.className === DReference.name) val = val.map( (e: GObject) =>  {  return e.instanceof.__raw.name || e; });
        switch(val.length) {
            case 0: return '';
            case 1: return val[0] + '';
            default: return val + '';
        }
    }
    public rawValue(): void { super.cannotCall('rawValue'); }
    /*
    protected get_rawValue(context: Context): string {
        const values: this["value"] = context.proxyObject.value;
        const instanceOf = context.proxyObject.instanceof;
        const stringValues: string[] = [];
        if(Array.isArray(values)) {
            for(let value of values) {
                if (!value) continue;
                if (typeof value !== 'string') { stringValues.push((value as LObject).feature('name') as string); }
                else {
                    if(instanceOf.type.className === 'DEnumerator') {
                        const enumerator: LEnumerator = LEnumerator.fromPointer(instanceOf.type.id);
                        let literal: string|undefined = enumerator.literals[parseInt(value)]?.name;
                        literal = (literal === undefined) ? 'null' : literal;
                        stringValues.push(literal);
                    } else { stringValues.push(value); }
                }
            }
            return JSON.stringify(stringValues);
        } else {
            const singleton: LObject|string = values as (LObject|string);
            if(typeof singleton !== 'string') { return JSON.stringify(singleton.feature('name') as string); }
            else {
                if(instanceOf.type.className === 'DEnumerator') {
                    const enumerator: LEnumerator = LEnumerator.fromPointer(instanceOf.type.id);
                    let literal: string|undefined = enumerator.literals[parseInt(values)]?.name;
                    literal = (literal === undefined) ? 'null' : literal;
                    return JSON.stringify(literal);
                } else { return JSON.stringify(values); }
            }
        }

    }
    */

    protected get_delete(context: Context): () => void {
        const ret = () => {
            const lValue = context.proxyObject;
            const lFeature = lValue.instanceof;
            const features = lFeature.__raw.instances;
            const values = [...(Selectors.getValues().map((val) => {return val.id}))];
            BEGIN()
            SetFieldAction.new(lFeature.__raw, 'instances', features.indexOf(lValue.id), '-=', true);
            SetRootFieldAction.new('values', values.indexOf(lValue.id), '-=', false);
            END()
            lValue.superDelete();
        }
        return ret;
    }

}
DNamedElement.subclasses.push(DValue);
LNamedElement.subclasses.push(LValue);



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


/*
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
*/
