import {
    GraphSize, IPoint, DocString, Dictionary, Pointer,
    GObject,
    GraphPoint, DViewPoint, DViewElement, PointedBy,
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
    public static help(){
        console.clear();
        let i: number  = 1;

        console.log(`
Before deploying a new version you should:

${i++}) Update changelog

${i++}) make a separate build subfolder (so you can switch versions)

${i++}) build a new empty versioning function with signature like: private ['2.1 -> 2.3'](s: DState): DState
        fill this function in a way that translates from the state shape of the old version, to the state shape of the new one
   
        `);



        // DEPRECATED stuff
        false && console.log(`
Before deploying a new version you should:

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
            console.log('versionfixer update pre', {prevVer, currVer, entry: VersionFixer.versionAdapters[currVer]});
            let {n, f} = VersionFixer.versionAdapters[currVer];
            s.version.conversionList = [...s.version.conversionList, currVer];
            s = f.call(singleton, s);
            currVer = s.version.n = n || 0;
            console.log('versionfixer update post', {prevVer, currVer, n});
            //Log.exDev(currVer !== n, "version updater updated to incorrect target versionn \""+prevVer+"\" -> \""+n+"\" , please notify the developers.");
            Log.exDev(currVer <= prevVer, "version updater found loop at version \""+currVer+"\", please notify the developers.");
            prevVer = currVer;
        }

        // update default views
        for (let k in s.idlookup) {
            let e = s.idlookup[k];
            if (!e || typeof e !== 'object') continue;
            let v: DViewElement|DViewPoint = e as any;
            if (v.version !== VersionFixer.highestVersion && !v.clonedCounter){ // NB: for untouched views clonedCounter is undefined, not 0.
                let newView: DViewElement | DViewPoint = Defaults.defaultViewPointsMap[v.id]||Defaults.defaultViewsMap[v.id];
                if (!newView) continue; // not a default view
                newView = {...newView} as any;
                newView.pointedBy = PointedBy.merge(newView, v);
                newView.subViews = {...newView.subViews, ...v.subViews};
                s.idlookup[k] = newView;
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
                (c as DViewPoint|DViewElement).version = 1.0;
            }
        }
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
                console.log('autocorrect: removed incomplete object ', {d:s.idlookup[ptr], cn:s.idlookup[ptr]?.className, ptr})
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
                if (id === 'Pointer1745981301328_USER_504') console.log('deepreplace 0', {isPointer, isValidPointer, key, obj, fullpath, removedPointers, removedElements});
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
                    if (key === 'father' && id === 'Pointer1745981301328_USER_504') console.log('deepreplace 1', {});

                    if (!Pointers.isPointer(id)) { Log.eDevv('found mandatory key in an unexpected position', {fullpath, final_id:obj, s}); return obj; }
                    let d: GObject = s.idlookup[id];
                    if (key === 'father' && (/*d?.className === 'DObject' ||*/ d?.className === 'DViewElement' || d?.isPrimitive)) return obj; // dobj can have missing father  todo: ?????? really?
                    removedElements.push({d, d_id: id, final_id:obj, key: key as any, fullpath});
                    if (!(id in s.idlookup)) return undefined;
                    hasDeleted = true;
                    if (key === 'father' && id === 'Pointer1745981301328_USER_504') console.log('deepreplace 2', {hasDeleted});
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
            VersionFixer.removeNullPtrs(out, s, lookup, 'DPackage', [...common, 'classifiers', 'subpackages'])
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
                TRANSACTION('project repair', () => {
                   if (canLoadAction) LoadAction.new(s);
                })
        }
        else {
            if (popupIfCorrect) Tooltip.show('project repair report:\tall good, no anomalies detected!', undefined, undefined, 3);
            Log.ii('project repair report:\tall good, no anomalies detected!');
        }

        return s;
    }

    public static mandatoryKeys = ['father'];
    public static removeNullPtrs(out:{counter: number, list:{path: string, val: string[]}[]}, s: DState, lookup: Dictionary<DocString<'className'>, DPointerTargetable[]>,
                                 cn: DocString<'ClassName'>, keys: string[]): void {
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
                    (d as GObject)[k] = (v as any[]).filter(e => {
                        if (e && Pointers.isPointer(e) && s.idlookup[e]) return true;
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
        console.log("failed to save new version, the conversion function is not updating state properly.",
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