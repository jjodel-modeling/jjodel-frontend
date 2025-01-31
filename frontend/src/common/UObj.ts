import {GObject, Log, PointedBy, RuntimeAccessible} from "../joiner";
import {U, Uarr} from "../joiner";
const stringify = require('json-stable-stringify');

@RuntimeAccessible('Uobj')
export class Uobj {
    static cname: string = 'Uobj';

    // difference react-style. lazy check by === equality field by field. parameters are readonly
    public static objdiff<T extends GObject>(old:T, neww: T, includeProto: boolean = true): {removed: Partial<T>, added: Partial<T>, changed: Partial<T>, unchanged: Partial<T>} {
        // let ret: GObject = {removed:{}, added:{}, changed:{}};
        let ret: {removed: Partial<T>, added: Partial<T>, changed: Partial<T>, unchanged: Partial<T>}  = {removed:{}, added:{}, changed:{}, unchanged: {}};
        if (!neww && !old) { return ret; }
        if (!neww) {
            ret.removed = old;
            if (!includeProto){
                ret.removed = {...ret.removed, __proto__:{}};
            }
            return ret;
        }
        if (!old) {
            ret.added = neww;
            if (!includeProto) {
                ret.added = {...ret.added, __proto__:{}};
            }
            return ret;
        }
        // let oldkeys: string[] = Object.keys(old); let newkeys: string[] = Object.keys(neww);

        let key: any;
        for (key in old) {
            if (!includeProto && !old.hasOwnProperty(key)) continue;
            // if (neww[key] === undefined){
            // if neww have a key with undefined value, it counts (and should) as having that property key defined
            if (!(key in neww)){ (ret.removed as GObject)[key] = old[key]; }
            else if (neww[key] === old[key]) { (ret.unchanged as GObject)[key] = old[key] }
            else (ret.changed as GObject)[key] = old[key];
        }
        for (let key in neww) {
            if (!includeProto && !neww.hasOwnProperty(key)) continue;
            if (!(key in old)){ (ret.added as GObject)[key] = neww[key]; }
        }
        if (Array.isArray(neww)) {
            if (neww.length === old.length) { (ret.unchanged as GObject).length = neww.length; }
            else {
                let newb = 'length' in neww;
                let oldb = 'length' in old;
                if (newb && !oldb) (ret.added as GObject).length = neww.length;
                else if (!newb && oldb) (ret.removed as GObject).length = neww.length;
                else (ret.changed as GObject).length = neww.length;
            }
        }
        return ret;
    }

    // returns <"what changed from old to neww"> and in nested objects recursively
    // todo: how can i tell at what point it's the fina lvalue (might be a nestedobj) and up to when it's a delta to follow and unroll?   using __isAdelta:true ?
    // NB: this returns the delta that generates the future. if you want the delta that generate the past one, invert parameter order.
    public static objectDelta<T extends object>(old: T, neww: T, deep: boolean = true, includeProto: boolean = false): Partial<T>{
        let newwobj: GObject = neww;
        let oldobj: GObject = old;
        if (old === neww) return {};
        if (!neww) {
            if (includeProto) return old;
            return {...old}; // destructure because i need to remove prototype
        }
        let diff = Uobj.objdiff(old, neww, includeProto); // todo: optimize this, remove the 3 loops below and add those directly in Uobj.objdiff(old, neww, ret); writing inside the obj in third parameter
        console.log('objdiff', {diff, old, neww})
        let isArr = false;
        let to = typeof old;
        let tn = typeof old;
        if (to !== 'object'/* && tn === 'object'*/) {
            if (includeProto) return neww;
            return {...neww} as any;
        }
        if (tn === 'object' && Array.isArray(neww)) { isArr = true; }
        let ret: GObject = {}; // {__isAdelta:true};
        for (let key in diff.added) {
            //if (!includeProto && diff.added.hasOwnProperty(key)) continue;
            ret[key] = newwobj[key];
        }
        for (let key in diff.changed) {
            let subold = oldobj[key];
            let subnew = newwobj[key];
            if (typeof subold === typeof subnew && typeof subold === "object") {
                if (deep) {
                    ret[key] = Uobj.objectDelta(subold, subnew, true, includeProto)
                }
                else {
                    ret[key] = subnew;
                    /*if (typeof neww === 'object' && Array.isArray(subnew)) {
                        ret[key].length = subnew.length;
                        ret[key].__jjObjDiffIsArr = true;
                    }*/
                }
            }
            else ret[key] = subnew;
        }
        // todo: add to variable naming rules: can't start with "_-", like in "_-keyname", it means "keyname" removed in undo delta
        let removedprefix = ""; // "_-";
        for (let key in diff.removed) {
            ///if (!includeProto && !diff.removed.hasOwnProperty(key)) continue;
            if (ret[removedprefix + key] === undefined) {
                console.log('undef empty probl<em', {r:diff.removed, val:ret[removedprefix + key], pkey:removedprefix + key, key, ret, old, neww})
            }
            if (key in neww) ret[removedprefix + key] = undefined;
            else ret[removedprefix + key] = '__jjObjDiffEmptyElem';
        } //newwobj[key]; }
        // console.log("objdiff", {old, neww, diff, ret});
        if (isArr) {
            ret.length = (neww as GObject).length;
            ret.__jjObjDiffIsArr = true;
        }
        return ret as Partial<T>;
    }


