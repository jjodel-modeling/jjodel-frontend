import {
    DAttribute,
    DClass,
    DeepReadonly,
    Dictionary, DObject,
    DState,
    DValue,
    GObject,
    Info,
    LogicContext,
    Pointer, Pointers
} from "../joiner";
import {L, D, RuntimeAccessible, U} from "../joiner";

class CacheEntry{
    success: boolean = true;
    value?: any;
    dependencies!: number[];
}
function getNameFromValue(d: DValue): string | undefined {
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
        return ProxyCache.nameMap[d.id];
        or i just return the ppointer and then do passes to resolve pointers later on N times as necessary
        // problem: if it's reference value -> object.name -> object.$name
        // eg: value "name" of type DReference pointing to an object with $name property, that name might not have been cached yet.
        // so i would need to run this N times, where N is the longest $name chain or resolve a DAG graph...
    }
}) as string | undefined*/
}

type ProxyKey = string;
@RuntimeAccessible("ProxyCache")
export class ProxyCache {
    static clonedCounter: Dictionary<Pointer, number> = {};
    static cache: Dictionary<Pointer, Dictionary<number/*clonedCount*/, Dictionary<ProxyKey, CacheEntry>>> = {};
    static subelementMap: Dictionary<Pointer, Pointer[]> = {};
    static nameMap: Dictionary<Pointer, string> = {};

    static update(ret: DeepReadonly<DState>, old: DeepReadonly<DState>): void {
        let allObjectKeys = new Set(U.arrayMergeInPlace(Object.keys(ret.idlookup), Object.keys(old.idlookup)));

        ProxyCache.subelementMap = {};
        for (let k of allObjectKeys) {
            let d: Readonly<GObject<D>> = ret.idlookup[k] as any;
            let oldd = old.idlookup[k];
            if (d?.father) {
                if (!ProxyCache.subelementMap[d.father]) ProxyCache.subelementMap[d.father] = [];
                ProxyCache.subelementMap[d.father].push(d.id);
            }
            // name set, abstracted to general purpose
            if (d?.name) {
                let name = U.toIdentifier(d.name);
                if (name === "name") {
                    let namesToUpdate: Set<DValue | DObject> = new Set();
                    switch (d.className) {
                        default:
                            ProxyCache.nameMap[d.id] = U.toIdentifier(name);
                            break;
                            tonamed arr should use eid instead
                        // 1) value with personal name === "name" and shapeless (m2 does not override his name, no intersection with (2))
                        case "DValue":
                            if (d.instanceof) break;
                            namesToUpdate.add(d as DValue);
                            break;
                        case "DObject":
                            // objects might have name from m2, or from an attribute named "name"
                            // since at this stage i cannot tell if it have such an attribute from D-objects (might inherit name from m2 attribute or other)
                            // i just recompute his name
                            namesToUpdate.add(d as DObject);
                            break;
                        // 2) values with name coming from m2 === "name"
                        case "DAttribute": case "DReference":
                            for (let ptr of ((d as DAttribute).instances || [])) namesToUpdate.add(D.fromPointer(ptr));
                            break;
                        default: break;
                    }

                    for (let d of namesToUpdate) {
                        let l = L.fromD(d);
                        ProxyCache.nameMap[d.id] = getNameFromValue(d);
                        instead of doing this shit, which does not account for custom getter on name, can't i just update it when calling get_name?
                    }
                }

            }
            if (d?.clonedCounter === oldd?.clonedCounter) continue;
        }
    }



    static getByName(parent: Pointer, name: string): Pointer | null {
        if (!ProxyCache.subelementMap[parent]) return null;
        for (let child_ptr of ProxyCache.subelementMap[parent]) {
            if (ProxyCache.nameMap[child_ptr] === name) return child_ptr;
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
    // info.dependencies stores the location of dependencies as local path eg: ["$name", "$eid"]
    // cache.dependencies stores the last saved clonedCounter for each info.dependencies eg: ["$name", "$eid"] --> [12, 42]
    // nb: i don't use Cache.clear here because: if it's not cacheable, it should never have a cache value to delete.
    // if it is, it will return success = false and be updated with the new clonedCounters dependencies. replacement over deletion.
    static get(k: string, d: D, i : Info): CacheEntry | null {
        let dependencies = i.dependencies;
        if (!dependencies?.length) return null; // do not cache by default unless dependencies are stated.
        if (!ProxyCache.cache[d.id]) ProxyCache.cache[d.id] = {};
        let cc = d.clonedCounter || -1;
        if (!ProxyCache.cache[d.id]?.[cc]) ProxyCache.cache[d.id][cc] = {};
        if (!ProxyCache.cache[d.id]?.[cc][k]) ProxyCache.cache[d.id][cc][k] = {success: true, dependencies: []}
        const ret = ProxyCache.cache[d.id][cc][k];
        // if (!ret.success) return ret; // nb: since the event orders are cache.get() proxy.get() cache.set()
        // false should be found only in case of loops like proxy.get("k") -> cache.get("k") -> proxy.get("k")

        let version: number;
        if (dependencies[0] === "all") return null; // do not use, just don't fill the array.
        for (let i = 0; i < dependencies.length; i++) {
            let dep = dependencies[i];
            switch (dep) {
                case "": case "this": // "case for simple cache checking only this.clonedCounter
                    version = d.clonedCounter || 0;
                    if (ret.dependencies[i] === version) continue;
                    // ProxyCache.clear(c, k);
                    ret.success = false;
                    ret.dependencies[i] = version;
                    return ret;
                default:
                    version = ProxyCache.navigate(dep, d);
                    if (!isNaN(version) && version === ret.dependencies?.[i]) continue;
                    // ProxyCache.clear(c, k);
                    ret.success = false;
                    ret.dependencies[i] = version;
                    break;
            }
        }
        return ret;
    }

    // everything else is handled by getter
    static set(v: any, entry: CacheEntry, k: string, ptr: Pointer): void {
        entry.value = v;
        entry.success = true;
        if (k === "name") ProxyCache.nameMap[ptr] = v;
    }

    /*
    static set(v: any, c: LogicContext<any>, k: string, l: L, d: D, i: Info){
        if (!ProxyCache.cache[c.data.id]) ProxyCache.cache[c.data.id] = {};
        if (!ProxyCache.cache[c.data.id][c.data.clonedCounter]) ProxyCache.cache[c.data.id][c.data.clonedCounter] = {};
        ProxyCache.cache[c.data.id][c.data.clonedCounter][k] = {success: true, value:v, dependencies};
    }*/

    private static navigate(path: string[], d: GObject<D>): number {
        if (!path) return d.clonedCounter || 0;
        if (!Array.isArray(path)) path = [path];
        let target: GObject<D> = d;
        for (let s of path) {
            if (!s) return d.clonedCounter || 0;
            if (s[0] === "$") {
                target = D.from(this.getByName(target.id, s.slice(1)) as any);
                break;
            }
            target = D.from(d[s]);
            break;
        }
        return target?.clonedCounter || -1;
    }


}