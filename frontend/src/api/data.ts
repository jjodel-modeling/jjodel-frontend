import {
    Json,
    Pointer,
    GObject,
    Dictionary,
    DocString, RuntimeAccessible
} from "../joiner";
import {
    Log,
    DModelElement,
    DModel,
    LModel,
    DValue,
    LValue,
    DObject,
    LObject,
    DEnumerator,
    DEnumLiteral,
    DAttribute,
    LAttribute,
    DReference,
    LReference,
    DClassifier,
    DClass,
    LClass,
    DParameter,
    DOperation,
    DPackage,
    LPackage,
    DTypedElement,
    LTypedElement,
    DAnnotation,
    AttribETypes,
    U,
    CreateElementAction,
    Selectors,
    PointedBy,
    LPointerTargetable,
    windoww,
    SetRootFieldAction,
    Constructors,
    store,
    SetFieldAction,
    DPointerTargetable, ShortAttribETypes, toLongEType, DState, Debug
} from "../joiner";
import {DefaultEClasses, ShortDefaultEClasses, toLongEClass} from "../common/U";
type RET<T = boolean> = T | Promise<T>;
/*

class SavePack{
    model: string;
    vertexpos: string;
    view: string;
    constructor(model: string='', vertexpos: string='', view:string='') {
        this.model = model;
        this.vertexpos = vertexpos;
        this.view = view;
    }
}*/



export abstract class IStorage{
    static get():IStorage { return Log.exx("IStorage.get (static) should be overridden"); }
    public prefix: string;
    public autosave: boolean;
    constructor(prefix: string, autosave: boolean) {
        this.prefix = prefix;
        this.autosave = autosave;
    }


    public del(key: string | number): boolean{
        let isOverwrite = this.get(key) !== null;
        this.set(key, '');
        return isOverwrite; }
    public abstract set(key: string | number, val: string | any): RET<boolean>;
    get<T extends boolean>(key: string | number, parse: T = false as any): T extends false ? null | string : null | any{ return Log.exx("IStorage.get should be overridden"); }

    protected serialize(val: any): string { // serialize
        try { return JSON.stringify(val); } catch(e){ return ""+val; }
    }
    protected deserialize(val: string): any{ // de-serialize
        try { return JSON.parse(val); } catch(e){ return val; }
    }
    protected set0(val: any): string { return this.serialize(val); }
    protected get0(val: any): string { return this.deserialize(val); }
    protected parse(val: any): string { return this.deserialize(val); }
}

export class LocalStorage extends IStorage{
    public static get():LocalStorage {return new LocalStorage("_j", true); }
    private constructor (prefix: string, autosave: boolean) { super(prefix, autosave); }

    private static KeyList= {lastOpenedModel: "lastOpenedModel",lastOpenedView: "lastOpenedView",lastOpenedPosition: "lastOpenedPosition",}


    get<T extends boolean>(key: string | number, parse: T = false as any): T extends false ? null | string : null | any{
        let val = localStorage.getItem(this.prefix+key);
        return parse ? this.parse(val) : val;
    }

    set(key?: string | number, val?: string | any): boolean {
        val = this.serialize(val);
        // let isOverwrite = localStorage.getItem(this.prefix+key);
        localStorage.set(this.prefix+key, val);
        return true;
    }

/*
    public getLastOpened(modelNumber: 1 | 2): SavePack {
        let modelname = "m" + modelNumber + "_";
        const ret: SavePack = new SavePack();
        ret.model = this.get(modelname + LocalStorage.KeyList.lastOpenedModel, false) || '';
        ret.view = this.get(modelNumber + LocalStorage.KeyList.lastOpenedView, false) || '';
        ret.vertexpos = this.get(modelNumber + LocalStorage.KeyList.lastOpenedPosition, false) || '';
        return ret; }

    public deleteLastOpened(modelNumber: 1 | 2): void { this.setLastOpened(modelNumber, '', '', ''); }

    public setLastOpened(modelNumber: 1 | 2, model: string = '', view: string = '', vertex: string = ''): void {
        let modelname = "m" + modelNumber + "_";
        if (model) this.set(modelname + LocalStorage.KeyList.lastOpenedModel, model);
        else this.del(modelname +  LocalStorage.KeyList.lastOpenedModel);
        if (view) this.set(modelname + LocalStorage.KeyList.lastOpenedView, view);
        else this.del(modelname +  LocalStorage.KeyList.lastOpenedView);
        if (vertex) this.set(modelname + LocalStorage.KeyList.lastOpenedPosition, vertex);
        else this.del(modelname +  LocalStorage.KeyList.lastOpenedPosition); }

*/
}

@RuntimeAccessible('ECoreParser')
export class EcoreParser{
    static supportedEcoreVersions = ["http://www.eclipse.org/emf/2002/Ecore"];
    static prefix:string = '-'; // aligned with EcoreService.xmlToJson output (was '@')
    static cname = 'ECoreParser';

    // Canonical EDataType aliases used to resolve user-declared primitive packages in
    // multi-package XMI-wrapped imports (Fase B.1). When an EPackage contains only
    // <EDataType name="X"/> entries, those names are remapped to JjOM canonical primitives
    // here so downstream LinkAllNamesToIDs can resolve them via replacePrimitiveMap.
    private static EDATATYPE_CANONICAL_ALIASES: Dictionary<string, string> = {
        'String':   'EString',
        'Integer':  'EInt',
        'Int':      'EInt',
        'Boolean':  'EBoolean',
        'Bool':     'EBoolean',
        'Double':   'EDouble',
        'Real':     'EDouble',
        'Float':    'EFloat',
        'EString':  'EString',
        'EInt':     'EInt',
        'EBoolean': 'EBoolean',
        'EDouble':  'EDouble',
        'EFloat':   'EFloat',
        'EChar':    'EChar',
        'EDate':    'EDate',
        'ELong':    'ELong',
        'EShort':   'EShort',
        'EByte':    'EByte',
        // Bug H: cross-document UML2 Types.ecore primitive (int with -1 sentinel for "*")
        'UnlimitedNatural': 'EInt',
        // Bug H: cross-document Ecore.ecore reflection types — opaque semantic-preserving fallback
        'EDiagnosticChain': 'EString',
        'EJavaObject':      'EString',
        'EClass':           'EClass',
    };

    static parse(ecorejson: GObject | string | null, isMetamodel: boolean, filename: string | undefined, persist: boolean = true): DModelElement[]{
        if (!ecorejson) return [];
        let parsedjson: GObject;
        if (typeof ecorejson === "string") try { parsedjson = JSON.parse(ecorejson); } catch(e) { windoww.temp = ecorejson; Log.exx("error while parsing json:", e, ecorejson.substring(0, 1000)); throw e; }
        else parsedjson = ecorejson;
        // console.log("root parse", {ecorejson, parsedjson});
        // isMetamodel = !!parsedjson[ECoreRoot.ecoreEPackage];

        Constructors.paused = true;
        let parsedElements: DModelElement[] = isMetamodel ? EcoreParser.parseM2Model(parsedjson, filename) : EcoreParser.parseM1Model(parsedjson, undefined, filename);
        console.warn("parse.result D", parsedElements);
        this.LinkAllNamesToIDs(parsedElements);
        this.fixNamingConflicts(parsedElements);
        Constructors.paused = false;
        // if (persist) CreateElementAction.newBatch(parsedElements);
        // update m1 object pointers (need them to be persistent to navigate .fathers and get ecore pointer strings using LObject)
        this.fixObjectPointers(parsedElements); // updates dvalue.values from ecore reference to pointers.
        Constructors.persist(parsedElements);

        windoww.tmpparse = () => LPointerTargetable.wrapAll(parsedElements);

        this.tempfix_untilopennewtabisdone(parsedElements, isMetamodel);

        // console.log('parsedElem', parsedElements)
        return parsedElements;
    }

