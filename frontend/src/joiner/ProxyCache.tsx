import type {
    DAttribute,
    DClass,
    DeepReadonly,
    Dictionary,
    DObject,
    DValue,
    GObject,
    Info,
    LClass,
    LObject,
    LogicContext,
    Pointer,
} from "../joiner";
import {
    Log,
    Pointers,
    store,
    L,
    D,
    RuntimeAccessible,
    DState,
    U,
} from "../joiner";

class CacheEntry{
    success: boolean = true;
    value?: any;
    dependencies!: number[];
}
function geteidFromValue(d: DValue): string | undefined {
    for (let s of d.values) {
        if (s === null || s === undefined) continue;
        return ""+s;
    }
    return undefined;
    /*
return d.values.find(s=> {
    return !s || typeof s !== "string";
    /*
|| typeof s !== "string") return false;
    if (Pointers.isPointer(s)) {

        if (alreadyVisited[s]) return false;
        alreadyVisited[s] = true;
        /*
        let d = D.fromPointer(s);
        return ProxyCache.eidMap[d.id];
        or i just return the ppointer and then do passes to resolve pointers later on N times as necessary
        // problem: if it's reference value -> object.eid -> object.$eid
        // eg: value "eid" of type DReference pointing to an object with $eid property, that eid might not have been cached yet.
        // so i would need to run this N times, where N is the longest $eid chain or resolve a DAG graph...
    }
}) as string | undefined*/
}


/*
The issue with $selectors and name / eid
to resolve dependencies using $, i need to resolve name and eid first (cache build / update phase).
resolving eid is far too complicated and it involves iterating a lot of properties (inheritance, shapeless, shadowing...)
so it must be done with L.get()
but L.get() calls the cache, which i'm still building

my solution so far:
allow use of L.get() during the cache building phase, temporarly disabling the cached results.
during this intermediate phase clonedCounters are updated but ProxyCache.eidMap is not, so dependencies using $ won't work.
so eid.dependency cannot contain $
as for name i'm using a mock of L.get_name built in here to avoid L-calls
and it should be fine for all objects !=== LObject, which are calling eid anyway

* */
/*
The system uses 2 different caches with shared entries.
1) personal cache: only eligible if __info_of__ has explicit dependencies
    based on element clonedCounter, it becomes invalid every time his own clonedCounter or his dependency list clonedCounters changed.
    it always returns a cache entry with an array of current dependencies.
    if success, the proxy will take the value and discard the metadata
    if failure, the proxy will call the getter, and store the result in the cache entry with already computed current clonedCounters
    the cache entry will become valid for next calls unless a dependency change clonedCounters again.
    in every case a copy of the entry is inserted in global cache

2) global cache
    only valid as long the whole state does not update (check by clonedCounter, undo actions might count as change)
    global cache is always checked first, if there is a match it doesn't check for personal cache and does not compute dependencies.


*/
type ProxyKey = string;
@RuntimeAccessible("ProxyCache")
export class ProxyCache {
    static clonedCounter: Dictionary<Pointer, number> = {};
    static cache: Dictionary<Pointer, Dictionary<number/*clonedCount*/, Dictionary<ProxyKey, CacheEntry>>> = {};
    static globalCache: Dictionary<number/* DState.current.clonedCounter */, Dictionary<Pointer, Dictionary<ProxyKey, CacheEntry>>> = {};
    static oldStateCC: number = -1;
    static subelementMap: Dictionary<Pointer, Pointer[]> = {};
    static eidMap: Dictionary<Pointer, string> = {};
    static enabled: boolean = true;
    static status: "preparing" | "ready" = "ready";

    static disable(): boolean {
        let old = ProxyCache.enabled;
        ProxyCache.enabled = false;
        return old;
    }
    static enable(): boolean {
        let old = ProxyCache.enabled;
        ProxyCache.enabled = true;
        return old;
    }

    static update(ret: DeepReadonly<DState>, old: DeepReadonly<DState>): void {
        try { ProxyCache.update0(ret, old); }
        catch (e: any) {
           Log.eDevv("error in cache update", {e, stack: [...(e.stack.split("\n"))] });
        }
    }
    static update0(ret: DeepReadonly<DState>, old: DeepReadonly<DState>): void {
        let allObjectKeys = new Set(U.arrayMergeInPlace(Object.keys(ret.idlookup), Object.keys(old.idlookup)));
        if (!ProxyCache.enabled) { return; }
        ProxyCache.subelementMap = {};
        // ProxyCache.disable();
        ProxyCache.status = "preparing";
        for (let k of allObjectKeys) {
            let d: Readonly<GObject<D>> = ret.idlookup[k] as any;
            if (d && typeof d !== "object") continue;
            let oldd = old.idlookup[k];
            if (d?.father) {
                if (!ProxyCache.subelementMap[d.father]) ProxyCache.subelementMap[d.father] = [];
                ProxyCache.subelementMap[d.father].push(d.id);
            }
            // eid set, abstracted to general purpose
            if (d) switch (d.className) {
                default:
                    let name = L.from(d).name;
                    ProxyCache.eidMap[d.id] = name;
                    break;
                    // only objects can have $target using eid instead of name
                case "DObject": //case "DClass":
                    let eid = L.fromD(d as DObject).eid;
                    ProxyCache.eidMap[d.id] = eid;
                    break;
            }
            if (d?.clonedCounter === oldd?.clonedCounter) continue;
        }
        ProxyCache.status = "ready";
        // ProxyCache.enable();
    }



