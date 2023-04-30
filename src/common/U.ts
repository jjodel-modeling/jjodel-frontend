import type {GObject} from "../joiner";

import {
    AbstractConstructor,
    Constructor,
    Dictionary,
    DPointerTargetable, DRefEdge, DReference,
    MyError,
    RuntimeAccessible, Selectors,
    windoww
} from "../joiner";
import {Uarr} from "./uarr";

export class U{
    static getStackTrace(sliceCalls: number = 2): string[] {
        const ret: string | undefined = Error().stack;
        // try { var a = {}; a.debug(); } catch(ex) { ret = ex.stack; }
        // if (Array.isArray(ret)) return ret;
        if (!ret) return ['UnknownStackTrace'];
        const arr: string[] = ret.split('\n');
        // first 2 entries are "Erorr" and "getStackTrace()"
        return sliceCalls > 0 ? arr.slice( sliceCalls ) : arr; }


    public static removeFromList(list: string[], itemToRemove: string): string[] {
        const set = new Set(list);
        set.delete(itemToRemove);
        return [...set];
    }

    static increaseEndingNumber(s: string, allowLastNonNumberChars: boolean = false, allowDecimal: boolean = false, increaseWhile?: ((x: string) => boolean)): string {
        /*let i = s.length;
    let numberEnd = -1;
    while (--i > 0) {
      if (!isNaN(+s[i])) { if (numberEnd === -1) { numberEnd = i; } continue; }
      if (s[i] === '.' && !allowDecimal) { break; }
      if (s[i] === '.') { allowDecimal = false; continue; }
      if (!ignoreNonNumbers) { break; }
      if (numberEnd !== -1) { ignoreNonNumbers = false; }
    }
    if (numberEnd === -1) { return s + '_1'; }
    // i++;
    numberEnd++;*/
        let regexpstr = '([0-9]+' + (allowDecimal ? '|[0-9]+\\.[0-9]+' : '') + ')' + (allowLastNonNumberChars ? '[^0-9]*' : '') + '$';
        const matches: RegExpExecArray | null = new RegExp(regexpstr, 'g').exec(s); // Global (return multi-match) Single line (. matches \n).
        // S flag removed for browser support (firefox), should work anyway.
        let prefix: string;
        let num: number;
        if (!matches) {
            prefix = s;
            num = 2;
        } else {
            Log.ex(matches.length > 2, 'parsing error: /' + regexpstr + '/gs.match(' + s + ')');
            let i = s.length - matches[0].length;
            prefix = s.substring(0, i);
            num = 1 + (+matches[1]);
            // UU.pe(isNaN(num), 'wrong parsing:', s, s.substring(i, numberEnd), i, numberEnd);
            // const prefix: string = s.substring(0, i);
            // console.log('increaseendingNumber:  prefix: |' + prefix+'| num:'+num, '[i] = ['+i+']; s: |'+s+"|");

        }
        if (increaseWhile) while (increaseWhile(prefix + num)) { num++; }
        return prefix + num; }

    public static followPath(base: GObject, path: string): {chain: GObject[], lastObject: GObject, keys:string[], lastkey: string, lastval: any, failedRemainingPath: string[]} {
        let patharr = path.split('.');
        let base0 = base;
        let ret: {chain: GObject[], lastObject: GObject, keys: string[], lastkey: string, lastval: any, failedRemainingPath: string[]}  = {} as any;
        ret.keys = patharr;
        ret.chain = [base];
        let lastObject = base;

        for (let i = 0; i < patharr.length; i++) {
            let path = ret.lastkey = patharr[i];
            lastObject = base;
            base = base[path];
            ret.chain.push(base);
            if (typeof base !== "object" || i + 1 === patharr.length) {
                ret.failedRemainingPath = patharr.slice(i);
                ret.lastval = base;
                ret.lastObject = lastObject;
                return ret;
            }
        }
        throw new Error("followPath should never reach here");
        return ret;
    }