    private static fixObjectPointers(parsedElements: DModelElement[]): void {
        let dobjects: DObject[] = parsedElements.filter(e=>e.className === DObject.cname) as any[];
        let values: DValue[] = parsedElements.filter(e=>e.className === DValue.cname) as any[];
        let lobjects: LObject[] = LPointerTargetable.fromArr(dobjects);
        let m1pointermap: Dictionary<string, LObject> = { }; //    "//@rootrefname.index@/refname.index/@....etc"
        for (let o of lobjects){ m1pointermap[o.ecorePointer()] = o; }
        for (let v of values) {
            if (v.isMirage) continue;
            let modified = false;
            let newvalues = v.values.map((e) => {
                if (!m1pointermap[e as any]) return e;
                modified = true;
                // console.log("m1 pointer resolved:", {from:e, to:m1pointermap[e as any].id});
                return m1pointermap[e as any].id;
            });
            if (!modified) continue;
            //let lv: LValue = LPointerTargetable.from(v);
            v.values = newvalues;
        }

    }
    private static tempfix_untilopennewtabisdone(parsedElements: DModelElement[], isMetamodel: boolean) {
        // replaces current model with parsed model. this needs to be removed to open a new tab later on.
        let model: DModel = null as any;
        for (let elem of parsedElements) { if (elem.className === DModel.cname) { model = elem as any; break; } }
        // RIMOSSO 2026-05-13 (Bug E, Strategy A): il push qui duplica state.m2models perché il
        // Constructor di DModel (classes.ts:937 via _persistCallbacks) ha già dispatchato la stessa
        // azione durante Constructors.persist(). Causava React "duplicate key" warning in TreeView
        // (TreeViewContent.tsx:1640) e Navbar (Navbar.tsx:1979). Riferimento:
        // docs/discovery/2026-05-13_microdiscovery_bug_ef_render_duplicate.md sezione 6.1.
        // SetRootFieldAction.new(isMetamodel ? "m2models" : "m1models", model.id, '+=', false);
        void model;
    }

    // resolve eCore pointers to Jodel pointers and set the PointedBy
    private static LinkAllNamesToIDs(parsedElements: DModelElement[]): void {
        // todo: è post-parse che legga i nomi e assegni gli id aggiustando le references e extends settati by name. trova i campi temporanei cercando i @ts-ignore
        // update mref, attribute, parameter type
        // update operation exception
        // replace those names with id's

        let idMap: Dictionary<Pointer, DModelElement> = {};
        let nameMap: Dictionary<string, DModelElement> = {};
        let replacePrimitiveMap: Dictionary<string, DClassifier> = {};
        let d_Estring: DClassifier = Selectors.getAllPrimitiveTypes()[1];
        replacePrimitiveMap[AttribETypes.EString] = d_Estring;
        // todo: do the same for all other primitives
        let state: DState = store.getState();

        // let longprefixlength = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore'.length;
        const typeprefix = "#//";
        for (let shortkey in ShortAttribETypes) {
            if (shortkey === ShortAttribETypes.EVoid) continue;
            let shortetype: ShortAttribETypes = (ShortAttribETypes as GObject)[shortkey];
            let longetype: AttribETypes = toLongEType(shortetype);
            let dClassType: DClassifier = Selectors.getPrimitiveType(shortetype, state);
            Log.exDev(!dClassType, "missing primitive type: " + shortkey, {shortkey, shortetype, longetype, dClassType, state});
            // the correct one
            replacePrimitiveMap[typeprefix + shortkey] = dClassType; // like "#//EChar"
            // fallbacks for missing type instead of crash
            if (!replacePrimitiveMap[shortkey]) replacePrimitiveMap[shortkey] = dClassType;
            if (!replacePrimitiveMap[shortetype]) replacePrimitiveMap[shortetype] = dClassType;
            if (!replacePrimitiveMap[longetype]) replacePrimitiveMap[longetype] = dClassType;
        }
        for (let shortkey in ShortDefaultEClasses) {
            let shortetype: ShortDefaultEClasses = (ShortDefaultEClasses as GObject)[shortkey];
            let longetype: DefaultEClasses = toLongEClass(shortetype);
            let dClassType: DClassifier = Selectors.getDefaultEcoreClass(shortetype, state);
            Log.exDev(!dClassType, "missing ecore native class: " + shortkey, {shortkey, shortetype, longetype, dClassType, state});

            // the correct one
            replacePrimitiveMap[longetype] = dClassType;
            // fallbacks for missing type instead of crash
            if (!replacePrimitiveMap[shortkey]) replacePrimitiveMap[shortkey] = dClassType;
            if (!replacePrimitiveMap[shortetype]) replacePrimitiveMap[shortetype] = dClassType;
            if (!replacePrimitiveMap[longetype]) replacePrimitiveMap[typeprefix + shortkey] = dClassType; // like "#//EObject"
        }


        for (let ecorename in replacePrimitiveMap) {
            // duplicates are very likely becuase of fallback alias like "EChar", but they shouldn't override user-defined class EChar if it exist, so don't throw error.
            if (idMap[replacePrimitiveMap[ecorename].id]) continue;
            idMap[replacePrimitiveMap[ecorename].id] = replacePrimitiveMap[ecorename];
        }

        // let prereplace = (name: string) => name.replaceAll("#//", "");
        let replaceRules = ["extends", /*"extendedBy",*/ "exceptions", "type", "values"];
        let dobj: GObject & DModelElement;

        for (dobj of parsedElements) {
            idMap[dobj.id] = dobj;
            if (!dobj.name || dobj.className === DModel.cname) continue; // Model name can be reused internally
            let name = (dobj as GObject).__fullname;
            delete (dobj as GObject).__fullname;
            if (dobj.className === DOperation.cname || dobj.className === DParameter.cname) {
                // operation overload, in this case i create N separate operations, but all references will point to the last operation.
                // empty on purpose, just avoid naming check
            }
                // todo: problem, uml.ecore have "isComposite" operation and attribute on sme class "property", so who is referenced by "#//property/isComposite" ??
            // else Log.exDev(nameMap[typeprefix + name], "found 2 elements with same name", {nameMap, dobj, name, shortname: dobj.name, typeprefix});
            else Log.w(!!nameMap[typeprefix + name], "found 2 elements with same name", {nameMap, new:dobj, old:nameMap[typeprefix + name], name, shortname: dobj.name, typeprefix});
            nameMap[typeprefix + name] = dobj;
            // nameMap[typeprefix + dobj.name] = dobj; // <eAnnotations source="subsets" references="#//Activity/group"/>
        }

        for (let replacekey of replaceRules){
            for (dobj of parsedElements) {
                let valtmp: string | string[] = dobj[replacekey] as string | string[];
                if (valtmp === undefined) continue; // for missing properties in a d-object like looking for extends on a dmodel.
                let values: string[]
                let isArray = Array.isArray(valtmp);
                if (isArray) {
                    values = valtmp as string[];
                    dobj[replacekey] = [];
                }
                else {
                    values = [valtmp as string];
                }
                for (let value of values) {
                    if (!value) continue;
                    // console.log("fixalltypes", {replacekey, dobj, value, values});
                    let target: DModelElement = replacePrimitiveMap[value];
                    if (!target) target = nameMap[value];
                    // Defensive fallback for unrecognized EDataType patterns.
                    // After Bug H fix, this branch should be unreachable for known patterns
                    // (UML2 Types.ecore, Ecore.ecore reflection types) since rewriteXPathPointers
                    // catches them upstream and rewrites to canonical short names. Kept as
                    // last-resort for cross-doc EDataType from metamodels not yet seen in fixtures.
                    if (!target && value.indexOf("ecore:EDataType") === 0) {
                        Log.ww('found unknown EDataType "' + value + '", remapping it to string');
                        target = replacePrimitiveMap[AttribETypes.EString];
                    }
                    /*
                    if (!target && value === "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"){
                        Log.ww('found type Object is not supported yet in metamodel, remapped to EString');
                        target = replacePrimitiveMap[AttribETypes.EString];
                    }*/
                    // if (Pointers.isPointer(value)) { target = value;  if it happen to be a pointer it's a mistake in parser }
                    // (value.indexOf("#//") == 0) && console.log("attempt to replace primitive type to his id", {target, dobj, replacekey, value, replacePrimitiveMap, nameMap, idMap, parsedElements});

                    if (replacekey === "extends") {
                        if (!target) continue;
                        Log.ex(target.className !== DClass.cname, "found a class attempting to extend an object that is not a class", {target, dobj, replacePrimitiveMap, nameMap, idMap});
                        // (target as DClass).extendedBy.push((dobj as DClass).id);
                    }
                    Log.ex(!target, "LinkAllNames() can't find type target:", {value, nameMap, replacePrimitiveMap, dobj, replacekey});
                    if (isArray) dobj[replacekey].push(target.id);
                    else dobj[replacekey] = target.id;
                }
            }
        }

        // fix from ordinals to Pointer<DEnumLiteral>
        function DfromPtr<T extends DPointerTargetable>(id: Pointer<T>|null|undefined): T{ return !id ? undefined as any : (DPointerTargetable.fromPointer(id, state)); }
        function getLiteral(id: Pointer<DEnumerator>, ordinal: number): DEnumLiteral { return LPointerTargetable.fromD(DfromPtr(id))?.ordinals[ordinal]?.__raw; }
        for (let elem of parsedElements) {
            if (elem.className !== DValue.cname) continue;
            let dval: DValue = elem as DValue;
            let meta: DAttribute | DReference = DfromPtr(dval.instanceof as Pointer<DAttribute|DReference>);
            if (!meta) continue;
            let type: DEnumerator = DfromPtr(meta.type) as DEnumerator;
            if (!type || type.className !== DEnumLiteral.cname) continue;
            let mapper = (v: unknown): Pointer<DEnumLiteral> => {
                if (typeof v !== "number") { Log.ee("found non-numeric value in a literal value.", v, dval); return v as any; }
                let l = getLiteral(type.id, v);
                return l ? l.id : v as any;
            }
            dval.values = dval.values.map( mapper );
        }

        // finally: set all pointedby
        for (let ptrkey of PointedBy.list) for(dobj of parsedElements) {
            let valtmp: string | string[] = dobj[ptrkey] as string | string[];
            let values: string[];
            if (Array.isArray(valtmp)) {
                values = valtmp as string[];
            }
            else {
                if (valtmp === undefined) values = [];
                // if (valtmp === "modeltmp") { dobj[ptrkey] = null; values = []; } // because model.father is null, but i want to error check others and let them crash if missing father
                else values = [valtmp as string];
            }
            for (let value of values) {
                if (!value) continue;
                // errore: per operazione.type l'import mi restituisce puntatore a oggetto stringa, ma non è tra gli oggetti parsed
                let target: DModelElement = idMap[value];
                if (target) {
                    target.pointedBy.push(PointedBy.new("idlookup." + dobj.id + "." + ptrkey));
                } else {
                    target = DfromPtr(value);
                    // console.log("fixalltypes", {ptrkey, valtmp, dobj, value, values, target, idMap});
                    if (!target) throw new Error("target undefined");
                    SetFieldAction.new(target, "pointedBy", PointedBy.new("idlookup." + dobj.id + "." + ptrkey),'+=', false);
                }
            }
        }
        // update superclasses
        this.updateSuperClasses(parsedElements);
    }