    static getByEid(parent: Pointer, eid: string): Pointer | null {
        // Log.eDevv("So far cache dependencies with $ are disabled");

        if (!ProxyCache.subelementMap[parent]) return null;
        for (let child_ptr of ProxyCache.subelementMap[parent]) {
            if (ProxyCache.eidMap[child_ptr] === eid) return child_ptr;
        }
        return null;
    }

    static clear(c: LogicContext<any>, k: string): boolean {
        // clear all
        if (!k) {
            let ret = ProxyCache.cache[c.data.id]?.[c.data.clonedCounter];
            if (!ret) return false;
            delete ProxyCache.cache[c.data.id]?.[c.data.clonedCounter];
            return true;
        }
        // clear specific ckey
        let ret = ProxyCache.cache[c.data.id]?.[c.data.clonedCounter]?.[k];
        if (!ret) return false;
        delete ProxyCache.cache[c.data.id]?.[c.data.clonedCounter]?.[k];
        return true;
    }

    // returns: null -> cache disabled for said property.  ret.success = false -> cache invalid, will be updated
    // info.dependencies stores the location of dependencies as local path eg: ["$eid", "$eid"]
    // cache.dependencies stores the last saved clonedCounter for each info.dependencies eg: ["$eid", "$eid"] --> [12, 42]
    // nb: i don't use Cache.clear here because: if it's not cacheable, it should never have a cache value to delete.
    // if it is, it will return success = false and be updated with the new clonedCounters dependencies. replacement over deletion.
    public static get(k: string, d: D, i?: Info): CacheEntry | null {
        try { return ProxyCache.get0(k, d, i); }
        catch (e: any) {
            Log.eDevv("error in cache get", {e, k, d, i, stack: [...e.stack.split("\n")]});
            return null;
        }
    }
    // when the whole state didn't change since last call, i cache even stuff without dependencies, assuming they are deterministic or don't track stuff outside the state.
    private static globalMakeEntry(k: string, d: D, i?: Info): CacheEntry {
        let cc = DState.current?.clonedCounter || -1;
        if (!ProxyCache.globalCache[cc]) ProxyCache.globalCache[cc] = {};
        if (!ProxyCache.globalCache[cc][d.id]) ProxyCache.globalCache[cc][d.id] = {};
        if (!ProxyCache.globalCache[cc][d.id][k]) ProxyCache.globalCache[cc][d.id][k] = {success: false, dependencies: []};
        return ProxyCache.globalCache[cc][d.id][k];
    }
    private static globalGet(k: string, d: D, i?: Info): CacheEntry | null {
        let cc = DState.current?.clonedCounter || -1;

        // new approach: global cache is only populated by local cache entries moved after computed dependencies.
        // if state is unchanged: either use global cache or recompute non-cached value with deps
        // if state is changed: globalCache is erased and it recomputes personal dependencies and stores a link in globalCache (retrieved here)
        return ProxyCache.globalCache?.[cc]?.[d.id]?.[k];

        /*
        // if personal cache is available and recent to last global state change, use that one without computing dependencies
        let personalCache = ProxyCache.cache?.[d.id]?.[dcc]?.[k];
        if (personalCache?.success && personalCache.stateCC === cc) {
            nvm: in this case (personalCache.stateCC === cc) i\'d rather just use the classic personal method and compute dependencies,' +
             so i get a cache that stays valid for longer.
            return ProxyCache.cache[d.id][dcc][k];
        }

        // if not store it in personal cache.
        if (!ProxyCache.globalCache[cc]) ProxyCache.globalCache[cc] = {};
        if (!ProxyCache.globalCache[cc][d.id]) ProxyCache.globalCache[cc][d.id] = {};
        if (!ProxyCache.globalCache[cc][d.id][k]) ProxyCache.globalCache[cc][d.id][k] = {success: false, dependencies: []};
        return ProxyCache.globalCache[cc][d.id][k];*/
    }

    private static globalReset(){
        ProxyCache.globalCache = {};
        ProxyCache.oldStateCC = DState.current?.clonedCounter || -1;
    }

