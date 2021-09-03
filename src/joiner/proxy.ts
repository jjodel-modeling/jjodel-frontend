import type {GObject, Proxyfied} from "../joiner";
import {RuntimeAccessibleClass} from "../joiner";


export class LogicContext<P extends MyProxyHandler<D>, D extends RuntimeAccessibleClass> extends RuntimeAccessibleClass{
    constructor(public proxy: P, public data: D) { super(); }
    /*
        saveToRedux(propkey: "keyof data" | string, val: "typeof data[path]" | any): void { // todo: ask non stackoverflow
            // todo, put data in redux store, path is "obj1.obj2.obj3..." might replace it with a path funciton that return the foremost nested object container
            if (!propkey) {
                // todo: set whole object instead of a property
            }
        }*/
}

export abstract class MyProxyHandler<T extends GObject> extends RuntimeAccessibleClass implements ProxyHandler<T>{
    s: string = 'set_';
    g: string = 'get_';
    get(target: T, p: string | number | symbol, proxyitself: Proxyfied<T>): boolean { throw new Error('must be overridden'); }
    set(target: T, p: string | number | symbol, value: any, proxyitself: Proxyfied<T>): boolean { throw new Error('must be overridden'); }

    ownKeys(target: T): ArrayLike<string | symbol>{ return Object.keys(target); }
}

export type GetPath<T = GObject> = T;
class GetPathHandler<T extends GObject> extends MyProxyHandler<T>{
    strbuilder: string = '';
    get(targetObj: T, propKey: keyof T | string, proxyitself: Proxyfied<T>): any {
        // console.log('GetPathHandler', {targetObj, propKey, proxyitself});
        if (propKey === "start") this.strbuilder = '';
        if (propKey === '$') { const ret = this.strbuilder; this.strbuilder = ''; return ret; }
        this.strbuilder += (this.strbuilder ? '.' : '') + propKey;
        return proxyitself;
    }
}

// 15-20 min + 5 di domande entro il 1° ottobre, discussione 10-12 ottobre
export const getPath: GetPath = new Proxy( {}, new GetPathHandler());
(window as any).getpathtest = getPath;
// todo: testalo con:
// this.test[1].with.arrays+=1;
