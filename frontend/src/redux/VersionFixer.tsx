import {
    GraphSize, IPoint, DocString, Dictionary, Pointer,
    GObject,
    GraphPoint, DViewPoint, DViewElement, PointedBy,
    DProject, LViewElement,
    DV, DPackage, DObject, EdgeBendingMode, EdgeHead,
} from "../joiner";
import {
    Defaults, DGraphElement,
    DPointerTargetable, DReference,
    DState,
    LoadAction,
    Log, LPointerTargetable, Pointers, RuntimeAccessible, RuntimeAccessibleClass, store, TRANSACTION,
    U
} from "../joiner";
import {Tooltip} from "../components/forEndUser/Tooltip";
import {DEFAULT_VIEW_JSX_STRING, LEGACY_PLACEHOLDER_MARKER, V2_2_TO_V2_3_DETECT_MARKER,
    DEFAULT_VIEW_JSX_V2_3_LEGACY, V2_3_TO_V3_DETECT_MARKER,
    CLASSIC_OBJECT_VIEW_JSX, CLASSIC_VALUE_VIEW_JSX, CLASSIC_SINGLETON_VIEW_JSX,
    CLASSIC_OBJECT_VIEW_MARKER, CLASSIC_VALUE_VIEW_MARKER, CLASSIC_SINGLETON_VIEW_MARKER} from "../utils/defaultViewTemplate";
import {defaultObjectViewIR} from "../components/editor-v2/viewpoint/ir/irDefaults";

/*
                                    TODO for every update: check the VersionFixer.help() function
*/

const deleteDState = false; // there is also one in Constructors, update them together
@RuntimeAccessible('VersionFixer')
export class VersionFixer {
    public static cname = 'VersionFixer';
    private static versionAdapters: Dictionary<number/*version*/, {n: number, f:(s: DState)=>DState}> = VersionFixer.setup();
    private static highestVersion: number = 0; // automatically updated from updater function names
    private static prefix: string = '__jodel_versioning_';
    // public static UpdateOnSave: Dictionary<string, string> = {}; // stuff to be fixed with string replacement instead of save object manipulation
    public static help(){
        console.clear();
        let i: number  = 1;

        /* console.log(`
Before deploying a new version you should:

${i++}) Update changelog

${i++}) build a new empty versioning function with signature like: private ['2.1 -> 2.3'](s: DState): DState
        fill this function in a way that translates from the state shape of the old version, to the state shape of the new one

`); */



        // DEPRECATED stuff
        false && console.log(`
Before deploying a new version you should: // obsolete version

${i++}?) ONLY IF IT'S FIRST TIME;
   run DState.registerFirstTimeOnly() in the deploy version and export the localStorage variables starting with ${VersionFixer.prefix} to the dev version.
   or call it in dev version after having temporarly undone the pending updates if possible, otherwise next steps might fail.
   
${i++}?) ONLY IF there are entirely new kinds of D-objects or optional new sub-structures in D-objects (like View.palette), update buildVersionSignature() method

${i++}) build a new empty versioning function with signature: private ['2.1 -> 2.3'](s: DState): DState

${i++}) in DState update DState.version.n (leave date and conversionList unchanged)

${i++}) open a new empty project (no models no metamodels)
   to find out what changed in the state between version without risking human error, i made an automatic detection.
   call VersionFixer.checkVersionChanges() in browser console to see what changed need conversion in the function (i would save the result as comment inside the func)

${i++}) fill the empty function of step (1), in a way that translates from the state shape of the old version, to the state shape of the new one

${i++}) only after the transition function is complete, call VersionFixer.registerNewVersion();
   it will both validate the version update function and store the new version as baseline.
   (needs to be done last because checkVersionChanges will stop working until a new version is ready)
   
BEWARE: this approach cannot detect changes of valid values where the type did not change. eg if view.appliableTo = 'string' change his valid string values but not his type;
everytime you put hands into a D-Object shape or valid values, you should document them to be able to write a conversion function later on.
        `);
    }
    public static get_highestversion(): number{
        if (VersionFixer.highestVersion === 0) VersionFixer.setup();
        return VersionFixer.highestVersion;
    }

    private static setup(): (typeof VersionFixer)["versionAdapters"]{
        VersionFixer.versionAdapters = {};
        const errormsg = (k: string)=>"Version auto-updater have a updater registered incorrectly: \"" + k + "\", please notify the developers."
        let staticKeys = [] as string[];// no need for them Object.getOwnPropertyNames(VersionFixer);
        let instanceKeys = Object.getOwnPropertyNames(VersionFixer.prototype); // object.keys does not list not-enumarable stuff (like class funcs)
        let allKeys = [...staticKeys, ...instanceKeys];
        for (let k of allKeys){
            switch(k){
                case 'constructor': case 'd': case 'className':
                case 'prefix': case 'highestVersion': case 'versionAdapters':
                case 'get_highestversion':
                case 'staticClassName': case 'cname': case 'subclasses':
                case 'help': case 'setup': case 'update': continue;
            }
            let [froms, tos] = k.split(' -> ');
            Log.exDev(!froms?.length || !tos?.length, errormsg(k));
            let from = +froms; let to = +tos;
            Log.exDev(isNaN(from) || isNaN(to), errormsg(k));
            Log.exDev(!!VersionFixer.versionAdapters[from], "duplicate version adapter from \""+from+"\", please notify the developers.")
            VersionFixer.highestVersion = Math.max(VersionFixer.highestVersion, to);
            VersionFixer.versionAdapters[from] = {n:to, f: (VersionFixer.prototype as any)[k]}
        }
        return VersionFixer.versionAdapters;
    }

    public static update(s: DState): DState{
        if (!VersionFixer.versionAdapters) VersionFixer.setup();
        if (!s.version) s.version = {n: 2.1, date:"_reconverted", conversionList:[0]};
        let prevVer = s.version.n || 0;
        let currVer = prevVer;
        let singleton = new VersionFixer();
        let canAutocorrect = U.getHashParam('repair') === '1';
        if (canAutocorrect) s = VersionFixer.autocorrect(s, false, false);
        while (currVer !== VersionFixer.highestVersion) {
            Log.exDev(!VersionFixer.versionAdapters[currVer], "missing version adapter from \""+ currVer+"\", please notify the developers.",
                {adapers: VersionFixer.versionAdapters, curr: VersionFixer.versionAdapters[currVer]});
            // console.log('versionfixer update pre', {prevVer, currVer, entry: VersionFixer.versionAdapters[currVer]});
            let {n, f} = VersionFixer.versionAdapters[currVer];
            s.version.conversionList = [...s.version.conversionList, currVer];
            s = f.call(singleton, s);
            currVer = s.version.n = n || 0;
            // console.log('versionfixer update post', {prevVer, currVer, n});
            //Log.exDev(currVer !== n, "version updater updated to incorrect target versionn \""+prevVer+"\" -> \""+n+"\" , please notify the developers.");
            Log.exDev(currVer <= prevVer, "version updater found loop at version \""+currVer+"\", please notify the developers.");
            prevVer = currVer;
        }
        let pid = U.getProjectID_URL() as Pointer;
        let project = s.idlookup[pid] as DProject;
        if (project) project.version = s.version.n;

        // update default views (only actual view elements, skip DClass/DPackage/etc.)
        for (let k in s.idlookup) {
            let e = s.idlookup[k];
            if (!e || typeof e !== 'object') continue;
            let cn = (e as any).className;
            if (cn !== 'DViewElement' && cn !== 'DViewPoint') continue;
            let v: DViewElement|DViewPoint = e as any;
            if (v.className.includes("View") && v.version !== VersionFixer.highestVersion && !v.clonedCounter){ // NB: for untouched views clonedCounter is undefined, not 0.
                LViewElement.updateDefaultView(v, s);
            }
        }

        // add new default views
        for (let k in Defaults.defaultViewsMap) {
            if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewsMap[k];
        }
        for (let k in Defaults.defaultViewPointsMap) {
            if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewPointsMap[k];
        }

        if (canAutocorrect) s = VersionFixer.autocorrect(s, false, false);
        return s;
    }


