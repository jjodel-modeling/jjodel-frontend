import {
    CoordinateMode,
    Defaults,
    Dictionary, DocString, DPointerTargetable, DReference,
    DState, DStructuralFeature,
    DViewElement,
    EdgeBendingMode,
    EdgeGapMode,
    GObject,
    GraphPoint,
    GraphSize, LClass,
    Log, LPointerTargetable, LState, Pointer, RuntimeAccessible, RuntimeAccessibleClass, store,
    U
} from "../joiner";
import {NumberControl, PaletteControl, PathControl, StringControl} from "../view/viewElement/view";

/*
                                    TODO for every update: check the VersionFixer.help() function
*/

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
        for (let c of Object.values(s.idlookup) as any[]) { if (c?.className && c.id && c.isCrossReference === undefined) c.isCrossReference = false; }
        for (let c of (s.viewelements).map(p=> this.d(p, s))) { c.father = c.viewpoint; }
        for (let c of (s.viewpoints).map(p=> this.d(p, s))) { c.cssIsGlobal = true; }
        for (let c of (s.projects).map(p=> this.d(p, s))) { c.favorite = {}; c.description = ''; }
        for (let c of (s.references).map(p=> this.d(p, s))) { if (c.composition === undefined) c.aggregation = !(c.composition = !!(c as any).containment); }
        for (let c of (s.models).map(p=> this.d(p, s))) { if (c.dependencies === undefined) c.dependencies = []; }
        for (let c of (s.attributes).map(p=> this.d(p, s))) {
            c.derived = !!c.derived;
            c.derived_write = undefined; // c.derived ? '' : undefined;
            c.derived_read = undefined; // c.derived ? '' : undefined;
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