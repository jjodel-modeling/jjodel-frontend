import {
    Json,
    Log,


    DModelElement,
    LModelElement,
    DModel,
    LModel,
    DValue,
    LValue,
    DNamedElement,
    LNamedElement,
    DObject,
    LObject,
    DEnumerator,
    LEnumerator,
    DEnumLiteral,
    LEnumLiteral,
    DAttribute,
    LAttribute,
    DReference,
    LReference,
    DStructuralFeature,
    LStructuralFeature,
    DClassifier,
    LClassifier,
    DDataType,
    LDataType,
    DClass,
    LClass,
    DParameter,
    LParameter,
    DOperation,
    LOperation,
    DPackage,
    LPackage,
    DTypedElement,
    LTypedElement,
    DAnnotation,
    LAnnotation,
    EJavaObject,
    DMap,
    LMap,
    DFactory_useless_,
    LFactory_useless_,
    AttribETypes,
    U,
    Pointer,
    CreateElementAction,
    Selectors,
    GObject,
    Dictionary,
    PointedBy, LPointerTargetable, windoww, SetRootFieldAction

} from "../joiner";

type RET<T = boolean> = T | Promise<T>;
type Ret = RET;

class SavePack{
    model: string;
    vertexpos: string;
    view: string;
    constructor(model: string='', vertexpos: string='', view:string='') {
        this.model = model;
        this.vertexpos = vertexpos;
        this.view = view;
    }
}

type JsonSavePack = {[key in keyof SavePack]: Json | null }


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
    public abstract set(key: string | number, val: string | any): RET;
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


}

export class EcoreParser{
    static supportedEcoreVersions = ["http://www.eclipse.org/emf/2002/Ecore"];
    static prefix:string = '@';
    static parse(ecorejson: string | null, persist: boolean = false): DModelElement[]{
        if (!ecorejson) return [];
        let parsedElements: DModelElement[] = EcoreParser.parseDModel(JSON.parse(ecorejson));
        console.warn("parse.result D", parsedElements);
        this.LinkAllNamesToIDs(parsedElements);
        this.fixNamingConflicts(parsedElements);
        if (persist) {
            CreateElementAction.newBatch(parsedElements);
        }
        windoww.tmpparse = () => LPointerTargetable.wrapAll(parsedElements);

        this.tempfix_untilopennewtabisdone(parsedElements);
        return parsedElements;
    }
    private static tempfix_untilopennewtabisdone(parsedElements: DModelElement[]) {
        // replaces current model with parsed model. this needs to be removed to open a new tab later on.
        let model: DModel = null as any;
        for (let elem of parsedElements) { if (elem.className === DModel.name) { model = elem as any; break; } }
        windoww.tmp3 = () => { SetRootFieldAction.new("models", [model.id], '', false);  }
        SetRootFieldAction.new("models", [model.id], '', false); // it is pointer but no need to update pointedby's this time
        SetRootFieldAction.new('metamodel', model.id, '', true);
    }