    private static get0(k: string, d: D, i?: Info): CacheEntry | null {
        if (!ProxyCache.enabled) return null;
        if (ProxyCache.status === "preparing") return null;

        let dependencies = i?.dependencies;
        switch (dependencies?.[0]) {
            // skip stuff explicitly marked as non-cacheable (es: random-based results, mouse coords, date...)
            // usually because not dependent from the redux state changes.
            case "never": case "all": return null;
            default: break;
        }

        let cc = d.clonedCounter || -1;
        let newStateCC: number = DState.current.clonedCounter as any;
        let didStateChange = ProxyCache.oldStateCC !== newStateCC;
        if (didStateChange) ProxyCache.globalReset();
        else {
            let globalCache: CacheEntry | null = ProxyCache.globalGet(k, d, i);
            if (globalCache) return globalCache;
        }
        if (!dependencies?.length) return ProxyCache.globalMakeEntry(k, d, i);

        // from here on, there are true dependencies listed and global cache failed
        if (!ProxyCache.cache[d.id]) ProxyCache.cache[d.id] = {};
        let debug = ProxyCache.cache?.[d?.id]?.[cc]?.[k];
        if (!ProxyCache.cache[d.id]?.[cc]) ProxyCache.cache[d.id][cc] = {};
        if (!ProxyCache.cache[d.id]?.[cc][k]) ProxyCache.cache[d.id][cc][k] = {success: true, dependencies: []};
        const ret = ProxyCache.cache[d.id][cc][k];
        if (!("success" in ret)) console.error("wrong cache ret", {ret, debug});
        ret.success = true; // start assuming true, and try to invalidate by checking dependencies
        // if (!ret.success) return ret; // nb: since the event orders are cache.get() proxy.get() cache.set()
        // false should be found only in case of loops like proxy.get("k") -> cache.get("k") -> proxy.get("k")

        let version: number;
        outer: for (let i = 0; i < dependencies.length; i++) {
            let dep = dependencies[i];
            switch (dep) {
                case "all": case "never": // already handled above, this is a double check if they are in indexes >= 1
                    Log.eDevv("cache dependencies all or never must be the only element in the array");
                    return null;
                case "": case "this": // "case for simple cache checking only this.clonedCounter
                    version = d.clonedCounter || 0;
                    if (ret.dependencies[i] === version) continue;
                    // ProxyCache.clear(c, k);
                    ret.success = false;
                    ret.dependencies[i] = version;
                    console.log("proxyCache fail 'this'", {rd:ret.dependencies, i, dep, ret});
                    break outer;
                default:
                    let versions = ProxyCache.navigate(dep, d);
                    if (!versions) {
                        ret.success = false;
                        ret.dependencies = [];
                        Log.eDevv("Cache have wrong dependencies path", {dep, i, d});
                        break outer;
                    }
                    if (versions.length !== ret.dependencies.length) {
                        ret.success = false;
                        ret.dependencies = versions;
                        console.log("proxyCache fail length", {versions, rd:ret.dependencies, i, dep, ret});
                        break outer;
                    }
                    for (let j = 0; j < versions.length; j++) {
                        if (versions[j] !== ret.dependencies?.[j]) {
                            ret.success = false;
                            ret.dependencies = versions;
                            console.log("proxyCache fail version", {versions, rd:ret.dependencies, i, dep, ret, j});
                            break outer;
                        }
                    }
            }
        }
        // export the same cache entry in globalstate, so if the global state did not change i take the value faster without evaluating dependencies.
        newStateCC ??= -1;
        if (!ProxyCache.globalCache[newStateCC]) ProxyCache.globalCache[newStateCC] = {};
        if (!ProxyCache.globalCache[newStateCC][d.id]) ProxyCache.globalCache[newStateCC][d.id] = {};
        if (!ProxyCache.globalCache[newStateCC][d.id][k]) ProxyCache.globalCache[newStateCC][d.id][k] = ret
        return ret;
    }

    // everything else is handled by getter
    static set(v: any, entry: CacheEntry, k: string, d: D): void {
        entry.value = v;
        entry.success = true;
    }

    /*
    static set(v: any, c: LogicContext<any>, k: string, l: L, d: D, i: Info){
        if (!ProxyCache.cache[c.data.id]) ProxyCache.cache[c.data.id] = {};
        if (!ProxyCache.cache[c.data.id][c.data.clonedCounter]) ProxyCache.cache[c.data.id][c.data.clonedCounter] = {};
        ProxyCache.cache[c.data.id][c.data.clonedCounter][k] = {success: true, value:v, dependencies};
    }*/

    private static navigate(path: string[], d0: GObject<D>): null | number[] {
        return (ProxyCache.navigate0(path, d0) || []).map(d=> d ? d.clonedCounter || 0 : -1);
    }
    private static navigate0(path: string[], d0: GObject<D>): null | D[] {
        if (!path) return d0 ? [d0] : null;
        if (!Array.isArray(path)) path = [path];
        let targets: GObject<D>[] = [d0];
        for (let i = 0; i < path.length; i++) {
            let s = path[i];
            if (!s) return targets || null;
            if (s[0] === "$") {
                if (ProxyCache.status === "preparing") {
                    Log.exDevv("So far cache dependencies with $ are disabled during preparation phase");
                    return null;
                }
                targets = targets.flatMap(t=>D.from(this.getByEid(t?.id, s.slice(1)) as any));
            } else {
                targets = targets.flatMap(t => t?.[s]);
            }
            break;
        }
        return targets;
    }


}