    static arrayRemoveAll<T>(arr: Array<T>, elem: T, debug: boolean = false): void {
        let index;
        if (!arr) return;
        while (true) {
            index = arr.indexOf(elem);
            Log.l(debug, 'ArrayRemoveAll: index: ', index, '; arr:', arr, '; elem:', elem);
            if (index === -1) { return; }
            arr.splice(index, 1);
            Log.l(debug, 'ArrayRemoveAll RemovedOne:', arr);
        }
    }

    // delete this block --> start
    private static classnameConverter(classname: string): string | null {
        switch (classname) {
            default: return null;
            case "DAttribute": return "attributes";
            case "DReference": return "references";
            case "DPackage": return "packages";
        }
    }
    public static classnameToRedux(classname: string): string | null {
        return  (classname.substring(1)).toLowerCase() + "s";
    }

    static endsWith(str: string, suffix: string | string[]): boolean {
        if (Array.isArray(suffix)) {
            for (let suf of suffix) {
                if (U.endsWith(str, suf)) return true;
            }
            return false;
        }
        return str.length >= suffix.length && str.lastIndexOf(suffix) === str.length - suffix.length;
    }

    // returns true only if parameter is already a number by type. UU.isNumber('3') will return false
    static isNumber(o: any): boolean { return +o === o && !isNaN(o); }


    static stringCompare(s1: string, s2: string): -1 | 0 | 1 { return (s1 < s2) ? -1 : (s1 > s2) ? 1 : 0; }
    static getType(param: any): string {
        switch (typeof param) {
            default: return typeof param;
            case 'object':
                return param?.constructor?.name || param?.className || "{_rawobject_}";
            case 'function': // and others
                return "geType for function todo: distinguish betweeen arrow and classic";
        }
    }
    static asClass<T extends Function>(obj: any, classe: T, elseReturn: T | null = null): null | T { return obj instanceof classe ? obj as any as T: elseReturn; }
    static asString<T>(propKey: unknown, elseReturn: T | null = null): string | null | T { return typeof propKey === 'string' ? propKey : elseReturn; }
    static isString(propKey: unknown): boolean { return typeof propKey === 'string'; }

    public static classnameToObjConverter(classname: string): string | null {
        switch (classname) {
            default: return U.classnameConverter(classname);
            case "DClass": return "classifiers";
            case "DEnumerator": return "classifiers";
            case "DEnumLiteral": return "literals";
        }
    }
    public static classnameToReduxConverter(classname: string): string | null {
        switch (classname) {
            default: return U.classnameConverter(classname);
            case "DClass": return "classs";
            case "DEnumerator": return "enumerators";
            case "DEnumLiteral": return "enumliterals";
        }
    }

    static arrayUnique<T>(arr: T[]): Array<T> { return [ ...new Set<T>(arr)]; }

    static arrayDifference<T>(starting: T[], final: T[]): {added: T[], removed: T[], starting: T[], final: T[]} {
        let ret: {added: T[], removed: T[], starting: T[], final: T[]} = {} as any;
        ret.starting = starting;
        ret.final = final;
        if (!starting) starting = [];
        if (!final) final = [];
        ret.removed = Uarr.arraySubtract(starting, final, false); // start & !end
        ret.added = Uarr.arraySubtract(final, starting, false); // end & !start
        return ret;
    }

    static SetMerge<T>(modifyFirst: boolean = true, ...iterables: Iterable<T>[]): Set<T> {
        const set: Set<T> = modifyFirst ? iterables[0] as Set<T>: new Set<T>();
        Log.e(!(set instanceof Set), 'U.SetMerge() used with modifyFirst = true requires the first argument to be a set');
        for (let iterable of iterables) { for (let item of iterable) { set.add(item); } }
        return set; }

    static objectFromArrayValues(arr: (string | number)[]): Dictionary<string | number, boolean> {
        let ret: Dictionary = {};
        // todo: improve efficiency
        for (let val of arr) { ret[val] = true; }
        return ret;
    }