    public static applyObjectDelta(statelevel: GObject, deltalevel: GObject, inplace: boolean = false, asserteq?: GObject): GObject {
        if (!statelevel) statelevel = {};
        // todo: if delta = ObjectDelta('str', {0:'s', 1:'t', 2:'X'}); applydelta('str', delta); what happes?
        if (typeof statelevel !== 'object') statelevel = {}; // return statelevel;
        if (typeof deltalevel !== 'object') return deltalevel as any;
        let oldState = {...statelevel}; // just for debug
        let targetIsArr = deltalevel.__jjObjDiffIsArr || Array.isArray(deltalevel);
        if (!inplace) statelevel = Array.isArray(statelevel) ? Uarr.arrayShallowCopy(statelevel) : {...statelevel}; // NB: [ ...{obj} ] is invalid, but {...[]} is valid, careful
        else if (targetIsArr && !Array.isArray(statelevel)) statelevel = Uarr.arrayShallowCopy(statelevel); // forced to ignore inplace requirement due to change of type (obj -> arr)

        // statelevel = {...statelevel}; not working if i do it here, just a new var. first time copy id done in caller func undo(). recursive copies are done before recursive step
        let includeProto = false;
        for (let key in deltalevel) {
            let delta = deltalevel[key];
            if (!includeProto && !deltalevel.hasOwnProperty(key)) { continue; }
            // console.log("undoing", {delta, key, deltalevel, statelevel})
            // if (key.indexOf("_-") === 0) { delete statelevel[key.substring(2)]; continue; } // ????????????????????????????????????? todo: check
            if (key === '__jjObjDiffIsArr') continue; // the key is the string, the val is true
            if (delta === '__jjObjDiffEmptyElem') { // the key is the index,the  val is the string
                delete statelevel[key];
                continue;
            }
            if (typeof delta === "object") {
                // if (Uobj.isObject(delta, false, false, true)) {
                // if (!inplace) statelevel[key] = Array.isArray(delta) ? Uarr.arrayShallowCopy(statelevel[key]) : {...statelevel[key]};
                // console.log('handling ', {key});
                statelevel[key] = Uobj.applyObjectDelta(statelevel[key], delta, inplace, asserteq?.[key]); }
            else { statelevel[key] = delta; }
        }
        let old = statelevel;

        if (targetIsArr) {
            statelevel = [];
            for (let k in old) {
                if (!old.hasOwnProperty(k)) continue;
                statelevel[k] = old[k]; // it takes array custom keys
            }

            //delete statelevel.__jjObjDiffIsArr;
            let len: number = null as any;
            if (Array.isArray(deltalevel) || 'length' in deltalevel) len = deltalevel.length;
            else if ('length' in old) len = old.length;
            else Log.exDevv('cannot find array length', {old, statelevel, deltalevel, asserteq});
            if (!(len>=0)) {
                console.error('invalid array length set', {old, statelevel, deltalevel, asserteq});
            }
            else {
                try { statelevel.length = len; } catch(e){
                    console.error('invalid array length set err', {e, old,
                        len, linold:'length' in old, 'lindelta': 'length' in deltalevel,
                        statelevel, deltalevel, asserteq});
                    throw e;
                }

            }
        }

        if (asserteq) {
            let as = stringify(asserteq);
            let rs = stringify(statelevel);
            Log.eDev(as !== rs, 'deltas: error in Uobj.diff, UObj.delta or UObj.patch, assertion failed',
                {oldState, deltalevel, ret:statelevel, asserteq, rs, as, old, targetIsArr});
        }
        return statelevel;
    }
}

Uobj.cname = 'Uobj';