    private static LinkAllNamesToIDs(parsedElements: DModelElement[]): void {
        // todo: è post-parse che legga i nomi e assegni gli id aggiustando le references e extends settati by name. trova i campi temporanei cercando i @ts-ignore
        // update mref, attribute, parameter type
        // update operation exception
        // replace those names with id's

        let idMap: Dictionary<Pointer, DModelElement> = {};
        let nameMap: Dictionary<string, DModelElement> = {};
        let replacePrimitiveMap: Dictionary<string, DClassifier> = {};
        let d_Estring: DClassifier = Selectors.getAllPrimitiveTypes()[0];
        replacePrimitiveMap[AttribETypes.EString] = d_Estring;
        // todo: do the same for all other primitives

        // let longprefixlength = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore'.length;
        const typeprefix = "#//";
        for (let shortkey in AttribETypes){
            let longkey: string = (AttribETypes as GObject)[shortkey];
            // fallback for missing type instead of crash
            if (!replacePrimitiveMap[longkey]) replacePrimitiveMap[longkey] = d_Estring;

            // allow shortcuts to work too
            replacePrimitiveMap[typeprefix + shortkey] = replacePrimitiveMap[longkey];

        }


        for (let ecorename in replacePrimitiveMap) {
            idMap[replacePrimitiveMap[ecorename].id] = replacePrimitiveMap[ecorename];
        }

        let prereplace = (name: string) => name.replaceAll("#//", ""); // todo: if
        let replaceRules = ["extends", "extendedBy", "exceptions", "type"];
        let dobj: GObject & DModelElement;

        for (dobj of parsedElements) {
            if (dobj.name) { nameMap[dobj.name] = dobj; nameMap[typeprefix + dobj.name] = dobj;}
            idMap[dobj.id] = dobj;
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
                    const isType = value.indexOf("#//") == 0;
                    let target: DModelElement = replacePrimitiveMap[value];
                    if (!target) target = nameMap[value];


                    if (isType) {
                        console.log("attempt to replace primitive type to his id", {target, dobj, replacekey, value, replacePrimitiveMap, nameMap, idMap});
                    }

                    if (replacekey === "extends") {
                        if (!target) continue;
                        Log.ex(target.className !== DClass.name, "found a class attempting to extend an object that is not a class", {target, dobj, replacePrimitiveMap, nameMap, idMap});
                        (target as DClass).extendedBy.push((dobj as DClass).id);
                    }
                    Log.ex(!target, "LinkAllNames() can't find type target:", {value, nameMap, replacePrimitiveMap, dobj, replacekey});
                    if (isArray) dobj[replacekey].push(target.id);
                    else dobj[replacekey] = target.id;
                }
            }

        }

        for (let ptrkey of PointedBy.list) for(dobj of parsedElements) {
            let valtmp: string | string[] = dobj[ptrkey] as string | string[];
            let values: string[]
            let isArray = Array.isArray(valtmp);
            if (isArray) {
                values = valtmp as string[];
            }
            else {
                if (valtmp === undefined) values = [];
                // if (valtmp === "modeltmp") { dobj[ptrkey] = null; values = []; } // because model.father is null, but i want to error check others and let them crash if missing father
                else values = [valtmp as string];
                // todo: fixa i pointedby
            }
            console.log("fixalltypes[]", {ptrkey, valtmp, dobj, values});
            for (let value of values) {
                if (!value) continue;
                // errore: per operazione.type l'import mi restituisce puntatore a oggetto stringa, ma non è tra gli oggetti parsed
                let target: DModelElement = idMap[value];
                console.log("fixalltypes", {ptrkey, valtmp, dobj, value, values, target, idMap});
                if (!target) throw new Error("target undefined");
                target.pointedBy.push(PointedBy.new("idlookup." + dobj.id + "." + ptrkey));
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

    static parseDModel(json: Json): DModelElement[] {
        let generated: DModelElement[] = [];
        if (!json) { json = {}; }
        let dObject: DModel = DModel.new();
        generated.push(dObject); // dObject.father = 'modeltmp' as any;
        /// *** specific  *** ///
        const childrens = EcoreParser.getChildrens(json);
        const annotations = EcoreParser.getAnnotations(json);
        dObject.name = json[ECoreNamed.namee] as string || "imported_metamodel_1";
        for (let child of annotations) {
            EcoreParser.parseDAnnotation(dObject, child, generated);
        }
        for (let child of childrens) {
            EcoreParser.parseDPackage(dObject, child, generated);
        }
        return generated;
    }


    static parseDAnnotation(parent: DModelElement, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        let dObject: DAnnotation = DAnnotation.new();
        generated.push(dObject); dObject.father = parent.id;
        dObject.father = parent.id;
        if (parent) parent.annotations.push(dObject.id);

        /// *** specific  *** ///
        let key: string;
        for (key in json){
            const value = json[key];
            switch (key) {
                default: Log.exx('unexpected field in EAnnotation:  ' + key + ' => |' + value + '|'); break;
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

    static parseDPackage(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);

        console.warn("parseDPackage.childrens", childs, generated);
        let dObject: DPackage = DPackage.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.packages.push(dObject.id);

        let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
        // model.xmi = json[EcoreParser.prefix+"xmlns:xmi"]; // http://www.omg.org/XMI
        // model.xsi = json[EcoreParser.prefix+"xmlns:xsi"]; // http://www.w3.org/2001/XMLSchema-instance
        Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);

        dObject.name = this.read(json, ECoreNamed.namee, 'defaultPackage');
        /// *** specific start *** ///
        dObject.uri = this.read(json, ECorePackage.nsURI, null);
        dObject.prefix = this.read(json, ECorePackage.nsPrefix, null);
        // if (!parent.uri) parent.uri = dObject.uri;
        // if (!parent.prefix) parent.prefix = dObject.prefix; // namespace
        for (let child of childs) {
            switch (child[ECoreClass.xsitype]) {
                default: Log.exx('unexpected xsitype:', child[ECoreClass.xsitype], ' found in jsonfragment:', child, ', in json:', json, ' package:', dObject); break;
                case 'ecore:EClass': this.parseDClass(dObject, child, generated); break;
                case 'ecore:EEnum': this.parseDEnum(dObject, child, generated); break;
            }
        }
        /// *** specific end *** ///
        return generated; }

    static parseDClass(parent: DPackage, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        let dObject: DClass = DClass.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.classifiers.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'Class_1');
        /// *** specific start *** ///
        for (let key in json) {
            switch (key) {
                default: Log.exx('unexpected field in parseDClass() |' + key + '|', json); break;
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
        dObject.extends = tmps.split(' ');
        const features: Json[] = this.getChildrens(json);
        const functions: Json[] = this.getChildrens(json, false, true);
        for (let child of functions) {
            this.parseDOperation(dObject, json, generated);
        }
        for (let child of features) {
            const xsiType = this.read(child, ECoreAttribute.xsitype);
            switch (xsiType) {
                default: Log.exx( 'unexpected xsi:type: ', xsiType, ' in feature:', child); break;
                case 'ecore:EAttribute':
                    this.parseDAttribute(dObject, child, generated); break;
                case 'ecore:EReference':
                    this.parseDReference(dObject, child, generated); break;
            }
        }
        /// *** specific end *** ///
        return generated; }

    static parseDEnum(parent: DPackage, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DEnumerator = DEnumerator.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.classifiers.push(dObject.id);
        /// *** specific start *** ///
        for (let key in json) {
            const value = json[key];
            switch (key) {
                default: Log.exx('Enum.parse() unexpected key:', key, 'in json:', json); break;
                case ECoreEnum.xsitype: case ECoreNamed.namee: break;
                case ECoreEnum.eLiterals: break;
                case ECoreEnum.serializable: dObject.serializable = value === 'true'; break;
                case ECoreEnum.instanceTypeName: dObject.instanceClassName = value + ''; break;
            }
        }
        for (let child of childs) {
            this.parseDEnumLiteral(dObject, child, generated);
        }

        /// *** specific end *** ///
        return generated; }



    static parseDEnumLiteral(parent: DEnumerator, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DEnumLiteral = DEnumLiteral.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.literals.push(dObject.id);
        /// *** specific start *** ///
        dObject.ordinal = +this.read(json, EcoreLiteral.value, Number.NEGATIVE_INFINITY);
        dObject.literal = this.read(json, EcoreLiteral.literal, '');
        dObject.name = this.read(json, ECoreNamed.namee,  dObject.literal || 'literal_1');
        /// *** specific end *** ///
        return generated; }

    static parseDAttribute(parent: DClass, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DAttribute = DAttribute.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.attributes.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'attr_1');
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        /// *** specific end *** ///
        return generated; }

    static parseDReference(parent: DClass, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DReference = DReference.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.references.push(dObject.id);
        dObject.name = this.read(json, ECorePackage.namee, 'Ref_1');
        /// *** specific start *** ///
        dObject.containment = U.fromBoolString(this.read(json, ECoreReference.containment, false), false);
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);

        dObject.type = this.read(json, ECoreReference.eType, this.getEcoreTypeName(parent));

        console.log("attempting to parse dref", {dObject, json, parent, typekey:  ECoreReference.eType})

        /// *** specific end *** ///
        return generated; }

    static parseDParameter(parent: DOperation, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DParameter = DParameter.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.parameters.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'arg1');
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        dObject.ordered = U.fromBoolString(this.read(json, ECoreOperation.ordered, 'false'), false);
        dObject.unique = U.fromBoolString(this.read(json, ECoreOperation.unique, 'false'), false);
        /// *** specific end *** ///
        return generated; }

    static parseDOperation(parent: DClass, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DOperation = DOperation.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.operations.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, 'operation_1');
        /// *** specific start *** ///
        dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 1);
        dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
        dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
        dObject.exceptions = [this.read(json, ECoreOperation.eexceptions, '')];
        dObject.ordered = U.fromBoolString(this.read(json, ECoreOperation.ordered, 'false'));
        dObject.unique = U.fromBoolString(this.read(json, ECoreOperation.unique, 'false'));
        dObject.visibility = AccessModifier.package;
        for (let child of childs) {
            this.parseDParameter(dObject, json, generated);
        }
        /// *** specific end *** ///
        return generated; }


    /*
    static parseTEMPLATE(parent: DSomething, json: Json, generated: DModelElement[]): DModelElement[] {
        if (!generated) generated = [];
        if (!json) { json = {}; }
        const childs = this.getChildrens(json);
        let dObject: DSomething = DSomething.new();
        generated.push(dObject); dObject.father = parent.id;
        if (parent) parent.CHILDCOLLECTION.push(dObject.id);
        dObject.name = this.read(json, ECoreNamed.namee, defaultNameTODO);
        /// *** specific start *** ///
        for (let child of childs) {
            this.parseDSOMETHING(dObject, json, generated);
        }
        /// *** specific end *** ///
        return generated; }*/





    /////////////////////////////////// generic
    static XMLinlineMarker: string = '@';
    static classTypePrefix: string = '#//'
    private static getAnnotations(thiss: Json): Json[] {
        const ret: any = thiss[ECorePackage.eAnnotations];
        if (!ret || $.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    private static getDetails(thiss: Json): Json[] {
        const ret: any = thiss[ECoreAnnotation.details];
        if (!ret || $.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    private static getChildrens(thiss: Json, throwError: boolean = false, functions: boolean = false): Json[] {
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
        Log.ex( throwError && !ret, 'getChildrens() Failed: ', thiss, ret);
        // console.log('ret = ', ret, ' === ', {}, ' ? ', ($.isEmptyObject(ret) ? [] : [ret]));
        if (!ret || $.isEmptyObject(ret)) { return []; }
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
        if (parent.className === DEnumerator.name || parent.className === DClass.name) return this.classTypePrefix + this.name;
        // return Type.classTypePrefix + parent.parent.name; problem: need L-object to navigate
        return Log.ex("getEcoreTypeName failed", parent);
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

export class ECoreRoot {
    static ecoreEPackage: string;
}

export class ECoreAnnotation {
    static source: string;
    static references: string;
    static details: string;}
export class ECoreNamed {
    static namee: string; }

export class ECoreDetail {
    static key: string;
    static value: string; }

export class ECorePackage {
    static eAnnotations: string;
    static eClassifiers: string;
    static xmlnsxmi: string;
    static xmlnsxsi: string;
    static xmiversion: string;
    static xmlnsecore: string;
    static nsURI: string;
    static nsPrefix: string;
    static namee: string;
}


export class ECoreClass {
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

export class ECoreEnum {
    static eAnnotations: string;
    static xsitype: string;
    static namee: string;
    static instanceTypeName: string;
    static serializable: string;
    static eLiterals: string;
}

export class EcoreLiteral {
    static eAnnotations: string;
    static namee: string;
    static value: string;
    static literal: string;
}


export class ECoreReference {
    static eAnnotations: string;
    static xsitype: string;
    static eType: string;
    static containment: string;
    static upperbound: string;
    static lowerbound: string;
    static namee: string; }

export class ECoreAttribute {
    static eAnnotations: string;
    static xsitype: string;
    static eType: string;
    static namee: string;
    static lowerbound: string;
    static upperbound: string;
}

export class ECoreOperation {
    static eAnnotations: string;
    static eType: string;
    static eexceptions: string;
    static upperBound: string;
    static lowerBound: string;
    static unique: string;
    static ordered: string;
    static namee: string;
    static eParameters: string; }

export class ECoreParameter {
    static eAnnotations: string;
    static namee: string;
    static ordered: string;
    static unique: string;
    static lowerBound: string;
    static upperBound: string;
    static eType: string;
}

export class XMIModel {
    static type: string;
    static namee: string; }


///////////////

ECoreRoot.ecoreEPackage = 'ecore:EPackage';
ECoreNamed.namee = EcoreParser.XMLinlineMarker + 'name';

ECorePackage.eAnnotations = ECoreClass.eAnnotations = ECoreEnum.eAnnotations = EcoreLiteral.eAnnotations =
    ECoreReference.eAnnotations = ECoreAttribute.eAnnotations = ECoreOperation.eAnnotations = ECoreParameter.eAnnotations = 'eAnnotations';

ECoreAnnotation.source = EcoreParser.XMLinlineMarker + 'source';
ECoreAnnotation.references = EcoreParser.XMLinlineMarker + 'references'; // "#/" for target = package.
ECoreAnnotation.details = 'details'; // arr
ECoreDetail.key = EcoreParser.XMLinlineMarker + 'key'; // can have spaces
ECoreDetail.value = EcoreParser.XMLinlineMarker + 'value';

ECorePackage.eClassifiers = 'eClassifiers';
ECorePackage.xmlnsxmi = EcoreParser.XMLinlineMarker + 'xmlns:xmi'; // typical value: http://www.omg.org/XMI
ECorePackage.xmlnsxsi = EcoreParser.XMLinlineMarker + 'xmlns:xsi'; // typical value: http://www.w3.org/2001/XMLSchema-instance
ECorePackage.xmiversion = EcoreParser.XMLinlineMarker + 'xmi:version'; // typical value: "2.0"
ECorePackage.xmlnsecore = EcoreParser.XMLinlineMarker + 'xmlns:ecore';
ECorePackage.nsURI = EcoreParser.XMLinlineMarker + 'nsURI'; // typical value: "http://org/eclipse/example/bowling"
ECorePackage.nsPrefix = EcoreParser.XMLinlineMarker + 'nsPrefix'; // typical value: org.eclipse.example.bowling
ECorePackage.namee = EcoreParser.XMLinlineMarker + 'name';

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

EcoreLiteral.literal = 'literal';
EcoreLiteral.namee = ECorePackage.namee;
EcoreLiteral.value = 'value'; // any integer (-inf, +inf), not null. limiti = a type int 32 bit?

ECoreReference.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EReference"
ECoreReference.eType = EcoreParser.XMLinlineMarker + 'eType'; // "#//Player"
ECoreReference.containment = EcoreParser.XMLinlineMarker + 'containment'; // "true"
ECoreReference.upperbound = EcoreParser.XMLinlineMarker + 'upperBound'; // "@1"
ECoreReference.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound'; // does even exists?
ECoreReference.namee = EcoreParser.XMLinlineMarker + 'name';

ECoreAttribute.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EAttribute",
ECoreAttribute.eType = EcoreParser.XMLinlineMarker + 'eType'; // "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
ECoreAttribute.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreAttribute.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound';
ECoreAttribute.upperbound = EcoreParser.XMLinlineMarker + 'upperBound';


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

XMIModel.type = EcoreParser.XMLinlineMarker + 'type';
XMIModel.namee = EcoreParser.XMLinlineMarker + 'name';