    static arrayMergeInPlace<T>(arr1: T[], ...otherArrs: T[][]): T[] {
        for (const arr of otherArrs) arr1.push.apply(arr1, arr || []);
        return arr1; }



    // warn: if return is not explicitly inserted (if that's the case set imlicitReturn = false) with a scope and the code have multiple statemepts it will fail.
    // can modify scope AND context
    // warn: can access external scope (from the caller)
    // if the context (this) is missing it will take the scope as context.
    // warn: cannot set different scope and context, "this" della funzione sovrascrive anche il "this" interno allo scope come chiave dell'oggetto
    // warn: if you modify
    public static evalInContextAndScope<T = any>(codeStr: string, scope?: GObject, context?: GObject): T {
        // console.log('evalInContextAndScope', {codeStr, scope, context});
        // scope per accedere a variabili direttamente "x + y"
        // context per accedervi tramite this, possono essere impostati come diversi.
        if (!scope && !context) { Log.ex(true, 'evalInContextAndScope: must specify at least one of scope || context', {codeStr, scope, context}); }
        if (!context) context = scope; // se creo un nuovo contesto pulisco anche lo scope dalle variabili locali di questa funzione.
        // scope.this = scope.this || context || scope; non funziona
        // console.log('"with(this){ return eval( \'" + codeStr + "\' ); }"', "with(this){ return eval( '" + codeStr + "' ); }");
        // eslint-disable-next-line no-restricted-syntax,no-with
        // if (allowScope && allowContext) { return function(){ with(this){ return eval( '" + codeStr + "' ); }}.call(scopeAndContext); }
        // if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr + "' ); }").call(scopeAndContext); }
        let _ret: T = null as any;
        const _eval = {codeStr, context, scope};
        /*
        if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr.replace(/'/g, "\\'") + "' ); }").call(scopeAndContext); }
        if (!allowScope && allowContext) { return new Function( "return eval( '" + codeStr + "' );").call(scopeAndContext); }
        if (allowScope && !allowContext) { return eval("with(scopeAndContext){ " + codeStr + " }"); }*/
//      U.pe(!!scope && U.isStrict(), 'cannot change scope while in strict mode ("use strict")');
        let prefixDeclarations: string = "", postfixDeclarations: string = '';
        if (scope) {
            if (U.isStrict) {
                for (let key in scope) {
                    // anche se li assegno non cambiano i loro valori nel contesto fuori dall'eval, quindi lancio eccezioni con const.
                    prefixDeclarations += "const " + key + " = this." + key + "; ";
                    postfixDeclarations = "";
                }
            } else {
                prefixDeclarations = "with(" + (context ? "this._eval." : "") + "scope){ ";
                postfixDeclarations = " }";
            }
        }
        if (scope && context) {
            (context as any)._eval = _eval;
            //console.log('pre eval jsx:', context, 'body:', {codeStr, Input: windoww.Input});
            _ret = new (Function as any)(prefixDeclarations + "return eval( this._eval.codeStr );" + postfixDeclarations).call(context);
            delete (context as any)._eval; } else
        if (!scope && context) { _ret = new (Function as any)( "return eval( this._eval._codeStr );").call(context); } else
        if (scope && !context) {
            // NB: potrei creare lo scope con "let key = value;" per ogni chiave, ma dovrei fare json stringify e non è una serializzazione perfetta e può dare eccezioni(circolarità)
            // console.log({isStrict: U.isStrict, eval: "eval(" + prefixDeclarations + codeStr + postfixDeclarations + ")"});
            _ret = eval(prefixDeclarations + codeStr + postfixDeclarations); }
        return _ret; }


    // merge properties with first found first kept (first parameters have priority on override). only override null|undefined values, not (false|0|'') values
    static objectMergeInPlace<A extends object, B extends object>(output: A, ...objarr: B[]): void {
        const out: GObject = output;
        for (let o of objarr) for (let key in o) {
            // noinspection BadExpressionStatementJS,JSUnfilteredForInLoop
            out[key] ?? (out[key] = o[key]);
        }
    }