    public static autocorrect(s0?: DState, popupIfCorrect: boolean = false, canLoadAction: boolean = false): DState {
        let s: DState;
        if (s0) s = {...s0} as any;
        else s = {...store.getState()} as any;
        if (!s0) s0 = {...s} as any;

        let validPtrs: typeof s.idlookup = {};
        let oldIDlookup = {...s.idlookup};

        // fully remove half-deleted items
        for (let ptr in s.idlookup) {
            if (ptr === 'clonedCounter') continue;
            if (!Pointers.isPointer(ptr)) {
                Log.eDevv('invalid key in idlookup', {ptr, s, v:s.idlookup[ptr]});
                delete s.idlookup[ptr];
                continue;
            }
            let v: GObject<DPointerTargetable> = s.idlookup[ptr];


            if (v.id !== ptr || Object.keys(v).length < 5 || deleteDState && v.className === 'DState') { // totally euristic lowerbound to detect semi-deleted objects or ill-created
                // console.log('autocorrect: removed incomplete object ', {d:s.idlookup[ptr], cn:s.idlookup[ptr]?.className, ptr})
                delete s.idlookup[ptr];
            }
            // for nulls and undefined is handled below, handled also in do loop but it won't detect missing "in" properties. while this does.
            if (!v.className || (v.className.includes('Edge') && (!v.end || !v.start))) delete s.idlookup[ptr];
            if (!('father' in v)) {
                switch (v.className){
                    case "DClass": if (v.isPrimitive) continue;  break;
                    /// todo: in versionfixer just add .father to everyone, then declare it in DPointerTargetable
                    case "DViewPoint":
                    case "DUser":
                    case "DProject":
                    case "DModel":
                    case "DGraph": continue;
                    default: delete s.idlookup[ptr];
                }
            }
        }

        // remove invalid pointers (with values but pointing to nothing).
        let removedPointers: {final_id:any, fullpath:string[], d_id?:Pointer, key?:string, d?: any}[] = [];
        let removedElements: {final_id:any, fullpath:string[], d_id?:Pointer, key?:string, d?: any}[] = [];
        let hasDeleted: boolean;
        delete (s as any).id;
        let maxLoop = 100;
        do {
            hasDeleted = false;
            if (maxLoop-- <= 0) {
                console.error({removedPointers});
                Log.eDevv('version autocorrect exceeded maximum number of corrections', s0);
                return s0 as any;
            }

            s = U.deepReplace(s, (key:string|number|undefined, obj: any, fullpath:string[]) => {
                let isPointer = Pointers.isPointer(obj);
                let isValidPointer = isPointer && s.idlookup[obj]?.id === obj;
                let id: Pointer<any> = fullpath?.[1];
                // if (id === 'Pointer1745981301328_USER_504') console.log('deepreplace 0', {isPointer, isValidPointer, key, obj, fullpath, removedPointers, removedElements});
                if (isPointer && isValidPointer) return obj;
                // if: undef or invalid pointer implicates full object removal
                // NB: critical pointers missing are also handled above, but the above part is including also missing properties ("in") while this part doesn't
                // both are necessary because this part ensures a critical pointer does not become null INSIDE the loop because of ptr removal.
                if ((
                    (key === 'father' && fullpath.length === 3) // idlookup.someid.father = 3 keys
                    || (key === 'end' && fullpath.length === 3)
                    || (key === 'start' && fullpath.length === 3))
                    //|| key === 'viewpoint' && fullpath.length === 3
                ) {
                    // if (key === 'father' && id === 'Pointer1745981301328_USER_504') console.log('deepreplace 1', {});

                    if (!Pointers.isPointer(id)) { Log.eDevv('found mandatory key in an unexpected position', {fullpath, final_id:obj, s}); return obj; }
                    let d: GObject = s.idlookup[id];
                    if (key === 'father' && (/*d?.className === 'DObject' ||*/ d?.className === 'DViewElement' || d?.isPrimitive)) return obj; // dobj can have missing father  todo: ?????? really?
                    removedElements.push({d, d_id: id, final_id:obj, key: key as any, fullpath});
                    if (!(id in s.idlookup)) return undefined;
                    hasDeleted = true;
                    // if (key === 'father' && id === 'Pointer1745981301328_USER_504') console.log('deepreplace 2', {hasDeleted});
                    return undefined;
                }

                // pointer is invalid
                if (isPointer && !isValidPointer){
                    removedPointers.push({final_id: obj, fullpath});
                    // if: simple invalid pointer implicates self-removal (just the pointer from a collection/variable)
                    return undefined;
                }

                // valid obj or pointer
                return obj;
            })
            for (let del of removedElements) {

                if (del.d_id && (del.d_id in s.idlookup)) {
                    delete s.idlookup[del.d_id];
                    //@ts-ignore
                    s.delCount = (s.delCount || 0) + 1;
                }
            }

        } while (hasDeleted);

        for (let k in s.idlookup) {
            let v = s.idlookup[k];
            if (!v) delete s.idlookup[k];
        }

        let lookup: Dictionary<DocString<'className', DPointerTargetable[]>> = {};
        for (let k in s.idlookup) {
            let v = s.idlookup[k];
            if (typeof v !== 'object' || !v.className) continue;
            if (!lookup[v.className]) lookup[v.className] = [];
            lookup[v.className].push(v);
        }
        let common = ['instances', 'instanceof', 'node', 'model', 'annotations', 'graph'];
        let out = {counter: 0, list: [] as {path: string, val: string[]}[]};

        {
            VersionFixer.removeNullPtrs(out, s, lookup, 'DModel', [...common, 'packages'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DPackage', [...common, 'classifiers', 'classes', 'enumerators', 'subpackages'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DClass', [...common, 'references', 'attributes', 'operations', 'extends', 'extendedBy'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DAttribute', [...common, 'type'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DReference', [...common, 'type'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DOperation', [...common, 'type'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DParameter', [...common, 'type', 'parameters', 'exceptions'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DEnumerator', [...common, 'literals'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DObject', [...common, 'features'])
            // VersionFixer.removeNullPtrs(out, s, lookup, 'DValue', [...common, 'values'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DGraph', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DGraphVertex', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DGraphElement', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DEdgePoint', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DVertex', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DVoidVertex', [...common, 'subElements'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DVoidEdge', [...common, 'subElements', 'start', 'end', 'midnodes'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DEdge', [...common, 'subElements', 'start', 'end', 'midnodes'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DViewPoint', [...common, 'subViews', 'viewpoint'])
            VersionFixer.removeNullPtrs(out, s, lookup, 'DViewElement', [...common, 'subViews', 'viewpoint'])
            lookup['rootPointers'] = [s];
            let rootPointers = [
                "models",
                "m2models",
                "m1models",
                "viewelements",
                "stackViews",
                "graphs",
                "voidvertexs",
                "vertexs",
                "graphvertexs",
                "graphelements",
                "edgepoints",
                "edges",
                "classifiers",
                "enumerators",
                "packages",
                "primitiveTypes",
                "attributes",
                "enumliterals",
                "references",
                "classs",
                "operations",
                "parameters",
                "ecoreClasses",
                "returnTypes",
                "objects",
                "values",
                "users",
                "viewpoints",
                "projects"];
            VersionFixer.removeNullPtrs(out, s, lookup, 'rootPointers', rootPointers)
        }

        let output: string[] = ['Project repair'];
        let removedDObjects = Object.keys(oldIDlookup).length - Object.keys(s.idlookup).length;
        let diff = U.arrayDifference(Object.keys(oldIDlookup), Object.keys(s.idlookup));
        if (removedDObjects) {
            output.push('removed ' + removedDObjects + ' invalid objects.'); // dobjects
        }
        let tot_removedPtrs = out.counter + removedPointers.length;

        if (tot_removedPtrs) output.push('removed ' + tot_removedPtrs + ' invalid pointers.');
        /*
        if (removedPointers.length) output.push('removed ' + removedPointers.length+' invalid pointers.'); // ptr to non-existing elem
        if (out.counter) {
            output.push('removed ' + out.counter + ' invalid pointers.'); // undef in ptr collection
        }
        */
        if (output.length > 1) {
            Tooltip.show(<div className={'m-auto text-center'}>{(output as any).separator(<br/>)}</div>, undefined, undefined, 10);
            Log.ii('project repair report', {removedPointers,
                removedObjects_num: removedDObjects,
                lookupDiff: U.arrayDifference(Object.keys(oldIDlookup), Object.keys(s.idlookup)),
                removedObjects: diff.removed.map(e=>oldIDlookup[e]),
                removedValues: out.counter, output, out});
            if (canLoadAction) TRANSACTION('project repair', () => { LoadAction.new(s); });
        }
        else {
            if (popupIfCorrect) Tooltip.show('project repair report:\tall good, no anomalies detected!', undefined, undefined, 3);
            Log.ii('project repair report:\tall good, no anomalies detected!');
        }

        return s;
    }

    public static mandatoryKeys = ['father'];
    public static removeNullPtrs(out:{counter: number, list:{path: string, val: string[]}[]}, s: DState, lookup: Dictionary<DocString<'className'>, DPointerTargetable[]>,
                                 cn: DocString<'ClassName'>, keys: string[], removeDuplicates: boolean = true): void {
        for (let d of (lookup[cn]||[])) {
            for (let k of keys) {
                if (!(k in d)) continue;
                let v = (d as GObject)[k];

                if (Pointers.isPointer(v)) {
                    if (s.idlookup[v]) continue; // it's a valid single value
                    else (d as GObject)[k] = undefined;
                }
                /* if (!Array.isArray(v)) {
                       d[k] = undefined; // removal of single elements is already handled by deepReplace, this just ensures it is always undef and not null or so.
                       continue;
                   }
                */
                if (Array.isArray(v)) {
                    let removed: any[] = [];
                    let duplicateChecker: Dictionary = {};
                    (d as GObject)[k] = (v as any[]).filter(e => {
                        if (e && Pointers.isPointer(e) && s.idlookup[e]) {
                            if (removeDuplicates && duplicateChecker[e]) return false; // duplicate
                            duplicateChecker[e] = e;
                            return true;
                        }
                        removed.push(e);
                        return false;
                    });
                    if (out && removed.length) {
                        out.counter += v.length - (d as GObject)[k].length;
                        out.list.push({path:d.id+'.'+k, val: removed});
                    }
                }
            }
        }
    }

    private d<D extends DPointerTargetable, L extends LPointerTargetable>(ptr: Pointer<D>, s: DState): D{
        return s.idlookup[ptr] as any;
        // {n}
    }
    private ['0 -> 2.1'](s: DState): DState {
        s.version = {n: 2.1, date:"_reconverted", conversionList:[0]};
        return s;
    }
    private ['2.1 -> 2.2'](s: DState): void {

    }

    private ['2.2 -> 2.201'](s: DState): DState {
        // let ls: LState = LPointerTargetable.from(s); nope, avoid L-objects. actions would fire in present state instead of in parameter state
        for (let c of (s.classs).map(p=> this.d(p, s))) {
            c.isSingleton = !!c.isSingleton; // booleanize the undefined
            c.sealed = [];
            c.final = false;
            c.rootable = undefined;
        }
        for (let c of Object.values(s.idlookup) as any[]) {
            if (!c || typeof c !== 'object' || !c.className || !c.id) continue;
            if (c.isCrossReference === undefined) c.isCrossReference = false;
        }
        for (let c of (s.viewelements).map(p=> this.d(p, s))) { c.father = c.viewpoint; }
        for (let c of (s.viewpoints).map(p=> this.d(p, s))) { c.cssIsGlobal = true; }
        for (let c of (s.projects).map(p=> this.d(p, s))) { c.favorite = {}; c.description = ''; }
        for (let c of (s.references).map(p=> this.d(p, s))) { if (c.composition === undefined) c.aggregation = !(c.composition = !!(c as any).containment); }
        for (let c of (s.models).map(p=> this.d(p, s))) { if (c.dependencies === undefined) c.dependencies = []; }
        for (let c of (s.attributes).map(p => this.d(p, s))) {
            c.derived = !!c.derived;
            c.derived_write = undefined; // c.derived ? '' : undefined;
            c.derived_read = undefined; // c.derived ? '' : undefined;
        }
        for (let id in s.idlookup){
            let c = s.idlookup[id] as DPointerTargetable;
            if (!c || !c.className || !c.pointedBy) continue;
            for (let p of c.pointedBy) { p.source = U.replaceAll(U.replaceAll(U.replaceAll(p.source||'', '+=', ''), '-=', ''), '[]', ''); }
        }
        for (let id in s.idlookup){
            let c = s.idlookup[id] as DPointerTargetable;
            if (!c || !c.className || !c.zoom) continue;
            c.zoom = {x:1, y:1} as any as GraphPoint; // for old projects, reset zoom because it was bugged. scrollbar was zooming but without graphical feedback, some projects might have zoom >1000x
        }

        return s;
    }
    private ['2.201 -> 2.202'](s: DState): DState {
        for (let c of Object.values(s.idlookup) as any[]) {
            if (!c || typeof c !== 'object' || !c.className || !c.id) continue;
            if (c.isCrossReference === undefined) c.isCrossReference = false;
            if (!c.zoom && RuntimeAccessibleClass.extends(c.className, DGraphElement)){
                c.zoom = {x:1, y:1};
            }
        }
        return s;
    }

    private ['2.202 -> 2.203'](s: DState): DState {
        for (let id in s.idlookup){
            let c = s.idlookup[id] as DPointerTargetable;
            if (!c || typeof c !== 'object') continue;
            if ((c as DGraphElement).isSelected) (c as DGraphElement).isSelected = {};
            if (c?.className?.toLowerCase().includes('view')){
                (c as DViewPoint|DViewElement).version = 2.202; // it is effectively v1 of views
            }
        }
        return s;
    }
    private ['2.203 -> 2.204'](s: DState): DState {
        let newLanguages = DV.defaultLanguages();
        if (!s.languages) s.languages = newLanguages;
        else {
            for (let key in s.languages) {
                // erase old languages that got renamed/retired and are not customized.
                if (!(key in newLanguages) && !s.languages[key].edited) delete s.languages[key];
            }

            for (let key in newLanguages) {
                let newLanguage = newLanguages[key];
                let oldLanguage = s.languages[key];
                if (!oldLanguage || !oldLanguage.edited) s.languages[key] = newLanguage; // update single obsolete language
            }
        }
        return s;
    }

    private ['2.204 -> 2.205'](s: DState): DState {
        for (let c of Object.values(s.idlookup) as any[]) {
            if (!c || typeof c !== 'object' || !c.className || !c.id) continue;
            if (c.className === 'DPackage') {
                let p: DPackage = c;
                let classifiers: Pointer<any>[] = (p as any).classifiers;
                if (!p.classes) p.classes = [];
                if (!p.enumerators) p.enumerators = [];
                if (!classifiers) continue;
                for (let ptr of classifiers.filter(c=>!!c)){
                    let d = this.d(ptr, s);
                    if (!d) continue;
                    if (d.className === 'DClass') p.classes.push(ptr);
                    else if (d.className === 'DEnumerators') p.enumerators.push(ptr);
                }
            }
        }
        return s;
    }
    private ['2.205 -> 2.206'](s: DState): DState {
        if (!s.RECOMPILE_LANGUAGE) s.RECOMPILE_LANGUAGE = [];
        for (let e of Object.values(s.idlookup) as any[]) {
            if (!e || typeof e !== 'object' || !e.className || !e.id) continue;
            if (!e.__childrenToSort) e.__childrenToSort = [];
            // fix parameter having default type "operation"
            if (e.className === 'DParameter' && e.type) {
                let type = this.d(e.type, s);
                if (type && type.className === 'DOperation') e.type = Pointers.ESTRING;
            }

            if (e.className === 'DValue' && e.name?.toLowerCase() === 'name' && e.values[0]) {
                let o: DObject = this.d(e.father, s);
                if (o) o.name = e.values[0];
            }
        }
        return s;
    }
    private ['2.206 -> 2.207'](s: DState): DState {
        let ptrsToReplace: Pointer[] = [];
        for (let k in s.idlookup) {
            if (k.indexOf('POINT_')!==0) continue;
            // let newid = 'Pointer'+k;
            ptrsToReplace.push(k);
        }
        for (let i = 0; i < (s.edgepoints||[]).length; i++) {
            let v = s.edgepoints[i];
            if (!v || v.indexOf('POINT_')!==0) continue;
            if (ptrsToReplace.indexOf(v) === -1) ptrsToReplace.push(v);
        }
        if (ptrsToReplace.length) {
            let str = JSON.stringify(s);
            for (let ptr of ptrsToReplace){ str = str.split(ptr).join('Pointer'+ptr) }
            s = JSON.parse(str);
        }
        for (let e of Object.values(s.idlookup) as any[]) {
            if (!e || typeof e !== 'object' || !e.className || !e.id) continue;
        }
        return s;
    }
    private ['2.207 -> 2.208'](s: DState): DState {
        let old = {...s};
        for (let lang of Object.values(s.languages)){
            if (typeof lang !== 'object') continue;
            for (let k in lang.m2t) {
                let pd = lang.m2t[k];
                if (typeof pd !== 'object') continue;
                pd.__str = pd.str;
                delete pd.str;
            }
            for (let k in lang.t2m) {
                let pd = lang.t2m[k];
                if (typeof pd !== 'object') continue;
                pd.__str = pd.str;
                delete pd.str;
            }
        }

        for (let k in s.idlookup) {
            let e = s.idlookup[k] as GObject;
            if (e?.uri) {
                e.uri.split('jodel-react').join('jjodelreact');
            }
        }
        return s;
    }
    private ['2.208 -> 2.209'](s: DState): DState {
        if (!s.NODES_RECOMPILE_grid) s.NODES_RECOMPILE_grid = [];
        if (!s.VIEWS_RECOMPILE_grid) s.VIEWS_RECOMPILE_grid = [];
        if (!s.NODES_RECOMPILE_snap) s.NODES_RECOMPILE_snap = [];
        if (!s.VIEWS_RECOMPILE_snap) s.VIEWS_RECOMPILE_snap = [];
        let oldp: Pointer<DProject>[] = s.projects;
        const pid: Pointer<DProject> = U.getProjectID_URL() as any;
        s.projects = [pid];
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as GObject;
            if (!e?.className) continue;
            if (k !== pid && e.className === 'DProject') {
                delete s.idlookup[k];
            }
            if ((e.className.includes('Vertex') || e.className.includes('EdgePoint') || e.className.includes('View')) && !('snap' in e)) {
                e.snap = {x:1, y:1};
            }
            if ((/*e.className.includes('Graph') ||*/ e.className.includes('View')) && !('grid' in e)) {
                e.grid = {x: 0, y:0, type:'cartesian', center: 'cc', visible: true};
            }
        }
        return s;
    }

    private ['2.209 -> 2.210'](s: DState): DState {
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as GObject;
            if (!e?.className) continue;
            if (e.className === 'DProject' && !e.tagNames) { e.tagNames = e.tags || [] }
        }
        return s;
    }

    // 2.210 → 2.211: M1 node rendering aligned to flow editor
    // (header order + emphasis, feature operator =, value italic, no bottom padding).
    // No data migration; auto-refresh of default views regenerates view.css from views.ts
    // and jsxString templates from DV.tsx.
    private ['2.210 -> 2.211'](s: DState): DState {
        return s;
    }

    // 2.211 → 2.212: redesign default class view to "minimal clean" variant
    // + edge-like compact modifier + smart preview for binary associative classes.
    // String-replaces stale jsxString matching the legacy placeholder marker
    // across all DViewElement in the project state. Also clears legacy `css`
    // and `palette` to align with the new global SCSS-based styling
    // (`.jjodel-default-view` in `frontend/src/styles/default-view.scss`).
    private ['2.211 -> 2.212'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.jsxString !== 'string') continue;
            if (!e.jsxString.includes(LEGACY_PLACEHOLDER_MARKER)) continue;

            e.jsxString = DEFAULT_VIEW_JSX_STRING;
            e.css = '';
            e.palette = {};
            e.css_MUST_RECOMPILE = true;
            migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.211 -> 2.212] Migrated ${migrated} default view(s) to minimal clean design.`);
        }
        return s;
    }

    // 2.212 → 2.213: introduce L2 edge overlay schema on DViewElement (and DViewPoint subclass).
    // Adds three additive fields to all existing view instances:
    //   - isEdge: false       (default disabled — view does not render as edge overlay)
    //   - edgeSource: ''      (no source endpoint expression configured)
    //   - edgeTarget: ''      (no target endpoint expression configured)
    // No rendering change in this migration. Fields are consumed by L2 Fase 3+ (SVG overlay
    // in classic editor) and Fase 5 (properties panel UI). Idempotent: re-running is a no-op
    // because of the typeof guards. See design doc `design_2026-05-03_L2_edge_overlay.md`.
    private ['2.212 -> 2.213'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement' && e.className !== 'DViewPoint') continue;

            let touched = false;
            if (typeof e.isEdge !== 'boolean') { e.isEdge = false; touched = true; }
            if (typeof e.edgeSource !== 'string') { e.edgeSource = ''; touched = true; }
            if (typeof e.edgeTarget !== 'string') { e.edgeTarget = ''; touched = true; }
            if (touched) migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.212 -> 2.213] Migrated ${migrated} view(s) with L2 edge schema defaults.`);
        }
        return s;
    }

    // 2.213 → 2.214: replace v2.2 default view jsxString (which doesn't handle
    // `view.isEdge`) with v2.3 jsxString that supports L2 edge overlay rendering.
    // Detects v2.2 by presence of marker AND absence of 'view.isEdge' usage
    // (introduced in v2.3 only). Idempotent: re-running this migration is a no-op
    // if all DViewElement are already on v2.3.
    private ['2.213 -> 2.214'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.jsxString !== 'string') continue;
            let hasV2Marker = e.jsxString.indexOf(V2_2_TO_V2_3_DETECT_MARKER) !== -1;
            let alreadyV2_3 = e.jsxString.indexOf('view.isEdge') !== -1;
            if (hasV2Marker && !alreadyV2_3) {
                e.jsxString = DEFAULT_VIEW_JSX_STRING;
                migrated++;
            }
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.213 -> 2.214] Migrated ${migrated} default view(s) to v2.3 (L2 isEdge support).`);
        }
        return s;
    }

    // 2.214 → 2.215: introduce L2 edgeRouting field on DViewElement (and DViewPoint subclass).
    // Adds one additive field to all existing view instances:
    //   - edgeRouting: 'manhattan-rounded'  (default — preserves current rendering)
    // Possible values: 'straight' | 'manhattan-rounded' | 'bezier'. Consumed by EdgeRenderItem
    // in components/edgeOverlay/EdgeOverlay.tsx; UI in InfoData.tsx (gated by isEdge=true).
    // Idempotent: re-running is a no-op because of the typeof guard.
    private ['2.214 -> 2.215'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement' && e.className !== 'DViewPoint') continue;

            if (typeof e.edgeRouting !== 'string') { e.edgeRouting = 'manhattan-rounded'; migrated++; }
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.214 -> 2.215] Migrated ${migrated} view(s) with L2 edgeRouting default.`);
        }
        return s;
    }

    // 2.215 → 2.216: introduce DProject.expandedTreeNodes for persistent
    // tree-view expand/collapse state. For each existing project, seeds the
    // array with synthetic section keys + every metamodel/package/sub-package/
    // class/model id reachable from the project. Features (foglie) are not
    // seeded. Idempotent: skips projects that already have an array set.
    private ['2.215 -> 2.216'](s: DState): DState {
        let seeded = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DProject') continue;
            if (Array.isArray(e.expandedTreeNodes)) continue;

            const expanded: string[] = [
                '__section:megamodel',
                '__section:metamodels',
                '__section:viewpoints',
                '__section:viewpoints/syntax',
                '__section:viewpoints/validation',
                '__section:documentation',
            ];

            const visitPackage = (pkgId: any): void => {
                if (typeof pkgId !== 'string') return;
                expanded.push(pkgId);
                const pkg = s.idlookup[pkgId] as any;
                if (!pkg) return;
                for (const subId of (pkg.subpackages || [])) visitPackage(subId);
                for (const cId of (pkg.classes || [])) {
                    if (typeof cId === 'string') expanded.push(cId);
                }
            };

            for (const mmId of (e.metamodels || [])) {
                if (typeof mmId !== 'string') continue;
                expanded.push(mmId);
                expanded.push(`__section:models:${mmId}`);
                const mm = s.idlookup[mmId] as any;
                if (mm && Array.isArray(mm.packages)) {
                    for (const pkgId of mm.packages) visitPackage(pkgId);
                }
            }
            for (const modelId of (e.models || [])) {
                if (typeof modelId === 'string') expanded.push(modelId);
            }

            e.expandedTreeNodes = expanded;
            seeded++;
        }
        if (seeded > 0) {
            console.log(`[VersionFixer 2.215 -> 2.216] Seeded expandedTreeNodes for ${seeded} project(s).`);
        }
        return s;
    }

    // 2.216 → 2.217: introduce DProject layout fields for the 4-column shell
    // (rail | canvas | property | tree). Seeds 5 fields with their defaults on
    // existing projects so future shell rendering can rely on them being present.
    // Idempotent: skips projects that already have all 5 fields set (any value).
    private ['2.216 -> 2.217'](s: DState): DState {
        let seeded = 0;
        for (let k in s.idlookup) {
            const e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DProject') continue;

            const hasAll =
                typeof e.layoutPropertyPanelWidth === 'number' &&
                typeof e.layoutTreeWidth === 'number' &&
                typeof e.layoutPropertyPanelOpen === 'boolean' &&
                typeof e.layoutTreeCollapsed === 'boolean' &&
                typeof e.layoutFocusCanvas === 'boolean';
            if (hasAll) continue;

            if (typeof e.layoutPropertyPanelWidth !== 'number') e.layoutPropertyPanelWidth = 400;
            if (typeof e.layoutTreeWidth !== 'number') e.layoutTreeWidth = 300;
            if (typeof e.layoutPropertyPanelOpen !== 'boolean') e.layoutPropertyPanelOpen = true;
            if (typeof e.layoutTreeCollapsed !== 'boolean') e.layoutTreeCollapsed = false;
            if (typeof e.layoutFocusCanvas !== 'boolean') e.layoutFocusCanvas = false;
            seeded++;
        }
        if (seeded > 0) {
            console.log(`[VersionFixer 2.216 -> 2.217] Seeded layout fields for ${seeded} project(s).`);
        }
        return s;
    }

    // 2.217 → 2.218: identity binding foundation — populate DObject.initialName for existing instances.
    // Strategy 3a: preserve the current display name as initialName.
    //   - If data.name is non-empty, use it as initialName (preserves what the user sees today).
    //   - If data.name is empty/null, synthesise "<MetaclassName>_<idSuffix>" based on instanceof
    //     and last 4 chars of the DObject id (stable across reloads).
    // Idempotent: skips DObjects that already have initialName populated.
    // Does NOT touch data.name nor any slot value — that remains scope of Prompt 2.
    private ['2.217 -> 2.218'](s: DState): DState {
        let migrated = 0;
        for (let e of Object.values(s.idlookup) as any[]) {
            if (!e || typeof e !== 'object' || !e.className || !e.id) continue;
            if (e.className !== 'DObject') continue;
            if (e.initialName) continue;  // already populated, skip

            if (e.name && typeof e.name === 'string' && e.name.length > 0) {
                // Preserve current name as the fallback identifier
                e.initialName = e.name;
            } else {
                // Compute a synthetic defaultname based on the meta class name.
                // We cannot call DPointerTargetable.defaultname here (operates on L-layer with
                // proxy wrapping); replicate the prefix logic in a D-only way and use the id
                // suffix for stability across reloads instead of computing sibling uniqueness.
                const meta = e.instanceof ? s.idlookup[e.instanceof] : null;
                const prefix = (meta && (meta as any).name) ? (meta as any).name + '_' : 'obj_';
                e.initialName = prefix + (e.id || '').slice(-4);
            }
            migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.217 -> 2.218] Populated initialName for ${migrated} DObject(s).`);
        }
        return s;
    }

    // 2.218 → 2.219: introduce optional DVertex.ghostOffsets (per-refId drag offset of
    // cross-MM ghost-target chips). Default-absent (undefined → {} consumer-side), so no
    // per-instance seeding is needed — bump only.
    private ['2.218 -> 2.219'](s: DState): DState { return s; }

    // 2.219 → 2.220: introduce optional DVertex.ghostParentOffsets (per-parent drag offset of
    // cross-MM ghost-parent chips, keyed by super-type DClass id). Default-absent (undefined →
    // {} consumer-side), so no per-instance seeding is needed — bump only.
    private ['2.219 -> 2.220'](s: DState): DState { return s; }

    // 2.220 → 2.221: native Classic edges now route orthogonally (Manhattan) by default.
    // Flip default edge views from Line ('L') to Manhattan. Keyed on the stable default
    // edge-view id prefix + appliableTo === 'Edge' (excludes Pointer_ViewEdgePoint, whose
    // appliableTo is 'EdgePoint') + bendingMode === Line (preserves any deliberate user-chosen
    // mode). User-custom edge views use timestamp ids → not matched. Idempotent: re-running
    // finds nothing. NB: untouched default edge views are also regenerated wholesale by
    // updateDefaultView via the version bump; this method additionally covers touched
    // (clonedCounter) defaults, which updateDefaultView skips.
    private ['2.220 -> 2.221'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.id !== 'string' || !e.id.startsWith('Pointer_ViewEdge')) continue;
            if (e.appliableTo !== 'Edge') continue;               // excludes Pointer_ViewEdgePoint
            if (e.bendingMode !== EdgeBendingMode.Line) continue;  // preserve user-chosen modes
            e.bendingMode = EdgeBendingMode.Manhattan;
            migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.220 -> 2.221] Migrated ${migrated} default edge view(s) Line → Manhattan.`);
        }
        return s;
    }

    // 2.221 → 2.222: composition & aggregation default edge views gain a target arrow
    // (head → Head_reference). Composition additionally drops its tail diamond (tail → '') and
    // switches its solid #6A6A6A fill → #fff0 so the arrow renders OPEN like Association's (head
    // and tail share one per-view --fill; with the diamond gone that fill only drives the arrow).
    // Aggregation keeps its hollow diamond and #fff fill. The shared EdgeHead.* constants and the
    // palette dropdown stay untouched. Keyed on the stable default ids (touched defaults keep them;
    // clonedCounter only versions the object). Per-slot conditional: each slot is rewritten only
    // while it still holds its previous default — preserves user-customized slots, idempotent on
    // re-run. css_MUST_RECOMPILE forces --head/--tail/--fill to recompile. Untouched defaults are
    // also regenerated wholesale by updateDefaultView via the bump; this additionally covers the
    // touched (clonedCounter) ones it skips.
    private ['2.221 -> 2.222'](s: DState): DState {
        const ARROW = EdgeHead.Head_reference;
        const gray = U.hexToPalette('#6A6A6A').value[0];   // composition's previous default fill
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (e.appliableTo !== 'Edge') continue;
            let p = e.palette;
            if (!p) continue;
            let changed = false;
            if (e.id === 'Pointer_ViewEdgeComposition') {
                if (p.tail && p.tail.value === EdgeHead.Tail_composition) { p.tail.value = ''; changed = true; } // drop diamond
                if (p.head && p.head.value === '') { p.head.value = ARROW; changed = true; }                     // add target arrow
                let c = p.fill && p.fill.value && p.fill.value[0];
                if (c && c.r === gray.r && c.g === gray.g && c.b === gray.b && c.a === gray.a) {
                    p.fill = U.hexToPalette('#fff0'); changed = true;                                            // #6A6A6A → open
                }
            } else if (e.id === 'Pointer_ViewEdgeAggregation') {
                if (p.head && p.head.value === '') { p.head.value = ARROW; changed = true; }                     // add target arrow
            }
            if (changed) { e.css_MUST_RECOMPILE = true; migrated++; }
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.221 -> 2.222] Updated ${migrated} composition/aggregation default edge view(s).`);
        }
        return s;
    }

    // 2.222 → 2.223: redesign the classic-editor M1 Default views (Object, Value,
    // Singleton) for visual parity with the flow editor (palette-aware header band,
    // attribute-only body, italic palette-colored values). String-replaces stale
    // persisted jsxString and clears the legacy per-view `css`/`palette` (styling
    // now lives in `frontend/src/styles/classic-object-view.scss`).
    //
    // Detection mirrors '2.211 -> 2.212': a stable substring kept from the legacy
    // template (`object-children` / `values_str` / `singleton`) paired with the
    // ABSENCE of the v3 marker — the NEW templates intentionally keep that substring
    // (the className is `jjodel-classic-object`, WITHOUT the ` v3` suffix that only
    // the marker comment carries), so the marker is what makes this idempotent.
    //
    // Dual mechanism (cf. '2.220 -> 2.221' / '2.221 -> 2.222'): the version bump makes
    // updateDefaultView regenerate UNTOUCHED defaults (clonedCounter undefined) wholesale
    // from source (DV.tsx → the new constants); this method additionally covers TOUCHED
    // (clonedCounter) defaults, which updateDefaultView skips.
    private ['2.222 -> 2.223'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.jsxString !== 'string') continue;

            let replacement: string | undefined = undefined;
            if (e.jsxString.includes('object-children') && !e.jsxString.includes(CLASSIC_OBJECT_VIEW_MARKER)) replacement = CLASSIC_OBJECT_VIEW_JSX;
            else if (e.jsxString.includes('values_str') && !e.jsxString.includes(CLASSIC_VALUE_VIEW_MARKER)) replacement = CLASSIC_VALUE_VIEW_JSX;
            else if (e.jsxString.includes('singleton') && !e.jsxString.includes(CLASSIC_SINGLETON_VIEW_MARKER)) replacement = CLASSIC_SINGLETON_VIEW_JSX;
            if (replacement === undefined) continue;

            e.jsxString = replacement;
            e.css = '';
            e.palette = {};
            e.css_MUST_RECOMPILE = true;
            migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.222 -> 2.223] Migrated ${migrated} classic M1 default view(s) for flow parity.`);
        }
        return s;
    }

    // 2.223 → 2.224: isEdge rendering moved OUT of the default jsxString into the TS rendering layer
    // (graphElement.tsx renderView + components/edgeOverlay/EdgeFallbackCard). Rewrites DViewElement
    // jsxStrings still carrying the v2.3 default template (the isEdge top-level gate + the
    // `length === 2` edge-like heuristic) to the simplified v3 DEFAULT_VIEW_JSX_STRING
    // (header + hint + decorators). Detection mirrors '2.211 -> 2.212' / '2.213 -> 2.214': exact
    // match against the frozen v2.3 constant (fast path) OR the marker V2_3_TO_V3_DETECT_MARKER
    // ('jjodel-default-view--edge-fallback') — present only in v2.3, absent from v2.2 and from the
    // simplified template, so re-running is a no-op (idempotent). Clears legacy per-view css/palette
    // and forces a recompile, exactly as '2.222 -> 2.223' does for jsxString rewrites. Dual
    // mechanism: the version bump makes updateDefaultView regenerate UNTOUCHED defaults (clonedCounter
    // undefined) wholesale from source (DEFAULT_VIEW_JSX_STRING); this method additionally covers
    // TOUCHED (clonedCounter) defaults, which updateDefaultView skips.
    private ['2.223 -> 2.224'](s: DState): DState {
        let migrated = 0;
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.jsxString !== 'string') continue;
            if (e.jsxString !== DEFAULT_VIEW_JSX_V2_3_LEGACY && !e.jsxString.includes(V2_3_TO_V3_DETECT_MARKER)) continue;

            e.jsxString = DEFAULT_VIEW_JSX_STRING;
            e.css = '';
            e.palette = {};
            e.css_MUST_RECOMPILE = true;
            migrated++;
        }
        if (migrated > 0) {
            console.log(`[VersionFixer 2.223 -> 2.224] Migrated ${migrated} default view(s): isEdge logic moved to TS.`);
        }
        return s;
    }

    // 2.224 -> 2.225: M1 reference edges in the classic editor now render through the new
    // <DerivedReferenceEdge> component instead of the minting <Edge> factory (Option B, step 1).
    // The change lives in the 'Model' default view jsxString (DefaultView.model() in common/DV.tsx).
    // Pure version bump: the bump makes updateDefaultView regenerate UNTOUCHED default views
    // (clonedCounter undefined) wholesale from source (DV.tsx, now emitting <DerivedReferenceEdge>
    // for M1), so saved projects pick up the new template. User-customized (clonedCounter) Model
    // views are intentionally left as-is (not wiped); they keep the prior minting <Edge> path.
    private ['2.224 -> 2.225'](s: DState): DState { return s; }

    // 2.225 → 2.226: INVERSE migration (classic deprecation, IR contract — spec v1.2 sez. 11).
    // Classic default M1 views (marker-matched) receive the IR default view
    // (`ir` field, migratedFrom: 'classic-default'): EditorV2 renders them via the
    // IR interpreter, the jsxString stays as classic fallback until Fase 5.
    // CLASSIC_VALUE views have no IR equivalent (values are rows inside object
    // nodes in the flow) and custom non-default jsxStrings get the explicit
    // legacy mark `irLegacyClassic` (rendered as abstract nodes, never silently
    // dropped). Idempotent: records already carrying `ir` or the mark are skipped.
    // NOTE: LViewElement.updateDefaultView preserves `ir`/`irLegacyClassic` across
    // the version-bump regeneration (see view.tsx) — without that carry-over this
    // migration would be wiped by the same load that applies it.
    private ['2.225 -> 2.226'](s: DState): DState {
        let migratedToIR = 0;
        let markedLegacy = 0;
        const isKnownDefault = (jsx: string): boolean =>
            jsx === DEFAULT_VIEW_JSX_STRING
            || jsx === DEFAULT_VIEW_JSX_V2_3_LEGACY
            || jsx.includes(V2_3_TO_V3_DETECT_MARKER)
            || jsx.includes(V2_2_TO_V2_3_DETECT_MARKER)
            || jsx.includes(LEGACY_PLACEHOLDER_MARKER)
            || jsx.includes('jjodel-default-view');
        for (let k in s.idlookup) {
            let e = s.idlookup[k] as any;
            if (!e || typeof e !== 'object') continue;
            if (e.className !== 'DViewElement') continue;
            if (typeof e.jsxString !== 'string' || !e.jsxString) continue;
            if (e.ir !== undefined || e.irLegacyClassic) continue; // idempotent

            const jsx: string = e.jsxString;
            if (jsx.includes(CLASSIC_OBJECT_VIEW_MARKER) || jsx.includes(CLASSIC_SINGLETON_VIEW_MARKER)) {
                e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' };
                migratedToIR++;
            } else if (jsx.includes(CLASSIC_VALUE_VIEW_MARKER)) {
                e.irLegacyClassic = true;
                markedLegacy++;
            } else if (!isKnownDefault(jsx)) {
                e.irLegacyClassic = true;
                markedLegacy++;
            }
        }
        if (migratedToIR > 0 || markedLegacy > 0) {
            console.log(`[VersionFixer 2.225 -> 2.226] IR inverse migration: ${migratedToIR} default view(s) -> IR, ${markedLegacy} marked legacy-classic.`);
        }
        return s;
    }

    // 2.226 → 2.227: bonifica dei salvataggi con slot DValue duplicati dagli import XMI
    // pre-fix 4811db8. FASE A dedup slot per (DObject, meta-feature): superstite = slot
    // valorizzato non-mirage (Opzione A), merge dei value dei loser (reference Format B),
    // riordino delle features SOLO sugli oggetti bonificati. FASE B dedup radici duplicate
    // in DModel.objects (residuo prodotto anche post-fix, finché il push diretto restava in
    // XMIService) e pointer figli duplicati nei containment. FASE C pulizia dei riferimenti
    // pendenti agli id rimossi (instances, s.values, pointedBy, DGraphElement.model) e
    // reparent loser→survivor. Idempotente (secondo run no-op); no-op sui progetti puliti.
    // Logica dimostrata in __tests__/versionfixer_2227_migration.test.ts (12/12).
    private ['2.226 -> 2.227'](s: DState): DState {
        const idlookup: any = s.idlookup;
        if (!idlookup || typeof idlookup !== 'object') return s;

        const dedupKeepFirst = (arr: any[]): any[] => {
            if (!Array.isArray(arr)) return arr;
            const seen = new Set<any>();
            const out: any[] = [];
            for (const x of arr) { if (seen.has(x)) continue; seen.add(x); out.push(x); }
            return out;
        };
        const isPointerArray = (vals: any[]): boolean =>
            Array.isArray(vals) && vals.length > 1
            && vals.every(v => typeof v === 'string' && idlookup[v] && idlookup[v].className === 'DObject');

        const removed = new Set<string>();
        const reparent = new Map<string, string>();
        let dedupSlots = 0, mergedVals = 0, dupRoots = 0, dupChildPtrs = 0, reordered = 0;

        // FASE A — dedup slot per (DObject, meta-feature); merge Format B; reorder touched.
        for (const k in idlookup) {
            const e = idlookup[k];
            if (!e || typeof e !== 'object' || e.className !== 'DObject' || !Array.isArray(e.features)) continue;

            // A1: dedup features by id (a valued slot id can appear twice — Firma 1).
            e.features = dedupKeepFirst(e.features);

            // A2: group resolvable slots by instanceof (skip undefined = schema-less).
            const groups = new Map<string, string[]>();
            for (const fid of e.features) {
                const dv = idlookup[fid];
                if (!dv || dv.className !== 'DValue') continue;
                const inst = dv.instanceof;
                if (typeof inst !== 'string') continue;
                const arr = groups.get(inst) ?? [];
                arr.push(fid);
                groups.set(inst, arr);
            }

            let touched = false;
            for (const [, fids] of groups) {
                if (fids.length <= 1) continue;
                const slots = fids.map(f => idlookup[f]).filter(Boolean);
                const survivor = slots.find(v => v.isMirage === false && Array.isArray(v.values) && v.values.length > 0)
                    ?? slots.find(v => v.isMirage === false)
                    ?? slots[0];
                for (const loser of slots) {
                    if (loser === survivor) continue;
                    if (Array.isArray(loser.values)) {
                        if (!Array.isArray(survivor.values)) survivor.values = [];
                        for (const v of loser.values) if (!survivor.values.includes(v)) { survivor.values.push(v); mergedVals++; }
                    }
                    reparent.set(loser.id, survivor.id);
                    removed.add(loser.id);
                    delete idlookup[loser.id];
                    dedupSlots++;
                }
                if (survivor.isMirage && Array.isArray(survivor.values) && survivor.values.length > 0) survivor.isMirage = false;
                touched = true;
            }
            if (touched) e.features = e.features.filter((f: string) => !removed.has(f));

            // Opzione A + riordino: only on bonified objects, order features by the metaclass
            // feature order (cosmetic: IR raw-order renderer; zero referential risk).
            if (touched) {
                const meta = e.instanceof ? idlookup[e.instanceof] : null;
                const order: string[] | null = meta && Array.isArray(meta.features) ? meta.features : null;
                if (order && order.length) {
                    const rank = (fid: string): number => {
                        const inst = idlookup[fid]?.instanceof;
                        const i = typeof inst === 'string' ? order.indexOf(inst) : -1;
                        return i < 0 ? Number.MAX_SAFE_INTEGER : i;
                    };
                    const before = e.features.join(',');
                    e.features = [...e.features].sort((a: string, b: string) => rank(a) - rank(b));
                    if (e.features.join(',') !== before) reordered++;
                }
            }
        }

        // FASE B — dedup duplicate pointers (independent of FASE A; runs on post-fix saves too).
        for (const k in idlookup) {
            const e = idlookup[k];
            if (!e || typeof e !== 'object') continue;
            if (e.className === 'DModel' && Array.isArray(e.objects)) {
                const b = e.objects.length; e.objects = dedupKeepFirst(e.objects); dupRoots += b - e.objects.length;
            }
            if (e.className === 'DValue' && isPointerArray(e.values)) {
                const b = e.values.length; e.values = dedupKeepFirst(e.values); dupChildPtrs += b - e.values.length;
            }
        }

        // FASE C — purge references to removed ids (single pass).
        if (removed.size > 0) {
            if (Array.isArray((s as any).values)) (s as any).values = (s as any).values.filter((id: string) => !removed.has(id));
            for (const k in idlookup) {
                const e = idlookup[k];
                if (!e || typeof e !== 'object') continue;
                if (Array.isArray(e.instances)) e.instances = e.instances.filter((id: string) => !removed.has(id));
                if (e.model && removed.has(e.model)) e.model = undefined;
                if (typeof e.father === 'string' && reparent.has(e.father)) e.father = reparent.get(e.father);
                if (Array.isArray(e.pointedBy)) {
                    e.pointedBy = e.pointedBy.filter((p: any) => {
                        const src = p && typeof p.source === 'string' ? p.source : '';
                        const seg = src.split('.')[1]; // "idlookup.<id>.<field>"
                        return !removed.has(seg);
                    });
                }
            }
        }

        if (dedupSlots || dupRoots || dupChildPtrs || reordered) {
            console.log(`[VersionFixer 2.226 -> 2.227] bonifica: ${dedupSlots} slot duplicati rimossi, `
                + `${mergedVals} value migrati (Format B), ${dupRoots} radici dedup, `
                + `${dupChildPtrs} pointer figli dedup, ${reordered} oggetti riordinati.`);
        }
        return s;
    }

}