    private static todoGetPrimitiveTypenope(type: AttribETypes.EString | string): Pointer<DClass, 1, 1, LClass> {
        // akready fixed in LinkAllNamesToID
        return 'todoGetPrimitiveType from parser';
    }

    private static updateSuperClasses(parsedElements: DModelElement[]): void {
        // todo:3

    }
    private static fixNamingConflicts(parsedElements: DModelElement[]): void {
        // todo:4 final
    }

    static parseM2Model(json: Json, filename: string | undefined): DModelElement[] {
        let generated: DModelElement[] = [];
        if (!json) { json = {}; }
        let modelname = json[ECoreNamed.namee] as string;
        if (!modelname && filename) {
            let pos = filename.indexOf(".");
            modelname = pos === -1 ? filename : filename.substring(0, pos); }
        let dObject: DModel = DModel.new( modelname || "imported_metamodel_1", undefined, true, true);
        generated.push(dObject);

        // Detect XMI-wrapped multi-package input. xmlToJson represents children sharing a
        // tag name as either an object (1 child) or an array (N children) under that tag key.
        // For wrapped files the root <xmi:XMI> contains one or more <ecore:EPackage> children;
        // for unwrapped files the root itself is <ecore:EPackage>.
        const epkgChildren = EcoreParser.getMultiPackageChildren(json);

        if (epkgChildren) {
            // Multi-package wrapped XMI path.
            // The xmlns:ecore attribute is on the XMI wrapper, not on individual EPackage
            // children, so we validate here instead of inside parsePackageBody.
            let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
            Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);

            // Classify packages: a "primitive-only" package contains exclusively EDataType
            // classifiers; it gets consumed (its names become primitive aliases via XPath
            // rewrite) rather than producing a DPackage in the model.
            const primitiveIndices = new Set<number>();
            const normalIndices = new Set<number>();
            for (let i = 0; i < epkgChildren.length; i++) {
                if (EcoreParser.isPrimitivePackage(epkgChildren[i])) primitiveIndices.add(i);
                else normalIndices.add(i);
            }

            // Use the first normal package's name as the DModel name (per Fase B.1 spec).
            const firstNormalIdx = Array.from(normalIndices).sort((a, b) => a - b)[0];
            if (firstNormalIdx !== undefined) {
                const firstNormalName = epkgChildren[firstNormalIdx][ECoreNamed.namee] as string;
                if (firstNormalName) dObject.name = firstNormalName;
            }

            // Parse normal packages. Primitive ones are skipped here and contribute only
            // through the XPath rewrite pass below.
            for (let i = 0; i < epkgChildren.length; i++) {
                if (primitiveIndices.has(i)) continue;
                EcoreParser.parsePackageBody(dObject, epkgChildren[i], generated);
            }

            // Rewrite XPath-style pointers ("/N/X" form only) on `type` and `extends` fields
            // before LinkAllNamesToIDs runs. Three-segment "/N/X/Y" pointers (used by
            // eOpposite for feature references) are left untouched; they are scope Fase B.2.
            EcoreParser.rewriteXPathPointers(generated, primitiveIndices, normalIndices, epkgChildren);
        } else {
            // Single-package path: root JSON IS the <ecore:EPackage>. parseRootPackage validates internally.
            EcoreParser.parseRootPackage(dObject, json, generated);
            // Bug H: also normalize cross-document EDataType/EClass references in single-package
            // imports (no separate primitive packages exist locally; the root is conceptually
            // package index 0). Pass empty primitiveIndices so the XPath primitive branch is no-op.
            EcoreParser.rewriteXPathPointers(generated, new Set(), new Set([0]), [json]);
        }
        return generated;
    }

    static parseM1Model(json: Json, meta?: LModel, filename?: string): DModelElement[] {
        let generated: DModelElement[] = [];
        if (!json) { json = {}; }
        /// *** specific  *** ///
        // this.parseDObject(json, dObject, DModel,undefined, generated);
        let allmodels: DModel[];
        if (!meta && filename) {
            allmodels = Selectors.getAll(DModel);
            allmodels = allmodels.filter( (m) => m.name === filename);
            meta = LPointerTargetable.fromD(allmodels[0]);
        } else allmodels = [];

        let xmlns =  EcoreParser.XMLinlineMarker + "xmlns:";
        let ns: string | undefined = undefined as any;
        function findns(key: string): false | string {
            let pos = key.indexOf(":");
            if (pos <= 0) return false;
            return ns = key.substring(0, pos); // through namespace before the name of the root objects;
            // additional method: through xmlns key
            // if (key.indexOf(xmlns)) continue; // "-xmlns:org.eclipse.example.modelname": "https://org/eclipse/example/modelname",
            // ns = key.substring(xmlns.length); break;
        }
        outerloop: for (let key0 in json) { // ns can be at most in sublevel 3, this is annoying but i need it at beginning of parsing
            if (findns(key0)) break;
            let val0 = json[key0];
            if (typeof val0 === "object") for (let key1 in val0) {
                if (findns(key0)) break outerloop;
            }
        }
        if (ns && !meta) {
            let allpkgs: LPackage[] = Selectors.getAll(DPackage, undefined, undefined, true, true);
            let matchpkg: LPackage[] = allpkgs.filter( (d) => d.uri === ns);
            meta = matchpkg[0]?.model;
            // Log.exDev(!meta, "metamodel not found: ", {ns, json, filename, allmodels, allpkgs, matchpkg}) // todo: after tests remove this check and allow shapeless models.
        }

        let modelname = '';
        if (!modelname && filename) {
            let pos = filename.indexOf(".");
            modelname = (pos === -1 ? filename : filename.substring(0, pos)); }
        let dObject: DModel = DModel.new( modelname || "imported_model_1", meta?.id, false, true);
        // console.log("made model", json);
        generated.push(dObject);

        for (let key in json) {
            switch(key) {
                case ECoreObject.xmi_version: // this is only on roots
                    Log.ex(json[key] !== "2.0","The only supported ecore version is \"2.0\", found instead: \""+json[key] +"\"");
                    break;
                // case ECoreObject.xmlnsecore:
                case ECoreObject.xmlns_xmi:
                    let expected = "http://www.omg.org/XMI";
                    Log.ex(json[key] !== expected,"Unexpected XMI schema. Should be \""+expected+"\", found instead: \""+json[key] +"\"");
                    break;
                default: // a feature name
                    let val = json[key];
                    if (!val) continue;
                    if (key.indexOf(xmlns) === 0) continue; // "-xmlns:org.eclipse.example.modelname": "https://org/eclipse/example/modelname",
                    if (key[0] === EcoreParser.XMLinlineMarker) key = key.substring(EcoreParser.XMLinlineMarker.length);

                    const namespacedclass: string = key;
                    const mmclass: LClass | undefined = meta && meta.getClassByNameSpace(namespacedclass);
                    // if (!mmclass) console.log("failed to get mmclass", {meta, key, mmclass})
                    const roots_for_this_metaclass: Json[] = Array.isArray(val) ? val : [val]; // there might be N roots of class A, M of type B...
                    for(let rootjson of roots_for_this_metaclass) {
                        // DObject.new(mmclass.id, dObject.id, DModel, undefined, true)
                        EcoreParser.parseDObject(rootjson, dObject, DModel, mmclass, generated);
                    }
            }
        }
        return generated;
    }
    /*
    {
      "org.eclipse.example.bowling:League": { <-- :classroot
        "-xmlns:xmi": "http://www.omg.org/XMI",
        "-xmlns:org.eclipse.example.bowling": "https://org/eclipse/example/bowling",
        "-xmi:version": "2.0",
        "Players": [
          { "-name": "tizio" },
          { "-name": "asd" }
        ]
      }
    }
    */


    /// In Ecore parsing when you find a value list, it is possible to recover only the type for the meta-feature,<br>
    /// but an array of Mammals might have some Whales, Pigs, etc mixed in. and you have to get the correct subclass for each
    static getobjectmetaclass(json: Json, metaSuperClass: LClass): LClass {
        return metaSuperClass; // todo: comment this and execute below
        let subclasses: LClass[] | [] = !metaSuperClass ? [] : [metaSuperClass];
        let subclasseshapes: Dictionary<Pointer<DClass>, {l: LClass } & Dictionary<DocString<"feature name">,  LTypedElement["type"]/*feature type*/>> = {}
        for (let sc of subclasses) {
            subclasseshapes[sc.id] = {l: sc};
            let row = subclasseshapes[sc.id];
            for (let feat of sc.children) {
                let lfeat: LTypedElement = feat as any;
                let dfeat: DTypedElement = lfeat.__raw as any;
                if (!dfeat.name || !dfeat.type) continue;
                row[dfeat.name] = lfeat.type;
            }
        }
        return this.findBestMatch(subclasseshapes, json);
    }
    static findBestMatch(
        m2classes: Dictionary<Pointer<DClass>,  {l: LClass } & Dictionary<DocString<"feature name">, LTypedElement["type"]>>,
        json: Dictionary<DocString<"feature name">, any/*actual val instead of type*/>): LClass{
        throw new Error("todo");
        return null as any;
    }
    static parseDObject(json: Json, parent: DModel | DValue, parentType: typeof DModel | typeof DValue, meta: LClass | undefined, generated: DModelElement[]): DModelElement[]{
        if (!json) { json = {}; }
        meta = meta && this.getobjectmetaclass(json, meta);
        // let dObject: DObject = DObject.new(meta?.id, parent.id, parentType, json["name"] as string || "obj_1");
        // let data: Partial<DObject> = {};
        let dObject: DObject = DObject.new(meta?.id, parent.id, parentType, json["name"] as string || "obj_1");
        generated.push(dObject); dObject.father = parent.id;
        if (parent) {
            if (parentType === DModel) (parent as DModel).objects.push(dObject.id);
            else (parent as DValue).values.push(dObject.id);
        }
        // console.log("made dobject", {json, dObject, meta, metaname: meta?.name});
        /// *** specific  *** ///
        for (let key in json) {
            switch(key) {
                case ECoreObject.xmi_version: // this is only on roots
                    Log.ex(json[key] !== "2.0","The only supported ecore version is \"2.0\", found instead: \""+json[key] +"\"");
                    break;
                // case ECoreObject.xmlnsecore:
                case ECoreObject.xmlns_xmi:
                    let expected = "http://www.omg.org/XMI";
                    Log.ex(json[key] !== expected,"Unexpected XMI schema. Should be \""+expected+"\", found instead: \""+json[key] +"\"");
                    break;
                default: // a feature name
                    let val = json[key];
                    if (!val) continue;
                    if (key[0] === EcoreParser.XMLinlineMarker) key = key.substring(1);
                    if (key.indexOf("xmlns:") === 0) continue; // "-xmlns:org.eclipse.example.modelname": "https://org/eclipse/example/modelname",
                    let metafeature: LAttribute | LReference | undefined = meta && (meta as any)["@"+key];
                    // console.log("feature meta", {json, dObject, key, val, metafeature, classmeta: meta});
                    let values: any[];
                    if (Array.isArray(val)) values = val;
                    else if (val as unknown === undefined) values = [];
                    else values = [val];
                    EcoreParser.parseDValue(key, values, dObject/*father*/, metafeature/*meta*/, generated);
                // DValue.new(key, metafeature?.id, values, dObject, true, false);
            }
        }
        return generated;
    }

    private static parseDValue(name:string | undefined, jsonvalues: any[], parent: DObject, meta: LAttribute | LReference | undefined, generated: DModelElement[]): DModelElement[] {
        if (!jsonvalues) { jsonvalues = []; }
        // let dObject: DObject = DObject.new(meta?.id, parent.id, parentType, json["name"] as string || "obj_1");
        // console.log("DValue.new(meta ? undefined : name, meta?.id, jsonvalues, parent.id, true, false)")
        // console.log("DValue.new(", meta ? undefined : name, ",",meta?.id, ",",jsonvalues, ",",parent.id);
        let dValue: DValue = DValue.new(meta ? undefined : name, meta?.id, [], parent.id, true, false);
        generated.push(dValue); dValue.father = parent.id;
        parent.features.push(dValue.id);
        // console.log("made dValue", {jsonvalues, dValue, meta, metaname: meta?.name});
        if (meta && meta.className === DAttribute.cname) { dValue.values = jsonvalues; return generated; }

        for (let v of jsonvalues) {
            if (typeof v !== "object") { dValue.values.push(v); continue; }
            // let subdObject: DObject = DObject.new((meta as LReference)?.type.id, parent.id, DValue, undefined);
            // generated.push(subdObject);
            EcoreParser.parseDObject(v, dValue, DValue, (meta as LReference)?.type, generated);
        }
        return generated;
    }

    static parseDAnnotation(parent: DModelElement, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        return []; // todo
        if (!generated) generated = [];
        if (!json) { json = {}; }
        let dObject: DAnnotation = DAnnotation.new();
        generated.push(dObject); dObject.father = parent.id;
        (dObject as any).name = this.read(json, ECoreNamed.namee, undefined);
        dObject.father = parent.id;
        if (parent) parent.annotations.push(dObject.id);
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        (dObject as GObject).__fullname = undefined; // fullnamePrefix + "/" + (dObject as any).name; // if annotation is not named (and it shouldn't) i don't wanna override container name
        /// *** specific  *** ///
        let key: string;
        for (key in json){
            const value = json[key];
            switch (key) { //todo
                default: Log.exx('unexpected field in EAnnotation:  ' + key + ' => |' + value + '|', {key, value, json}); break;
                // case ECoreAnnotation.annotations: break; // todo: enable, yes annotations can have annotations
                case ECoreAnnotation.details: break;
                case ECoreAnnotation.references: break;
                case ECoreAnnotation.source: break;
            }
        }
        // annotation.referencesStr = this.read(json, ECoreAnnotation.source, '#/');
        // annotation.name = this.read(json, ECoreAnnotation.name, 'EAnnotation_1');
        // const details: Json[] = this.getDetails(json);
        // for (let i = 0; i < details.length; i++) { new EAnnotationDetail(this, details[i]); }
        return generated; }

    static parseRootPackage(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!json) { json = {}; }
        // Single-package path validates the ecore namespace here. For multi-package XMI-wrapped
        // imports the validation is hoisted to the wrapper level in parseM2Model.
        let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
        Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);
        return EcoreParser.parsePackageBody(parent, json, generated);
    }

    private static parsePackageBody(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);

        let dObject: DPackage = DPackage.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.packages.push(dObject.id);

        dObject.name = this.read(json, ECoreNamed.namee, 'default');
        // root package name is "transparent" and not applied in "#//reference/paths/...", if referenced i guess his name is "#//"
        (dObject as GObject).__fullname = ''; // fullnamePrefix + "/" + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        const subPackages: Json[] = this.getSubPackages(json);
        dObject.uri = this.read(json, ECorePackage.nsURI, null);
        dObject.prefix = this.read(json, ECorePackage.nsPrefix, null);
        console.warn("parsePackageBody.children", {childs, annotations, subPackages, dObject, generated});
        // if (!parent.uri) parent.uri = dObject.uri;
        // if (!parent.prefix) parent.prefix = dObject.prefix; // namespace
        for (let child of childs) {
            switch (child[ECoreClass.xsitype]) {
                default: Log.exx('unexpected xsitype:', child[ECoreClass.xsitype], ' found in jsonfragment:', child, ', in json:', json, ' package:', dObject); break;
                case 'ecore:EClass': this.parseDClass(dObject, child, generated, ''); break;
                case 'ecore:EEnum': this.parseDEnum(dObject, child, generated, ''); break;
            }
        }
        for (let child of subPackages) EcoreParser.parseSubPackage(dObject, child, generated, '');
        /// *** specific end *** ///
        return generated; }

    static parseSubPackage(parent: DPackage, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DPackage = DPackage.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.subpackages.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'subPackage_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.uri = this.read(json, ECoreSubPackage.nsURI, null);
        dObject.prefix = this.read(json, ECoreSubPackage.nsPrefix, null);
        const subPackages: Json[] = this.getSubPackages(json);
        console.warn("parseSubPackage.children", {childs, annotations, subPackages, dObject, generated});
        // if (!dObject.uri) dObject.uri = dObject.name + "." + parent.uri;
        // if (!dObject.prefix) dObject.prefix = dObject.name + "." + parent.prefix; // namespace
        for (let child of childs) {
            switch (child[ECoreClass.xsitype]) {
                default: Log.exx('unexpected xsitype:', child[ECoreClass.xsitype], ' found in jsonfragment:', child, ', in json:', json, ' package:', dObject); break;
                case 'ecore:EClass': this.parseDClass(dObject, child, generated, (dObject as GObject).__fullname + "/"); break;
                case 'ecore:EEnum': this.parseDEnum(dObject, child, generated, (dObject as GObject).__fullname + "/"); break;
            }
        }
        for (let child of subPackages) EcoreParser.parseSubPackage(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific end *** ///
        return generated; }

    static parseDClass(parent: DPackage, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        let dObject: DClass = DClass.new(
            this.read(json, ECoreNamed.namee, 'Concept_1'),
            undefined as any, undefined as any, undefined as any, undefined as any, undefined, parent.id,
        );
        generated.push(dObject);// dObject.father = parent.id;
        //dObject.name = this.read(json, ECoreNamed.namee, 'Class_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        for (let key in json) {
            switch (key) {
                default: Log.exx('unexpected field in parseDClass() |' + key + '|', json); break;
                case ECoreClass.eAnnotations:
                case ECoreClass.instanceTypeName:
                case ECoreClass.eSuperTypes:
                case ECoreClass.xsitype:
                case ECoreClass.eOperations:
                case ECoreClass.eStructuralFeatures:
                case ECoreClass.abstract:
                case ECoreClass.interface:
                case ECoreClass.namee: break; } }
        dObject.instanceClassName = this.read(json, ECoreClass.instanceTypeName, '');
        dObject.interface = this.read(json, ECoreClass.interface, 'false') === 'true';
        dObject.abstract = this.read(json, ECoreClass.abstract, 'false') === 'true';
        let tmps: string = this.read(json, ECoreClass.eSuperTypes, '');
        // Guard 2026-05-13 (Bug G root cause): se tmps è vuoto, split(' ') ritorna [''] invece di [].
        // L'array [''] propaga downstream a get_superclasses (LModelElement.tsx:3596) come queue
        // iniziale [undefined], causando TypeError mascherato dal proxy swallow di proxy.ts:276-293
        // come "childrenNames.indexOf is not a function". Riferimento:
        // docs/discovery/2026-05-13_microdiscovery_bug_g_childrennames.md.
        dObject.extends = tmps ? tmps.split(' ') : [];
        const features: Json[] = this.getChildren(json);
        const functions: Json[] = this.getChildren(json, false, true);

        for (let child of functions) this.parseDOperation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        for (let child of features) {
            const xsiType = this.read(child, ECoreAttribute.xsitype);
            switch (xsiType) {
                default: Log.exx( 'unexpected xsi:type: ', xsiType, ' in feature:', child); break;
                case 'ecore:EAttribute':
                    this.parseDAttribute(dObject, child, generated, (dObject as GObject).__fullname + "/"); break;
                case 'ecore:EReference':
                    this.parseDReference(dObject, child, generated, (dObject as GObject).__fullname + "/"); break;
            }
        }
        /// *** specific end *** ///
        return generated; }

    static parseDEnum(parent: DPackage, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DEnumerator = DEnumerator.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.enumerators.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'Enum_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        for (let key in json) {
            const value = json[key];
            switch (key) {
                default: Log.exx('Enum.parse() unexpected key:', key, 'in json:', json); break;
                case ECoreEnum.eAnnotations:
                case ECoreEnum.xsitype: case ECoreNamed.namee: break;
                case ECoreEnum.eLiterals: break;
                case ECoreEnum.serializable: dObject.serializable = value === 'true'; break;
                case ECoreEnum.instanceTypeName: dObject.instanceClassName = value + ''; break;
            }
        }
        for (let child of childs) {
            this.parseDEnumLiteral(dObject, child, generated, (dObject as GObject).__fullname + "/");
        }

        /// *** specific end *** ///
        return generated; }



    static parseDEnumLiteral(parent: DEnumerator, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DEnumLiteral = DEnumLiteral.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.literals.push(dObject.id);
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.value = +this.read(json, ECoreLiteral.value, Number.NEGATIVE_INFINITY);//vv4
        dObject.literal = this.read(json, ECoreLiteral.literal, '');
        dObject.name = this.read(json, ECoreNamed.namee,  dObject.literal || 'literal_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        /// *** specific end *** ///
        return generated; }

    static parseDAttribute(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        // done: old approach does not set pointedBy, i should set father and all pointers in .new() parameters
        let dObject: DAttribute = DAttribute.new(
            this.read(json, ECoreNamed.namee, 'attr_1'),
            undefined,
            parent.id,
        );
        generated.push(dObject);// dObject.father = parent.id;
        // if (parent) parent.attributes.push(dObject.id);
        //dObject.name = this.read(json, ECoreNamed.namee, 'attr_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        /// *** specific end *** ///
        return generated; }

    static parseDReference(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DReference = DReference.new(undefined, undefined, parent.id);
        generated.push(dObject);// dObject.father = parent.id;
        // if (parent) parent.references.push(dObject.id);
        dObject.name = this.read(json, ECorePackage.namee, 'Ref_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.composition = U.fromBoolString(this.read(json, ECoreReference.containment, false), false);
        dObject.container = U.fromBoolString(this.read(json, ECoreReference.container, false), false);
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreReference.eType, this.getEcoreTypeName(parent));
        /// *** specific end *** ///
        return generated; }

    static parseDParameter(parent: DOperation, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DParameter = DParameter.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.parameters.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'arg1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        dObject.ordered = U.fromBoolString(this.read(json, ECoreOperation.ordered, 'false'), false);
        dObject.unique = U.fromBoolString(this.read(json, ECoreOperation.unique, 'false'), false);
        /// *** specific end *** ///
        return generated; }

    static parseDOperation(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DOperation = DOperation.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.operations.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'operation_1');
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;

        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 1);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        dObject.exceptions = [this.read(json, ECoreOperation.eexceptions, '')];
        dObject.ordered = U.fromBoolString(this.read(json, ECoreOperation.ordered, 'false'));
        dObject.unique = U.fromBoolString(this.read(json, ECoreOperation.unique, 'false'));
        dObject.visibility = AccessModifier.package;
        for (let child of childs) {
            this.parseDParameter(dObject, child, generated, (dObject as GObject).__fullname + "/");
        }
        /// *** specific end *** ///
        return generated; }


    /*
    static parseTEMPLATE(parent: DSomething, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildren(json);
        let dObject: DSomething = DSomething.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.CHILDCOLLECTION.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, defaultNameTODO);
        (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
        const annotations: Json[] = this.getAnnotations(json);
        for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
        /// *** specific start *** ///
        for (let child of childs) {
            this.parseDSOMETHING(dObject, child, generated, (dObject as GObject).__fullname + "/");
        }
        /// *** specific end *** ///
        return generated; }*/





    /////////////////////////////////// generic
    static XMLinlineMarker: string = '-'; // aligned with EcoreService.xmlToJson output (was '@')
    static classTypePrefix: string = '#//'
    private static getSubPackages(thiss: Json): Json[] {
        const ret: any = thiss[ECoreSubPackage.eSubpackages];
        if (!ret || U.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    private static getAnnotations(thiss: Json): Json[] {
        const ret: any = thiss[ECorePackage.eAnnotations];
        if (!ret || U.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    private static getDetails(thiss: Json): Json[] {
        const ret: any = thiss[ECoreAnnotation.details];
        if (!ret || U.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    private static getChildren(thiss: Json, throwError: boolean = false, functions: boolean = false): Json[] {
        if (!thiss && !throwError) { return []; }
        const mod = thiss[ECoreRoot.ecoreEPackage];
        const pkg = thiss[ECorePackage.eClassifiers];
        const cla = thiss[functions ? ECoreClass.eOperations : ECoreClass.eStructuralFeatures];
        const fun = thiss[ECoreOperation.eParameters];
        const lit = thiss[ECoreEnum.eLiterals];

        const ret: any = mod || pkg || cla || fun || lit;
        /*if ( ret === undefined || ret === null ) {
          if (thiss['@name'] !== undefined) { ret = thiss; } // if it's the root with only 1 child arrayless
        }*/
        Log.ex( throwError && !ret, 'getChildren() Failed: ', thiss, ret);
        // console.log('ret = ', ret, ' === ', {}, ' ? ', (U.isEmptyObject(ret) ? [] : [ret]));
        if (!ret || U.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; }
    }

    private static read(json: Json, field: string, valueIfNotFound: any = 'read<T>()CanThrowError'): string {
        let ret: any = json ? json[field] : null;
        if (ret !== null && ret !== undefined && field.indexOf(this.XMLinlineMarker) !== -1) {
            Log.ex(U.isObject(ret, false, false, true), 'inline value |' + field + '| must be primitive.', ret);
            ret = U.multiReplaceAll('' + ret, ['&amp;', '&#38;', '&quot;'], ['&', '\'', '"']);
        }
        if ((ret === null || ret === undefined)) {
            Log.ex(valueIfNotFound === 'read<T>()CanThrowError', 'this.read<',  '> failed: field[' + field + '], json: ', json);
            return valueIfNotFound; }
        return ret; }

    static write(json: Json, field: string, val: string | any[]): string | any[] {
        if (val !== null && field.indexOf(EcoreParser.XMLinlineMarker) !== -1) {
            Log.ex(val !== '' + val, 'inline value |' + field + '| must be a string.', val);
            val = U.multiReplaceAll(val as string, ['&', '\'', '"'], ['&amp;', '&#38;', '&quot;']);
        }
        else Log.ex(val !== '' + val || !U.isObject(val, true), 'primitive values should be inserted only inline in the xml:', field, val);
        json[field] = val;
        return val; }

    private static getEcoreTypeName(parent: DClassifier): string {
        if (parent.className === DEnumerator.cname || parent.className === DClass.cname) return this.classTypePrefix + this.name;
        // return Type.classTypePrefix + parent.parent.name; problem: need L-object to navigate
        return Log.exx("getEcoreTypeName failed", parent);
    }

    // Returns the array of <ecore:EPackage> children under an <xmi:XMI> wrapper, or null
    // if the root JSON is itself a single <ecore:EPackage> (no wrapper).
    private static getMultiPackageChildren(json: Json): Json[] | null {
        const val = json[ECoreRoot.ecoreEPackage]; // "ecore:EPackage"
        if (val === undefined || val === null) return null;
        return Array.isArray(val) ? val : [val];
    }

    // A package is "primitive-only" when every classifier inside is an ecore:EDataType.
    // The package name is irrelevant — the user may call it PrimitiveTypes, Types, etc.
    private static isPrimitivePackage(pkg: Json): boolean {
        const classifiers = this.getChildren(pkg);
        if (classifiers.length === 0) return false;
        for (const c of classifiers) {
            if (c[ECoreClass.xsitype] !== 'ecore:EDataType') return false;
        }
        return true;
    }

    // Pre-pass run before LinkAllNamesToIDs. Rewrites XPath-style pointers in `type` and
    // `extends` fields into forms the resolver already handles: primitive package references
    // become canonical EDataType names (e.g. "EString"), normal package references become
    // "#//ClassName". Three-segment pointers ("/N/X/Y") used by eOpposite are out of scope
    // for Fase B.1 and left untouched (they will error downstream as expected).
    private static rewriteXPathPointers(
        parsedElements: DModelElement[],
        primitiveIndices: Set<number>,
        normalIndices: Set<number>,
        epkgChildren: Json[]
    ): void {
        const xpathRe = /^\/(\d+)\/([^/]+)$/;
        // Bug H: matches cross-document EDataType/EClass multi-value form, e.g.
        //   "ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Boolean"
        //   "ecore:EClass http://www.eclipse.org/emf/2002/Ecore#//EClass"
        // The captured group is the final type-name segment after "#//".
        // Idempotent: requires "ecore:E\w+\s+..." prefix, never matches rewritten short names.
        const crossDocRe = /^ecore:E\w+\s+\S+#\/\/(\w+)$/;
        const rewriteOne = (value: string): string => {
            if (typeof value !== 'string') return value;
            // Bug H: cross-document multi-value form takes precedence over XPath form.
            const cdm = crossDocRe.exec(value);
            if (cdm) {
                const typeName = cdm[1];
                const canonical = EcoreParser.EDATATYPE_CANONICAL_ALIASES[typeName];
                if (canonical) return canonical;
                // Unknown cross-doc type: leave raw, defensive fallback at data.ts:314 catches it.
                return value;
            }
            if (!value.startsWith('/')) return value;
            const m = xpathRe.exec(value);
            if (!m) return value; // "/N/X/Y" or other shapes: scope Fase B.2
            const idx = parseInt(m[1], 10);
            const name = m[2];
            if (primitiveIndices.has(idx)) {
                const canonical = EcoreParser.EDATATYPE_CANONICAL_ALIASES[name];
                if (canonical) return canonical;
                const pkgName = (epkgChildren[idx]?.[ECoreNamed.namee] as string) || '?';
                console.warn(`[EcoreImporter] Unknown EDataType "${name}" in primitive package "${pkgName}" (index ${idx}), falling back to EString`);
                return 'EString';
            }
            if (normalIndices.has(idx)) return EcoreParser.classTypePrefix + name; // "#//Name"
            return value;
        };

        for (const elem of parsedElements) {
            const e = elem as GObject;
            if (typeof e.type === 'string') {
                const newVal = rewriteOne(e.type);
                e.type = newVal;
            }
            if (Array.isArray(e.extends)) {
                e.extends = e.extends.map((v: string) => {
                    if (typeof v !== 'string') return v;
                    const newVal = rewriteOne(v);
                    return newVal;
                });
            }
        }
    }

}

export enum AccessModifier {
    public = 'public',
    private = 'private',
    protected = 'protected',
    internal = 'internal',
    package = 'package',
    protectedinternal = 'protected internal',
    protectedprivate = 'protected private', }

@RuntimeAccessible('ECoreRoot')
export class ECoreRoot {
    static cname = 'ECoreRoot';
    static ecoreEPackage: string;
}

@RuntimeAccessible('ECoreAnnotation')
export class ECoreAnnotation {
    static cname = 'ECoreAnnotation';
    static source: string;
    static references: string;
    static details: string;
}

@RuntimeAccessible('ECoreNamed')
export class ECoreNamed {
    static cname = 'ECoreNamed';
    static namee: string;
}

@RuntimeAccessible('ECoreDetail')
export class ECoreDetail {
    static cname = 'ECoreDetail';
    static key: string;
    static value: string;
}

@RuntimeAccessible('ECoreSubPackage')
export class ECoreSubPackage { // <eSubpackages
    static cname = 'ECoreSubPackage';
    static eAnnotations: string;
    static eClassifiers: string;
    static nsURI: string;
    static nsPrefix: string;
    static namee: string;
    static eSubpackages: string;
}

@RuntimeAccessible('ECorePackage')
export class ECorePackage extends ECoreSubPackage {
    static cname = 'ECorePackage';
    static eAnnotations: string;
    static eSubpackages: string;
    static eClassifiers: string;
    static xmlnsxmi: string;
    static xmlnsxsi: string;
    static xmiversion: string;
    static xmlnsecore: string;
    static nsURI: string;
    static nsPrefix: string;
    static namee: string;
}

@RuntimeAccessible('ECoreClass')
export class ECoreClass {
    static cname = 'ECoreClass';
    static eAnnotations: string;
    static eStructuralFeatures: string;
    static xsitype: string;
    static namee: string;
    static eOperations: string;
    static instanceTypeName: string;
    static eSuperTypes: string;
    static abstract: string;
    static interface: string;

    // static defaultValue = EcoreParser.XMLinlineMarker + 'defaultValue';  // visualizzato in ecore ma mai salvato dentro il file. inutilizzato
    // nelle classi, assume il valore di "[name] = [NumericValue]" senza le [] negli enum.
}

@RuntimeAccessible('ECoreEnum')
export class ECoreEnum {
    static cname = 'ECoreEnum';
    static eAnnotations: string;
    static xsitype: string;
    static namee: string;
    static instanceTypeName: string;
    static serializable: string;
    static eLiterals: string;
}

@RuntimeAccessible('ECoreLiteral')
export class ECoreLiteral {
    static cname = 'ECoreLiteral';
    static eAnnotations: string;
    static namee: string;
    static value: string;
    static literal: string;
}


@RuntimeAccessible('ECoreReference')
export class ECoreReference {
    static cname = 'ECoreReference';
    static eAnnotations: string;
    static xsitype: string;
    static eType: string;
    static namee: string;
    static unique: string;
    static ordered: string;
    static upperbound: string;
    static lowerbound: string;
    static containment: string;
    static container: string;
}

@RuntimeAccessible('ECoreAttribute')
export class ECoreAttribute {
    static cname = 'ECoreAttribute';
    static eAnnotations: string;
    static xsitype: string;
    static namee: string;
    static eType: string;
    static unique: string;
    static ordered: string;
    static lowerbound: string;
    static upperbound: string;
}

@RuntimeAccessible('ECoreOperation')
export class ECoreOperation {
    static cname = 'ECoreOperation';
    static eAnnotations: string;
    static namee: string;
    static eType: string;
    static upperBound: string;
    static lowerBound: string;
    static unique: string;
    static ordered: string;
    static eexceptions: string;
    static eParameters: string;
}

@RuntimeAccessible('ECoreParameter')
export class ECoreParameter {
    static cname = 'ECoreParameter';
    static eAnnotations: string;
    static namee: string;
    static eType: string;
    static lowerBound: string;
    static upperBound: string;
    static ordered: string;
    static unique: string;
}

@RuntimeAccessible('ECoreObject')
export class ECoreObject {
    static cname = 'ECoreObject';
    static xmlns_xmi: string;
    static xmlns_uri: never; // "-xmlns:org.eclipse.example.modelname": "https://org/eclipse/example/modelname", <b>key is dynamic</b>
    static xmi_version: string;
}

@RuntimeAccessible('XMIModel')
export class XMIModel {
    static cname = 'XMIModel';
    static type: string;
    static namee: string;
}


///////////////

ECoreRoot.ecoreEPackage = 'ecore:EPackage'; // this is root tag but not in xml->json, just his attributes/childrens
ECoreNamed.namee = EcoreParser.XMLinlineMarker + 'name';

ECorePackage.eAnnotations = ECoreSubPackage.eAnnotations = ECoreClass.eAnnotations =
    ECoreEnum.eAnnotations = ECoreLiteral.eAnnotations =  ECoreReference.eAnnotations =
        ECoreAttribute.eAnnotations = ECoreOperation.eAnnotations = ECoreParameter.eAnnotations = 'eAnnotations';

ECoreAnnotation.source = EcoreParser.XMLinlineMarker + 'source';
ECoreAnnotation.references = EcoreParser.XMLinlineMarker + 'references'; // "#/" for target = package.
ECoreAnnotation.details = 'details'; // arr
ECoreDetail.key = EcoreParser.XMLinlineMarker + 'key'; // can have spaces
ECoreDetail.value = EcoreParser.XMLinlineMarker + 'value';

ECorePackage.eSubpackages = 'eSubpackages';
ECorePackage.eClassifiers = 'eClassifiers';
ECorePackage.xmlnsxmi = EcoreParser.XMLinlineMarker + 'xmlns:xmi'; // typical value: http://www.omg.org/XMI
ECorePackage.xmlnsxsi = EcoreParser.XMLinlineMarker + 'xmlns:xsi'; // typical value: http://www.w3.org/2001/XMLSchema-instance
ECorePackage.xmiversion = EcoreParser.XMLinlineMarker + 'xmi:version'; // typical value: "2.0"
ECoreObject.xmi_version = EcoreParser.XMLinlineMarker + 'xmi:version'; // "2.0"
ECorePackage.xmlnsecore = EcoreParser.XMLinlineMarker + 'xmlns:ecore';
ECorePackage.nsURI = EcoreParser.XMLinlineMarker + 'nsURI'; // typical value: "http://org/eclipse/example/modelname"
ECorePackage.nsPrefix = EcoreParser.XMLinlineMarker + 'nsPrefix'; // typical value: org.eclipse.example.modelname
ECorePackage.namee = EcoreParser.XMLinlineMarker + 'name';

ECoreSubPackage.eSubpackages = 'eSubpackages';
ECoreSubPackage.eClassifiers = 'eClassifiers';
ECoreSubPackage.nsURI = EcoreParser.XMLinlineMarker + 'nsURI'; // typical value: "http://org/eclipse/example/modelname"
ECoreSubPackage.nsPrefix = EcoreParser.XMLinlineMarker + 'nsPrefix'; // typical value: org.eclipse.example.modelname
ECoreSubPackage.namee = EcoreParser.XMLinlineMarker + 'name';


ECoreClass.eStructuralFeatures = 'eStructuralFeatures';
ECoreClass.eOperations = 'eOperations';
ECoreClass.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EClass"
ECoreClass.namee = ECorePackage.namee;
ECoreClass.eSuperTypes = EcoreParser.XMLinlineMarker + 'eSuperTypes'; // space separated: "#name1 #name2"...
ECoreClass.instanceTypeName = EcoreParser.XMLinlineMarker + 'instanceTypeName';  // raw str
ECoreClass.instanceTypeName = EcoreParser.XMLinlineMarker + 'instanceTypeName';
ECoreClass.abstract = EcoreParser.XMLinlineMarker + 'abstract'; // bool
ECoreClass.interface = EcoreParser.XMLinlineMarker + 'interface'; // bool

ECoreEnum.instanceTypeName = ECoreClass.instanceTypeName;
ECoreEnum.serializable = 'serializable'; // "false", "true"
ECoreEnum.xsitype = ECoreClass.xsitype; // "ecore:EEnum"
ECoreEnum.eLiterals = 'eLiterals';
ECoreEnum.namee = ECorePackage.namee;

ECoreLiteral.literal = 'literal';
ECoreLiteral.namee = ECorePackage.namee;
ECoreLiteral.value = 'value'; // any integer (-inf, +inf), not null. limiti = a type int 32 bit? vv4

ECoreReference.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EReference"
ECoreReference.eType = EcoreParser.XMLinlineMarker + 'eType'; // "#//Player"
ECoreReference.containment = EcoreParser.XMLinlineMarker + 'containment'; // "true"
ECoreReference.container = EcoreParser.XMLinlineMarker + 'container'; // "true" todo: not sure if it's really like this.
ECoreReference.upperbound = EcoreParser.XMLinlineMarker + 'upperBound'; // "@1"
ECoreReference.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound'; // does even exists?
ECoreReference.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreReference.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false",
ECoreReference.ordered = EcoreParser.XMLinlineMarker + 'unique'; // "false",


ECoreAttribute.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EAttribute",
ECoreAttribute.eType = EcoreParser.XMLinlineMarker + 'eType'; // "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
ECoreAttribute.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreAttribute.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound';
ECoreAttribute.upperbound = EcoreParser.XMLinlineMarker + 'upperBound';
ECoreAttribute.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false",
ECoreAttribute.ordered = EcoreParser.XMLinlineMarker + 'unique'; // "false",


ECoreOperation.eParameters = 'eParameters';
ECoreOperation.namee = EcoreParser.XMLinlineMarker + 'name'; // "EExceptionNameCustom",
ECoreOperation.ordered = EcoreParser.XMLinlineMarker + 'ordered'; // "false",
ECoreOperation.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false",
ECoreOperation.lowerBound = EcoreParser.XMLinlineMarker + 'lowerBound'; // "5", ma che senso ha su una funzione?? è il return?
ECoreOperation.upperBound = EcoreParser.XMLinlineMarker + 'upperBound';
ECoreOperation.eType = EcoreParser.XMLinlineMarker + 'eType'; // "#//Classname",
ECoreOperation.eexceptions = EcoreParser.XMLinlineMarker + 'eExceptions';
// "#//ClassnameException1 #//ClassNameException2 (also custom classes) ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt

ECoreParameter.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreParameter.ordered = EcoreParser.XMLinlineMarker + 'ordered'; // "false";
ECoreParameter.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false"
ECoreParameter.lowerBound = EcoreParser.XMLinlineMarker + 'lowerBound'; // "1"
ECoreParameter.upperBound = EcoreParser.XMLinlineMarker + 'upperBound'; // "2"
ECoreParameter.eType = EcoreParser.XMLinlineMarker + 'eType'; // "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDoubl

ECoreObject.xmlns_xmi = EcoreParser.XMLinlineMarker + 'xmlns:xmi'; // "http://www.omg.org/XMI"
// ECoreObject.xmlns_uri = EcoreParser.XMLinlineMarker + 'xmlns:org.eclipse.example.modelname'; // "https://org/eclipse/example/modelname"

XMIModel.type = EcoreParser.XMLinlineMarker + 'type';
XMIModel.namee = EcoreParser.XMLinlineMarker + 'name';

export const EcoreXmiTags = [
    "xmi:version",
    "xmlns:xmi",
    "xmlns:xsi",
    "xmlns:ecore",
];