    // warn: this check if the scope containing the function is strict, to check if a specific external scope-file is strict
    // you have to write inline the code:        var isStrict = true; eval("var isStrict = false"); if (isStrict)...
    // @ts-ignore
    public static isStrict: boolean = ( function() { return !this; })();
    // merge without unique check
    static ArrayMerge(arr1: any[], ...arr2: any[]): void { U.ArrayMerge0(false, arr1, arr2); }
    // implementation
    static ArrayMerge0(unique: boolean, arrtarget: any[], ...arrays: any[]): void {
        if (!arrtarget || !arrays) return;

        if (unique) { for (let arri of arrays) for (let e of arri) U.ArrayAdd(arrtarget, e); }
        else { for (let arri of arrays) Array.prototype.push.apply(arrtarget, arri); }
    }

    static ArrayAdd<T>(arr: Array<T>, elem: T, unique: boolean = true, throwIfContained: boolean = false): boolean {
        Log.ex(!arr || !Array.isArray(arr), 'ArrayAdd arr null or not array:', arr);
        if (!unique) { arr.push(elem); return true; }
        if (arr.indexOf(elem) === -1) { arr.push(elem); return true; }
        Log.ex(throwIfContained, 'ArrayAdd element already contained:', arr, elem);
        return false; }

    public static classIsExtending(subconstructor: Constructor | AbstractConstructor, superconstructor: Constructor | AbstractConstructor): boolean {
        return (superconstructor as typeof DPointerTargetable)?._extends?.includes(subconstructor as any) || false;
        // return U.getAllPrototypes(subconstructor).includes(superconstructor);
    }

    static isObject(obj: GObject|any): boolean { return obj instanceof Object; }


    //T extends ( ((...args: any[]) => any) | (() => any)
    public static execInContextAndScope<T extends (...args: any) => any>(func: T, parameters: Parameters<T>, scope?: GObject, context?: GObject): ReturnType<T>{
        Log.l(true, 'execInCtxScope', {func, parameters, scope, context});
        let ret: any;
        const _eval = {context, scope, func, parameters: parameters || []};
        let prefixDeclarations: string = "", postfixDeclarations: string = '';
        if (scope) {
            if (U.isStrict) {
                for (let key in scope) {
                    // anche se li assegno non cambiano i loro valori nel contesto fuori dall'eval, quindi lancio eccezioni con const.
                    prefixDeclarations += "const " + key + " = this." + key + "; ";
                    postfixDeclarations = "";
                }
            } else {
                prefixDeclarations = "with(" + (context ? "this._eval." : "") + "scope){ ";
                postfixDeclarations = " }";
            }
        }
        if (!scope && !context) { Log.ex(true, 'execInContextAndScope: must specify at least one of scope || context', {func, scope, context}); }
        if (!context) context = scope; // se creo un nuovo contesto pulisco anche lo scope dalle variabili locali di questa funzione.
        if (scope && context) {
            context._eval = _eval;
            // will the scope work with "with" outside the function body?
            ret = new Function( prefixDeclarations + "return this._eval.func.apply(this._eval.context, this._eval.parameters);" + postfixDeclarations).call(context);
            delete context._eval;
        }
        if (!scope && context) { return _eval.func.apply(_eval.context, _eval.parameters); }
        if (scope && !context) {
            // todo: non credo funzioni, _eval non dovrebbe essere accessibile dopo la "with" forse devo fare scope._eval = _eval;
            return eval(prefixDeclarations + "return _eval.func(..._eval.parameters);" + postfixDeclarations); }
        return ret; }