//deprecated stuff



/*
public static checkVersionChanges(): GObject{
    let lastVerName = localStorage.getItem(VersionFixer.prefix+'last');
    let lastVerState = localStorage.getItem(VersionFixer.prefix+lastVerName);
    let lastVersionSignature = JSON.parse(lastVerState || '{not:"found"}');
    let newVersionSignature = this.buildVersionSignature();
    return VersionFixer.checkVersionChanges_inner(lastVersionSignature, newVersionSignature);
}
public static checkVersionChanges_inner(s1: DState, s2:DState): GObject{ return U.objectDelta(s1, s2, true); }
public static registerFirstTimeOnly(): void {
    let newVersionSignature = VersionFixer.buildVersionSignature();
    localStorage.setItem(VersionFixer.prefix+'last', ''+newVersionSignature.version.n);
    localStorage.setItem(VersionFixer.prefix+''+newVersionSignature.version.n, JSON.stringify(newVersionSignature));
}

public static registerNewVersion(): boolean {
    let lastVerName = localStorage.getItem(VersionFixer.prefix+'last');
    let prevVersionSignature: DState = JSON.parse(localStorage.getItem(VersionFixer.prefix+lastVerName) || '{not:"found"}') as any;
    let newVersionSignature = VersionFixer.buildVersionSignature();
    let updatedVersionSignature = this.update(prevVersionSignature);
    let versionDiff: GObject = VersionFixer.checkVersionChanges_inner(updatedVersionSignature, newVersionSignature);
    if (Object.keys(versionDiff).length !== 0) {
        // console.log("failed to save new version, the conversion function is not updating state properly.",
            {versionDiff, prevVersionSignature, newVersionSignature, updatedVersionSignature});
        return false;
    }
    localStorage.setItem(VersionFixer.prefix+'last', ''+newVersionSignature.version.n);
    localStorage.setItem(VersionFixer.prefix+''+newVersionSignature.version.n, JSON.stringify(newVersionSignature));
    return true;
}
private static buildVersionSignature(): DState {
    // purpose: save in state 1 of each D-objects with all the possible sub-objects in every possible structure shape
    // values can be dummy but syntactical valid
    //DState.new(); nope, i'm using current state, just call it from an empty project with no models.
    DViewElement.new2("View", "jsx", undefined,(d)=>{
        d.appliableTo = 'Any';
        d.subViews = {["Sample-fake-subView"]: 3.5};
        d.oclUpdateCondition = '(view: LViewElement) => { return false; } <--- as a string'
        d.defaultVSize = new GraphSize(5,5,5,5);
        d.palette = {
            "color": {type:'color', value: [{r:0, g:0, b:0, a:0}]} as PaletteControl,
            "number": {type:'number', value: 4, unit: 'px'} as NumberControl,
            "text": {type:'text', value: 'stringa'} as StringControl,
            "path": {type:'path', value: 'M 00 L 1 1 Z', x: '5', y: '10', options: [{k: 'optionnale', v:'option path M 0 0 L 5 5 Z'}]} as PathControl,
        };
        d.events = {["function name"]: "function body"};
        d.bendingMode = EdgeBendingMode.Bezier_QT;
        d.edgeGapMode = EdgeGapMode.gap;
        d.size = {["node or model Pointer"]: new GraphSize(5,5,5,5)};
        d.edgeStartOffset = new GraphPoint(5,5);
        d.edgeEndOffset = new GraphPoint(5,5);
        d.edgePointCoordMode = CoordinateMode.relativePercent;
        d.edgeHeadSize = new GraphPoint(5,5);
        d.edgeTailSize = new GraphPoint(5,5);
    }, true, 'DViewElement');



    return store.getState();
}
*/