    static removeEmptyObjectKeys(obj: GObject): void{
        for (let key of Object.keys(obj)) {
            if (obj[key] === null || obj[key] === undefined) delete obj[key];
        }
    }
    public static getReferenceEdge(dReference: DReference) : DRefEdge | undefined {
        const dRefEdges: DRefEdge[] = Selectors.getRefEdges();
        for(let dRefEdge of dRefEdges) {
            if(dRefEdge.start === dReference.id) { return dRefEdge; }
        }
        return undefined;
    }
}




@RuntimeAccessible
export class Log{
    constructor() { }
    // public static history: Dictionary<string, Dictionary<string, any[]>> = {}; // history['pe']['key'] = ...parameters
    public static lastError: any[];
    private static loggerMapping: Dictionary<string, LoggerInterface[]> = {} // takes function name returns logger list
    public static registerLogger(logger: LoggerInterface, triggerAt: (typeof windoww.U.pe) & {name: string}) {
        if (!Log.loggerMapping[triggerAt.name]) Log.loggerMapping[triggerAt.name] = [];
        Log.loggerMapping[triggerAt.name].push(logger);
    }

    static disableConsole(){
        // @ts-ignore
        console['logg'] = console.log;
        console.log = () => {}; }

    static enableConsole() {
        // @ts-ignore
        if (console['logg']) console.log = console['logg']; }

    private static log(prefix: string, category: string, originalFunc: typeof console.log, b: boolean, ...restArgs: any[]): string {
        if (!b) { return ''; }
        const key: string = windoww.U.getCaller(1);
        if (restArgs === null || restArgs === undefined) { restArgs = []; }
        let str = '[' + prefix + ']' + key + ': ';
        for (let i = 0; i < restArgs.length; i++) {
            console.log(prefix, {i, restArgs, curr:restArgs[i]});
            str += '' +
                (typeof restArgs[i] === 'symbol' ?
                    '' + String(restArgs[i]) :
                    restArgs[i])
                + '\t\r\n'; }
        if (Log.loggerMapping[category]) for (const logger of Log.loggerMapping[category]) { logger.log(category, key, restArgs, str); }
        originalFunc(key, ...restArgs);
        return str; }

    public static e(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        const str = Log.log('Error', 'e', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        return str;
        // throw new Error(str);
    }

    public static eDev(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        const str = Log.log('Dev Error','eDev', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        return str;
        // throw new Error(str);
    }

    public static ex(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        const str = Log.log('Error', 'e', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        throw new MyError(str, ...restArgs); }

    public static exDev(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        const str = Log.log('Dev Error','eDev', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        throw new MyError(str, ...restArgs); }

    public static i(b: boolean, ...restArgs: any[]): string { return Log.log('Info', 'i', console.log, b, ...restArgs); }
    public static l(b: boolean, ...restArgs: any[]): string { return Log.log('Log', 'l', console.log, b, ...restArgs); }
    public static w(b: boolean, ...restArgs: any[]): string { return Log.log('Warn', 'w', console.warn, b, ...restArgs); }


    public static eDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): string { return Log.eDev(true, ...[firstParam, ...restAgs]); }
    public static ee(...restAgs: any): string { return Log.e(true, ...restAgs); }
    public static exDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): never | any { return Log.exDev(true, ...[firstParam, ...restAgs]); }
    public static exx(...restAgs: any): never | any { return Log.ex(true, ...restAgs); }
    public static ii(...restAgs: any): string { return Log.i(true, ...restAgs); }
    public static ll(...restAgs: any): string { return Log.l(true, ...restAgs); }
    public static ww(...restAgs: any): string { return Log.w(true, ...restAgs); }
}

type NotBool<T> = Exclude<T, boolean>;

interface LoggerInterface{
    log: (category: string, key: string, data: any[], fullconcat?: string) => any;
}


export class DDate{

    public static addDay(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setDate(date.getDate() + offset);
        return ret;
    }
    public static addMonth(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setMonth(date.getMonth() + offset);
        return ret;
    }
    public static addYear(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setFullYear(date.getFullYear() + offset);
        return ret;
    }
}
