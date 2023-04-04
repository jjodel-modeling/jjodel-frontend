// import * as detectzoooom from 'detect-zoom'; alternative: https://www.npmjs.com/package/zoom-level
import {ChangeEvent, ReactElement} from "react";
import {isDeepStrictEqual} from "util";
// import {Mixin} from "ts-mixer";
import type {
    Constructor,
    GObject,
    Dictionary,
    Temporary, Pack, Pack1, Pointer, AbstractConstructor
} from "../joiner";
import {
    Json,
    bool,
    DocString,
    JsType,
    RuntimeAccessibleClass,
    LPointerTargetable,
    MixOnlyFuncs,
    RuntimeAccessible,
    windoww,
    MyError,
    DPointerTargetable,
    TODO,
    LogicContext,
    LModelElement,
    SetRootFieldAction,
    DLog,
    CreateElementAction,
    MyProxyHandler,
    LReference,
    LClass,
    LPackage,
    LEnumerator,
    LAttribute,
    DRefEdge,
    Selectors,
    DReference,
    DModelElement, WPointerTargetable, LEnumLiteral, DAttribute, DClassifier, LClassifier, LNamedElement
} from "../joiner";
// import KeyDownEvent = JQuery.KeyDownEvent; // https://github.com/tombigel/detect-zoom broken 2013? but works

console.warn('loading ts U log');

@RuntimeAccessible
export class U{

    private static notNullFilter(e: any) { return !!e; };
    static pe(useLog_e: never, ...rest: any): void | never {}

    //Giordano: start

    public static initializeValue(classifier: undefined|DClassifier|LClassifier|Pointer<DClassifier, 1, 1, LClassifier>): string {
        if(!classifier) return 'null';
        const pointer: Pointer = typeof classifier === 'string' ? classifier : classifier.id;
        const me: LNamedElement = LNamedElement.fromPointer(pointer);
        switch(me.name) {
            case 'EString': return '';
            case 'EChar':  return 'a';
            case 'EInt': return '0';
            case 'ELong': return '0';
            case 'EShort': return '0';
            case 'Byte': return '0';
            case 'EFloat': return '0';
            case 'EDouble': return '0';
            case 'EBoolean': return 'false';
            case 'EDate': return new Date().toJSON().slice(0,10);
        }
        return 'null';
    }

    public static orderChildrenByTimestamp(context: LogicContext): LModelElement[] {
        const children = context.proxyObject.childrens;
        if(children && children.length > 0) {
            let orderedChildren = new Map<number, LModelElement>();
            for(let child of children) {
                let timestamp = child.id.slice(-13);
                orderedChildren.set(+timestamp, child);
            }
            orderedChildren = new Map([...orderedChildren.entries()].sort());
            return [...orderedChildren.values()];
        } else return [];
    }

    public static getReferenceEdge(dReference: DReference) : DRefEdge | undefined {
        const dRefEdges: DRefEdge[] = Selectors.getRefEdges();
        for(let dRefEdge of dRefEdges) {
            if(dRefEdge.start === dReference.id) { return dRefEdge; }
        }
        return undefined;
    }

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
    /*
    public static removeFromList<T extends LPointerTargetable>(list: T[], itemToRemove: T): T[] {
        const correctedList: T[] = [];
        for(let item of list) {
            const lItem: T | undefined = MyProxyHandler.wrap(item as DPointerTargetable);
            if(lItem && lItem.id !== itemToRemove.id) { correctedList.push(lItem); }
        }
        return correctedList;
    }
    */
    public static removeFromList(list: string[], itemToRemove: string): string[] {
        const set = new Set(list);
        set.delete(itemToRemove);
        return [...set];
    }

    public static showToolButton(className : string) : boolean {
        switch (className){
            default: return false;
            case "DPackage":
            case "DClass":
            case "DAttribute":
            case "DReference":
            case "DEnumerator":
            case "DEnumLiteral": return true;
        }
    }

    /*
    public static deletePointerBy(lModel: LPointerTargetable, dPointer: string|DPointerTargetable): void {
        const pointedBy = new Set(lModel.pointedBy as any as string[]);
        const pointer: string = typeof dPointer === "string" ? dPointer : dPointer.id;
        pointedBy.delete(pointer);
        // todo: WPointerTargetable.from(lModel)
        (lModel as any).pointedBy = [...pointedBy];
    }
    public static addPointerBy(lModel: LPointerTargetable, newelem: DPointerTargetable | Pointer<DPointerTargetable>): void {
        const pointedBy = new Set(lModel.pointedBy);
        let newelem_: LPointerTargetable = LModelElement.from(newelem);
        pointedBy.add(newelem_);
        lModel.pointedBy = [...pointedBy];
    }*/

    public static writeLog(action: string, context: string, firstItem: string, secondItem?: string): void {
        let log: string = "";
        //context = context.toUpperCase();
        switch(action.toLowerCase()) {
            case "create": log = `<i>${context}:</i> created <b>${firstItem}</b>`; break;
            case "add": log = `<i>${context}:</i> added <b>${firstItem}</b> to <b>${secondItem}</b>`; break;
            case "delete": log = `<i>${context}:</i> deleted <b>${firstItem}</b> from <b>${secondItem}</b>`; break;
        }
        CreateElementAction.new(new DLog(log));
    }

    static multiReplaceAllKV(a: string, kv: string[][] = []): string {
        const keys: string[] = [];
        const vals: string[] = [];
        let i: number;
        for (i = 0; i < kv.length; i++) { keys.push(kv[i][0]); vals.push(kv[i][0]); }
        return U.multiReplaceAll(a, keys, vals); }

    static multiReplaceAll(a: string, searchText: string[] = [], replacement: string[] = []): string {
        Log.ex(searchText.length !== replacement.length, 'search and replacement must be have same length: ' + searchText.length + "vs" + replacement.length + " " +JSON.stringify(searchText) + "   " + JSON.stringify(replacement));
        let i = -1;
        while (++i < searchText.length) { a = U.replaceAll(a, searchText[i], replacement[i]); }
        return a; }

    static replaceAll(str: string, searchText: string, replacement: string, debug: boolean = false, warn: boolean = true): string {
        if (!str) { return str; }
        return str.split(searchText).join(replacement); }

    static toFileName(a: string = 'nameless.txt'): string {
        if (!a) { a = 'nameless.txt'; }
        a = U.multiReplaceAll(a.trim(), ['\\', '//', ':', '*', '?', '<', '>', '"', '|'],
            ['[lslash]', '[rslash]', ';', '°', '_', '{', '}', '\'', '!']);
        return a; }

    private static classnameConverter(classname: string): string | null {
        switch (classname) {
            default: return null;
            case "DAttribute": return "attributes";
            case "DReference": return "references";
            case "DPackage": return "packages";
        }
    }
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

    public static classnameToRedux(classname: string): string | null {
        return  (classname.substring(1)).toLowerCase() + "s";
    }
    //Giordano: end


    // warn: this check if the scope containing the function is strict, to check if a specific external scope-file is strict
    // you have to write inline the code:        var isStrict = true; eval("var isStrict = false"); if (isStrict)...
    // @ts-ignore
    public static isStrict: boolean = ( function() { return !this; })();

    // merge properties with first found first kept (first parameters have priority on override). only override null|undefined values, not (false|0|'') values
    static objectMergeInPlace<A extends object, B extends object>(output: A, ...objarr: B[]): void {
        const out: GObject = output;
        for (let o of objarr) for (let key in o) {
            // noinspection BadExpressionStatementJS,JSUnfilteredForInLoop
            out[key] ?? (out[key] = o[key]);
        }
    }

    public static log(log: any) {
        console.clear();
        console.log("###", log);
    }

    static removeEmptyObjectKeys(obj: GObject): void{
        for (let key of Object.keys(obj)) {
            if (obj[key] === null || obj[key] === undefined) delete obj[key];
        }
    }

        // usage example: objectMergeInPlace_conditional(baseobj, (out, key, current) => !out[key] && current[key];
    static objectMergeInPlace_conditional<A extends object, B extends object>(output: A, condition: (out:A&B, key: string | number, current:B, objarr?: B[], indexOfCurrent?: number) => boolean, ...objarr: B[]): A & B {
        const out: GObject = output;
        let i: number = 0;
        for (let o of objarr) for (let key in o) { if (condition(out as A&B, key, o, objarr, i++)) out[key] = o[key]; }
        return out as  A & B; }

    static getFunctionSignatureFromComments(f: Function): {parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string} {
        Log.e(!JsType.isFunction(f), 'getFunctionSignature() parameter must be a function');
        // let parameters: {name: string, defaultVal: string, typedesc: string}[] = []; //{name: '', defaultVal: undefined, typedesc: ''};
        let ret: {parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string}
            = {parameters: [], returns: undefined, f: f, fname: undefined, isLambda: null as Temporary, signature: ''};
        let str: string = f.toString();
        let starti: number = str.indexOf('(');
        let endi: number;
        let parcounter: number = 1;
        for (endi = starti + 1; endi < str.length; endi++) {
            if (str[endi] === ')' && --parcounter === 0) break;
            if (str[endi] === '(') parcounter++; }

        let parameterStr = str.substring(starti + 1, endi);
        // console.log('getfuncsignature starti:', starti, 'endi', endi, 'fname:', str.substr(0, starti), 'parameterStr:', parameterStr);
        ret.fname = str.substr(0, starti).trim();
        ret.fname = ret.fname.substr(0, ret.fname.indexOf(' ')).trim();
        // 2 casi: anonimo "function (par1...){}" e "() => {}", oppure nominato: "function a1(){}"
        if (ret.fname === '' || ret.fname === 'function') ret.fname = undefined; // 'anonymous function';



        let returnstarti: number = str.indexOf('/*', endi + 1);
        let returnendi: number = -1;
        let bodystarti: number = str.indexOf('{', endi + 1);
        if (returnstarti === -1 || bodystarti !== -1 && bodystarti < returnstarti) {
            // no return type or comment is past body
            ret.returns = undefined;
        } else {
            returnendi = str.indexOf('*/', returnstarti + 2);
            ret.returns = str.substring(returnstarti + 2, returnendi).trim();
            bodystarti = str.indexOf('{', returnendi); }
        if (ret.returns === '') ret.returns = undefined;

        // is lambda if do not have curly body or contains => between return comment and body
        // console.log('isLambda:', bodystarti, str.substring(Math.max(endi, returnendi)+1, bodystarti));
        ret.isLambda =  bodystarti === -1 || str.substring(Math.max(endi, returnendi)+1, bodystarti).trim() === '=>';

        let regexp = /([^=\/\,]+)(=?)([^,]*?)(\/\*[^,]*?\*\/)?,/g; // only problem: the last parameter won't match because it does not end with ",", so i will append it everytime.
        let match;
        while ((match = regexp.exec(parameterStr + ','))) {
            // match[0] is always the full match (not a capture group)
            // match[2] can only be "=" or empty string
            // nb: match[4] can be "/*something*/" or "," a single , without spaces.
            let par: {name: string, defaultVal: string | undefined, typedesc: string | null} = {name: match[1], defaultVal: match[3], typedesc: match[4] && match[4].length > 1 ? match[4] : null};
            par.name = par.name.trim();
            par.defaultVal = par.defaultVal ? par.defaultVal.trim() : undefined;
            par.typedesc = par.typedesc && par.typedesc && par.typedesc.length > 1 ? par.typedesc.substring(2, par.typedesc.length - 2).trim() || null : null;
            ret.parameters.push(par); }
        // set signature

        ret.signature = '' + (ret.fname ? '/*' + ret.fname + '*/' : '') + '(';
        let i: number;
        for (i = 0; i < ret.parameters.length; i++) {
            let par = ret.parameters[i];
            ret.signature += (i === 0 ? '' : ', ') + par.name + (par.typedesc ? '/*' + par.typedesc + '*/' : '') + (par.defaultVal ? ' = ' + par.defaultVal : '');
        }
        ret.signature += ')' + (ret.returns ? '/*' + ret.returns + '*/' : '');
        return ret; }

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
        if (context) context = {...context};
        if (scope) scope = {...scope};
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

    // warn: aggiunge un layer di scope ma ha accesso anche agli scope precedenti (del chiamante della funzione e superiori)
    // warn2: può modificare lo scope internamente all'eval ma ogni cambiamento è perso all'uscita dell'esecuzione (modifica copie)
    // warn3: gli oggetti nested variabili dentro oggetti dello scope) sono modificabili con modifiche persistenti perchè vengono pasate per puntatore.
    // warn4: richiede un return per leggere il valore
    // insomma: sta funzione fa schifo ma non c'è di meglio e non puoi nè permettere nè vietare completamente le modifiche allo scope.
    private static execInScope_DO_NOT_USE(codeStr: string, scope: GObject) {
        return (new Function(...Object.keys(scope), codeStr))(...Object.values(scope));
    }

    // can modify context in-place, requires "this" before variable
    private static evalInContext(js: string, context: GObject): unknown {
        //# Return the results of the in-line anonymous function we .call with the passed context
        return function() { return eval(js); }.call(context);
    }/*
    / *
    // NO: ha 2 problemi: il contesto non è persistente e puoi accedere al contesto solo con "this" ma non direttamente usando i nomi delle variabili
    public static evalInContext(contextObj: GObject, code: string): any{
        return U.evalContextFunction.call(contextObj || {}, code);
    }

    // only create a context for "this", wich is bound by .call(), should never be called without .call()
    private static evalContextFunction(code: string): any { eval(code); }
*/
    public static highOrderFunctionExampleTyped<T extends (...args: any[]) => ReturnType<T>>(func: T): (...funcArgs: Parameters<T>) => ReturnType<T> {
        const funcName = func.name;

        // Return a new function that tracks how long the original took
        return (...args: Parameters<T>): ReturnType<T> => {
            console.time(funcName);
            const results = func(...args);
            console.timeEnd(funcName);
            return results; };
    }

    static asClass<T extends Function>(obj: any, classe: T, elseReturn: T | null = null): null | T { return obj instanceof classe ? obj as any as T: elseReturn; }
    static asString<T>(propKey: unknown, elseReturn: T | null = null): string | null | T { return typeof propKey === 'string' ? propKey : elseReturn; }
    static isString(propKey: unknown): boolean { return typeof propKey === 'string'; }


    static cloneObj<T extends object>(o: T): Json<T> {
        /*o = {...o};
        delete (o as any)._reactInternals; should be done recursively
        delete (o as any)._owner;
        console.log('o', {o});*/
        return JSON.parse(JSON.stringify(o)); }

    static loadScript(path: string, useEval: boolean = false): void {
        const script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        Log.eDev(useEval, 'loadScript', 'useEval','useEval todo. potrebbe essere utile per avviare codice fuori dalle funzioni in futuro.');
        document.body.append(script); }

    static ancestorFilter<T extends Element>(selector: string, domelem: T, stopNode?: Node, includeSelf: boolean = true): JQuery<T> {
        return $(U.ancestorArray(domelem, stopNode, includeSelf)).filter(selector); }

    static ancestorArray<T extends Element>(domelem: T, stopNode?: Node, includeSelf: boolean = true): Array<T> {
        // [0]=element, [1]=father, [2]=grandfather... [n]=document
        if (domelem === null || domelem === undefined) { return []; }
        const arr = includeSelf ? [domelem] : [];
        let tmp: T = domelem.parentNode as T;
        while (tmp !== null && tmp !== stopNode) {
            arr.push(tmp);
            tmp = tmp.parentNode as T; }
        return arr; }

    static newSvg<T extends SVGElement>(type: string): T {
        return document.createElementNS('http://www.w3.org/2000/svg', type) as T; }

    static toSvg<T>(html: string): T {
        Log.e(true, 'toSvg', 'maybe not working, test before use');
        const o: SVGElement = U.newSvg<SVGElement>('svg');
        o.innerHTML = html;
        return o.firstChild as unknown as T; }

    static toHtmlValidate(text: string): Element | undefined {
        const html: Element = U.toHtml(text);
        if (html.innerHTML === text.replace(/\s+/gi,  '')) return html;
        return undefined; }

    static toHtmlRow(html: string): HTMLTableRowElement {
        return U.toHtml<HTMLTableRowElement>(html, U.toHtml('<table><tbody /></table>').firstChild as HTMLElement); }

    static toHtmlCell(html: string): HTMLTableCellElement {
        return U.toHtml<HTMLTableCellElement>(html, U.toHtml('<table><tbody><tr /></tbody></table>').firstChild!.firstChild as HTMLElement); }

    static toHtml<T extends Element>(html: string, container?: Element, containerTag: string = 'div'): T {
        if (!container) { container = document.createElement(containerTag); }
        Log.e(!html || html === '', 'toHtml', 'require a non-empty string', html);
        container.innerHTML = html;
        const ret: T = container.firstChild as any;
        if (ret) container.removeChild(ret);
        return ret; }

    public static levenshtein(a: string, b: string): number {
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let cost = (a.charAt(a.length - 1) === b.charAt(b.length - 1)) ? 0 : 1;
        return Math.min(
            U.levenshtein(a.substring(0, a.length - 1), b) + 1,
            U.levenshtein(a, b.substring(0, b.length - 1)) + 1,
            U.levenshtein(a.substring(0, a.length - 1), b.substring(0, b.length - 1)) + cost,
        );
    }

    public static getClosestPropertyName(names: string[], name: string): string {
        let lowest = Infinity;
        return names.reduce(function(previous, current) {
            let distance = U.levenshtein(current, name);
            if (distance < lowest) {
                lowest = distance;
                return current;
            }
            return previous;
        }, '');
    }
    public static getClosestPropertyNames(names: string[], name: string): string[] {
        let distances: {distance: number, value: string}[] = names.map( value => { return {distance: U.levenshtein(value, name), value}; });
        return distances.sort( (a, b) => a.distance - b.distance).map( e => e.value);
    }

    public static autoCorrectProxy<T extends GObject>(target: T, recursive: boolean, logger: Console): ProxyHandler<T> {
        return new Proxy(target, {
            get: function(target, name) {
                let namestr = U.asString(name, null);
                if (!namestr) return undefined // todo: how do i use a symbol? object[symbol] is invalid
                if (name in target) return target[namestr];
                const suggestions: string[] = U.getClosestPropertyNames(Object.getOwnPropertyNames(target), namestr);
                logger.warn(`${namestr} is not defined, did you meant ${suggestions[0]}?\t\nother suggestions:`, suggestions);
                return namestr && target[suggestions[0]];
            },
        });
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

    static arrayUnique<T>(arr: T[]): Array<T> { return [ ...new Set<T>(arr)]; }

    static fileReadContent(file: File, callback: (content :string) => void): void {
        const textType = /text.*/;
        try { if (!file.type || file.type.match(textType)) {
            let reader = new FileReader();
            reader.onload = function(e) { callback( '' + reader.result ); };
            reader.readAsText(file);
            return;
        } } catch(e) { Log.e(true, "Exception while trying to read file as text. Error: |", e, "|", file); }
        Log.e(true, "Wrong file type found: |", file ? file.type : null, "|", file); }

    static fileRead(onChange: (e: Event, files: FileList | null, contents?: string[]) => void, extensions: string[] | FileReadTypeEnum[], readContent: boolean): void {
        // $(document).on('change', (e) => console.log(e));

        console.log("importEcore: pre file reader");
        myFileReader.show(onChange, extensions, readContent);
    }

    public static clear(htmlNode: Element): void {
        if (htmlNode) while (htmlNode.firstChild) { htmlNode.removeChild(htmlNode.firstChild); }
    }

    static clearAllTimeouts(): void {
        const highestTimeoutId: number = setTimeout(() => {}, 1) as any;
        for (let i = 0 ; i < highestTimeoutId ; i++) { clearTimeout(i); }
    }


    private static oneTimeMap: Dictionary<string, boolean> = {};
    // todo: un UU.genID() che generi unico a seconda del n° linea di codice da cui viene invocato, o sempre diverso se senza linea (console, eval)
    static getStackTrace(sliceCalls: number = 2): string[] {
        const ret: string | undefined = Error().stack;
        // try { var a = {}; a.debug(); } catch(ex) { ret = ex.stack; }
        // if (Array.isArray(ret)) return ret;
        if (!ret) return ['UnknownStackTrace'];
        const arr: string[] = ret.split('\n');
        // first 2 entries are "Erorr" and "getStackTrace()"
        return sliceCalls > 0 ? arr.slice( sliceCalls ) : arr; }
/*
    private static sequenceNumber: number = 0;
    private static idMap: Dictionary<string, any> = {};
    public static getID(): string { return this.genID(); }
    public static genID(): string { return 'timedkey_' + new Date().valueOf()+'_' + (this.sequenceNumber++); }
    public static setID(key: string, value: any): void {
        U.idMap[key] = value;
    }
    public static unsetID(key: string): void { delete U.idMap[key]; }
    public static isSetID(key: string): boolean { return U.idMap.hasOwnProperty(key); }
    public static getByID<T>(key: string): T { return U.idMap[key]; }*/

    // 0 for caller, 1 for caller of caller, -1 for current function, up to -4 to see internal layers (useless)
    public static getCaller(stacksToSkip: number = 0): string {
        const stack: string[] = this.getStackTrace(4);
        // erase getStackTrace() and isFirstTimeCalled() + Error() first stack + n° of layer the caller wants.
        return stack[stacksToSkip]; }

    private static gotcalledby: Dictionary<string, boolean> = {};

    // returns true only the first time this line is reached, false in loops >1 loop, false in recursion >1 recursion, false even days after the first execution unless the page is reloaded
    public static isFirstTimeCalledByThisLine(stacksToSkip: number = 0): boolean {
        const caller: string = this.getCaller(stacksToSkip);
        if (U.gotcalledby[caller]) return false;
        return U.gotcalledby[caller] = true; }

    public static lineKey(): string { return this.getCaller(0); }
    /* todo: spostala in Log.once(condition, ...args)
    public static oneTime(key: string | undefined = undefined, printFunction: (b: boolean, s: any, ...restArgs: any[]) => string, condition: boolean, s: any, ...restArgs: any[]): string {
        if (!key) key = U.getCaller(1);
        if (condition || U.oneTimeMap[key]) return null;
        U.oneTimeMap[key] = true;
        return printFunction(condition, s, ...restArgs); }*/

    // ritorna un array con tutti i figli, nipoti... discendenti di @parent
    public static iterateDescendents(parent: Element): HTMLCollectionOf<Element> { return parent.getElementsByTagName('*'); }


    // Prevent the backspace key from navigating back.
    static preventBackSlashHistoryNavigation(event: JQuery.KeyDownEvent): boolean {
        if (!event || !event.key || event.key.toLowerCase() !== 'backspace') { return true; }
        const types: string[] = ['text', 'password', 'file', 'search', 'email', 'number', 'date',
            'color', 'datetime', 'datetime-local', 'month', 'range', 'search', 'tel', 'time', 'url', 'week'];
        const srcElement: JQuery<any> = $((event as any)['srcElement'] || event.target);
        const disabled = srcElement.prop('readonly') || srcElement.prop('disabled');
        if (!disabled) {
            if (srcElement[0].isContentEditable || srcElement.is('textarea')) { return true; }
            if (srcElement.is('input')) {
                const type = srcElement.attr('type');
                if (!type || types.indexOf(type.toLowerCase()) > -1) { return true; }
            }
        }
        event.preventDefault();
        return false; }
    // todo: esercizio per antonella array deep copy
    /// copy all the element inside the array and sub-arrays, eventually deep cloning but not duplicating objects or leaf elements.
    static ArrayCopy<T>(arr: Array<T>, deep: boolean): Array<T> {
        const ret: Array<T> = [];
        let i: number;
        for (i = 0; i < arr.length; i++) {
            if (deep && Array.isArray(arr[i])) {
                const tmp: Array<T> = U.ArrayCopy<T>(arr[i] as unknown as Array<T>, deep);
                ret.push(tmp as unknown as T); } else { ret.push(arr[i]); }
        }
        return ret; }

    static SetMerge<T>(modifyFirst: boolean = true, ...iterables: Iterable<T>[]): Set<T> {
        const set: Set<T> = modifyFirst ? iterables[0] as Set<T>: new Set<T>();
        Log.e(!(set instanceof Set), 'U.SetMerge() used with modifyFirst = true requires the first argument to be a set');
        for (let iterable of iterables) { for (let item of iterable) { set.add(item); } }
        return set; }

    static MapMerge<K, V>(modifyFirst: boolean = true, ...maps: Map<K, V>[]): Map<K, V> {
        const ret: Map<K, V> = modifyFirst ? maps[0] : new Map<K, V>();
        let i: number;
        for (i = 0; i < maps.length; i++) { maps[i].forEach(function(value, key){ ret.set(key, value); }) }
        return ret; }

    // merge with unique elements
    static ArrayMergeU(arr1: any[], ...arr2: any[]): void { U.ArrayMerge0(true, arr1, arr2); }
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

    static fieldCount(obj: object): number {
        let counter: number = 1 - 1;
        for (const key in obj) { if (!(key in obj)) { continue; } counter++; }
        return counter; }

    static isPositiveZero(m: number): boolean {
        if (!!Object.is) { return Object.is(m, +0); }
        return (1 / m === Number.POSITIVE_INFINITY); }

    static isNegativeZero(m: number): boolean {
        if (!!Object.is) { return Object.is(m, -0); }
        return (1 / m === Number.NEGATIVE_INFINITY); }

    static TanToRadian(n: number): number { return U.DegreeToRad(U.TanToDegree(n)); }
    static TanToDegree(n: number): number {
        if (U.isPositiveZero(n)) { return 0; }
        if (n === Number.POSITIVE_INFINITY) { return 90; }
        if (U.isNegativeZero(n)) { return 180; }
        if (n === Number.POSITIVE_INFINITY) { return 270; }
        return U.RadToDegree(Math.atan(n)); }

    static RadToDegree(radians: number): number { return radians * (180 / Math.PI); }
    static DegreeToRad(degree: number): number { return degree * (Math.PI / 180); }

    private static maxID: number = 0;
    public static idPrefix: string = '';
    // static getID(): string { return U.idPrefix + U.maxID++; }
    static getID: Generator<number> = function* idgenerator(): Generator<number> { let i: number = 0; while(true) yield i++; }();



    static ReactNodeAsElement(e: React.ReactNode): React.ReactElement | null { return e && (e as ReactElement).type ? e as ReactElement : null; }

    static getType(param: any): string {
        switch (typeof param) {
            default: return typeof param;
            case 'object':
                return param?.constructor?.name || param?.className || "{_rawobject_}";
            case 'function': // and others
                return "geType for function todo: distinguish betweeen arrow and classic";
        }
    }

    static stringCompare(s1: string, s2: string): -1 | 0 | 1 { return (s1 < s2) ? -1 : (s1 > s2) ? 1 : 0; }

    static endsWith(str: string, suffix: string | string[]): boolean {
        if (Array.isArray(suffix)) {
            for (let suf of suffix) {
                if (U.endsWith(str, suf)) return true;
            }
            return false;
        }
        return str.length >= suffix.length && str.lastIndexOf(suffix) === str.length - suffix.length;
    }

    static arrayFilterNull<T>(arr: (T | null | undefined)[]): T[] {
        return arr.filter(U.notNullFilter) as T[];
    }

    static arrayMergeInPlace<T>(arr1: T[], ...otherArrs: T[][]): T[] {
        for (const arr of otherArrs) arr1.push.apply(arr1, arr || []);
        return arr1; }

    static getEndingNumber(s: string, ignoreNonNumbers: boolean = false, allowDecimal: boolean = false): number {
        let i = s.length;
        let numberEnd = -1;
        while (--i > 0) {
            if (!isNaN(+s[i])) { if (numberEnd === -1) { numberEnd = i; } continue; }
            if (s[i] === '.' && !allowDecimal) { break; }
            if (s[i] === '.') { allowDecimal = false; continue; }
            if (!ignoreNonNumbers) { break; }
            if (numberEnd !== -1) { ignoreNonNumbers = false; }
        }
        s = numberEnd === -1 ? '1' : s.substring(i, numberEnd);
        return +parseFloat(s); }

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

    static deepEqual_use_isDeepStrictEqual_bynode(subElements: any, val: any): boolean { return false; }


    public static shallowEqual(objA: GObject, objB: GObject): boolean {
        if (objA === objB) { return true; }

        if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') { return false; }

        var keysA = Object.keys(objA);
        var keysB = Object.keys(objB);

        // if (keysA.length !== keysB.length) { return false; }
        // Test for A's keys different from B.
        // var bHasOwnProperty = hasOwnProperty.bind(objB);
        for (let keya in objA) if (objA[keya] !== objB[keya]) return false;

        // for (var i = 0; i < keysA.length; i++) if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) { return false; }
        return true;
    }

     // returns true only if parameter is already a number by type. UU.isNumber('3') will return false
     static isNumber(o: any): boolean { return +o === o && !isNaN(o); }

    public static getAllPrototypes(constructor: Constructor, chainoutoutrecursive: GObject[] = [], currentRecursion = 0, maxRecursion = 20, cache: boolean = true): GObject[] {
        // console.log('getAllPrototypes:', {name: constructor.name, currentRecursion, constructor, chainoutoutrecursive});
        if (cache && (constructor as any).__allprototypes) return (constructor as any).__allprototypes;
        let prototype = (constructor.prototype?.name) && constructor.prototype;
        let __proto__ = (constructor.__proto__?.name) && constructor.__proto__;
        if (!prototype && !__proto__ || currentRecursion >= maxRecursion) return chainoutoutrecursive;
        if (prototype) chainoutoutrecursive.push(prototype);
        if (__proto__) chainoutoutrecursive.push(__proto__);
        if (prototype) U.getAllPrototypes(prototype, chainoutoutrecursive, currentRecursion + 1, maxRecursion);
        if (__proto__) U.getAllPrototypes(__proto__, chainoutoutrecursive, currentRecursion + 1, maxRecursion);
        if (cache) (constructor as any).__allprototypes = chainoutoutrecursive;
        return chainoutoutrecursive;
    }

    public static classIsExtending(subconstructor: Constructor | AbstractConstructor, superconstructor: Constructor | AbstractConstructor): boolean {
        return (superconstructor as typeof DPointerTargetable)?._extends?.includes(subconstructor as any) || false;
        // return U.getAllPrototypes(subconstructor).includes(superconstructor);
    }

    static isObject(v: GObject|any, returnIfNull: boolean = true, returnIfUndefined: boolean = false, retIfArray: boolean = false): boolean {
        if (v === null) { return returnIfNull; }
        if (v === undefined) { return returnIfUndefined; }
        if (Array.isArray(v)) { return retIfArray; }
        // nb: mind that typeof [] === 'object'
        return typeof v === 'object'; }

    static objectFromArrayValues(arr: (string | number)[]): Dictionary<string | number, boolean> {
        let ret: Dictionary = {};
        // todo: improve efficiency
        for (let val of arr) { ret[val] = true; }
        return ret;
    }

    static toBoolString(bool: boolean, ifNotBoolean: boolean = false): string { return bool === true ? 'true' : (bool === false ? 'false' : '' + ifNotBoolean); }
    static fromBoolString<T extends any>(str: string | boolean): boolean;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal?: T): boolean | T;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal?: T, allowNull?: boolean): boolean | null | T;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal: T = false as any, allowNull: boolean = false, allowUndefined: boolean = false): boolean | null | undefined | T {
        str = ('' + str).toLowerCase();
        if (allowNull && (str === 'null')) return null;
        if (allowUndefined && (str === 'undefined')) return undefined;

        if (str === "true" || str === 't' || str === '1') return true;
        // if (defaultVal === true) return str === "false" || str === 'f' || str === '0'; // false solo se è esplicitamente false, true se ambiguo.
        if (str === "false" || str === 'f' || str === '0') return false;
        return defaultVal;
    }

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

    // returns <"what changed from old to neww"> and in nested objects recursively
    // todo: how can i tell at what point it's the fina lvalue (might be a nestedobj) and up to when it's a delta to follow and unroll?   using __isAdelta:true ?
    // NB: this returns the delta that generates the future. if you want the delta that generate the past one, invert parameter order.
    public static objectDelta<T extends object>(old: T, neww: T, deep: boolean = true): Partial<T>{
        let newwobj: GObject = neww;
        let oldobj: GObject = old;
        if (old === neww) return {};
        let diff = U.objdiff(old, neww); // todo: optimize this, remove the 3 loops below and add those directly in U.objdiff(old, neww, ret); writing inside the obj in third parameter

        let ret: GObject = {}; // {__isAdelta:true};
        for (let key in diff.added) { ret[key] = newwobj[key]; }
        for (let key in diff.changed) {
            let subold = oldobj[key];
            let subnew = newwobj[key];
            if (typeof subold === typeof subnew && typeof subold === "object") { ret[key] = deep ? U.objectDelta(subold, subnew, true) : subnew; }
            else ret[key] = subnew;
        }
        // todo: add to variable naming rules: can't start with "_-", like in "_-keyname", it means "keyname" removed in undo delta
        let removedprefix = ""; // "_-";
        for (let key in diff.removed) { ret[removedprefix + key] = undefined; } //newwobj[key]; }
        console.log("objdiff", {old, neww, diff, ret});
        return ret as Partial<T>;
    }

    // difference react-style. lazy check by === equality field by field
    public static objdiff<T extends GObject>(old:T, neww: T): {removed: Partial<T>, added: Partial<T>, changed: Partial<T>} {
        // let ret: GObject = {removed:{}, added:{}, changed:{}};
        let ret: {removed: Partial<T>, added: Partial<T>, changed: Partial<T>}  = {removed:{}, added:{}, changed:{}};
        if (!neww && !old) { return ret; }
        if (!neww) { ret.removed = old; return ret; }
        if (!old) { ret.added = neww; return ret; }
        let oldkeys: string[] = Object.keys(old);
        let newkeys: string[] = Object.keys(neww);

        let key: any;
        for (key in old) {
            // if (neww[key] === undefined){
            if (!(key in neww)){ // if neww have a key with undefined value, it counts (and should) as having that property key defined
                (ret.removed as GObject)[key] = old[key]; continue;
                // if (old[key] === undefined) { continue; }
                // continue;
            }
            if (neww[key] === old[key]) continue;
            (ret.changed as GObject)[key] = old[key];
        }
        for (let key in neww) {
            if (!(key in old)){ (ret.added as GObject)[key] = neww[key]; }
        }
        return ret;
    }

    /*
    private static findMostNestedSubObject_toomuch<T = {depth: number, path: string, subobj: GObject}>(root:GObject):
        {root: GObject, most: T, [depth: number]:T} {
        let ret: {root: GObject, most:T} = {root, most: {} as T};
        ret.root = root;
        ret.path = [];
        for (let key in root) {

        }
        return ret;} */

    public static findMostNestedSubObject_incomplete<T extends {depth: number, path: string[], subobj: GObject[]}>(root:GObject):
        {root: GObject, most: T, [depth: number]:T} {
        let ret: {root: GObject, most:T} = {root, most: {} as T};
        let sharedret: T = {depth: 0, path: [''], subobj:[root]} as T;
        ret.root = root;
        ret.most = sharedret;
            for (let key in root) {
                if (typeof root[key] === "object") U.findMostNestedSubObject_recursive_incomplete(root[key], key, 1, sharedret)
        }
        return ret;
    }
    private static findMostNestedSubObject_recursive_incomplete(obj: GObject, thispath: string, thisdepth: number, bestsharedret: {depth: number, path: string[], subobj: GObject[]} ): void {
        let isleaf = false; // todo
        for (let key in obj) {

        }
        if (isleaf) {
            if (thisdepth < bestsharedret.depth) return;
            if (thisdepth > bestsharedret.depth) { // gets overwritten N*dup(N) times if max depth is N, because this is updated once for every depth (except for duplicates. dup(N) = how many subpaths have that depth
                bestsharedret.depth = thisdepth;
                bestsharedret.path = [thispath];
                bestsharedret.subobj = [obj];
            }
            else { // equally depth as someone else
                bestsharedret.path.push(thispath);
                bestsharedret.subobj.push(obj);
            }
        }
        return;
    }
    /*  {a: { b: { c1: 1, c2:2, c3:3 } }, d: 1 }     ---->  {"a.b.c1":1, "a.b.c2":2, "a.b.c3":3. "d":1}*/
    public static flattenObjectToRoot(obj: GObject, prefix: string = '', pathseparator: string = '.'): GObject{
        return Object.keys(obj).reduce((acc: GObject, k: string) => {
            const pre = prefix.length ? prefix + pathseparator : '';
            if (typeof obj[k] === 'object') Object.assign(acc, U.flattenObjectToRoot(obj[k], pre + k, pathseparator));
            else acc[pre + k] = obj[k];
            return acc;
        }, {});
    }

    // from {a:{aa:true, ab:"ab"}, b:4} to ["a.aa = true", "a.ab = \"ab\"", "a.b = 4"]
    // maxkeylength is max length of any individual key, after it it will become: superlongpath --> supe...path
    // maxsubpaths is how many subpaths are displayed at most. after it it will be: super.rea.lly.long.pa.th --> super.rea.pa.th
    public static ObjectToAssignementStrings<R extends {str: string, fullstr: string, path:string[], fullpath:string[], val: string, fullvalue: string, pathlength?: number}>
    (obj: GObject, maxkeylength: number = 10, maxsubpaths: number = 6, maxvallength: number = 20, toolongreplacer: string = "…", out?:{best: R}&R[], quotestrings: boolean = true): {best: string}&string[] {
        const pathseparator = ".";
        const valueseparator = " = ";
        const filterrow = (rowpaths: string[]) => { return (!rowpaths.includes("clonedCounter") && !rowpaths.includes("pointedBy")); };
        let flatten = U.flattenObjectToRoot(obj, '', pathseparator);
        let i = -1;
        let tmp;
        let ret: {best: string} & string[] = [] as GObject as {best: string} & string[];
        tmp = (maxkeylength - toolongreplacer.length)/2;
        let halfpath = { start: Math.floor(tmp), end: Math.ceil(tmp) };
        tmp = (maxvallength - toolongreplacer.length)/2;
        let halfval = { start: Math.floor(tmp), end: Math.ceil(tmp) };
        tmp = (maxsubpaths - toolongreplacer.length)/2;
        let halfsubpaths = { start: Math.floor(tmp), end: Math.ceil(tmp) };


        let bestpathsize = 0;
        let best: R | null = null;
        let countsize = (total: number, arrelem: string): number => total + arrelem.length;
        const filterbest = (row: R) => {
            row.pathlength = row.fullstr.length; // row.fullpath.reduce<number>(countsize, 0);
            if (!best || bestpathsize < row.pathlength && filterrow(row.fullpath)) {
                best = row; bestpathsize = row.pathlength;
                if (out) out.best = best;
                ret.best = best.str;
            }
        }
        console.log("u get assignements", {flatten, obj});

        for (let key in flatten) {
            let row: R = {fullpath: key.split(pathseparator), fullstr: key} as R;
            // if (!filterrow(row.fullpath)) continue;
            // stringify(undefined) = undefined, so i add + ""
            try {
                if (!quotestrings && typeof flatten[key] === "string") row.fullvalue = flatten[key];
                else row.fullvalue = JSON.stringify(flatten[key]) + "";
            } catch(e) { row.fullvalue = "⁜not serializable⁜"; }
            console.log("U get assignements loop", {row, key, flatten, obj});
            row.val = row.fullvalue.length <= maxvallength ? row.fullvalue : row.fullvalue.substring(0, halfval.start) + toolongreplacer + row.fullvalue.substring(halfval.start);
            if (row.fullpath.length > maxsubpaths) {
                row.path = [...row.fullpath];
                row.path.splice( halfsubpaths.start, row.fullpath.length - halfsubpaths.start - halfsubpaths.end, toolongreplacer);
            } else row.path = row.fullpath;

            // row.path = row.fullpath.length <= maxsubpaths ? row.fullpath : [...row.fullpath.slice(0, halfsubpaths.start), ...row.fullpath.toomanyarraycopies];
            row.path = row.path.map((p: string) => (p.length <= maxkeylength ? p : p.substring(0, halfpath.start) + toolongreplacer + p.substring(p.length - halfpath.end)));
            if (out) { out.push(row); }
            row.str = row.path.join(pathseparator) + valueseparator + row.val;
            ret.push( row.str );
            filterbest(row);
        }
        return ret;
    }


    static download(filename: string = 'nameless.txt', text: string = '', debug: boolean = true): void {
        if (!text) { return; }
        filename = U.toFileName(filename);
        const htmla: HTMLAnchorElement = document.createElement('a');
        const blob: Blob = new Blob([text], {type: 'text/plain', endings: 'native'});
        const blobUrl: string = URL.createObjectURL(blob);
        Log.l(debug, text + '|\r\n| <-- rn, |\n| <--n.');
        htmla.style.display = 'none';
        htmla.href = blobUrl;
        htmla.download = filename;
        document.body.appendChild(htmla);
        htmla.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(htmla); }

    static formatXml(xml: string): string {
        const reg = /(>)\s*(<)(\/*)/g;
        const wsexp = / *(.*) +\n/g;
        const contexp = /(<.+>)(.+\n)/g;
        xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
        const pad: string = '' || '\t';
        let formatted = '';
        const lines = xml.split('\n');
        let indent = 0;
        let lastType = 'other';
        // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
        const transitions: GObject = {
            'single->single': 0,
            'single->closing': -1,
            'single->opening': 0,
            'single->other': 0,
            'closing->single': 0,
            'closing->closing': -1,
            'closing->opening': 0,
            'closing->other': 0,
            'opening->single': 1,
            'opening->closing': 0,
            'opening->opening': 1,
            'opening->other': 1,
            'other->single': 0,
            'other->closing': -1,
            'other->opening': 0,
            'other->other': 0
        };
        let i = 0;
        for (i = 0; i < lines.length; i++) {
            const ln = lines[i];

            // Luca Viggiani 2017-07-03: handle optional <?xml ... ?> declaration
            if (ln.match(/\s*<\?xml/)) {
                formatted += ln + '\n';
                continue;
            }
            // ---

            const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
            const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
            const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
            const type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
            const fromTo = lastType + '->' + type;
            lastType = type;
            let padding = '';

            indent += transitions[fromTo];
            let j: number;
            for (j = 0; j < indent; j++) {
                padding += pad;
            }
            if (fromTo === 'opening->closing') {
                formatted = formatted.substr(0, formatted.length - 1) + ln + '\n'; // substr removes line break (\n) from prev loop
            } else {
                formatted += padding + ln + '\n';
            }
        }

        return formatted.trim(); }


    // https://stackoverflow.com/questions/13861254/json-stringify-deep-objects  implementation with depth
    static circularStringify(obj: GObject, replacer?: null | ((key: string, value: any) => any), space?: string | number, maxDepth_unsupported: number = 100): string {
        const cache: any[] = [];
        return JSON.stringify(obj, (key, value: any) => {
            if (typeof value === 'object' && value !== null) {
                // Duplicate reference found, discard key
                if (cache.includes(value)) return "[Circular Reference]"; // might happen both before and after the replacer func
                if (replacer){
                    value = replacer(key, value);
                    if (cache.includes(value)) return "[Circular Reference]"; // might happen both before and after the replacer func
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        }, space);
    }

    static getFirstNumber(s: string, allowDecimalDot: boolean = true, allowDecimalComma: boolean = true, valueifmismatch: any = null): number {
        let commamode = (allowDecimalComma ? (allowDecimalDot ?"(\\.|\\,)" : "\\,") : (allowDecimalDot ? "\\." : "will not use this regex"));
        let floatregex = new RegExp("-?" + commamode  + "?\\d+(" + commamode + "\\d{1,2})?");
        let intregex = /-?\d+/;
        let ret: any;
        if (allowDecimalDot || allowDecimalComma) ret = floatregex.exec(s);
        else ret = intregex.exec(s);
        console.log({ret, floatregex, intregex, s});
        ret = ret && ret[0]; // first match
        if (ret === null) return valueifmismatch;

        let tmpindex:number;
        if (allowDecimalComma) ret = U.replaceAll(ret, ",", ".");
        // while (allowDecimalComma && (tmpindex = ret.indexOf(",")) !== ret.lastIndexOf(",")) ret.substring(tmp+1) // ret.indexOf(.)
        while ((allowDecimalDot || allowDecimalComma) && (tmpindex = ret.indexOf(".")) !== ret.lastIndexOf(".")) ret = ret.substring(tmpindex+1) // ret.indexOf(.)
        // if (ret[0]==="-" && (ret[1]==="," || ret[1]===".")) ret = "-0."+ret.substring(2); automatically done bu js.    +"-.5" = -0.5
        return +ret;
    }
    static countChars(s: string, substr_or_char: string): number {return s.split(substr_or_char).length - 1; }
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

// export class Dictionary<K = string, V = string> extends Object {}
export type GenericObject = GObject;

export class RawVertex{
    public edgesOut: RawEdge[] = [];
    public edgesIn: RawEdge[] = [];
    constructor(public id: string, public data: any = null){}
}
export class RawEdge{
    constructor(public id: string, public source: RawVertex, public target: RawVertex, public data: any = null){
        if (this.source) this.source.edgesOut.push(this);
        if (this.target) this.target.edgesIn.push(this);
    }
}


export class RawGraph{
    private matrix: Dictionary<string, Dictionary<string, number>> = {};
    private idMapping: Dictionary<string, RawEdge | RawVertex> = {};
    constructor(public vertex: RawVertex[], public edges: RawEdge[]){
        for (let v of this.vertex) { this.idMapping[v.id] = v; }
        for (let e of this.edges) { this.idMapping[e.id] = e; }
    }

    isDag(canDestryData: boolean = false): boolean {
        let out = {elementsInLoop: []};
        this.getDagOrder(canDestryData, out);
        return !!out.elementsInLoop.length; }

    clone(): RawGraph {
        const vertex = [];
        const edges = [];
        const copiesMapID: Dictionary<string, RawEdge | RawVertex> = {};
        for (let v of this.vertex) { v = new RawVertex(v.id, v.data); vertex.push(v); copiesMapID[v.id] = v; }
        for (let e of this.edges) {
            let source = e.source && copiesMapID[e.source.id] as RawVertex;
            let target = e.target && copiesMapID[e.target.id] as RawVertex;
            e = new RawEdge(e.id, source, target);
            edges.push(e);
        }
        return new RawGraph(vertex, edges);
    }

    public getDagOrder(canDestroyData: boolean = false, out: {elementsInLoop: RawVertex[]} = {} as any): RawVertex[][] {
        if (!canDestroyData) {
            const ret: RawVertex[][] = this.clone().getDagOrder(true, out).map(varr => varr.map( (v) => this.idMapping[v.id] as RawVertex));
            out.elementsInLoop = out.elementsInLoop.map( lv => this.idMapping[lv.id] as RawVertex);
            return ret;
        }
        out.elementsInLoop = [...this.vertex];
        let visitedThisIteration: RawVertex[];
        const ret: RawVertex[][] = [];
        while (true) {
            visitedThisIteration = [];
            ret.push(visitedThisIteration);
            for (let i = 0; i < out.elementsInLoop.length; i++) {
                let v: RawVertex = out.elementsInLoop[i];
                if (!v || v.edgesOut) continue;
                visitedThisIteration.push(v);
                out.elementsInLoop[i] = null as Temporary;
                for (let enteringedges of v.edgesIn) { U.arrayRemoveAll(enteringedges.source.edgesOut, enteringedges); }
            }
            out.elementsInLoop = out.elementsInLoop.filter(v => !!v);
            if (!visitedThisIteration.length) break;
            break;
        }
        return ret.reverse();
    }
    getMatrix(): Dictionary<string, Dictionary<string, number>>{
        return this.matrix || this.buildMatrix();
    }
    buildMatrix(): Dictionary<string, Dictionary<string, number>>{
        const matrix: Dictionary<string, Dictionary<string, number>> = {};
        for (let v1 of this.vertex) {
            matrix[v1.id] = {};
            for (let v2 of this.vertex) {
                matrix[v1.id][v2.id] = Uarr.arrayIntersection(v1.edgesOut, v2.edgesIn).length;
            }
        }
        return this.matrix = matrix;
    }

    static fromMatrix(matrix: Dictionary<string, Dictionary<string, number>>): RawGraph {
        const vertex: RawVertex[] = [];
        const edges: RawEdge[] = [];
        const vertexIDMapping: Dictionary<string, RawVertex> = {};
        let idMax: number = 0;
        for (let key in matrix) {
            const v: RawVertex = new RawVertex(key, null);
            vertex.push(v);
            vertexIDMapping[key] = v;
        }

        const getEdgeID = () => { while (matrix['' + idMax]) idMax++; return '' + idMax; }
        for (let v1key in matrix) {
            for (let v2key in matrix) {
                let count: number = matrix[v1key][v2key];
                while (count-- > 0) {
                    const e = new RawEdge(getEdgeID(), vertexIDMapping[v1key], vertexIDMapping[v2key]);
                    edges.push(e);
                }
            }
        }
        return new RawGraph(vertex, edges);
    }
}

export class myFileReader {
    private static input: HTMLInputElement = null as any;
    private static fileTypes: string[] = null as any;
    private static onchange: (e: Event) => void = null as any;
    // constructor(onchange: (e: ChangeEvent) => void = null, fileTypes: FileReadTypeEnum[] | string[] = null) { myFileReader.setinfos(fileTypes, onchange); }
    private static setinfos(fileTypes: undefined | FileReadTypeEnum[] | string[], onchange: (e: Event, files: FileList | null, contents: string[] | undefined ) => void, readcontent: boolean) {
        myFileReader.fileTypes = (fileTypes || myFileReader.fileTypes) as string[];
        const debug: boolean = false;
        debug&&console.log('fileTypes:', myFileReader.fileTypes, fileTypes);
        myFileReader.input = document.createElement('input');
        const input: HTMLInputElement = myFileReader.input;
        myFileReader.onchange = function (e: Event): void {
            if (!readcontent) { onchange(e, input.files, undefined); return; }
            let contentObj: Dictionary<number, string> = {};
            let fileLetti: number = 0;
            for (let i: number = 0; input.files && i <input.files.length; i++) {
                const f: File = input.files[i];
                debug&&console.log('filereadContent['+i+']( file:', f, ')');
                U.fileReadContent(f, (content: string) => {
                    debug&&console.log('file['+i+'] read complete. done: ' + ( 1 + fileLetti) + ' / ' + input.files?.length, 'contentObj:', contentObj);
                    contentObj[i] = content; // cannot use array, i'm not sure the callbacks will be called in order. using push is safer but could alter order.
                    // this is last file to read.
                    if (input.files && ++fileLetti === input.files.length) {
                        const contentArr: string[] = [];
                        for (let j: number = 0; j < input.files.length; j++) { contentArr.push(contentObj[j]); }
                        onchange(e, input.files, contentArr);
                    }
                });
            }
        } || myFileReader.onchange;
    }
    private static reset(): void {
        myFileReader.fileTypes = undefined as any;
        myFileReader.onchange = undefined as any;
        myFileReader.input = undefined as any;
    }
    public static show(onChange: (e: Event, files: FileList | null, contents?: string[]) => void, extensions: undefined | string[] | FileReadTypeEnum[] = undefined, readContent: boolean): void {
        console.log("importEcore: pre file reader", myFileReader.input);
        myFileReader.setinfos(extensions, onChange, readContent);
        //if (!myFileReader.input) return;
        myFileReader.input.setAttribute('type', 'file');
        if (myFileReader.fileTypes) {
            myFileReader.input.setAttribute('accept', myFileReader.fileTypes.join(','));
        }
        //console.log('fileTypes:', myFileReader.fileTypes, 'input:', myFileReader.input);
        $(myFileReader.input).on('change.custom' as any, myFileReader.onchange).trigger('click');
        myFileReader.reset();
    }

}

export class Uarr{
    public static arrayIntersection<T>(arr1: T[], arr2: T[]): T[]{
        if (!arr1 || ! arr2) return null as any;
        return arr1.filter( e => arr2.indexOf(e) >= 0);
    }

     static arraySubtract(arr1: any[], arr2: any[], inPlace: boolean): any[]{
         let i: number;
         const ret: any[] = inPlace ? arr1 : [...arr1];
         for (i = 0; i < arr2.length; i++) { U.arrayRemoveAll(ret, arr2[i]); }
         return ret; }

}

export class FocusHistoryEntry {
    time: Date;
    evt: JQuery.FocusInEvent;
    element: Element;
    constructor(e: JQuery.FocusInEvent, element?: Element, time?: Date) {
        this.evt = e;
        this.element = element || e.target;
        this.time = time || new Date();
    }
}
/*
export class InputPopup {
    static popupCounter = 0;
    html: HTMLElement;
    buttonContainer: HTMLElement;
    title?: HTMLElement;
    txtPre?: HTMLElement;
    input?: HTMLElement;
    txtPost?: HTMLElement;
    okButton?: HTMLButtonElement;
    xbutton: HTMLButtonElement;
    container: HTMLElement;
    innercontainer?: HTMLElement;

    $html: JQuery<HTMLElement>;
    $title?: JQuery<HTMLElement>;
    $txtPre?: JQuery<HTMLElement>;
    $input?: JQuery<HTMLElement>;
    $txtPost?: JQuery<HTMLElement>;
    $okButton?: JQuery<HTMLButtonElement>;
    $xbutton: JQuery<HTMLButtonElement>;
    $container: JQuery<HTMLElement>;
    validators: {validatorCallback: (value: string, input: HTMLElement) => boolean, errormsg: string}[] = [];


    constructor(title?: HTMLElement | string, txtPre?: HTMLElement | string, inputOrTag?: HTMLElement | string, txtPost?: HTMLElement | string){
        const id = 'popup_' + InputPopup.popupCounter++;
        this.container = U.toHtml('<div data-closebuttontarget="' + id + '" class="screenWideShadow" style="display: none;"></div>');
        this.xbutton = document.createElement('button');
        this.xbutton.classList.add('closeButton');
        this.xbutton.dataset.closebuttontarget = id;
        this.xbutton.innerText = 'X';
        this.html = document.createElement('div');
        this.html.classList.add('popupContent');
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.style.width = '100%';
        this.buttonContainer.style.display = 'flex';
        this.buttonContainer.style.marginTop = '10px';
        this.$container = $(this.container);
        this.$xbutton = $(this.xbutton);
        this.$html = $(this.html);
        this.container.append(this.html);
        this.html.append(this.xbutton);
        U.closeButtonSetup($(this.container));

        if (title || txtPre || txtPost) this.setText(title, txtPre, txtPost);
        this.setInputNode(inputOrTag); }

    addButtons(textornode: string|HTMLButtonElement, onclick: ((e:ClickEvent, value: string, input: HTMLElement, btn: HTMLButtonElement) => any)[], classes: string[] = ['btn-primary']): HTMLButtonElement {
        let btn: HTMLButtonElement;
        if (textornode instanceof HTMLButtonElement) { btn = textornode; }
        else {
            btn = document.createElement('button');
            btn.style.margin = 'auto';
            btn.textContent = textornode;
            btn.classList.add('btn', ...classes); }
        let i: number;
        for (i = 0; i < onclick.length; i++) {
            let clickhandler = onclick[i];
            $(btn).on('click', (e: ClickEvent) => { clickhandler(e, U.getValue(this.input), this.input, btn); });
        }
        this.buttonContainer.append(btn);
        return btn; }

    addOkButton(text: string = 'Confirm', onclick: ((e:ClickEvent, value: string, input: HTMLElement, btn: HTMLButtonElement) => any)[]) {
        onclick = onclick || [];
        text = text || 'Confirm';
        onclick.push((e:ClickEvent, value: string, input: HTMLElement, btn: HTMLButtonElement) => { this.destroy(); });
        U.remove(this.okButton);
        this.okButton = this.addButtons(text, onclick, ['btn-primary']);
        this.$okButton = $(this.okButton); }

    onCloseButton(onclick: ((e:ClickEvent, value: string, input: HTMLElement, btn: HTMLButtonElement) => any)[]) {
        let i: number;
        for (i = 0; i < onclick.length; i++) {
            let func = onclick[i];
            this.$xbutton.on('click.customhandler', (e: ClickEvent) => { func(e, U.getValue(this.input), this.input, this.xbutton); });
        }
    }

    setText(title: string|HTMLElement = '', pre: string | HTMLElement = '', post: string | HTMLElement = ''): void {
        U.remove(this.title);
        U.remove(this.txtPre);
        U.remove(this.txtPost);

        if (typeof title === 'string') {
            this.title = document.createElement('h1');
            this.title.style.textAlign = 'center';
            this.title.innerText = title; }
        else this.title = title;

        if (typeof pre === 'string') {
            this.txtPre = document.createElement('div');
            this.txtPre.innerText = pre; }
        else this.txtPre = pre;

        if (typeof post === 'string') {
            this.txtPost = document.createElement('div');
            this.txtPost.innerText = post; }
        else this.txtPost = post;

        this.$title = $(this.title);
        this.$txtPre = $(this.txtPre);
        this.$txtPost = $(this.txtPost); }

    setNestedInputNode(container: HTMLElement = null, node: HTMLElement, addDefaultEvents: boolean = true): void {
        this.innercontainer = container;
        this.setInputNode(node, null, null, addDefaultEvents); }

    setInputNode(nodeOrTag: HTMLElement | string = null, inputSubType: string = null, pattern: string = null, addDefaultEvents: boolean = true): void {
        if (!this.innercontainer) U.remove(this.input);
        if (nodeOrTag === null) return;
        if (typeof nodeOrTag === 'string') {
            this.input = document.createElement(nodeOrTag);
            //console.log('tadebug', nodeOrTag === 'textarea', nodeOrTag);
            if (nodeOrTag === 'textarea') {
                // this.input.classList.add('form-control'); looks better without, mainly for font-size and overflowing outline
                // this.input.style.fontSize = 'inherit';
                this.input.style.width  = 'calc(75vw - 152px)';
                this.input.style.height = 'calc(75vh - 200px)'; }
            if (nodeOrTag === 'input') {
                this.input.classList.add('form-control', 'form-control-lg');
                this.input.style.width = '100%';
                this.input.style.textAlign = 'center';
                this.input.style.margin = '50px 0'; }
            else {
                this.input.style.width  = 'calc(75vw - 152px)';
                this.input.style.height = 'calc(75vh - 200px)';
                this.input.style.border = '1px solid #ced4da';
                this.input.style.borderRadius = '.25rem;';
                this.input.style.padding = '1rem'; }
        }
        else this.input = nodeOrTag;
        if (inputSubType) { this.input.setAttribute('type', inputSubType); }
        if (pattern) { this.input.setAttribute('pattern', pattern); }
        this.$input = $(this.input);

        if (addDefaultEvents) {
            this.validators.push({validatorCallback: (value: string, input: HTMLElement): boolean => {
                    const pattern: string = input.getAttribute('pattern');
                    if (!pattern) return true;
                    const regex = new RegExp(pattern);
                    //console.log('validating pattern:', regex, pattern, value);
                    return regex.test(value);
                }, errormsg: 'pattern violated.'});
            this.$input.off('keydown.defaultvalidate').on('keydown.defaultvalidate', (e: KeyDownEvent) => { this.defaultKeydownEvt(e); });
            // $input.off('change.defaultvalidate').on('change.defaultvalidate', (e: BlurEvent) => {this.defaultChangeEvt(e)});
        }
    }

    setInput(value: string = null, placeholder: string = null): void {
        U.pe(!this.input, 'cannot set inputPopup values without setting an input field first.');
        U.setInputValue(this.input, value);
        this.input.setAttribute('placeholder', placeholder || ''); }
    /*
  oldconstructor(title: string, txtpre: string, txtpost: string, event: any[][] /* array of (['oninput', onInputFunction])* /,
              placeholder: string = null, value: string, inputType: string = 'input',
                 inputSubType: string = null, onsuccess: ((value: string, input: HTMLElement) => any)[]) {
    const value0 = value;
    if (!value) { value = ''; }
    this.onsuccess = onsuccess ? onsuccess : [];
    const id = 'popup_' + InputPopup.popupCounter++;
    placeholder = (placeholder ? 'placeholder="' + placeholder + '"' : '');
    inputSubType = (inputSubType ? 'type = "' + inputSubType + '"' : '');
    let innerValue: string;
    if (inputType.toLowerCase() === 'textarea') {
      innerValue = U.replaceAll(U.replaceAll(value, '<', '&lt;'), '>', '&gt;');
      innerValue += '</' + inputType + '>';
      value = '';
    } else { value = value === '' ? '' : 'value="' + U.replaceAll(value, '"', '&quot;') + '"'; innerValue = ''; }
    const container: HTMLElement = U.toHtml('' +
      '<div _ngcontent-c3="" data-closebuttontarget="' + id + '" class="screenWideShadow" style="display: none;">' +
      '<div _ngcontent-c3="" class="popupContent">' +
      '<h1 _ngcontent-c3="" style="text-align: center;">' + title + '</h1>' +
      '<button _ngcontent-c3="" class="closeButton" data-closebuttontarget="' + id + '">X</button>' +
      '<br _ngcontent-c3="">' +
      '<div _ngcontent-c3="" class="TypeList">' +
      '<table class="typeTable"><tbody>' +
      '<tr class="typeRow"><td class="alias textPre">' + txtpre + '</td>' +
      '<' + inputType + ' ' + inputSubType + ' ' + placeholder + ' ' + value + ' class="form-control popupInput" ' +
      'aria-label="Small" aria-describedby="inputGroup-sizing-sm">' + innerValue + txtpost +
      '</td>' +
      '</tr>' +
      '<tr><td class="errors" style="display: none;"></td></tr>' +
      '</tbody></table></div>' +
      '</div></div>');
    U.closeButtonSetup($(container));
    this.events = event;
    this.html = container;

    if (inputType === 'textarea') {
      this.getInputNode()[0].setAttribute('style', 'width: calc(75vw - 152px); height: calc(75vh - 200px);');
    }
    this.show();
  }* /
    // events: any[][];
    // onsuccess: ((value: string, input: HTMLElement) => any)[];
    // valid = false;
    // getInputNode(): JQuery<HTMLElement> { return $(this.html).find('.popupInput'); }

    // defaultBlurEvt(e: JQuery.BlurEvent){ this.inputted(); }

    private defaultKeydownEvt(e: KeyDownEvent): void { this.inputted(); }

    private inputted(): void {
        const input: HTMLElement = this.input;
        const value: string = U.getValue(input);
        let i: number;
        let valid: boolean = true;
        for (i = 0; this.validators && i < this.validators.length; i++) {
            const valentry = this.validators[i];
            if (!valentry) continue;
            //console.log('this:', this, 'input:', input, 'value:', value);
            if (!valentry.validatorCallback(value, input)) { this.setErrText(valentry.errormsg); valid = false; }
        }
        this.okButton.disabled = !valid; }

    show(): void {
        document.body.appendChild(this.container);
        this.container.style.display = 'none';
        if (this.title) this.html.appendChild(this.title);
        if (this.xbutton) this.html.appendChild(this.xbutton);
        if (this.innercontainer) this.html.appendChild(this.innercontainer);
        else if (this.input) this.html.appendChild(this.input);
        if (this.txtPre) this.html.appendChild(this.txtPre);
        if (this.txtPost) this.html.appendChild(this.txtPost);
        this.html.appendChild(this.buttonContainer);
        this.$container.slideDown(400);
        if (this.input) this.input.focus(); }

    hide(): void {
        this.container.style.display = 'block';
        this.$container.slideUp(400); }

    destroy(): null {
        this.container.style.display = 'block';
        $(this.container).slideUp(400, () => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
                this.container = null; }} );
        return null; }

    setErrText(str: string) {
        this.setText(null, null, str);
    }

    setValidation(validatorCallback: (value: string, input: HTMLElement) => boolean, errormsg: string): void {
        if (validatorCallback) this.validators.push({validatorCallback: validatorCallback, errormsg: errormsg}); }

}
*/

export enum ShortAttribETypes {
    void = 'void',
    EChar  = 'EChar',
    EString  = 'EString',
    EDate  = 'EDate',
    EBoolean = 'EBoolean',
    EByte  = 'EByte',
    EShort  = 'EShort',
    EInt  = 'EInt',
    ELong  = 'ELong',
    EFloat  = 'EFloat',
    EDouble  = 'EDouble',
    /*
  ECharObj  = 'ECharObj',
  EStringObj  = 'EStringObj',
  EDateObj  = 'EDateObj',
  EFloatObj  = 'EFloatObj',
  EDoubleObj  = 'EDoubleObj',
  EBooleanObj = 'EBooleanObj',
  EByteObj  = 'EByteObj',
  EShortObj  = 'EShortObj',
  EIntObj  = 'EIntObj',
  ELongObj  = 'ELongObj',
  EELIST  = 'EELIST',*/

}

export const ShortAttribSuperTypes: Dictionary<ShortAttribETypes, ShortAttribETypes[]> = {
    "void"     : [],
    "EChar"    : [ShortAttribETypes.EString],
    "EString"  : [],
    "EDate"    : [],
    "EBoolean" : [ShortAttribETypes.EByte, ShortAttribETypes.EShort, ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EByte"    : [ShortAttribETypes.EShort, ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EShort"   : [ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EInt"     : [ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "ELong"    : [ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EFloat"   : [ShortAttribETypes.EDouble],
    "EDouble"  : []
};

/*
export class EvalOutput<T extends Object> {
    outContext: T;
    return: any;
    exception: MyException;
}
class EvalContext {
    private static EC_ParStr: string;
    private static EC_TmpParContext: object;
    private static EC_TmpAllowcontextEvalEdit: boolean;
    private static EC_TmpKey: string;
    static EC_ret: any;
    static EC_exception: MyException;
    constructor(context: object, str: string, allowContextEvalEdit: boolean) {
        EvalContext.EC_TmpAllowcontextEvalEdit = allowContextEvalEdit;
        EvalContext.EC_ParStr = str;
        EvalContext.EC_TmpParContext = context;
        EvalContext.EC_TmpAllowcontextEvalEdit = allowContextEvalEdit;
        EvalContext.EC_ret = undefined;
        EvalContext.EC_exception = null;
        //console.log('evalincontext: this', this, 'context:', context);
        delete this['str'];
        delete this['context'];
        delete this['allowContextEvalEdit'];
        // tengo tutte le chiavi al di fuori per non sporcare "this" con variabili locali mentre faccio diventare "this" una shallowcopy di "context"
        for (EvalContext.EC_TmpKey in EvalContext.EC_TmpParContext) { this['' + EvalContext.EC_TmpKey] = EvalContext.EC_TmpParContext['' + EvalContext.EC_TmpKey]; }
        try { EvalContext.EC_ret = eval(EvalContext.EC_ParStr); } catch (e) { EvalContext.EC_exception = e; }
        if (!EvalContext.EC_TmpAllowcontextEvalEdit) return;
        for (EvalContext.EC_TmpKey in this) { EvalContext.EC_TmpParContext['' + EvalContext.EC_TmpKey] = this['' + EvalContext.EC_TmpKey]; }
    }
}
*/
export class SelectorOutput {
    jqselector!: string;
    attrselector!: string;
    attrRegex!: RegExp;
    exception!: any;
    resultSetAttr!: Attr[];
    resultSetElem!: JQuery<Element>;
}
//
// export class UU {
//     public static loopcounter = 0;
//     public static readonly AttributeSelectorOperator: '->' = '->';
//     private static prefix = 'ULibrary_';
//     private static clipboardinput: HTMLInputElement;
//     private static PermuteArr: any[][] = [];
//     private static PermuteUsedChars: any[] = [];
//     private static resizingBorder: HTMLElement;
//     private static resizingContainer: HTMLElement;
//     private static addCssAvoidDuplicates: Dictionary<string, HTMLStyleElement> = {};
//     private static $measurableRelativeTargetRoot: JQuery<Element>;
//     private static varTextToSvg: SVGSVGElement;
//     private static dblclickchecker: number = new Date().getTime();// todo: move @ start
//     private static dblclicktimerms: number = 300;
//     static mouseLeftButton: number = 0; // from e.button
//     static mouseWheelButton: number = 1;
//     static mouseRightButton: number = 2;
//     static mouseBackButton: number = 3;
//     static mouseForwardButton: number = 4;
//
//     static mouseLeftButtons: number = 1; // "evt.buttons" is binary. 7 = left + right + wheel; 0 = no button pressed.
//     static mouseRightButtons: number = 2;
//     static mouseWheelButtons: number = 4;
//     static mouseBackButtons: number = 8;
//     static mouseForwardButtons: number = 16;
//     // static vertexOldPos: GraphPoint = null;
//
//     static checkDblClick(): boolean {
//         const now: number = new Date().getTime();
//         const old: number = UU.dblclickchecker;
//         UU.dblclickchecker = now;
//         //console.log('dblclick time:', now - old, now, old);
//         return (now - old <= UU.dblclicktimerms); }
//
//     public static remove(x: Node): void { if (x && x.parentElement) x.parentElement.removeChild(x); }
//
//     static firstToUpper(s: string): string {
//         if (!s || s === '') return s;
//         return s.charAt(0).toUpperCase() + s.slice(1); }
//
//     static fileReadContent(file: File, callback: (content :string) => void): void {
//         const textType = /text.*/;
//         try { if (!file.type || file.type.match(textType)) {
//             let reader = new FileReader();
//             reader.onload = function(e) { callback( '' + reader.result ); };
//             reader.readAsText(file);
//             return;
//         } } catch(e) { UU.pe(true, "Exception while trying to read file as text. Error: |", e, "|", file); }
//         UU.pe(true, "Wrong file type found: |", file ? file.type : null, "|", file); }
//
//     static fileRead(onChange: (e: ChangeEvent, files: FileList, contents: string[]) => void, extensions: string[] | FileReadTypeEnum[], readContent: boolean): void {
//         myFileReader.show(onChange, extensions, readContent);
//     }
//     public static textToSvg<T extends SVGElement>(str: string): T { return UU.textToSvgArr<T>(str)[0]; }
//     static textToSvgArr<T extends SVGElement> (str: string): T[] {
//         if (!UU.varTextToSvg) { UU.varTextToSvg = UU.newSvg<SVGSVGElement>('svg'); }
//         UU.varTextToSvg.innerHTML = str;
//         const ret: T[] = [];
//         let i: number;
//         for (i = 0; i < UU.varTextToSvg.childNodes.length; i++) { ret.push(UU.varTextToSvg.childNodes[i] as T); }
//         return ret; }
//
//     static addCss(key: string, str: string, prepend: boolean = true): void {
//         const css: HTMLStyleElement = document.createElement('style');
//         css.innerHTML = str;
//         const old: HTMLStyleElement = UU.addCssAvoidDuplicates[key];
//         if (old) { old.parentNode.removeChild(old); }
//         UU.addCssAvoidDuplicates[key] = css;
//         if (prepend) { document.head.prepend(css); } else { document.head.append(css); }
//     }
//
//     static petmp(b: boolean, s: any, ...restArgs: any[]): null { return UU.pe(b, s, ...restArgs); }
//
//     static pedev(b: boolean, s: any, ...restArgs: any[]): null {
//         // todo: questi sono gli errori che dovrebbero verificarsi solo in caso di errori nel codice, mai in seguito ad azioni utente invalide.
//         // quindi dovrebbero avere un sistema di error reporting verso un server con ajax request.
//         return UU.pe(b, s, ...restArgs); }
//
//     static pe(b: boolean, s: any, ...restArgs: any[]): null {
//         if (!b) { return null; }
//         if (restArgs === null || restArgs === undefined) { restArgs = []; }
//         let str = 'Error:' + s + '';
//         for (let i = 0; i < restArgs.length; i++) { str += '' + restArgs[i] + '\t\r\n'; }
//         console.error(s, ...restArgs);
//         window['lastError'] = [restArgs];
//         UU.bootstrapPopup(str, 'danger', 5000);
//         return (((b as unknown) as any[])['@makeMeCrash'] as any[])['@makeMeCrash']; }
//
//     static pw(b: boolean, s: any, ...restArgs: any[]): string {
//         if (!b) { return null; }
//         if (restArgs === null || restArgs === undefined) { restArgs = []; }
//         let str = 'Warning:' + s + '';
//         for (let i = 0; i < restArgs.length; i++) { str += '' + restArgs[i] + '\t\r\n'; }
//         console.trace();
//         console.warn(s, ...restArgs);
//         UU.bootstrapPopup(str, 'warning', 5000);
//         return str; }
//
//     static ps(b: boolean, s: any, ...restArgs: any[]): string {
//         if (!b) { return null; }
//         if (restArgs === null || restArgs === undefined) { restArgs = []; }
//         let str = s + '';
//         for (let i = 0; i < restArgs.length; i++) { str += '' + restArgs[i] + '\t\t\r\n'; }
//         console.info(s, ...restArgs);
//         UU.bootstrapPopup(str, 'success', 3000);
//         return str; }
//
//     static pif(b: boolean, s: any, ...restArgs: any[]): string {
//         if (!b) { return null; }
//         return UU.p(s, ...restArgs); }
//
//     static p(s: any, ...restArgs: any[]): string {
//         if (restArgs === null || restArgs === undefined) { restArgs = []; }
//         let str = '' + s;
//         for (let i = 0; i < restArgs.length; i++) { str += '' + restArgs[i] + '\t\r\n'; }
//         console.info(s, ...restArgs);
//         return str; }
//
//     static $alertcontainer: JQuery<HTMLElement> = null;
//     static alertcontainer: HTMLElement = null;
//     static displayedTexts: Dictionary<string, Element> = {};
//     static bootstrapPopup(innerhtmlstr: string, color: 'success' | 'warning' | 'danger', timer: number): void {
//         const div = document.createElement('div');
//         if (!UU.$alertcontainer) {
//             UU.alertcontainer = document.createElement('div');
//             UU.alertcontainer.classList.add('alertcontainer');
//             document.body.appendChild(UU.alertcontainer);
//             UU.$alertcontainer = $(UU.alertcontainer); }
//         const container: HTMLElement = UU.alertcontainer;
//         const $container = UU.$alertcontainer;
//         const $div = $(div);
//         div.classList.add('alertshell', 'alert_' + color);
//         div.setAttribute('role', 'alert');
//         const alertMargin: HTMLElement = document.createElement('div');
//         alertMargin.innerHTML = innerhtmlstr;
//         if (UU.displayedTexts[innerhtmlstr]) return;
//         UU.displayedTexts[alertMargin.innerHTML] = div;
//         container.appendChild(div);
//         alertMargin.classList.add('alert', 'alert-' + color);
//         div.appendChild(alertMargin);
//         const end = () => { $div.slideUp(400, () => {
//             delete UU.displayedTexts[innerhtmlstr];
//             div.parentElement && container.removeChild(div);
//         }); }; // div.parentElement: nel caso non sia stato manualmente rimosso.
//         $div.on('mousedown', (e: MouseDownEvent) => {
//             UU.clipboardCopy(innerhtmlstr);
//             e.preventDefault();
//             e.stopPropagation();
//             if (UU.mouseRightButton === e.button) {
//                 let i: number;
//                 let $popups = $('.alertshell.alert_' + color);
//                 for (i = 0; i < $popups.length; i++) { delete UU.displayedTexts[$popups[i].innerHTML]; }
//                 $popups.remove();
//                 return; }
//             if (UU.mouseWheelButton === e.button) {
//                 UU.displayedTexts = [];
//                 $('.alertshell').remove();
//                 return; }
//             delete UU.displayedTexts[innerhtmlstr];
//             div.parentElement && container.removeChild(div);
//         });
//         $div.hide().slideDown(200, () => setTimeout(end, timer));
//     }
//
//     static cloneHtml<T extends Element>(html: T, deep = true, defaultIDNum = 1): T {
//         const clone: T = html.cloneNode(deep) as T;
//         const getLastNum = (str: string): number => {
//             let pos = str.length ;
//             while ( --pos > 0 && !isNaN(+str.charAt(pos)) ) {}
//             const numstr = (str.substring(pos));
//             return isNaN(+numstr) ? defaultIDNum : +numstr;
//         };
//         if (!clone.id) { return clone; }
//         let lastnum = getLastNum(clone.id) - 1;
//         const tmpID: string = clone.id + (clone.id.indexOf('_Clone') === -1 ? '_Clone' : '');
//         while (document.getElementById(tmpID + (++lastnum))) {}
//         clone.id = tmpID + lastnum;
//         return clone;
//     }
//
//     public static clearAttributes(node: Element): void {
//         let j: number;
//         for (j = 0; j < node.attributes.length; j++) { node.removeAttribute(node.attributes[j].name); }
//     }
//
//     // safe con SVG, input, select, textarea.
//     public static copyVisibleText(element0: Element): string {
//         const element: Element = element0.cloneNode(true) as Element;
//         const $element = $(element);
//         $element.remove(':hidden');
//         $element.remove('.addFieldButtonContainer');
//         $element.find('input, textarea').addBack('input, textarea').each( (i, e: HTMLInputElement | HTMLTextAreaElement)=> {
//             const replacement = document.createElement('div');
//             replacement.dataset.replacement = "1";
//             replacement.innerText = e.value;
//             UU.swap(e, replacement);
//         });
//         $element.find('select').addBack('select').each( (i, e: HTMLSelectElement)=> {
//             const replacement = document.createElement('div');
//             replacement.dataset.replacement = "1";
//             replacement.innerText = e.selectedIndex >= 0 ?  e.options[e.selectedIndex].text : '';
//             UU.swap(e, replacement);
//         });
//         UU.pe(!!$element.find('select, input, textarea').length,
//             'input remaining:', $element.find('select, input, textarea').addBack('select, input, textarea'));
//         // console.log('copyVisibleText() textcontent of:', element, UU.getRawInnerText(element));
//         return UU.getRawInnerText(element); }
//
//     // safe con SVG, !! NON safe con input, textarea e select
//     private static getRawInnerText(element: Element, win: Window = null): string {
//         let userselect: string, msuserselect: string, wkuserselect: string;
//         if (element['style']) {
//             let e: HTMLElement = element as any;
//             userselect = e.style.userSelect;
//             msuserselect = e.style.msUserSelect;
//             wkuserselect = e.style.webkitUserSelect;
//             e.style.userSelect = 'all'; // text
//             e.style.msUserSelect = 'all';
//             e.style.webkitUserSelect = 'all';
//         }
//         win = win || window;
//         const doc = win.document;
//         const wasInDocument = UU.isChildrenOf(element, doc.body);
//         if (!wasInDocument) { doc.body.appendChild(element); }
//         let sel: Selection, range: Range, prevRange: Range, selString: string;
//         sel = win.getSelection();
//         if (sel.rangeCount) {
//             prevRange = sel.getRangeAt(0);
//         }
//         range = doc.createRange();
//         range.selectNodeContents(element);
//         sel.removeAllRanges();
//         sel.addRange(range);
//         selString = sel.toString();
//         sel.removeAllRanges();
//         prevRange && sel.addRange(prevRange);
//         if (!wasInDocument) { doc.body.removeChild(element); }
//         if (element['style']) {
//             let e: HTMLElement = element as any;
//             if (userselect) { e.style.userSelect = userselect; }
//             if (msuserselect) { e.style.msUserSelect = userselect; }
//             if (wkuserselect) { e.style.webkitUserSelect = userselect; }
//         }
//         return selString; }
//
//
//     static cloneObj2<T extends object>(o: T): T {
//         UU.pe(true, 'todo: dovrebbe fare una deep copy copiando anche le funzioni (cosa che json.stringify non fa).');
//         return null; }
//
//
//     public static replaceVars<T extends Element>(obj: object, html0: T, cloneHtml = true, debug: boolean = false): T {
//         const html: T = cloneHtml ? UU.cloneHtml<T>(html0) : html0;
//         /// see it in action & parse or debug at
//         // v1) perfetto ma non supportata in jscript https://regex101.com/r/Do2ndU/1
//         // v2) usata: aggiustabile con if...substring(1). https://regex101.com/r/Do2ndU/3
//         // get text between 2 single '$' excluding $$, so they can be used as escape character to display a single '$'
//         // console.log('html0:', html0, 'html:', html);
//         UU.pe(!(html instanceof Element), 'target must be a html node.', html, html0);
//         html.innerHTML = UU.replaceVarsString(obj, html.innerHTML, debug);
//         UU.pif(debug, 'ReplaceVars() return = ', html.innerHTML);
//         return html; }
//
//     private static replaceVarsString0(obj: object, str: string, escapeC: string[] = null, replacer: string[] = null, debug: boolean = false): string {
//         UU.pe(escapeC && !replacer, 'replacer cannot be null if escapeChar is defined.');
//         UU.pe(replacer && !escapeC, 'escapeChar cannot be null if replacer is defined');
//         if (!escapeC && !replacer) { escapeC = replacer = []; }
//         UU.pe(escapeC.length !== replacer.length, 'replacer and escapeChar must be arrays of the same length');
//         str = str.replace(/(^\$|(((?!\$).|^))[\$](?!\$))(.*?)(^\$|((?!\$).|^)[\$](?!\$))/gm,
//             (match: string, capture) => {
//                 // console.log('matched:', match, 'capture: ', capture);
//                 if (match === '$') { return ''; }
//                 let prefixError = '';
//                 if (match.charAt(0) !== '$') {
//                     prefixError = match.charAt(0);
//                     match = match.substring(1); }
//                 // # = default value: {asHtml = true, isbase64 = false}
//                 const asHtml = match.charAt(1) === '1' || match.charAt(1) !== '#';
//                 const isBase64 = match.charAt(2) === '1' || match.charAt(2) !== '#';
//                 const varname = match.substring(3, match.length - 1);
//                 const debugtext = varname + '(' + match + ')';
//                 UU.pif(debug, 'match:', match);
//                 const resultarr = UU.replaceSingleVar(obj, varname, isBase64, false);
//                 let result: string = resultarr[resultarr.length - 1].value;
//                 if (result !== '' + result) { try { result = JSON.stringify(result); } catch(e) { result = '{_Cyclic object_}'} }
//                 let i = -1;
//                 UU.pif(debug, 'replaceSingleVar: ', match, ', arr', resultarr, ', ret', result, ', this:', obj);
//                 if (!asHtml) { while (++i < escapeC.length) { result = UU.replaceAll(result, escapeC[i], replacer[i]); } }
//                 UU.pif(debug, 'replaceSingleVar: ' + debugtext + ' --> ' + result + ' --> ' + prefixError, result, obj);
//                 if (UU.isObject(result)) {  }
//                 return prefixError + result;
//             });
//         return str; }
//
//     public static replaceVarsString(obj: object, htmlStr: string, debug: boolean = false): string {
//         UU.pe(!obj || !htmlStr, 'parameters cannot be null. obj:', obj, ', htmlString:', htmlStr);
//         //  https://stackoverflow.com/questions/38563414/javascript-regex-to-select-quoted-string-but-not-escape-quotes
//         //  good regex fatto da me https://regex101.com/r/bmWVrp/4
//
//         if (UU.isFunction((obj as any).preReplace)) (obj as any).preReplace();
//         // only replace content inside " quotes. (eventually escaping ")
//         htmlStr = UU.QuoteReplaceVarString(obj, htmlStr, '"', debug);
//         // only replace content inside ' quotes. (eventually escaping ')
//         htmlStr = UU.QuoteReplaceVarString(obj, htmlStr, '\'', debug);
//         // replaces what's left outside any quotation. (eventually escaping <>)
//         htmlStr = UU.replaceVarsString0(obj, htmlStr, ['<', '>'], ['&lt;', '&gt;']);
//         return htmlStr; }
//
//     private static QuoteReplaceVarString(obj: object, htmlStr: string, quote: string, debug: boolean = false): string {
//         UU.pe(quote !== '"' && quote !== '\'', 'the only quote supported are single chars " and \'.');
//         const quoteEscape = quote === '&quot;' ? '' : '&#39;'; // '\\' + quote;
//         // todo: dovrei anche rimpiazzare & with &amp; per consentire input &something; trattati come stringhe.
//         // ""|(:?[^\\](?!"")|^)((:?\\\\)*\"(:?.*?[^\\"]+){0,1}(:?\\\\)*\")
//         // '""|(:?[^\\](?!"")|^)((:?\\\\)*\"(:?.*?[^\\"]+){0,1}(:?\\\\)*\")'
//         // let regex = /""|(:?[^\\](?!"")|^)((:?\\\\)*\"(:?.*?[^\\"]+){0,1}(:?\\\\)*\")/;
//         let regexStr = '""|(:?[^\\\\](?!"")|^)((:?\\\\\\\\)*\\"(:?.*?[^\\\\"]+){0,1}(:?\\\\\\\\)*\\")';
//         if (quote !== '"') { regexStr = UU.replaceAll(regexStr, '"', '\''); }
//         const quoteRegex = new RegExp(regexStr, 'g'); // new RegExp("a", "b"); === /a/b
//         htmlStr = htmlStr.replace(quoteRegex, (match: string, capture) => {
//             const start: number = match.indexOf(quote);
//             const end: number = match.lastIndexOf(quote);
//             const content: string = UU.replaceVarsString0(obj, match.substring(start + 1, end), [quote], [quoteEscape], debug);
//             const ret = match.substring(0, start + 1) + content + match.substring(end);
//             UU.pif(debug, 'replaceQuotedVars: match: |' + match + '| --> |' + content + '| --> |' + ret + '| html:' , htmlStr, 'capt:', capture);
//             return ret;
//         });
//         return htmlStr;
//     }
//
//     //todo: da rimuovere, è stata completamente superata dal nuovo return type array di replaceSingleVar
//     static replaceSingleVarGetParentAndChildKey(obj: object, fullpattern: string, canThrow: boolean = false): {parent: any, childkey: string} {
//         const ret: {parent: any, childkey: string} = {parent: null, childkey: null};
//         let targetPatternParent: string;
//         const pos = fullpattern.indexOf('.');
//         const isBase64 = fullpattern.charAt(2) === '1' || fullpattern.charAt(2) !== '#';
//         UU.pe(isBase64, 'currently this method does not support base64 encoded templates. the conversion is still to do.', fullpattern);
//         if (pos === -1) {
//             ret.parent = obj;
//             ret.childkey = fullpattern.substring(3, fullpattern.length - 1);
//             return ret; }
//         try {
//             targetPatternParent = fullpattern.substring(0, pos) + '$';
//             const tmparr = UU.replaceSingleVarRaw(obj, targetPatternParent);
//             ret.parent = tmparr[tmparr.length - 1].value;
//             ret.childkey = fullpattern.substring(pos + 1, fullpattern.length - 1);
//         } catch (e) {
//             UU.pw(true, 'replaceSingleVarGetParentAndChildKey failed. fullpattern: |' + fullpattern + '| targetPatternParent: |'
//                 + targetPatternParent + '| obj: ', obj, ' reason: ', e);
//             return null; }
//         return ret; }
//
//     static replaceSingleVarRaw(obj: object, fullpattern: string, canThrow: boolean = false): {token: string, value: any}[] {
//         fullpattern = fullpattern.trim();
//         const isBase64 = fullpattern.charAt(2) === '1' || fullpattern.charAt(2) !== '#';
//         const varName = fullpattern.substring(3, fullpattern.length - 1);
//         return UU.replaceSingleVar(obj, varName, isBase64, canThrow); }
//
//     static replaceSingleVar(obj: object, varname: string, isBase64: boolean, canThrow: boolean = false): {token: string, value: any}[] {
//         const debug = false;
//         const showErrors = false;
//         let debugPathOk = '';
//         /////////////////// debug start
//         if (isBase64) {
//             isBase64 = false;
//             // varname = 'name';
//         }
//
//         /////////////////////// debug end
//         if (isBase64) { UU.pe(true, 'base64 unimplemented, varname:', varname); varname = atob(varname); }
//         let requestedValue: any = obj;
//         const fullpath: string = varname;
//         const tokens: string[] = varname.split('.'); // varname.split(/\.,/);
//         const ret: {token: string, value: any}[] = [];
//         let j;
//         let token: string = null;
//         for (j = 0; j < tokens.length; j++) {
//             ret.push({token: token === null ? 'this' : token, value: requestedValue});
//             token = tokens[j];
//             UU.pif(debug || showErrors, 'replacer: obj[req] = ', requestedValue, '[', token, '] =', (requestedValue ? requestedValue[token] : ''));
//             if (requestedValue === null || requestedValue === undefined) {
//                 UU.pe(showErrors, 'requested null or undefined:', obj, ', canthrow ? ', canThrow, ', fillplath:', fullpath);
//                 if (canThrow) {
//                     UU.pif(showErrors, 'wrong variable path:', debugPathOk + '.' + token, ': ' + token + ' is undefined. object = ', obj);
//                     throw new DOMException('replace_Vars.WrongVariablePath', 'replace_Vars.WrongVariablePath');
//                 } else {
//                     UU.pif(showErrors, 'wrong variable path:', debugPathOk + '.' + token, ': ' + token + ' is undefined. ovjet = ', obj);
//                 }
//
//                 ret.push({token: token, value: 'Error: ' + debugPathOk + '.' + token + ' = ' + undefined});
//                 // ret.push({token: token, value: requestedValue});
//                 return ret;
//             } else { debugPathOk += (debugPathOk === '' ? '' : '.') + token; }
//             ////
//             if (requestedValue instanceof ModelPiece) {
//                 const info: any = requestedValue.getInfo(true);
//                 const key = token.toLowerCase();
//                 if (key in info) { requestedValue = info[key]; } else { requestedValue = requestedValue[token]; }
//             } else { requestedValue = (requestedValue === null) ? undefined : requestedValue[token]; }
//         }
//
//         ret.push({token: token, value: requestedValue});
//         return ret; }
//
//     static replaceSingleVar_backup(obj: object, varname: string, isBase64: boolean, canThrow: boolean = false): any {
//         const debug = false;
//         const showErrors = false;
//         let debugPathOk = '';
//         if (isBase64) { varname = atob(varname); }
//         let requestedValue: any = obj;
//         const fullpath: string = varname;
//         const tokens: string[] = varname.split('.'); // varname.split(/\.,/);
//         let j;
//         for (j = 0; j < tokens.length; j++) {
//             const token = tokens[j];
//             UU.pif(debug || showErrors, 'replacer: obj[req] = ', requestedValue, '[', token, '] =', (requestedValue ? requestedValue[token] : ''));
//
//             if (requestedValue === null || requestedValue === undefined) {
//                 UU.pe(showErrors, 'requested null or undefined:', obj, ', canthrow ? ', canThrow, ', fillplath:', fullpath);
//                 if (canThrow) {
//                     UU.pif(showErrors, 'wrong variable path:', debugPathOk + '.' + token, ': ' + token + ' is undefined. object = ', obj);
//                     throw new DOMException('replace_Vars.WrongVariablePath', 'replace_Vars.WrongVariablePath');
//                 } else {
//                     UU.pif(showErrors, 'wrong variable path:', debugPathOk + '.' + token, ': ' + token + ' is undefined. ovjet = ', obj);
//                 }
//                 return 'Error: ' + debugPathOk + '.' + token + ' = ' + undefined;
//             } else { debugPathOk += (debugPathOk === '' ? '' : '.') + token; }
//             ////
//             if (requestedValue instanceof ModelPiece) {
//                 const info: any = requestedValue.getInfo(true);
//                 const key = token.toLowerCase();
//                 if (key in info) { requestedValue = info[key]; } else { requestedValue = requestedValue[token]; }
//             } else { requestedValue = (requestedValue === null) ? undefined : requestedValue[token]; }
//         }
//         return requestedValue; }
//
//     static changeVarTemplateDelimitersInMeasurables(innerText: string, toReplace: string = '$', replacement = '£'): string {
//         if (!innerText.indexOf('measurable')) { return innerText; } // + performance su scommessa probabilistica. better avg, worser worst case.
//         const html = document.createElement('div');
//         html.innerHTML = innerText;
//         const $measurables = $(html).find('.measurable');
//         let i: number;
//         let j: number;
//         for (i = 0; i < $measurables.length; i++) {
//             for (j = 0; j < $measurables[i].attributes.length; j++) {
//                 if($measurables[i].attributes[j].name[0] !== '_') { continue; }
//                 UU.changeVarTemplateDelimitersInMeasurablesAttr($measurables[i].attributes[j], toReplace, replacement); } }
//         return html.innerHTML; }
//
//     static changeBackVarTemplateDelimitersInMeasurablesAttr(attrVal: string, toReplace: string = '£', replacement = '$'): string {
//         return UU.changeVarTemplateDelimitersInMeasurablesAttrStr(attrVal, toReplace, replacement); }
//
//     private static changeVarTemplateDelimitersInMeasurablesAttr(attr: Attr, toReplace: string = '$', replacement = '£'): void {
//         attr.value = UU.changeVarTemplateDelimitersInMeasurablesAttrStr(attr.value, toReplace, replacement); }
//
//     private static changeVarTemplateDelimitersInMeasurablesAttrStr(val: string, toReplace: string, replacement: string): string {
//         const r = toReplace;
//         const rstr = '(^\\' + r + '|(((?!\\' + r + ').|^))[\\' + r + '](?!\\' + r + '))(.*?)(^\\' + r + '|((?!\\' + r + ').|^)[\\' + r + '](?!\\' + r + '))';
//         return val.replace(new RegExp(rstr, 'gm'), (match: string, capture) => {
//             if (match === toReplace) { return toReplace; }
//             let prefixError = '';
//             if (match.charAt(0) !== toReplace) {
//                 prefixError = match.charAt(0);
//                 match = match.substring(1); }
//             return prefixError + replacement + match.substring(1, match.length - 1) + replacement;
//         }); }
//
//
//
//
//
//     static toBase64Image(html: Element, container: Element = null, containerTag: string = 'div'): string {
//         // https://github.com/tsayen/dom-to-image
//         return 'HtmlToImage todo: check https://github.com/tsayen/dom-to-image'; }
//
//
//     static getParentLine(node: Node, parentLimit: Element = null, bottomToTopOrder: boolean = true, includeparentlimit: boolean = false, includenode: boolean = false): Element[] {
//         const arr: Element[] = [];
//         if (includenode) arr.push(node as any);
//         UU.pe(!node, 'UU.getParentLine() node argument cannot be null.');
//         while (node.parentElement && node.parentElement !== parentLimit) { arr.push(node = node.parentElement);}
//         if (includeparentlimit && node.parentElement === parentLimit) arr.push(parentLimit);
//         return bottomToTopOrder ? arr : arr.reverse(); }
//
//     /**
//      * checks if nodes have a vertical line relationship in the tree (parent, grandparent, ...);
//      * @ return {boolean}
//      */
//     static isParentOf(parent: Element, child: Node): boolean {
//         //  parent chains:   element -> ... -> body -> html -> document -> null
//         while (child !== null) {
//             if (parent === child) { return true; }
//             child = child.parentNode;
//         }
//         return false;
//     }
//
//     static isChildrenOf(child: Node, parent: Element) {
//         return UU.isParentOf(parent, child); }
//
//     static setSvgSize(style: SVGElement, size: GraphSize, defaultsize: GraphSize): GraphSize {
//         if (!style) return;
//         if (size) { size = size.duplicate(); } else { size = defaultsize.duplicate(); defaultsize = null; }
//         if (!UU.isNumber(size.x)) {
//             UU.pw(true, 'VertexSize Svg x attribute is NaN: ' + size.x + (!defaultsize ? '' : ' will be set to default: ' + defaultsize.x));
//             UU.pe(!defaultsize || !UU.isNumber(defaultsize.x), 'Both size and defaultsize are null.', size, defaultsize, style);
//             size.x = defaultsize.x; }
//         if (!UU.isNumber(size.y)) {
//             UU.pw(true, 'VertexSize Svg y attribute is NaN: ' + size.y + (!defaultsize ? '' : ' will be set to default: ' + defaultsize.y));
//             UU.pe(!defaultsize || !UU.isNumber(defaultsize.y), 'Both size and defaultsize are null.', size, defaultsize, style);
//             size.y = defaultsize.y; }
//         if (!UU.isNumber(size.w)) {
//             UU.pw(true, 'VertexSize Svg w attribute is NaN: ' + size.w + (!defaultsize ? '' : ' will be set to default: ' + defaultsize.w));
//             UU.pe(!defaultsize || !UU.isNumber(defaultsize.w), 'Both size and defaultsize are null.', size, defaultsize, style);
//             size.w = defaultsize.w; }
//         if (!UU.isNumber(size.h)) {
//             UU.pw(true, 'VertexSize Svg h attribute is NaN: ' + size.h + (!defaultsize ? '' : ' will be set to default: ' + defaultsize.h));
//             UU.pe(!defaultsize || !UU.isNumber(defaultsize.h), 'Both size and defaultsize are null.', size, defaultsize, style);
//             size.h = defaultsize.h; }
//         // UU.pe(true, '100!, ', size, style);
//         style.setAttributeNS(null, 'x', '' + size.x);
//         style.setAttributeNS(null, 'y', '' + size.y);
//         style.setAttributeNS(null, 'width', '' + size.w);
//         style.setAttributeNS(null, 'height', '' + size.h);
//         return size; }
//
//     static getSvgSize(elem: SVGElement, minimum: GraphSize = null, maximum: GraphSize = null): GraphSize {
//         const defaults: GraphSize = new GraphSize(0, 0, 200, 99);
//         const ret0: GraphSize = new GraphSize(+elem.getAttribute('x'), +elem.getAttribute('y'),
//             +elem.getAttribute('width'), +elem.getAttribute('height'));
//         const ret: GraphSize = ret0.duplicate();
//         if (!UU.isNumber(ret.x)) {
//             UU.pw(true, 'Svg x attribute is NaN: ' + elem.getAttribute('x') + ' will be set to default: ' + defaults.x);
//             ret.x = defaults.x; }
//         if (!UU.isNumber(ret.y)) {
//             UU.pw(true, 'Svg y attribute is NaN: ' + elem.getAttribute('y') + ' will be set to default: ' + defaults.y);
//             ret.y = defaults.y; }
//         if (!UU.isNumber(ret.w)) {
//             UU.pw(true, 'Svg w attribute is NaN: ' + elem.getAttribute('width') + ' will be set to default: ' + defaults.w);
//             ret.w = defaults.w; }
//         if (!UU.isNumber(ret.h)) {
//             UU.pw(true, 'Svg h attribute is NaN: ' + elem.getAttribute('height') + ' will be set to default: ' + defaults.h);
//             ret.h = defaults.h; }
//         if (minimum) {
//             if (UU.isNumber(minimum.x) && ret.x < minimum.x) { ret.x = minimum.x; }
//             if (UU.isNumber(minimum.y) && ret.y < minimum.y) { ret.y = minimum.y; }
//             if (UU.isNumber(minimum.w) && ret.w < minimum.w) { ret.w = minimum.w; }
//             if (UU.isNumber(minimum.h) && ret.h < minimum.h) { ret.h = minimum.h; } }
//         if (maximum) {
//             if (UU.isNumber(maximum.x) && ret.x > maximum.x) { ret.x = maximum.x; }
//             if (UU.isNumber(maximum.y) && ret.y > maximum.y) { ret.y = maximum.y; }
//             if (UU.isNumber(maximum.w) && ret.w > maximum.w) { ret.w = maximum.w; }
//             if (UU.isNumber(maximum.h) && ret.h > maximum.h) { ret.h = maximum.h; } }
//         if (!ret.equals(ret0)) { UU.setSvgSize(elem, ret, null); }
//         return ret; }
//
//     static findMetaParent<ParentT extends ModelPiece, childT extends ModelPiece>(parent: ParentT, childJson: Json, canFail: boolean, debug: boolean = true): childT {
//         const modelRoot: IModel = parent.getModelRoot();
//         // instanceof crasha non so perchè, dà undefined constructor quando non lo è.
//         if (UU.getClass(modelRoot) === 'MetaMetaModel') { UU.pif(debug, 'return null;'); return null; }
//         if (UU.getClass(modelRoot) === 'MetaModel') { UU.pif(debug, 'return null;'); return null; } // potrei ripensarci e collegarlo a m3
//         // todo: risolvi bene e capisci che collegamento deve esserci tra mmpackage e mpackage.
//         // fix temporaneo: così però consento di avere un solo package.
//         if (UU.getClass(modelRoot) === 'Model' && UU.getClass(parent) === 'Model') {
//             UU.pif(debug, 'return: ', parent.metaParent.childrens[0] as childT);
//             return parent.metaParent.childrens[0] as childT; }
//         // if (modelRoot === Status.status.mmm || !Status.status.mmm && modelRoot instanceof MetaMetaModel) { return null; }
//         // if (modelRoot === Status.status.mm) { return null; }
//         const ParentMetaParent: ParentT = parent.metaParent as ParentT;
//         const metaParentName = Json.read(childJson, XMIModel.namee, null);
//         // UU.pe(!metaParentName, 'type not found.', childJson);
//         let i;
//         let ret: childT = null;
//         UU.pif(debug, 'finding metaparent of:', childJson, 'parent:', parent, 'parent.metaparent:', ParentMetaParent,
//             'childrens:', ParentMetaParent ? ParentMetaParent.childrens : 'null parent');
//         for (i = 0; i < ParentMetaParent.childrens.length; i++) {
//             const metaVersionCandidate = ParentMetaParent.childrens[i];
//             const candidateName = metaVersionCandidate.name;
//             UU.pif(debug, 'check[' + i + '/' + ParentMetaParent.childrens.length + '] ' + candidateName + ' =?= ' + metaParentName + ' ? ' +
//                 (candidateName === metaParentName));
//             // console.log('is metaparent? of:', metaParentName, ' === ', candidateName, ' ? ', candidateName === metaParentName);
//             if (candidateName === metaParentName) {
//                 ret = metaVersionCandidate as childT;
//                 break;
//             }
//         }
//         UU.pif(debug, 'return: ', ret);
//         UU.pe(ret == null && !canFail, 'metaParent not found. metaParentParent:', ParentMetaParent,
//             'metaParentName:', metaParentName, 'parent:', parent, 'json:', childJson);
//         // console.log('findMetaParent of:', childJson, ' using parent:', parent, ' = ', ret);
//         return ret; }
//
//     /*
//     static findMetaParentP(parent: IModel, childJson: Json, canFail: boolean = true): IPackage {
//       return UU.findMetaParent<IModel, IPackage>(parent, childJson, canFail);
//     }
//
//     static findMetaParentC(parent: IPackage, childJson: Json, canFail: boolean = true): M2Class {
//       return UU.findMetaParent<IPackage, M2Class>(parent, childJson, canFail);
//     }
//
//     static findMetaParentA(prnt: M2Class, childJ: Json, canFail: boolean = true): IAttribute {
//       return UU.findMetaParent<M2Class, IAttribute>(prnt, childJ, canFail);
//     }
//
//     static findMetaParentR(prnt: M2Class, childJ: Json, canFail: boolean = true): IReference {
//       return UU.findMetaParent<M2Class, IReference>(prnt, childJ, canFail);
//     }
//   */
//     static arrayRemoveAll<T>(arr: Array<T>, elem: T, debug: boolean = false): void {
//         let index;
//         if (!arr) return;
//         while (true) {
//             index = arr.indexOf(elem);
//             UU.pif (debug, 'ArrayRemoveAll: index: ', index, '; arr:', arr, '; elem:', elem);
//             if (index === -1) { return; }
//             arr.splice(index, 1);
//             UU.pif (debug, 'ArrayRemoveAll RemovedOne:', arr);
//         }
//     }
//
//     static arraySubstr<T>(arr: Array<T>, start: number, length: number = null): Array<T> { return arr ? arr.slice(start, start + length) : arr; }
//     static arraySubstringSlice<T>(arr: Array<T>, start: number, end: number = null): Array<T> { return arr ? arr.slice(start, end) : arr; }
//
//     static eventiDaAggiungereAlBody(selecteds: string) {
//         // todo: guarda gli invocatori
//     }
//
//     private static GeomTolerance = 0; // 0.001;
//     static isOnEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         return UU.isOnHorizontalEdges(pt, shape, tolerance) || UU.isOnVerticalEdges(pt, shape, tolerance); }
//
//     static isOnVerticalEdges(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         return UU.isOnLeftEdge(pt, shape, tolerance) || UU.isOnRightEdge(pt, shape, tolerance); }
//
//     static isOnHorizontalEdges(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         return UU.isOnTopEdge(pt, shape, tolerance) || UU.isOnBottomEdge(pt, shape, tolerance); }
//
//     static isOnRightEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         if (!pt || !shape) { return null; }
//         if (tolerance === null) tolerance = UU.GeomTolerance;
//         if (tolerance) return Math.abs(pt.x - (shape.x + shape.w)) < tolerance
//             && ( pt.y - (shape.y) > tolerance && pt.y - (shape.y + shape.h) < tolerance);
//         return (pt.x === shape.x + shape.w) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
//
//     }
//
//     static isOnLeftEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         if (!pt || !shape) { return null; }
//         if (tolerance === null) tolerance = UU.GeomTolerance;
//         if (tolerance) return Math.abs(pt.x - shape.x) < tolerance
//             && (pt.y - (shape.y) > tolerance && pt.y - (shape.y + shape.h) < tolerance);
//         return (pt.x === shape.x) && (pt.y >= shape.y && pt.y <= shape.y + shape.h);
//     }
//
//     static isOnTopEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         if (!pt || !shape) { return null; }
//         if (tolerance === null) tolerance = UU.GeomTolerance;
//         if (tolerance) return Math.abs(pt.y - shape.y) < tolerance
//             && (pt.x - (shape.x) > tolerance && pt.x - (shape.x + shape.w) < tolerance);
//         return (pt.y === shape.y) && (pt.x >= shape.x && pt.x <= shape.x + shape.w);
//     }
//
//     static isOnBottomEdge(pt: GraphPoint, shape: GraphSize, tolerance: number = null): boolean {
//         if (!pt || !shape) { return null; }
//         if (tolerance === null) tolerance = UU.GeomTolerance;
//         if (tolerance) return Math.abs(pt.y - shape.y + shape.h) < tolerance
//             && (pt.x - (shape.x) > tolerance && pt.x - (shape.x + shape.w) < tolerance);
//         return (pt.y === shape.y + shape.h) && (pt.x >= shape.x && pt.x <= shape.x + shape.w);
//     }
//     // usage: var scope1 = makeEvalContext("variable declariation list"); scope1("another eval like: x *=3;");
//     // remarks: variable can be declared only on the first call, further calls on a created context can only modify the context without expanding it.
//
//     public static evalInContext<T extends object>(context: T, str: string, allowcontextEvalEdit: boolean = true): EvalOutput<T> {
//         const out: T = new EvalContext(context, str, allowcontextEvalEdit) as any; // becomes a copy of T
//         const ret: EvalOutput<T> = new EvalOutput<T>();
//         ret.outContext = allowcontextEvalEdit ? context : out; // context contiene l'oggetto originario, out contiene la shallowcopy modificata dall'eval.
//         ret.return = EvalContext.EC_ret;
//         ret.exception = EvalContext.EC_exception;
//         return ret; }
//
//     // same as above, but with dynamic context, although it's only extensible manually and not by the eval code itself.
//     static evalInContextOld(context, js): any {
//         let value;
//         try { // for expressions
//             value = eval('with(context) { ' + js + ' }');
//         } catch (e) {
//             if (e instanceof SyntaxError) {
//                 //try { // for statements
//                 value = (new Function('with(this) { ' + js + ' }')).call(context);
//                 //} catch (e) { UU.pw(true, 'error evaluating')}
//             }
//         }
//         return value; }
//


//
//     /// arrotonda verso zero.
//     static trunc(num: number): number {
//         if (Math['trunc' + '']) {
//             return Math['trunc' + ''](num);
//         }
//         if (Math.floor && Math.ceil) {
//             return Math[num > 0 ? 'floor' : 'ceil'](num);
//         }
//         return Number(String(num).replace(/\..*/, ''));
//     }
//
//     static closeButtonSetup($root: JQuery<HTMLElement>, debug: boolean = false) {
//         $root.find('.closeButton').off('click.closeButton').on('click.closeButton',
//             (e: ClickEvent) => {
//                 let html: HTMLElement = e.target;
//                 const target: string = html.dataset.closebuttontarget;
//                 html = html.parentElement;
//                 UU.pif(debug, 'html:', html, 'target:', e.target, 'targetstr:', target, 'dataset:', e.target.dataset);
//                 while (html && html.dataset.closebuttontarget !== target) {
//                     UU.pif(debug, 'html:', html, ', data:', (html).dataset.closebuttontarget, ' === ' + target);
//                     html = html.parentElement;
//                 }
//                 UU.pif(debug, 'html:', html);
//                 UU.pe(!html, 'closeTarget not found: event trigger:', e.target, 'html:', html);
//                 $(html).hide();
//             });
//     }
//
//     static insertAt(arr: any[], index: number, elem: any): void {
//         if (index >= arr.length) { arr.push(elem); return; }
//         arr.splice(index, 0, elem);
//     }
//
//     static setViewBox(svg: SVGElement, size: Size = null): void {
//         if (!size) { size = new Size(); size.x = size.y = size.w = size.h = null;}
//         let x = +size.x;
//         let y = +size.y;
//         let w = +size.w;
//         let h = +size.h;
//         let htmlsize: Size = null;
//         if (isNaN(x)) { x = 0; }
//         if (isNaN(y)) { y = 0; }
//         if (isNaN(w)) { w = htmlsize ? htmlsize.w : (htmlsize = UU.sizeof(svg)).w; }
//         if (isNaN(h)) { h = htmlsize ? htmlsize.h : (htmlsize = UU.sizeof(svg)).h; }
//         svg.setAttributeNS(null, 'viewBox', x + ' ' + y + ' ' + w + ' ' + h);
//     }
//
//     static getViewBox(svg: SVGElement): Size {
//         const str: string = svg.getAttributeNS(null, 'viewbox');
//         if (!str) return UU.sizeof(svg);
//         const arr: string[] = str.split(' ');
//         let vbox: Size = new Size(0, 0, 0, 0);
//         if (isNaN(+arr[0])) { vbox = UU.sizeof(svg); vbox.x = vbox.y = 0; return vbox; } else { vbox.x = +arr[0]; }
//         if (isNaN(+arr[1])) { vbox = UU.sizeof(svg); vbox.x = vbox.y = 0; return vbox; } else { vbox.y = +arr[1]; }
//         if (isNaN(+arr[2])) { vbox = UU.sizeof(svg); vbox.x = vbox.y = 0; return vbox; } else { vbox.w = +arr[2]; }
//         if (isNaN(+arr[3])) { vbox = UU.sizeof(svg); vbox.x = vbox.y = 0; return vbox; } else { vbox.h = +arr[3]; }
//         return vbox; }
//
//     static selectHtml(htmlSelect: HTMLSelectElement, optionValue: string, canFail: boolean = false) {
//         const $options: JQuery<HTMLOptionElement> = $(htmlSelect).find('option') as unknown as any;
//         let i: number;
//         let isFound = false;
//         if (optionValue === null || optionValue === undefined) { return; }
//         for (i = 0; i < $options.length; i++) {
//             const opt = $options[i] as HTMLOptionElement;
//             if (opt.value === optionValue) { opt.selected = isFound = true; }
//         }
//         UU.pw(!isFound, 'SelectOption not found. html:', htmlSelect, ', searchingFor: |' + optionValue + '|, in options:', $options);
//         UU.pe(!isFound && !canFail, 'SelectOption not found. html:', htmlSelect, ', searchingFor: |' + optionValue + '| in options:', $options);
//     }
//
//     static removeAllNgAttributes($root:JQuery<Element>): void {
//         let attrs: Attr[] = UU.getAllAttributes($root, (a) => !!a.name.match('ng\-|_ng'));
//         for (let attr of attrs) {
//             if (!attr.ownerElement) continue;
//             attr.ownerElement.removeAttributeNode(attr);
//         }
//     }
//
//     static getAllAttributes($root: JQuery<Element> = null, matcher: (a: Attr) => boolean): Attr[] {
//         if (!$root) $root = $(document) as any;
//         const $elems = $root.find('*').addBack();
//         const ret: Attr[] = [];
//         for (let elem of $elems) {
//             if (elem.attributes) Array.prototype.push.apply(ret, Array.prototype.filter.call(elem.attributes, matcher));
//         }
//         return ret;
//     }
//     static tabSetup(root: HTMLElement = document.body): void {
//         $('.UtabHeader').off('click.tabchange').on('click.tabchange', UU.tabClick);
//         $('.UtabContent').hide();
//         const $tabRoots = $('.UtabContainer');
//         let i: number;
//         for (i = 0; i < $tabRoots.length; i++) {
//             const selectedStr = $tabRoots[i].dataset.selectedtab;
//             const $selected = $($tabRoots[i]).find('>.UtabHeaderContainer>.UtabHeader[data-target="' + selectedStr + '"]');
//             UU.pe($selected.length !== 1, 'tab container must select exactly one tab. found instead: ' + $selected.length,
//                 'tabRoot:', $tabRoots[i], 'selector:', selectedStr);
//             // console.clear(); console.log('triggered: ', $selected);
//             $selected.trigger('click');
//         }
//         /*
//     UU.addCss('customTabs',
//       '.UtabHeaderContainer{ padding: 0; margin: 0; display: flex;}\n' +
//       '.UtabContainer{\n' +
//       'display: flex;\n' +
//       'flex-flow: column;\n' +
//       '\n}\n' +
//       '.UtabHeader{\n' +
//       'display: inline-block;\n' +
//       'width: auto; flex-grow: 1;\n' +
//       'margin: 10px;\n' +
//       'margin-bottom: 0;\n' +
//       'flex-basis: 0;\n' +
//       'text-align: center;\n' +
//       'border: 1px solid red;\n}\n' +
//       '.UtabHeader+.UtabHeader{\n' +
//       'margin-left:0;\n}\n' +
//       '.UtabHeader[selected="true"]{\n' +
//       'background-color: darkred;\n' +
//       '}\n' +
//       '.UtabContentContainer{\n' +
//       '\n' +
//       '    flex-grow: 1;\n' +
//       '    flex-basis: 0;\n' +
//       '    overflow: auto;' +
//       '\n}\n' +
//       '.UtabContent{\n' +
//       'flex-grow: 1;\n' +
//       // 'height: 100%;\n' +
//       '\n}\n');*/
//     }
//
//     static tabClick(e: ClickEvent): void {
//         let root: HTMLElement = e.currentTarget;
//         const target = root.dataset.target;
//         while (root && !root.classList.contains('UtabContainer')) {
//             root = root.parentNode as HTMLElement;
//         }
//         const $root = $(root);
//         const oldTarget = root.dataset.selectedtab;
//         root.dataset.selectedtab = target;
//         const $targethtml = $root.find('>.UtabContentContainer>.UtabContent[data-target="' + target + '"]');
//         UU.pe($targethtml.length !== 1, 'tab target count (' + $targethtml.length + ') is !== 1');
//         const $oldTargetHtml = $root.find('>.UtabContentContainer>.UtabContent[data-target="' + oldTarget + '"]');
//         UU.pe($oldTargetHtml.length !== 1, 'oldTab target count (' + $oldTargetHtml.length + ') is !== 1');
//         const $oldTargetHeader = $root.find('>.UtabHeaderContainer>.UtabHeader[data-target="' + oldTarget + '"]');
//         UU.pe($oldTargetHeader.length !== 1, 'oldTabHeader target count (' + $oldTargetHeader.length + ') is !== 1');
//         const $targetHeader = $root.find('>.UtabHeaderContainer>.UtabHeader[data-target="' + target + '"]');
//         UU.pe($targetHeader.length !== 1, 'TabHeader target count (' + $targetHeader.length + ') is !== 1');
//         if ($targethtml[0].getAttribute('selected') === 'true') {
//             return;
//         }
//         $oldTargetHeader[0].setAttribute('selected', 'false');
//         $targetHeader[0].setAttribute('selected', 'true');
//         $oldTargetHtml.slideUp();
//         $targethtml.slideDown();
//     }
//
//     static removeemptynodes(root: Element, includeNBSP: boolean = false, debug: boolean = false): Element {
//         let n: number;
//         for (n = 0; n < root.childNodes.length; n++) {
//             const child: any = root.childNodes[n];
//             UU.pif(debug, 'removeEmptyNodes: ', child.nodeType);
//             switch (child.nodeType) {
//                 default:
//                     break;
//                 case 1:
//                     UU.removeemptynodes(child, includeNBSP);
//                     break; // node: element
//                 case 2:
//                     break; // leaf: attribute
//                 case 8:
//                     break; // leaf: comment
//                 case 3: // leaf: text node
//                     let txt = child.nodeValue;
//                     let i: number;
//                     // replacing first blanks (\n, \r, &nbsp;) with classic spaces.
//                     for (i = 0; i < txt.length; i++) {
//                         let exit: boolean = false && false;
//                         switch (txt[i]) {
//                             default: exit = true; break; // if contains non-blank is allowed to live but trimmed.
//                             case '&nbsp': if (includeNBSP) { txt[i] = ' '; } else { exit = true; } break;
//                             case ' ':
//                             case '\n':
//                             case '\r': txt[i] = ' '; break; }
//                         if (exit) { break; }
//                     }
//                     // replacing last blanks (\n, \r, &nbsp;) with classic spaces.
//                     for (i = txt.length; i >= 0; i--) {
//                         let exit: boolean = false && false;
//                         switch (txt[i]) {
//                             default: exit = true; break; // if contains non-blank is allowed to live but trimmed.
//                             case '&nbsp': if (includeNBSP) { txt[i] = ' '; } else { exit = true; } break;
//                             case ' ':
//                             case '\n':
//                             case '\r': txt[i] = ' '; break; }
//                         if (exit) { break; }
//                     }
//                     txt = txt.trim();
//                     UU.pif(debug, 'txt: |' + root.nodeValue + '| --> |' + txt + '| delete?', (/^[\n\r ]*$/g.test(txt)));
//                     if (txt === '') { root.removeChild(child); n--; } else { root.nodeValue = txt; }
//                     break;
//             }
//         }
//         return root; }
//
//     static replaceAll(str: string, searchText: string, replacement: string, debug: boolean = false, warn: boolean = true): string {
//         if (!str) { return str; }
//         return str.split(searchText).join(replacement);
//         let lastPos = 0;
//         if (searchText === replacement) {
//             UU.pw(warn, 'replaceAll invalid parameters: search text === replacement === ' + replacement);
//             return str; }
//         UU.pif(debug, 'replaceAll(', searchText, ' with ', replacement, ') starting str:', searchText);
//         while (str.indexOf(searchText, lastPos)) {
//             const old = searchText;
//             const lastPosOld = lastPos;
//             searchText = searchText.substring(0, lastPos) + replacement + searchText.substring(lastPos + searchText.length);
//             lastPos = lastPos + replacement.length;
//             UU.pif(debug, 'replaceAll() ', old, ' => ', searchText, '; lastpos:' + lastPosOld + ' => ', lastPos);
//         }
//         return str;
//     }
//
//     static isValidHtml(htmlStr: string, debug: boolean = false ): boolean {
//         const div = document.createElement('div');
//         if (!htmlStr) { return false; }
//         div.innerHTML = htmlStr;
//         // if (div.innerHTML === htmlStr) { return true; }
//         const s2 = UU.multiReplaceAll(div.innerHTML, [' ', ' ', '\n', '\r'], ['', '', '', '']);
//         const s1 = UU.multiReplaceAll(htmlStr, [' ', ' ', '\n', '\r'], ['', '', '', '']);
//         const ret: boolean = s1 === s2;
//         if (ret || !debug) { return ret; }
//         const tmp: string[] = UU.strFirstDiff(s1, s2, 20);
//         UU.pif(debug, 'isValidHtml() ' + (tmp ? '|' + tmp[0] + '| vs |' + tmp[1] + '|' : 'tmp === null'));
//         return ret; }
//
//     static RGBAToHex(str: string, prefix = '#', postfix = ''): string {
//         return UU.RGBAToHexObj(str, prefix, postfix).rgbahex;
//     }
//
//     static HexToHexObj(str: string): {r: number, g: number, b: number, a: number} {
//         str = UU.replaceAll(str, '#', '');
//         let byteLen: number;
//         switch(str.length){
//             default: return null;
//             case 3: case 4: byteLen = 1; break; // rgb & rgba con 1 byte color depth
//             case 6: case 7: case 8: byteLen = 2; break;
//         }
//         const arr: number[] = [];
//         let pos = 0;
//         let strval: string;
//         let val: number;
//         while(true){
//             strval = str.substr(pos, byteLen);
//             if (!strval) break;
//             if (strval.length === 1) strval += strval; // f -> ff, 0 -> 00, 7 -> 77 nb: non usare byteLen, l'ultimo valore può avere bytelen diversa (RR GG BB A)
//             val = Number.parseInt(strval, 16);
//             if (isNaN(val)) return null;
//             arr.push(val);
//             pos += byteLen;
//         }
//         if (arr.length < 3) return null;
//         return {r: arr[0], g: arr[1], b: arr[2], a: arr[3]};
//     }
//
//     static colorObjToArgb(colorObj: {r: number, g: number, b: number, a: number}, prefix = '#', postfix = ''): {r: number, g: number, b: number, a: number, rgbhex: string, rgbahex: string} {
//         const ret = colorObj as {r: number, g: number, b: number, a: number, rgbhex: string, rgbahex: string};
//         let tmp = prefix + UU.toHex(ret.r, 2) + UU.toHex(ret.g, 2) + UU.toHex(ret.b, 2);
//         ret.rgbhex = tmp + postfix;
//         ret.rgbahex =  tmp + UU.toHex(ret.a || ret.a === 0 ? ret.a : 255, 2) + postfix;
//         return ret;
//     }
//
//     static RGBAToHexObj(str: string, prefix = '#', postfix = ''): {r: number, g: number, b: number, a: number, rgbhex: string, rgbahex: string} {
//         str = UU.replaceAll(str, 'a', '');
//         str = UU.replaceAll(str, 'rgb', '');
//         str = UU.replaceAll(UU.replaceAll(str, '(', ''), ')', '');
//         const rgb = str.split( ',' );
//         const ret = {
//             r: parseInt( rgb[0] ), //.toString(16); // .substring(4) skip rgb(
//             g: parseInt( rgb[1] ),
//             b: parseInt( rgb[2] ), // parseInt scraps trailing )
//             a: rgb[3] && rgb[3].length ? 255 * (+rgb[3]) : 255,
//         };
//         return UU.colorObjToArgb(ret);
//     }
//
//     static getIndex(node: Element): number {
//         if (!node.parentElement) { return -1; }
//         // return UU.toArray(node.parentElement.children).indexOf(node);
//         return Array.prototype.indexOf.call(node.parentElement.children, this); }
//
//     static toArray(childNodes: NodeListOf<ChildNode>): ChildNode[] {
//         if (Array['' + 'from']) { return Array['' + 'from'](childNodes); }
//         const array: ChildNode[] = [];
//         let i = -1;
//         while (++i < childNodes.length) { array.push(childNodes[i]); }
//         return array; }
//
//     static getClass(obj: object): string { return (obj as any).__proto__.constructor.name; }
//
//     static isString(elem: any) { return elem + '' === elem; }
//
//     static permuteV2(input: any[]): any[][] {
//         UU.PermuteArr = [];
//         UU.PermuteUsedChars = [];
//         return UU.permute0V2(input); }
//
//     private static permute0V2(input: any[]): any[][] {
//         let i;
//         let ch;
//         for (i = 0; i < input.length; i++) {
//             ch = input.splice(i, 1)[0];
//             UU.PermuteUsedChars.push(ch);
//             if (input.length === 0) {
//                 UU.PermuteArr.push(UU.PermuteUsedChars.slice());
//             }
//             UU.permute0V2(input);
//             input.splice(i, 0, ch);
//             UU.PermuteUsedChars.pop();
//         }
//         return UU.PermuteArr; }
//
//     static permute(inputArr: any[], debug: boolean = true): any[][] {
//         const results: any[][] = [];
//         const permuteInner = (arr: any[], memo: any[] = []) => {
//             let cur;
//             let i: number;
//             for (i = 0; i < arr.length; i++) {
//                 cur = arr.splice(i, 1);
//                 if (arr.length === 0) { results.push(memo.concat(cur)); }
//                 permuteInner(arr.slice(), memo.concat(cur));
//                 arr.splice(i, 0, cur[0]);
//             }
//             return results; };
//         return permuteInner(inputArr); }
//
//     static resizableBorderMouseDblClick(e: MouseDownEvent): void {
//         const size: Size = UU.sizeof(UU.resizingContainer);
//         const minSize: Size = UU.sizeof(UU.resizingBorder);
//         const oldSize: Size = new Size(0, 0, +UU.resizingContainer.dataset.oldsizew, +UU.resizingContainer.dataset.oldsizeh);
//         const horiz: boolean = UU.resizingBorder.classList.contains('left') || UU.resizingBorder.classList.contains('right');
//         const vertic: boolean = UU.resizingBorder.classList.contains('top') || UU.resizingBorder.classList.contains('bottom');
//         if (horiz && vertic) return; // do nothing on corner, non voglio che venga resizato sia a minheight che a minwidth, solo uno dei 2.
//         minSize.w *= horiz ? 2 : 1;
//         minSize.h *= vertic ? 2 : 1;
//         minSize.x = size.x;
//         minSize.y = size.y;
//         // console.log('old, size, min', oldSize, size, minSize, oldSize.w && size.equals(minSize));
//         if (oldSize.w && size.equals(minSize)) {
//             UU.resizingContainer.style.width = UU.resizingContainer.style.minWidth = UU.resizingContainer.style.maxWidth = oldSize.w + 'px';
//             UU.resizingContainer.style.height = UU.resizingContainer.style.minHeight = UU.resizingContainer.style.maxHeight = oldSize.h + 'px'; }
//         else {
//             UU.resizingContainer.style.width = UU.resizingContainer.style.minWidth = UU.resizingContainer.style.maxWidth = minSize.w + 'px';
//             UU.resizingContainer.style.height = UU.resizingContainer.style.minHeight = UU.resizingContainer.style.maxHeight = minSize.h + 'px';
//             UU.resizingContainer.dataset.oldsizew = '' + size.w;
//             UU.resizingContainer.dataset.oldsizeh = '' + size.h; }
//     }
//
//     static resizableBorderMouseDown(e: MouseDownEvent): void {
//         UU.resizingBorder = e.currentTarget;
//         UU.resizingContainer = UU.resizingBorder;
//         UU.resizingContainer.style.padding = '0';
//         UU.resizingContainer.style.flexBasis = '0';
//         // UU.resizingContent.style.width = '100%'; required too
//         while (!UU.resizingContainer.classList.contains('resizableBorderContainer')) {
//             UU.resizingContainer = UU.resizingContainer.parentNode as HTMLElement; }
//         if (UU.checkDblClick()) UU.resizableBorderMouseDblClick(e); }
//
//     static resizableBorderMouseUp(e: MouseDownEvent): void { UU.resizingBorder = UU.resizingContainer = null; }
//     static resizableBorderUnset(e: ContextMenuEvent): void {
//         e.preventDefault();
//         const border: HTMLElement = e.currentTarget;
//         let container: HTMLElement = border;
//         while (container.classList.contains('resizableBorderContainer')) { container = container.parentNode as HTMLElement; }
//         container.style.flexBasis = '';
//         container.style.minHeight = container.style.minWidth =
//             container.style.maxHeight = container.style.maxWidth =
//                 container.style.height = container.style.width = ''; }
//
//     static resizableBorderMouseMove(e: MouseDownEvent): void {
//         if (!UU.resizingBorder) { return; }
//         const size: Size = UU.sizeof(UU.resizingContainer);
//         const missing: Point = new Point(0, 0);
//         const cursor: Point = new Point(e.pageX, e.pageY);
//         const puntoDaFarCoinciderePT: Point = cursor.duplicate();
//         const l: boolean = UU.resizingBorder.classList.contains('left');
//         const r: boolean = UU.resizingBorder.classList.contains('right');
//         const t: boolean = UU.resizingBorder.classList.contains('top');
//         const b: boolean = UU.resizingBorder.classList.contains('bottom');
//         if (l) { puntoDaFarCoinciderePT.x = size.x; }
//         if (r) { puntoDaFarCoinciderePT.x = size.x + size.w; }
//         if (t) { puntoDaFarCoinciderePT.y = size.y; }
//         if (b) { puntoDaFarCoinciderePT.y = size.y + size.h; }
//         const add: Point = cursor.subtract(puntoDaFarCoinciderePT, true);
//         if (l) { add.x *= -1; }
//         if (t) { add.y *= -1; }
//         // o = p0 - c
//         // p = c
//         // c = p0-o
//         // console.log('lrtb: ', l, r, t, b);
//         // console.log('ptcoinc: ', puntoDaFarCoinciderePT, ' cursor:', cursor, ' size:', size, 'adjust:', add);
//         size.w += add.x;
//         size.h += add.y;
//         const borderSize: Size = UU.sizeof(UU.resizingBorder);
//         if (l || r) { size.w = Math.max(size.w, borderSize.w * 2); }
//         if (t || b) { size.h = Math.max(size.h, borderSize.h * 2); }
//         UU.resizingContainer.style.width = UU.resizingContainer.style.maxWidth = UU.resizingContainer.style.minWidth = (size.w) + 'px';
//         UU.resizingContainer.style.height = UU.resizingContainer.style.maxHeight = UU.resizingContainer.style.minHeight = (size.h) + 'px';
//         // console.log('result:' + UU.resizingContainer.style.width);
//         UU.resizingContainer.style.flexBasis = 'unset'; }
//
//     static resizableBorderSetup(root: HTMLElement = document.body): void {
//         // todo: addBack is great, aggiungilo tipo ovunque. find() esclude l'elemento radice anche se matcha la query, addback rimedia aggiungendo il
//         //  previous matched set che matcha la condizione.
//         const $arr = $(root).find('.resizableBorder').addBack('.resizableBorder');
//         let i = -1;
//         const nl = '\n';
//         while (++i < $arr.length) {
//             UU.makeResizableBorder($arr[i]); }
//         UU.eventiDaAggiungereAlBody(null);
//         $(document.body).off('mousemove.ResizableBorder').on('mousemove.ResizableBorder', UU.resizableBorderMouseMove);
//         $(document.body).off('mouseup.ResizableBorder').on('mouseup.ResizableBorder', UU.resizableBorderMouseUp);
//         $('.resizableBorder.corner').off('mousedown.ResizableBorder').on('mousedown.ResizableBorder', UU.resizableBorderMouseDown)
//             .off('contextmenUU.ResizableBorder').on('contextmenUU.ResizableBorder', UU.resizableBorderUnset);
//         $('.resizableBorder.side').off('mousedown.ResizableBorder').on('mousedown.ResizableBorder', UU.resizableBorderMouseDown)
//             .off('contextmenUU.ResizableBorder').on('contextmenUU.ResizableBorder', UU.resizableBorderUnset);
//         return; }
//
//     static makeResizableBorder(html: HTMLElement, left: boolean = true, top: boolean = true, right: boolean = true, bottom = true): void {
//         // if (!html.classList.contains('resizableBorderContainer')) { html.classList.add('resizableBorderContainer'); }
//         let container: HTMLElement = null;
//         let content: HTMLElement = null;
//         if (false && html.children.length === 9 && html.children[4].classList.contains('resizableContent')) {
//             // already initialized.
//             container = html;
//             content = container.children[4] as HTMLElement;
//             UU.clear(container);
//         } else {
//             // first run: initialing now.
//             // const tmpNode: HTMLElement = document.createElement('div');
//             // while (html.firstChild) { tmpNode.appendChild(html.firstChild); }
//             // while (tmpNode.firstChild) { content.appendChild(tmpNode.firstChild); }
//             content = html;
//             container = UU.cloneHtml(html, false);
//             html.setAttribute('original', 'true');
//             while (container.classList.length > 0) { container.classList.remove(container.classList.item(0)); }
//         }
//         // console.log('container:', container, 'content:', content);
//         UU.pe(container.children.length !== 0, '');
//         // UU.copyStyle(html, container);
//         html.parentNode.insertBefore(container, html);
//         content.classList.remove('resizableBorderContainer');
//         content.classList.add('resizableContent');
//         container.classList.add('resizableBorderContainer');
//         if (left) { html.dataset.resizableleft = 'true'; }
//         if (right) { html.dataset.resizableright = 'true'; }
//         if (top) { html.dataset.resizabletop = 'true'; }
//         if (bottom) { html.dataset.resizablebottom = 'true'; }
//
//         left = html.dataset.resizableleft === 'true';
//         right = html.dataset.resizableright === 'true';
//         top = html.dataset.resizabletop === 'true';
//         bottom = html.dataset.resizablebottom === 'true';
//
//         // const size: Size = UU.sizeof(html);
//         // container.style.width = size.w + 'px';
//         // container.style.height = size.h + 'px';
//         const l: HTMLElement = UU.toHtml('<div class="resizableBorder side left"></div>');
//         const r: HTMLElement = UU.toHtml('<div class="resizableBorder side right"></div>');
//         const t: HTMLElement = UU.toHtml('<div class="resizableBorder side top"></div>');
//         const b: HTMLElement = UU.toHtml('<div class="resizableBorder side bottom"></div>');
//         const tl: HTMLElement = UU.toHtml('<div class="resizableBorder corner top left"></div>');
//         const tr: HTMLElement = UU.toHtml('<div class="resizableBorder corner top right"></div>');
//         const bl: HTMLElement = UU.toHtml('<div class="resizableBorder corner bottom left"></div>');
//         const br: HTMLElement = UU.toHtml('<div class="resizableBorder corner bottom right"></div>');
//         const hstripT: HTMLElement = UU.toHtml('<div class="resizableStrip up"></div>');
//         const hstripM: HTMLElement = UU.toHtml('<div class="resizableStrip center"></div>');
//         const hstripB: HTMLElement = UU.toHtml('<div class="resizableStrip down"></div>');
//         l.dataset.resizeenabled = left ? 'true' : 'false';
//         r.dataset.resizeenabled = right ? 'true' : 'false';
//         t.dataset.resizeenabled = top ? 'true' : 'false';
//         b.dataset.resizeenabled = bottom ? 'true' : 'false';
//         tl.dataset.resizeenabled = top && left ? 'true' : 'false';
//         tr.dataset.resizeenabled = top && right ? 'true' : 'false';
//         bl.dataset.resizeenabled = bottom && left ? 'true' : 'false';
//         br.dataset.resizeenabled = bottom && right ? 'true' : 'false';
//         const style: CSSStyleDeclaration = getComputedStyle(html, null);
//         // html.style.border = 'none';
//         t.style.borderTop = tl.style.borderTop = tr.style.borderTop = style.borderTop; // || '0';
//         b.style.borderBottom = bl.style.borderBottom = br.style.borderBottom = style.borderBottom; // || '0';
//         l.style.borderLeft = tl.style.borderLeft = bl.style.borderLeft = style.borderLeft; // || '0';
//         r.style.borderRight = tr.style.borderRight = br.style.borderRight = style.borderRight; // || '0';
//
//         // per un bug lo stile viene sempre letto come "none"
//         /*l.style.borderStyle = 'solid';
//     r.style.borderStyle = 'solid';
//     t.style.borderStyle = 'solid';
//     b.style.borderStyle = 'solid';*/
//         //console.log('style.border:', style.border);
//         /*UU.pe(t.style.borderTopStyle === 'none', '1');
//     UU.pe(isNaN(+t.style.borderWidth), '2');
//     UU.pe(+t.style.borderWidth === 0, '3');
//     if (t.style.borderTopStyle === 'none' || isNaN(+t.style.borderWidth) || +t.style.borderWidth === 0) {
//       t.style.borderWidth = t.style.height = t.style.width = t.style.flexGrow = '0'; }
//     if (b.style.borderBottomStyle === 'none' || isNaN(+b.style.borderWidth) || +b.style.borderWidth === 0) {
//       b.style.borderWidth = b.style.height = b.style.width = b.style.flexGrow = '0'; }
//     if (l.style.borderLeftStyle === 'none' || isNaN(+l.style.borderWidth) || +l.style.borderWidth === 0) {
//       l.style.borderWidth = l.style.height = l.style.width = l.style.flexGrow = '0'; }
//     if (r.style.borderTopStyle === 'none' || isNaN(+r.style.borderWidth) || +r.style.borderWidth === 0) {
//       r.style.borderWidth = r.style.height = r.style.width = r.style.flexGrow = '0'; }*/
//         /*
//     const borderSizeL: Size;
//     const borderSizeR: Size;
//     const borderSizeT: Size;
//     const borderSizeB: Size;
//     tl.style.width = l.style.width = bl.style.width = (borderSizeL.w) + 'px';
//     tr.style.width = r.style.width = br.style.width = (borderSizeR.w) + 'px';
//     tl.style.height = t.style.height = tr.style.height = (borderSizeT.h) + 'px';
//     bl.style.height = b.style.height = br.style.height = (borderSizeB.h) + 'px';
//
//     t.style.width = b.style.width = (size.w - (borderSizeL.w + borderSizeR.w)) + 'px';
//     l.style.height = r.style.height = (size.h - (borderSizeT.h + borderSizeB.w)) + 'px';*/
//         // html.parentNode.appendChild(container);
//         hstripT.appendChild(tl);
//         hstripT.appendChild(t);
//         hstripT.appendChild(tr);
//         hstripM.appendChild(l);
//         hstripM.appendChild(content);
//         hstripM.appendChild(r);
//         hstripB.appendChild(bl);
//         hstripB.appendChild(b);
//         hstripB.appendChild(br);
//         container.appendChild(hstripT);
//         container.appendChild(hstripM);
//         container.appendChild(hstripB);
//         container.style.border = 'none';/*
//     const size: Size = UU.sizeof(container);
//     const hbordersize = 10;
//     const vbordersize = 10;
//     container.style.width = Math.max(hbordersize * 2 + size.w) + 'px';
//     container.style.height = Math.max(vbordersize * 2 + size.h) + 'px';*/
//         content.style.border = 'none';
//         if (!content.style.width || content.style.width === 'auto'){
//             content.style.width = '100%';
//             content.style.height = '100%'; }
//         content.style.minWidth = '0';
//         content.style.minHeight = '0';
//
//     }
//
//     static copyStyle(from: HTMLElement | SVGGElement, to: HTMLElement | SVGGElement, computedStyle: CSSStyleDeclaration = null): boolean {
//         // trying to figure out which style object we need to use depense on the browser support, so we try until we have one.
//         if (!computedStyle) { computedStyle = from['' + 'currentStyle'] || document.defaultView.getComputedStyle(from, null); }
//         // if the browser dose not support both methods we will return failure.
//         if (!computedStyle) { return false; }
//         // checking that the value is not a undefined, object, function, empty or int index ( happens on some browser)
//         const stylePropertyValid = (name: any, value: any) => {
//             // nb: mind that typeof [] === 'object';
//             return typeof value !== 'undefined' && typeof value !== 'object' && typeof value !== 'function' && value.length > 0
//                 // && value !== parseInt(value, 10); };
//                 && +name !== parseInt(name, 10); };
//
//         let property: string;
//         for (property in computedStyle) {
//             // hasOwnProperty is useless, but compiler required
//             // console.log('property[', property, '] = ', computedStyle[property]);
//             if (!computedStyle.hasOwnProperty(property) || !stylePropertyValid(property, computedStyle[property])) { continue; }
//             to.style[property] = computedStyle[property];
//         }
//         return true; }
//
//     static cclear(): void { console.clear(); console.trace(); }
//
//     static toDottedURI(uri: string): string {
//         return UU.replaceAll(UU.replaceAll(uri.substring(uri.indexOf('://') + '://'.length), '\\', '/'), '/', '.');
//     }
//     static toHttpsURI(uri: string, folderChar: string = '/'): string {
//         return 'https://' + UU.replaceAll(uri, '.', folderChar);
//     }
//
//     static toNumber(o: any) {
//         if (o === null || o === undefined || (UU.isString(o) && o.trim() === '')) return null;
//         o = +o;
//         if (isNaN(o)) return null;
//         return o; }
//
//     // returns true only if parameter is a number or a stringified number. UU.isNumber('3') will return true
//     static isNumerizable(o: any): boolean { return o !== null && o !== undefined && o !== '' && !isNaN(+o); }
//     static isNumberArray(o: any, minn: number = Number.NEGATIVE_INFINITY, max: number = Number.POSITIVE_INFINITY,
//                          ifItIsEmptyArrReturn: boolean = true): boolean {
//         const validation = (val: number) => UU.isNumber(val) && val >= minn && val <= max;
//         return UU.isArrayOf(o, validation, ifItIsEmptyArrReturn); }
//
//     static isIntegerArray(o: any, minn: number = Number.NEGATIVE_INFINITY, max: number = Number.POSITIVE_INFINITY,
//                           ifItIsEmptyArrReturn: boolean = true): boolean {
//         const validation = (val: number) => (UU.isNumber(val) && Math.floor(val) === val && val >= minn && val <= max);
//         return UU.isArrayOf(o, validation, ifItIsEmptyArrReturn); }
//
//     static isCharArray(values: any, ifItIsEmpryArrayReturn: boolean = true): boolean {
//         const charValidator = (val: string) => (val.length === 1);
//         return UU.isArrayOf(values, charValidator, ifItIsEmpryArrayReturn); }
//     static isArrayOf(value: any, functionCheck: any, ifItIsEmptyArrayReturn: boolean = true): boolean {
//         if (!Array.isArray(value)) { return false; }
//         let i: number;
//         if (value.length === 0) { return ifItIsEmptyArrayReturn; }
//         for (i = 0; i < value.length; i++) {
//             if (!functionCheck(value[i]) && !UU.isArrayOf(value[i], functionCheck, ifItIsEmptyArrayReturn)) { return false; }
//         }
//         return true; }
//
//
//     static isStringArray(value: any, ifItIsEmptyArrayReturn: boolean = true): boolean {
//         if (!Array.isArray(value)) { return false; }
//         let i: number;
//         if (value.length === 0) { return ifItIsEmptyArrayReturn; }
//         for (i = 0; i < value.length; i++) { if (!UU.isString(value[i]) && !UU.isStringArray(value[i], true)) { return false; } }
//         return true; }
//
//     static clipboardCopy(text: string): void {
//         if (!UU.clipboardinput) {
//             UU.clipboardinput = document.createElement('input');
//             UU.clipboardinput.id = UU.prefix + 'CopyDataToClipboard';
//             UU.clipboardinput.type = 'text';
//             UU.clipboardinput.style.display = 'block';
//             UU.clipboardinput.style.position = 'absolute';
//             UU.clipboardinput.style.top = '-100vh'; }
//         document.body.appendChild(UU.clipboardinput);
//         UU.clipboardinput.value = text;
//         UU.clipboardinput.select();
//         document.execCommand('copy');
//         document.body.removeChild(UU.clipboardinput);
//         UU.clearSelection(); }
//
//     static clearSelection() {}
//
//     static refreshPage(): void { window.location.href += ''; }
//
//     static isArray(v: any): boolean { return Array.isArray(v); }
//
//     static isEmptyObject(v: any, returnIfNull: boolean = true, returnIfUndefined: boolean = false): boolean {
//         return UU.isObject(v, returnIfNull, returnIfUndefined) && $.isEmptyObject(v); }
//
//     static isObject(v: any, returnIfNull: boolean = true, returnIfUndefined: boolean = false, retIfArray: boolean = false): boolean {
//         if (v === null) { return returnIfNull; } riscritto in JsTypes
//         if (v === undefined) { return returnIfUndefined; }
//         if (Array.isArray(v)) { return retIfArray; }
//         // nb: mind that typeof [] === 'object'
//         return typeof v === 'object'; }
//
//     static isFunction(v: any): boolean { return (typeof v === 'function'); }
//
//     static isPrimitive(v: any, returnIfNull: boolean = true, returnIfUndefined: boolean = true): boolean {
//         if (v === null) { return returnIfNull; }
//         if (v === undefined) { return returnIfUndefined; }
//         // return (typeof v !== 'function') && (typeof v !== 'object') && (!UU.isArray(v));
//         return !UU.isObject(v) && !Array.isArray(v) && !UU.isFunction(v); }
//
//     static isValidName(name: string): boolean { return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name); }
//
//     static getTSClassName(thing: any): string {
//         if (!thing || !thing.constructor) return typeof(thing);
//         return thing.constructor.name + ''; }
//
//     static detailButtonSetup($root = null): void {
//         if (!$root) $root = $(document.body);
//         $root.find('button.detail').off('click.detailbutton').on('click.detailbutton', (e: ClickEvent, forceHide: boolean) => {
//             const btn = e.currentTarget as HTMLButtonElement;
//             const $btn = $(btn);
//             const $detailPanel = $root.find(btn.getAttribute('target'));
//             const otherButtons: HTMLButtonElement[] = $(btn.parentElement).find('button.detail').toArray().filter(x => x != btn) as any;
//             // $styleown.find('div.detail:not(' + btn.getAttribute('target') + ')');
//
//             const b: boolean = btn.dataset.on === '1';
//             if (forceHide || b) {
//                 btn.style.width = '';
//                 btn.dataset.on = '0';
//                 btn.style.borderBottom = '';
//                 btn.style.borderBottomLeftRadius = '';
//                 btn.style.borderBottomRightRadius = '';
//                 $btn.find('.closed').show();
//                 $btn.find('.opened').hide();
//                 // $detailcontainers.show();
//                 $detailPanel.hide();
//             } else {
//                 const size: Size = UU.sizeof(btn);
//                 btn.style.width = size.w + 'px';
//                 btn.dataset.on = '1';
//                 btn.style.borderBottom = 'none'; // '3px solid #252525';
//                 btn.style.borderBottomLeftRadius = '0';
//                 btn.style.borderBottomRightRadius = '0';
//                 $btn.find('.closed').hide();
//                 $btn.find('.opened').show()[0].style.width = (size.w - 15 * 2) + 'px';
//                 // console.log('others:', otherButtons, 'me:', $btn);
//                 $(otherButtons).data('on', '1').trigger('click', true);
//                 $detailPanel.show();
//             }
//         });
//         $root.find('div.detail').hide();
//     }
//
//
//     static replaceAllRegExp(value: string, regExp: RegExp, replacement: string): string { return value.replace(regExp, replacement); }
//
//     static fixHtmlSelected($root: JQuery<Element>): void {
//         const $selecteds: JQuery<HTMLSelectElement> = $root.find('select') as JQuery<HTMLSelectElement>;
//         let i: number;
//         for (i = 0 ; i < $selecteds.length; i++) {
//             const $option: JQuery<HTMLOptionElement> = $($selecteds[i]).find('option[selected]') as any as JQuery<HTMLOptionElement>;
//             UU.selectHtml($selecteds[i], $option.length ? $option[0].value : null); }
//     }
//
//     // ignores first N equal chars and return the substring of s1 from N to N+len or until s1 end.
//     public static strFirstDiff(s1: string, s2: string, len: number): string[] {
//         let i: number;
//         if (!s1 && !s2) { return [s1, s2]; }
//         if (s1 && !s2) { return [s1.substr(0, len), s2]; }
//         if (!s1 && s2) { return [s1, s2.substr(0, len)]; }
//         const min: number = Math.min(s1.length, s2.length);
//         for (i = 0; i < min; i++) { if (s1[i] !== s2[i]) { return [s1.substr(i, len), s2.substr(i, len)]; } }
//         return null; }
//
//     // get the index of the first char not equal between s1 and s2 or null if one of the string ended.
//     public static strFirstDiffIndex(s1: string, s2: string): number{
//         let i: number = -1;
//         if (!s1 || !s2) return -1;
//         let minlen: number = Math.min(s1.length, s2.length);
//         // console.log('strequal minlen:', minlen, '|'+s1+'|', '|'+s2+'|');
//         for (i = -1; ++i < minlen && s1[i] === s2[i];) {
//             // console.log('strequal:', i, 's1:', s1[i], 's2', s2[i], true);
//         }
//         return i; }
//
//     public static mergeArray(a: any[], b: any[], inplace: boolean, asSet: boolean): any[] {
//         a = a || [];
//         b = b || [];
//         let ret: any[];
//         if (inplace) { (ret = a).push(...b); } else { ret = a.concat(...b); }
//         return asSet ? [...new Set(ret)] : ret; }
//
//     public static mergeClasses(elem1: Element, elem2: Element): void {
//         const classes1: string[] = elem1.getAttribute('class').split(' ');
//         const classes2: string[] = elem2.getAttribute('class').split(' ');
//         elem1.setAttribute('class', UU.mergeArray(classes1, classes2, true, true).join(' ')); }
//
//     public static mergeStyles(html: Element, fake: Element = null, styleString: string = null, prioritizeFake: boolean = false): void {
//         let i: number;
//         const styles1: any[] = html.getAttribute('style').split(';');
//         const styles2: any[] = (styleString = (styleString ? styleString : fake.getAttribute('style'))).split(';');
//         let stylesKv1: Dictionary<string, string> = {};
//         let stylesKv2: Dictionary<string, string> = {};
//         let key: string;
//         let val: string;
//         let pos: number;
//         for (i = 0; i < styles1.length; i++) {
//             pos = styles1[i].indexOf(':');
//             key = styles1[i].substr(0, pos).trim();
//             val = styles1[i].substr(pos + 1).trim();
//             if (key == '' || val == '') continue;
//             stylesKv1[key] = val; }
//         for (i = 0; i < styles2.length; i++) {
//             pos = styles2[i].indexOf(':');
//             key = styles2[i].substr(0, pos).trim();
//             val = styles2[i].substr(pos + 1).trim();
//             if (key == '' || val == '') continue;
//             stylesKv2[key] = val; }
//         if (prioritizeFake) {
//             let tmp = stylesKv1;
//             stylesKv1 = stylesKv2;
//             stylesKv2 = tmp; }
//         stylesKv1 = UU.join(stylesKv1, stylesKv2, true, false);
//         let style: string = '';
//         for (key in stylesKv1) { style += key + ':' + stylesKv1[key] + '; '; }
//         // console.log('final Style:', style, stylesKv1, stylesKv2, styles2);
//         html.setAttribute('style', style); }
//
//     public static merge(a: object, b: object, overwriteNull: boolean = true, clone: boolean = true): object { return UU.join(a, b, overwriteNull, clone); }
//     public static join(a: object, b: object, overwriteNull: boolean = true, clone: boolean = true): object {
//         if (clone) { a = UU.cloneObj(a); }
//         let key: string;
//         for (key in b) {
//             if (!b.hasOwnProperty(key)) { continue; }
//             if (b[key] !== undefined && a[key] === null && overwriteNull || a[key] === undefined) { a[key] = b[key]; }
//         }
//         return a;
//     }
//
//     public static getChildIndex_old(html: Node, allNodes: boolean = true): number {
//         if (allNodes) { return Array.prototype.indexOf.call(html.parentNode.childNodes, html); }
//         return Array.prototype.indexOf.call(html.parentNode.children, html); }
//
//     public static getChildIndex<T>(array: T[] | any, child: T | any): number {
//         return Array.prototype.indexOf.call(array, child); }
//
//     public static getIndexesPath_old(parent: Element, child: Element) {
//         let ret: number[] = [];
//         while (child && child !== parent) {
//             ret.push(UU.getChildIndex(parent.childNodes, child));
//             child = child.parentElement; }
//         // ret = ret.splice(ret.length - 2, 1);
//         return ret.reverse(); }
//
//     public static getIndexesPath_NoParentKey<T>(child: T, parent: any): string[] {
//         UU.pe(true, 'getindexespath without parent key: todo');
//         return null;
//         // todo: top-down ricorsivo a tentativi. implementa loop detection. senza childkey (può variare es: parent.a[3].b.c[1] = child)
//         //  return string array con nomi di campi e indici di array.
//     }
//     public static getIndexesPath<T>(child: T, parentKey: string, childKey: string = null /* null = parent is raw array*/, parentLimit: T = null) {
//         let ret: number[] = [];
//         while (child) {
//             const parent: any = child[parentKey];
//             if (child === parentLimit) { break; }
//             if (!parent || parent === child) { break; }
//             const parentArrChilds: T[] = childKey ? parent[childKey] : parent;
//             ret.push(UU.getChildIndex(parentArrChilds, child));
//             child = child[parentKey];
//         }
//         return ret.reverse(); }
//
//     static followIndexesPath(root: any, indexedPath: (number | string)[], childKey: string,
//                              outArr: {indexFollowed: (number | string)[], debugArr: {index: string | number, elem: any}[]} = {indexFollowed: [],
//                                  debugArr: [{index: 'Start', elem: root}]}, debug: boolean = false): any
//     {
//         let j: number;
//         let ret: any = root;
//         let oldret: any = ret;
//         UU.pe(!childKey, 'must define a childkey', childKey);
//         if (outArr) outArr.debugArr.push({index: 'start', elem: root, childKey: childKey} as any);
//         debug = +window['debugi'] === 1;
//         UU.pe(childKey && childKey !== '' + childKey, 'UU.followIndexesPath() childkey must be a string or a null:', childKey, 'root:', root);
//         for (j = 0; j < indexedPath.length; j++) {
//             let key: number | string = indexedPath[j];
//             let childArr = childKey ? ret[childKey] : ret;
//             UU.pif(debug, 'path ' + j + ') = elem.' + childKey + ' = ', childArr);
//             if (!childArr) { UU.pif(debug, 'UU.followIndexEnd 1:', outArr); return oldret; }
//             ret = childArr[key];
//             if (key >= childArr.length) { key = 'Key out of boundary: ' + key + '/' + childArr.length + '.'; }
//             UU.pif(debug, 'path ' + j + ') = elem.' + childKey + '[ ' + key + '] = ', ret);
//             if (outArr) outArr.debugArr.push({index: key, elem: ret});
//             if (!ret) { UU.pif(debug, 'UU.followIndexEnd 2:', outArr); return oldret; }
//             if (outArr) outArr.indexFollowed.push(key);
//             oldret = ret;
//         }
//         UU.pif(debug, 'UU.followIndexEnd 3:', outArr);
//         return ret; }
//
//     static followIndexesPathOld(templateRoot: Element, indexedPath: number[], allNodes: boolean = true,
//                                 outArr: {indexFollowed: number[]} = {indexFollowed: []}, debug: boolean = false): Element {
//         let j: number;
//         let ret: Element = templateRoot;
//         let oldret: Element = ret;
//         const debugarr: {index: number, html: Node}[] = [{index: 'Start' as any, html: ret}];
//         for (j = 0; j < indexedPath.length; j++) {
//             const index = indexedPath[j];
//             ret = (allNodes ? ret.childNodes[index] : ret.children[index]) as any;
//             if (!ret) {
//                 console.log('folllowPath: clicked on some dinamically generated content, returning the closest static parent.', debugarr);
//                 UU.pw(debug, 'clicked on some dinamically generated content, returning the closest static parent.', debugarr);
//                 return oldret; }
//             oldret = ret;
//             outArr.indexFollowed.push(index);
//             debugarr.push({index: index, html: ret});
//         }
//         UU.pif(debug, 'followpath debug arr:', debugarr);
//         return ret; }
//
//     static removeDuplicates(arr0: any[], clone: boolean = false): any[] { return UU.mergeArray(arr0, [], !clone, true); }
//
//     private static startSeparatorKeys = {}; nope, just use [].join(separator)
//     private static startSeparatorKeyMax = -1;
//     public static getStartSeparatorKey(): string { return ++UU.startSeparatorKeyMax + ''; }
//     public static startSeparator(key: string, separator: string = ', '): string {
//         if (key in UU.startSeparatorKeys) return separator;
//         UU.startSeparatorKeys[key] = true;
//         return ''; }
//
//     static arrayContains(arr: any[], searchElem: any): boolean {
//         if (!arr) return false;
//         // return arr && arr.indexOf(searchElem) === -1; not working properly on strings. maybe they are evaluated by references and not by values.
//         let i: number;
//         for (i = 0; i < arr.length; i++) { if (arr[i] === searchElem) return true; }
//         return false; }
//
//     static toBoolString(bool: boolean): string { return bool ? "true" : "false"; }
//     static fromBoolString<T>(str: string | boolean, defaultVal: boolean | T = false, allowNull: boolean = false, allowUndefined: boolean = false): boolean | T {
//         str = ('' + str).toLowerCase();
//         if (allowNull && (str === 'null')) return null;
//         if (allowUndefined && (str === 'undefined')) return undefined;
//
//         if (str === "true" || str === 't' || str === '1') return true;
//         // if (defaultVal === true) return str === "false" || str === 'f' || str === '0'; // false solo se è esplicitamente false, true se ambiguo.
//         if (str === "false" || str === 'f' || str === '0') return false;
//         return defaultVal;
//     }
//
//     static parseNumberOrBoolean(val: string, params: ParseNumberOrBooleanOptions = new ParseNumberOrBooleanOptions()): number {
//         let booleanTry: boolean | '' = UU.fromBoolString(val, '', true, true);
//         // console.log("isAllowingEdge parsenumberorboolean:", booleanTry, "|", params, "|", val);
//         switch ('' + booleanTry) {
//             default: UU.pe(true, "dev error, unexpected case on UU.parseNumberOfBoolean: ", val, ' = ', booleanTry); break;
//             case 'true': if (params.allowBooleans) return params.trueValue; break;
//             case 'false': if (params.allowBooleans) return params.falseValue; break;
//             case 'undefined': if (params.allowUndefined) return params.undefinedValue; break;
//             case 'null': if (params.allowNull) return params.nullValue; break;
//             case '':
//                 let valnumber: number = +val;
//                 if (isNaN(valnumber)) return params.allowedNan ? params.nanValue : params.defaultValue;
//                 return valnumber;
//         }
//         return params.defaultValue;
//     }
//
//     static parseSvgPath(str: string): {assoc: {letter: string, pt: Point}[], pts: Point[]} {
//         let i: number;
//         let letter: string = null;
//         let num1: string = null;
//         let num2: string = null; // useless initializing phase to avoid IDE warnings
//         let foundFloat: boolean = null;
//         let pt: Point = null;
//         let current: {letter: string, pt: Point} = null;
//         const assoc: {letter: string, pt: Point}[] = [];
//         const pts: Point[] = [];
//         const ret = {assoc: assoc, pts: pts};
//         const debug: boolean = false;
//         str = str.toUpperCase();
//
//         const startNextEntry = () => {
//             num1 = '';
//             num2 = '';
//             pt = new Point(0, 0);
//             pt.x = null;
//             pt.y = null;
//             foundFloat = false; };
//         const endCurrentEntry = () => {
//             pt.y = +num2;
//             UU.pe(isNaN(pt.y), 'parsed non-number as value of: |' + letter + '| in svg.path attribute: |' + str + '|', ret);
//
//             current = {letter: letter, pt: pt};
//             UU.pe(pt.x === null || pt.y === null, num1, num2, pt, i, str);
//             pts.push(pt);
//             assoc.push(current);
//             UU.pif(debug, 'endEntry:', current, ' position: |' + str.substr(0, i) + '|' + str.substr(i)+"|");
//             startNextEntry();
//         };
//         startNextEntry();
//         for (i = 0; i < str.length; i++) {
//             const c: string = str[i];
//             switch (c) {
//                 case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '.': case '-': case '+':
//                     if (c === '.') { UU.pe(foundFloat, ' found 2 floating points in a single parsed number in svg.path attribute: |' + str + '|'); foundFloat = true; }
//                     UU.pe((c === '+' || c === '-') && (pt.x === null && num1 !== '' || pt.y === null && num2 !== ''), 'found a ' + c + ' sign inside a number:', ret, i, str);
//                     if (pt.x === null) { num1 += c; break; }
//                     if (pt.y === null) { num2 += c; break; }
//                     UU.pe(true, 'found 3 numbers while parsing svg.path attribute: |' + str + '|', ret); break;
//                 case ' ':
//                     if (pt.x === null) {
//                         pt.x = +num1;
//                         foundFloat = false;
//                         UU.pe(isNaN(+pt.x), 'parsed non-number as value of: |' + letter + '| in svg.path attribute: |' + str + '|', ret); break; }
//                     if (pt.y === null) {
//                         pt.y = +num2;
//                         UU.pe(isNaN(+pt.y), 'parsed non-number as value of: |' + letter + '| in svg.path attribute: |' + str + '|', ret); break; }
//                     break;
//                 default:
//                     if (letter) { endCurrentEntry(); }
//                     letter = c;
//                     break;
//             }
//         }
//         endCurrentEntry();
//         return ret;
//     }
//
//     public static focusHistoryEntriesAndIdleTimes: (FocusHistoryEntry | null)[] = undefined;
//     public static focusHistoryEntries: FocusHistoryEntry[] = undefined;
//     public static focusHistoryElements: Element[] = undefined;
//     public static focusHistorySetup(): void {
//         UU.focusHistoryEntries = UU.focusHistoryEntries || [];
//         UU.focusHistoryElements = UU.focusHistoryElements || [];
//         UU.focusHistoryEntriesAndIdleTimes = UU.focusHistoryEntriesAndIdleTimes || [];
//         $(document).off('focusin.history').on('focusin.history', (e: FocusInEvent) => {
//             const element: Element = e.target;
//             // if (document.activeElement === element) return; // do i need to avoid duplicates or not?
//             const entry = new FocusHistoryEntry(e, element);
//             UU.focusHistoryEntriesAndIdleTimes.push(entry);
//             UU.focusHistoryElements.push(element);
//             UU.focusHistoryEntries.push(entry);
//             setTimeout(() => { UU.focusHistoryEntriesAndIdleTimes.push(null); }, 0);
//         });
//     }
//     public static focusHistoryReset(): void {
//         UU.focusHistoryEntries = [];
//         UU.focusHistoryElements = []; }
//     public static getLastFocusEntry(): FocusHistoryEntry {
//         UU.pe(!UU.focusHistoryEntries, 'focus history not initializated. call UU.focusHistorySetup() before');
//         return UU.focusHistoryEntries[UU.focusHistoryEntries.length]; }
//     /*
//   static unescapeHtmlEntities(s: string): string { return HE.decode(s); }
//   static escapeHtmlEntities(s: string): string { return HE.encode(s); }*/
//     static shallowArrayCopy<T>(arr: T[]): T[] {
//         let ret: T[] = [];
//         let i: number;
//         if (!arr) return null;
//         for (i = 0; i < arr.length; i++) { ret.push(arr[i]); }
//         return ret; }
//
//     static arrayInsertAt(arr: any[], index: number, item: any): void {
//         UU.pe(!arr || !Array.isArray(arr), 'ArrayInsertAt() must have a parameter array');
//         index = Math.max(0, index);
//         index = Math.min(arr.length, index);
//         arr.splice(index, 0, item);
//     }
//
//     static newArray(size: number): any[] {
//         let ret = [];
//         ret.length = Math.max(0, size);
//         return ret; }
//
//     static isInput(target: Node, deep_up: boolean, select: boolean = true, input: boolean = true,
//                    textarea: boolean = true, contenteditable: boolean = true): boolean {
//         let tag: string;
//         let attrcontenteditable: string;
//         let inputcheck: string = input ? 'input' : 'mustfail';
//         let selectcheck: string = select ? 'select' : 'mustfail';
//         let textareacheck: string = textarea ? 'textarea' : 'mustfail';
//         while (target) {
//             if (target === window.document) return false;
//             let targetElement: Element = target instanceof Element ? target : null;
//             tag = targetElement ? targetElement.tagName.toLowerCase() : null;
//             if (tag === inputcheck || tag === selectcheck || tag === textareacheck) {
//                 // console.log('isInput:', target);
//                 return true; }
//             attrcontenteditable = contenteditable && targetElement ? targetElement.getAttribute('contenteditable') : null;
//             if (attrcontenteditable === '' || attrcontenteditable === 'true') {
//                 // console.log('isInput:', target);
//                 return true; }
//             if (!deep_up) return false;
//             target = target.parentNode;
//         }
//         return false;
//     }
//     static getValue(input0: Element): string {
//         if (!input0) return null;
//         const input: HTMLInputElement = (input0 instanceof HTMLInputElement) ? input0 : null;
//         if (input) return input.value;
//         const textarea: HTMLTextAreaElement = (input0 instanceof HTMLTextAreaElement) ? input0 : null;
//         if (textarea) return textarea.value;
//         return input0.getAttribute('value') || input0['' + 'innerText'] || input0.innerHTML; }
//
//     static followsPattern(input0: Element, value: string = null): boolean {
//         let input: HTMLInputElement = (input0 instanceof HTMLInputElement) ? input0 : null;
//         let pattern: string = input ? input.pattern : input0.getAttribute('pattern');
//         if (pattern === null || pattern === undefined) return true;
//         const val = value || (input ? input.value : UU.getValue(input0));
//         const regex =  new RegExp(pattern);
//         return regex && regex.test(val); }
//
//     static trimStart(s: string, trimchars: string[]): string {
//         let i: number;
//         for (i = 0; i < s.length && trimchars.indexOf(s[i]) !== -1; i++) { ; }
//         return s.substr(i); }
//
//
//     static getAttributesByRegex(elem: Element, regexp: RegExp): Attr[]{
//         const ret: Attr[] = [];
//         let i: number;
//         for (i = 0; i < elem.attributes.length; i++) {
//             const attr: Attr = elem.attributes[i];
//             if (regexp.test(attr.name)) ret.push(attr); }
//         return ret; }
//
//     static getAttributes(elem: Element, validator: (a: Attr) => boolean): Attr[] {
//         const ret: Attr[] = [];
//         let i: number;
//         for (i = 0; i < elem.attributes.length; i++) {
//             const attr: Attr = elem.attributes[i];
//             if (validator(attr)) ret.push(attr); }
//         return ret; }
//
//     static getRelativeParentNode(elem: Element): Element {
//         UU.pe(!elem || !(elem instanceof Element), 'UU.getRelativeParentNode argument must be an Element, found instead:', elem);
//         while ((elem = elem.parentElement)) {
//             if (window.getComputedStyle(elem).position === 'relative') { return elem; } }
//         return document.body; }
//
//     static swapChildrens(node1: Node, node2: Node): void {
//         const arr: Node[] = Array.from(node1.childNodes);
//         let i: number;
//         for (i = 0; i < node2.childNodes.length; i++) { node1.appendChild(node2.childNodes[i]); }
//         for (i = 0; i < arr.length; i++) { node2.appendChild(arr[i]); }
//     }
//     static swap(node1: Node, node2: Node): void {
//         UU.pe(node1 && !(node1 instanceof Node) || node2 && !(node2 instanceof Node), 'aUU.swap() arguments mudt be nodes, found instead:', node1, node2);
//         const parent1: Node = node1.parentNode;
//         const parent2: Node = node2.parentNode;
//         // const next1: Node = node1.nextSibling; // qui non è necessario
//         const next2: Node = node2.nextSibling; // se non metto almeno next2, il secondo insertBefore fallisce perchè node2 è stato spostato.
//         //console.log('if (parent1 (', parent1, '))  parent1.insertBefore(', node2, node1, '); parent1.removeChild(', node1, '); }');
//         //console.log('if (parent2 (', parent2, '))  parent2.insertBefore(', node1, next2, '); parent2.removeChild(', node2, '); }');
//         if (parent1) {  parent1.insertBefore(node2, node1); parent1.removeChild(node1); }
//         if (parent2) {  parent2.insertBefore(node1, next2); parent2.removeChild(node2); }
//     }
//
//     static validateDatalist(input: HTMLInputElement, addinvalidclass: boolean = true, checkByValueAttribute: boolean = true): boolean {
//         const debug: boolean = false;
//         debug&&console.log('validateDatalist() input.list', input.list);
//         if (!input.list) return true;
//         let valid: boolean;
//         if (checkByValueAttribute) {
//             debug&&console.log($(input.list), '.find(\'option[value="' + input.value + '"]');
//             valid = $(input.list).find('option[value="' + input.value + '"]').length >= 1;
//         } else {
//             const arr: JQuery<HTMLOptionElement> = $(input.list).find('option[value="' + input.value + '"]') as any;
//             let i: number;
//             valid = false;
//             for (i = 0; i < arr.length; i++) { if (arr[i].innerText === input.value) { valid = true; break; }}
//         }
//         debug&&console.log('input:', input, 'addclass:', addinvalidclass, 'valid:', valid);
//         if (addinvalidclass){
//             if (valid){ input.removeAttribute('invalidDataList'); }else{ input.setAttribute('invalidDataList', 'true'); }
//         }
//         return valid; }
//
//     /// usage: UU.varname({wrappedVariableName}) = 'wrappedVariableName';
//     static varname(wrappedVariable: object): string { return Object.keys(wrappedVariable)[0]; }
//     static varname2(parentObject: object, variable: object): string {
//         for (let key in parentObject) { if (parentObject[key] === variable) return key; }
//         UU.pe(true, 'not a valid parent:', parentObject, variable); }
//
//     static isTriggered(e: Event | TriggeredEvent | EventBase): boolean {
//         // nb: actually JQ.ClickEvent implements JQ.EventBase extends JQ.TriggeredEvent that extends Event (native)
//         // but for some reason the IDE is telling me clickEVent is a TriggeredEVent but not not an Event.
//         let ist = !!e['isTrigger'];
//         let orig = !!e['originalEvent'];
//         UU.pe(ist === orig, 'assertion failed (istrigger):', ist, orig);
//         return ist; }
//
//     static ArrayToMap(arr: (string | number | boolean)[], useLastIndexAsValue: boolean = false): Dictionary<string, boolean | number> { return UU.toMap(arr, useLastIndexAsValue); }
//     static toDictionary(arr: (string | number | boolean)[], useLastIndexAsValue: boolean = false): Dictionary<string, boolean | number> { return UU.toMap(arr, useLastIndexAsValue); }
//     static toMap(arr: (string | number | boolean)[], useLastIndexAsValue: boolean = false): Dictionary<string, boolean | number> {
//         const ret: Dictionary<string, boolean | number> = {};
//         for (let i = 0; i < arr.length; i++) { ret['' + arr[i]] = useLastIndexAsValue ? i : true; }
//         // arr.reduce((accumulator,curr)=> (accumulator[curr]='',accumulator), {}); // geniale da stackoverflow (accumulator was "acc")
//         return ret; }
//
//     static isUnset(val: any, ignorespaces: boolean = true, parseStrings: boolean = true, ifemptystr: boolean = false, ifnull: boolean = true, ifundef: boolean = true, ifzero: boolean = false): boolean{
//         if (val === '' + val) {
//             if (ignorespaces) val = val.trim();
//             if (val === '') return ifemptystr;
//             if (!parseStrings) return true;
//             if (val === 'null') return ifnull;
//             if (val === 'undefined') return ifundef;
//             if (val === '0') return ifzero; }
//
//         if (val) return true;
//         if (val === null) return ifnull;
//         if (val === undefined) return ifundef;
//         if (val === 0) return ifzero;
//         UU.pe(true, 'isUnset() should not reach here', val);
//         return true; }
//
//     // usage: flags should be used only if delimiters are not used.
//     // delimiters can only be single characters
//     static parseRegexString(s: string, onlyIfDelimitedByOneOf: string[] = ['\\', '/'], flags: string = null, canThrow: boolean = true): RegExp {
//         const firstchar = s.charAt(0);
//         let lastindex: number = -1;
//         let i: number;
//         let ret: RegExp;
//         if (s !== '' + s) { UU.pe(canThrow, 'UU.parseRegexString() "s" argument must be a string.', s); return null; }
//         if (onlyIfDelimitedByOneOf) {
//             let found: boolean = false;
//             for (i = 0; i < onlyIfDelimitedByOneOf.length; i++) { if (firstchar === onlyIfDelimitedByOneOf[i]) { found = true; break; } }
//             if (!found) return null;
//             lastindex = s.lastIndexOf(firstchar);
//             if (lastindex === 0) return null;
//             flags = s.substring(lastindex + 1).trim();
//             s = s.substring(1, lastindex).trim();
//             try { ret = new RegExp(s, flags); }
//             catch (e) {
//                 UU.pe(canThrow, 'evaluation of regex string failed:', s, onlyIfDelimitedByOneOf);
//                 return null; }
//             return ret; }
//         if (flags !== '' + flags) { UU.pe(canThrow, 'UU.parseRegexString() "flags" argument must be a string.', flags); return null; }
//         try { ret = new RegExp(s, flags); }
//         catch (e) {
//             UU.pe(canThrow, 'evaluation of regex string failed:', s, onlyIfDelimitedByOneOf);
//             return null; }
//         return ret; }
//
//     static processSelectorPlusPlus(fullselector: string, prioritizeLeftPart: boolean, $searchRoots: JQuery<Element> = null,
//                                    $defaultNode: JQuery<Element> = null, defaultAttributeSelector: string = null, debug: boolean = true): SelectorOutput {
//         fullselector = fullselector.trim();
//         defaultAttributeSelector = defaultAttributeSelector && defaultAttributeSelector.trim().toLowerCase();
//         if (!$searchRoots) $searchRoots = $(document) as any;
//         UU.pe(fullselector !== '' + fullselector, 'Measurable.processSelectorPlusPlus() parameter exception: ', fullselector);
//         ///// try execution
//         let ret: SelectorOutput = new SelectorOutput();
//         ret.resultSetAttr = [];
//         ret.resultSetElem = $([]);
//         if (!$searchRoots.length) return ret;
//         let attributeSelectorIndex: number = fullselector.lastIndexOf(UU.AttributeSelectorOperator);
//         if (attributeSelectorIndex === -1) {
//             attributeSelectorIndex = prioritizeLeftPart ? 0 : fullselector.length
//             fullselector = prioritizeLeftPart ? fullselector + UU.AttributeSelectorOperator : UU.AttributeSelectorOperator + fullselector; }
//         let getAttributes = (html: Element, selector: string, regexp: RegExp): Attr[] => {
//             let ret: Attr[];
//             if (regexp) { ret = UU.getAttributesByRegex(html, regexp); }
//             else ret = UU.getAttributes(html, (a: Attr) => { return a.name.indexOf(selector) === 0; });
//             return ret; };
//         // is mono-right (only attribute)
//         if (attributeSelectorIndex === 0) {
//             ret.jqselector = null;
//             ret.attrselector = fullselector.substr(UU.AttributeSelectorOperator.length).trim().toLowerCase();
//             ret.attrRegex = UU.parseRegexString(ret.attrselector, ['/', '\\'], null, false); }
//
//         UU.pif(debug, 'part1:  index:', attributeSelectorIndex, ' data:', ret);
//         // is mono-left (only jqselector), becomes both.
//         if (attributeSelectorIndex + UU.AttributeSelectorOperator.length === fullselector.length) {
//             ret.jqselector = fullselector.substr(0, attributeSelectorIndex).trim();
//             ret.attrselector = defaultAttributeSelector ? defaultAttributeSelector : null;
//             ret.attrRegex = null; }
//
//         UU.pif(debug, 'part2:  index:', attributeSelectorIndex, ' data:', ret);
//         // check if ambiguous mono-part (left or right?), becomes both
//         /*
//     if (attributeSelectorIndex === -1) {
//       // first try to see if is attribute only.
//       ret.jqselector = null;
//       ret.attrselector = fullselector.toLowerCase();
//       ret.attrRegex = UU.parseRegexString(ret.attrselector, ['/', '\\'], null, false);
//       // first try to check if is mono-right (only attribute)
//       ret.resultSetAttr = getAttributes(defaultNode, ret.attrselector, ret.attrRegex);
//       if (ret.resultSetAttr.length) { return ret; }
//       // if not, it is JQ_selector only
//       ret.jqselector = fullselector;
//       ret.attrselector = Measurable.GlobalPrefix;
//       ret.attrRegex = null; }*/
//         if (ret.attrselector === '*') ret.attrRegex = /.*/;
//         // is both: left and right
//         // UU.pe(!ret.attrselector, 'attrselector should be always set at this point, at "-> ' + Measurable.GlobalPrefix + '" on worst case if it was empty.');
//         // search for external triggers
//         try { ret.resultSetElem = ret.jqselector && ret.jqselector !== 'this' ? $searchRoots.find(ret.jqselector) : ($defaultNode instanceof $ ? $defaultNode : $([])); }
//         catch (e) { ret.exception = e; return ret; }
//         UU.pif(debug, 'part3:  index:', attributeSelectorIndex, ' data:', ret, '$serachRoots', $searchRoots, ' $defaultNode:', $defaultNode, 'jqinstance?' , $defaultNode instanceof jQuery);
//
//         let i: number;
//         let j: number;
//         if (!ret.attrRegex && !ret.attrselector) return ret;
//         const attrSelectorArr: string[] = !ret.attrRegex ? UU.replaceAll(ret.attrselector, ',', ' ').split(' ') : null;
//         for (i = 0; i < ret.resultSetElem.length; i++) {
//             if (ret.attrRegex) { UU.ArrayMerge(ret.resultSetAttr, getAttributes(ret.resultSetElem[i], null, ret.attrRegex)); continue; }
//             for (j = 0; j < attrSelectorArr.length; j++) {
//                 let attrname: string = attrSelectorArr[j].trim();
//                 if (attrname === '') continue;
//                 UU.ArrayMerge(ret.resultSetAttr, getAttributes(ret.resultSetElem[i], attrname, null));
//             }
//         }
//         UU.pif(debug, 'part4 ret:  index:', attributeSelectorIndex, ' data:', ret);
//         return ret; }
//
//     static deepCloneWithFunctions(obj: object): object {
//         try {JSON.stringify(obj); } catch(e) { UU.pe(true, 'UU.deepCloneWithFunctions() Object have circular references.'); } // just to throw exception if the object have circular references
//         let copy: object;
//         let key: string;
//         // Handle the 3 simple types, and null or undefined
//         if (null === obj || undefined === obj || "object" !== typeof obj) return obj;
//
//         if (obj instanceof Date) { return new Date(obj.toString()); }
//         if (obj instanceof Number) { return new Number(obj.valueOf()); }
//         if (obj instanceof Boolean) { return new Boolean(obj.valueOf()); }
//         if (obj instanceof String) { return new String(obj.valueOf()); }
//         if (obj instanceof String) { return new String(obj.valueOf()); }
//         if (obj instanceof Function) { return obj; }
//         if (Array.isArray(obj)) { copy = []; }
//         if (obj instanceof Object) { copy = {}; }
//         // Handle Object
//         if (obj instanceof Object) {
//             copy = {};
//             for (key in obj) {
//                 if (obj.hasOwnProperty(key)) copy[key] = UU.deepCloneWithFunctions(obj[key]);
//             }
//             return copy;
//         }
//         return obj;
//     }
//
//     static objecKeysIntersect(obj1: object, obj2: object, prioritizeleft: boolean = true, clone: boolean = false): object {
//         if (!UU.isObject(obj1, false, false, true) || !UU.isObject(obj2, false, false, true)) return prioritizeleft ? obj1 : obj2;
//         let retobj: object = clone ? {} : obj1;
//         let key: string;
//
//         for (key in obj1) {
//             if (key in obj2) { retobj[key] = prioritizeleft ? obj1[key] : obj2[key]; continue }
//             if (!clone) delete obj1[key];
//         }
//         return retobj;
//     }
//
//     static toHex(num: number, lengthMin: number = 6): string {
//         let ret: string = Math.round(+num).toString(16);
//         while (ret.length < lengthMin) ret = '0' + ret;
//         return ret; }
//
//     static hexToNum(hexstr: string): number {
//         if (hexstr === null || hexstr === undefined) return hexstr as any;
//         if (hexstr.charAt(0) === '#') hexstr = hexstr.substr(1);
//         if (hexstr.length <= 2 || hexstr.charAt(1).toLowerCase() !== 'x') hexstr = '0x' + hexstr;
//         return parseInt(hexstr, 16); }
//
//     static expandInputSetup($root: JQuery<HTMLElement>) {
//         $root.find('input.expansible').addBack('input.expansible').on('focus', (e) => {
//             let inp: HTMLInputElement = e.currentTarget as HTMLInputElement;
//             let $exp = $('.expandedinput[data-expandedid=\"' + inp.dataset.expandedid + '"]');
//             let exp = $exp[0];
//             let expinput: HTMLElement = exp.firstElementChild as HTMLElement;
//             expinput.focus();
//             $exp.show();
//             console.log(expinput.innerText, inp.value);
//             expinput.innerText = inp.value;
//         });
//         $('.expandedinput').on('keydown', (e) => {
//             if (!(e.key === "Enter" && !e.shiftKey)) return;
//             let exp: HTMLElement = e.currentTarget as HTMLElement;
//             let $exp = $(exp);
//             let $inp: JQuery<HTMLInputElement> = $('input.expansible[data-expandedid=\"' + exp.dataset.expandedid + '"]');
//             let inp = $inp[0];
//             inp.value = (exp.firstElementChild as HTMLElement).innerText;
//             $exp.hide();
//         });
//     }
//
//     /**
//      * filtra la selezione dentro un elemento, ignorando selezione che fa overflow e calcolando gli elementi interni come se i testi fossero in un unico nodo (come se il parametero avesse tutto il testo senza childrens).
//      * @param {HTMLElement} div: must be a contenteditable or contained in a contenteditable to work (getSelection() will not work on non-focusable i think?)
//      **/
//     static getDivSelection(div: HTMLElement): {start: number, end: number, text: string} {
//         UU.pe(div instanceof HTMLInputElement || div instanceof HTMLTextAreaElement, 'parameter must not be a input or textarea element');
//         //let caretOffset: number = 0;
//         const doc: Document = div.ownerDocument || div['document'];
//         const win: Window = doc.defaultView || doc['parentWindow'];
//         let sel: Selection;
//         let ret: {start: number, end: number, text: string} = {start: 0, end: 0, text: ''};
//         let range: Range;
//         let caretRange: Range;
//         if (typeof win.getSelection != "undefined") {
//             sel = win.getSelection();
//             if (sel.rangeCount > 0) { // if is contenteditable
//                 range = win.getSelection().getRangeAt(0);
//                 caretRange = range.cloneRange();
//                 caretRange.selectNodeContents(div);
//                 // taking start selection
//                 caretRange.setEnd(range.startContainer, range.startOffset);
//                 ret.start = caretRange.toString().length;
//                 caretRange.setEnd(range.endContainer, range.endOffset);
//                 ret.end = caretRange.toString().length;
//                 caretRange.setStart(range.startContainer, range.startOffset);
//                 ret.text = caretRange.toString(); }
//         } else if ( (sel = doc['selection']) && sel.type != "Control") {
//             //IE  compatibility (start and text sono improvvisati e non testati)
//             var textRange = sel['createRange']();
//             var preCaretTextRange = doc.body['createTextRange']();
//             preCaretTextRange.moveToElementText(div);
//             preCaretTextRange.setEndPoint("EndToStart", textRange);// set selection end to start of the input parameter range.
//             ret.start = preCaretTextRange.text.length;
//             preCaretTextRange.setEndPoint("EndToEnd", textRange);
//             ret.end = preCaretTextRange.text.length;
//             preCaretTextRange.setEndPoint("StartToStart", textRange);
//             ret.text = preCaretTextRange.text; }
//         return ret; }
//
//     static getInputSelection(el: HTMLInputElement | HTMLTextAreaElement): {start: number, end: number, text: string} {
//         let range: Range;
//         let textInputRange: Range;
//         let endRange: Range;
//         UU.pe(!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement), 'parameter must be a input or textarea element');
//         let ret: {start: number, end: number, text: string} = {start: 0, end: 0, text: ''};
//         if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
//             ret.start = el.selectionStart;
//             ret.end = el.selectionEnd;
//         } else { // IE compatibility
//             range = document['selection'].createRange();
//             if (range && range['parentElement']() == el) {
//                 let len: number = el.value.length;
//                 let normalizedValue = el.value.replace(/\r\n/g, "\n");
//                 // Create a working TextRange that lives only in the input
//                 textInputRange = el['createTextRange']();
//                 textInputRange['moveToBookmark'](range['getBookmark']());
//                 // Check if the start and end of the selection are at the very end
//                 // of the input, since moveStart/moveEnd doesn't return what we want
//                 // in those cases
//                 endRange = el['createTextRange']();
//                 endRange.collapse(false);
//
//                 if (textInputRange['compareEndPoints']("StartToEnd", endRange) > -1) { ret.start = ret.end = len; }
//                 else {
//                     ret.start = -textInputRange['moveStart']("character", -len);
//                     ret.start += normalizedValue.slice(0, ret.start).split("\n").length - 1;
//
//                     if (textInputRange['compareEndPoints']("EndToEnd", endRange) > -1) { ret.end = len; }
//                     else {
//                         ret.end = -textInputRange['moveEnd']("character", -len);
//                         ret.end += normalizedValue.slice(0, ret.end).split("\n").length - 1; }
//                 }
//             }
//         }
//         ret.text = el.innerText.substring(ret.start, ret.end);
//         return ret; }
//
//     static getSelection(el: HTMLElement): {start: number, end: number, text: string} {
//         let ret: {start: number, end: number, text: string} = {start: 0, end: 0, text: ''};
//         UU.pe(!(el instanceof HTMLElement), 'UU.getSelection(): only html elements are supported');
//         if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) { return UU.getInputSelection(el); }
//         else return UU.getDivSelection(el); }
//
//     // NB: might not work on contenteditable with childrens filled with text.
//     static setSelection(el: HTMLElement, start: number, end: number = null): void {
//         end = end === null ? start : null;
//         let i: HTMLInputElement;
//         if (el['setSelectionRange']) { el['setSelectionRange'](start, end); return; } // for inputs
//         let range = new Range();
//         let endchildIndex = start;
//         let startchildIndex = end;
//         range.setStart(el.firstChild, startchildIndex);
//         range.setEnd(el.firstChild, endchildIndex); // firstchild is raw text.
//         // range.startOffset = start;
//         // range.endOffset = end;
//         // apply the selection, explained later
//         document.getSelection().removeAllRanges();
//         document.getSelection().addRange(range);
//         // el.setSelectionRange(start, end);
//     }
//     static setSelection2(obj: HTMLElement, start: number, end: number) {
//         end = end === null ? start : null;
//         var endNode, startNode = endNode = obj.firstChild;
//
//         // startNode.nodeValue = startNode.nodeValue.trim();
//
//         var range = document.createRange();
//         range.setStart(startNode, start);
//         range.setEnd(endNode, end + 1);
//
//         var sel = window.getSelection();
//         sel.removeAllRanges();
//         sel.addRange(range); }
//
//     static autocompleteInputSetup(inputGroup: HTMLElement, autocomplete: AutocompleteMatch[]){
//         let input: HTMLElement = inputGroup.firstElementChild as HTMLElement;
//         let suggestionList: HTMLUListElement = inputGroup.lastElementChild as HTMLUListElement;
//         let $suggestionList: JQuery<HTMLUListElement> = $(suggestionList);
//         UU.pe(!input || !input.contentEditable || !suggestionList || input === suggestionList, 'input html must be a container with firstchild as contenteditable, lastchild as suggestion ul list.');
//         let validSuggestions: AutocompleteMatch[] = [];
//         let splitIndexes: number[] = [];
//         let i: number;
//         let li: HTMLLIElement;
//         let $li: JQuery<HTMLLinkElement>;
//         let $input = $(input);
//         const debug: boolean = false;
//         let getSuggestionText = (li: HTMLLIElement) => { return (li.lastElementChild as HTMLElement).innerText; }
//         let getPreCursorString = (): string => {
//             let ret = UU.getSelection(input);
//             return input.innerText.substr(0, ret.start); };
//         const insertStringAtCurrentCursorPosition = (input: HTMLElement, text: string, replacePostText: boolean = false, rightArrow: boolean = false) => {
//             let ret = UU.getSelection(input);
//             let fakeend: string = ' ';
//             let str: string = input.innerText;// + fakeend;
//             let arrowfix: number = (rightArrow && ret.start < str.length ? -1 :0);
//             // se premo right-arrow senza che ci siano elementi dopo il cursore lo mette come penultimo.
//             let pre: string = str.substring(0, ret.start + arrowfix);
//             let post: string = str.substring(ret.end + arrowfix, str.length) + ' ';
//             let i: number = UU.strFirstDiffIndex(text, post);
//             // console.log('ArrowDebug:', pre, 'text:', text, 'post.substr(i):',post.substr(i), 'post:', post, 'i:', i);
//             input.innerText = pre + text + post.substr(i);
//             UU.setSelection(input, pre.length + 1, null);
//         };
//         let updateSuggestions = () => {
//             // logical and graphical update
//             let str = getPreCursorString();
//             str = UU.replaceAll(str, String.fromCharCode(160), ' ');
//             validSuggestions = [];
//             splitIndexes = [];
//             // console.log('updateSuggestions, prestring: |' + str + '|, suggestions:' + autocomplete.length);
//             UU.clear(suggestionList);
//             for (i = 0; i < autocomplete.length; i++){
//                 let matchindex = autocomplete[i].matches(str);
//                 // console.log(autocomplete[i], str);
//                 // console.log('updateSuggestions[' + i + '], str:' + str + ', hiddenMatch:' + autocomplete[i].hiddenprecondition + ', visibleMatch:' + autocomplete[i].key + ', matchindex:', matchindex);
//                 if (matchindex === -1) continue;
//                 splitIndexes.push(matchindex);
//                 validSuggestions.push(autocomplete[i]);
//                 let li = autocomplete[i].getLI(matchindex);
//                 let $li = $(li);
//
//                 $li.on('click', () => {
//                     insertStringAtCurrentCursorPosition(input, getSuggestionText(li));
//                     UU.setSelection(input, input.innerText.length, null);
//                     updateSuggestions();
//                 });
//                 if (validSuggestions.length > 0) $suggestionList.show(); else $suggestionList.hide();
//                 suggestionList.append(li);
//             }
//             debug&&console.log('valid suggestions:', validSuggestions);
//         }
//         $input
//             .on('mouseup', (e: MouseUpEvent) => { updateSuggestions(); })
//             .on('keydown', (e: KeyDownEvent) => {
//                 switch(e.key){ default: break;
//                     case Keystrokes.tab:
//                         e.preventDefault();
//                         li = suggestionList.firstElementChild as HTMLLIElement;
//                         if (!li) break;
//                         $(li).trigger('click');
//                         break; }})
//             .on('keyup', (e: KeyUpEvent) => {
//                 debug&&console.log('input keyup:', e);
//                 switch(e.key){
//                     default:
//                         updateSuggestions();
//                         break;
//                     // case Keystrokes.tab: break;// can never happen on keyUP unless i stop default action on keydown.
//
//                     case Keystrokes.arrowRight:
//                         if (e.shiftKey) return;
//                         li = suggestionList.firstElementChild as HTMLLIElement;
//                         if (!li) { updateSuggestions(); break; } // as a normal arrow press
//                         // as a suggestion accept
//                         let char = (li.lastElementChild as HTMLElement).innerText.charAt(0);
//                         insertStringAtCurrentCursorPosition(input, char, true, true);
//                         $input.trigger(jQuery.Event('keyup', {key:char}));
//                         break;
//                 } });
//     }
//
//     // NB: object.keys e for... in listano solo le proprietà enumerabili, le funzioni di classe in es6 non sono enumerabili.
//     static getAllProperties(obj0): string[] {
//         let props: string[] = [];
//         let obj = obj0;
//         do {
//             props = props.concat(Object.getOwnPropertyNames(obj));
//         } while (obj = Object.getPrototypeOf(obj));
//
//         return props.sort().filter(function(e, i, arr) { if (e!=arr[i+1]) return true; });
//     }
//     static copyFirstLevelStructureWithoutValues(o: object, allowPrimitive: boolean = true, allowObject: boolean = false, allowFunctions: boolean = true): Dictionary<string, string /*type description*/> {
//         let ret: Dictionary<string, undefined> = {};
//         let keys: string[] = UU.getAllProperties(o);
//         for (let index in keys) {
//             let key = keys[index];
//             let val = o[key];
//             if(val instanceof Function) { ret[key] = allowFunctions ? val : null; continue; }
//             if(val instanceof Object) { ret[key] = allowObject ? val : null; continue; }
//             ret[key] = allowPrimitive ? val : null;
//         }
//         return ret; }
//
//
//     static getFunctionSignatureFromComments(f: Function): {parameters: {name: string, defaultVal: string, typedesc: string}[], returns: string, f: Function, fname: string, isLambda: boolean, signature: string} {
//         UU.pe(!(f instanceof Function), 'getFunctionSignature() parameter must be a function');
// già inserita
//         // let parameters: {name: string, defaultVal: string, typedesc: string}[] = []; //{name: '', defaultVal: undefined, typedesc: ''};
//         let ret: {parameters: {name: string, defaultVal: string, typedesc: string}[], returns: string, f: Function, fname: string, isLambda: boolean, signature: string}
//             = {parameters: [], returns: '', f: f, fname: '', isLambda: null, signature: ''};
//         let str: string = f.toString();
//         let starti: number = str.indexOf('(');
//         let endi: number;
//         let parcounter: number = 1;
//         for (endi = starti + 1; endi < str.length; endi++) {
//             if (str[endi] === ')' && --parcounter === 0) break;
//             if (str[endi] === '(') parcounter++; }
//
//         let parameterStr = str.substring(starti + 1, endi);
//         // console.log('getfuncsignature starti:', starti, 'endi', endi, 'fname:', str.substr(0, starti), 'parameterStr:', parameterStr);
//         ret.fname = str.substr(0, starti).trim();
//         ret.fname = ret.fname.substr(0, ret.fname.indexOf(' ')).trim();
//         // 2 casi: anonimo "function (par1...){}" e "() => {}", oppure nominato: "function a1(){}"
//         if (ret.fname === '' || ret.fname === 'function') ret.fname = null; // 'anonymous function';
//
//
//
//         let returnstarti: number = str.indexOf('/*', endi + 1);
//         let returnendi: number = -1;
//         let bodystarti: number = str.indexOf('{', endi + 1);
//         if (returnstarti === -1 || bodystarti !== -1 && bodystarti < returnstarti) {
//             // no return type or comment is past body
//             ret.returns = null;
//         } else {
//             returnendi = str.indexOf('*/', returnstarti + 2);
//             ret.returns = str.substring(returnstarti + 2, returnendi).trim();
//             bodystarti = str.indexOf('{', returnendi); }
//         if (ret.returns === '') ret.returns = null;
//
//         // is lambda if do not have curly body or contains => between return comment and body
//         // console.log('isLambda:', bodystarti, str.substring(Math.max(endi, returnendi)+1, bodystarti));
//         ret.isLambda =  bodystarti === -1 || str.substring(Math.max(endi, returnendi)+1, bodystarti).trim() === '=>';
//
//         let regexp = /([^=\/\,]+)(=?)([^,]*?)(\/\*[^,]*?\*\/)?,/g; // only problem: the last parameter won't match because it does not end with ",", so i will append it everytime.
//         let match;
//         while ((match = regexp.exec(parameterStr + ','))) {
//             // match[0] is always the full match (not a capture group)
//             // match[2] can only be "=" or empty string
//             // nb: match[4] can be "/*something*/" or "," a single , without spaces.
//             let par = {name: match[1], defaultVal: match[3], typedesc: match[4] && match[4].length > 1 ? match[4] : null};
//             par.name = par.name.trim();
//             par.defaultVal = par.defaultVal && par.defaultVal.trim() || null;
//             par.typedesc = par.typedesc && par.typedesc && par.typedesc.length > 1 ? par.typedesc.substring(2, par.typedesc.length - 2).trim() || null: null;
//             ret.parameters.push(par); }
//         // set signature
//
//         ret.signature = '' + (ret.fname ? '/*' + ret.fname + '*/' : '') + '(';
//         let i: number;
//         for (i = 0; i < ret.parameters.length; i++) {
//             let par = ret.parameters[i];
//             ret.signature += (i === 0 ? '' : ', ') + par.name + (par.typedesc ? '/*' + par.typedesc + '*/' : '') + (par.defaultVal ? ' = ' + par.defaultVal : '');
//         }
//         ret.signature += ')' + (ret.returns ? '/*' + ret.returns + '*/' : '');
//         return ret; }
//
//     /* for both input, textarea and contenteditable.*/
//     static setInputValue(input: HTMLElement, value: string): void{
//         value = value === null || value === undefined ? '' : value;
//         if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
//             input.value = value;
//         } else input.innerText = value;
//     }
//
//     static hasFocus(elem: Element): boolean { return window.document.activeElement === elem; }
//     static hasFocusWithin(elem: Element, includeSelf: boolean = true): boolean {
//         if (!elem) return false;
//         const active = window.document.activeElement;
//         // console.log('hasFocus1:', includeSelf, ' && ', elem === active);
//         if (includeSelf && elem === active) return true;
//         // console.log('hasFocus2:', active, 'contains', elem, ' = ', active.contains(elem));
//         return elem.contains(active); }
//
//     static $makeSelect($root: JQuery<HTMLSelectElement>, entries: Dictionary<string, string>, optgrplabel: string = '', selectedVal: string = ''): void {
//         $root.each((i: number, e: HTMLSelectElement) => UU.makeSelect(e, entries, optgrplabel, selectedVal));
//     }
//
//     // used to convert type from string to some enum checking after validation
//     static getEnumValByVal<T>(val: string, enumDeclaration:object): T {
//         for (let key in enumDeclaration) {
//             if (enumDeclaration[key] === val) return val as any;
//         }
//         return null; }
//
//     static getEnumValByKey<T>(key: string, enumDeclaration:object): T {
//         if (enumDeclaration && enumDeclaration.hasOwnProperty(key)) return enumDeclaration[key] as T;
//         return null; }
//
//     static getEnumKeyByVal<T>(val: string | T, enumDeclaration:object): string {
//         for (let key in enumDeclaration) {
//             if (enumDeclaration[key] === val) return key;
//         }
//         return null;
//     }
//
//     static makeSelect(select: HTMLSelectElement, entries: Dictionary<string, string>, optgrplabel: string = '', selectedVal: string = ''): void {
//         const grp: HTMLOptGroupElement = document.createElement('optgroup');
//         UU.clear(select);
//         select.append(grp);
//         grp.label = optgrplabel;
//         for (let key in entries) {
//             const opt: HTMLOptionElement = document.createElement('option');
//             opt.setAttribute('value', key);
//             opt.innerText = entries[key];
//             if (entries[key] === selectedVal) opt.selected = true;
//             grp.append(opt);
//         }
//     }
//
//     static computeConditionalHides($root: JQuery<Element>, obj: Dictionary<string, boolean>, caseSensitive: boolean = false, cascadeOnChildrens: boolean = true,
//                                    displayFunction: (e: Element) => void = null, hideFunction: (e: Element) => void = null)
//         : {show: Element[], hide: Element[], inaltered: Element[]}  {
//         if (!displayFunction) displayFunction = (e: Element) => $(e).show();
//         if (!hideFunction) hideFunction = (e: Element) => $(e).hide();
//         if (cascadeOnChildrens) $root = $root.find('[uif]').addBack('[uif]');
//         else $root.filter('[uif]');
//         let ret: {show: Element[], hide: Element[], inaltered: Element[]} =
//             {hide: [], show: [],  inaltered: []};
//         $root.each((i: number, e: Element) => {
//             let b: boolean = UU.checkConditionalHide(e, obj, caseSensitive);
//             switch (b) {
//                 case true: ret.show.push(e); displayFunction(e); break;
//                 case false: ret.hide.push(e); hideFunction(e); break;
//                 default:
//                 case null: ret.inaltered.push(e); break;
//             }
//         });
//         return ret;
//     }
//
//     static checkConditionalHide(html: Element, obj: Dictionary<string, boolean>, caseSensitive: boolean = false): boolean {
//         let attrstr: string = html.getAttribute('uif');
//         if (!attrstr) return null;
//         attrstr = attrstr
//             .replace(/\|+/, ' || ')
//             .replace(/&+/, ' && ')
//             .replace('+', ' + ')
//             .replace('-', ' - ')
//             .replace('*', ' * ')
//             .replace('/', ' / ')
//             .replace('!', ' ! ')
//             .replace(/\s+/, ' ');
//         let i: number;
//         let key: string;
//         let tokens: string[] = attrstr.split(' ');
//         if (!caseSensitive) {
//             for (key in obj) {
//                 const lckey: string = key.toLowerCase();
//                 if (lckey === key) continue;
//                 const val: boolean = obj[key];
//                 delete obj[key];
//                 obj[lckey] = val;
//             }
//         }
//
//         for (i = 0; i < tokens.length; i++) {
//             const token: string = caseSensitive ? tokens[i] : tokens[i].toLowerCase();
//             // ricorda di non salvare in lowercase i token non sostituiti, altrimenti rimpiazza Math.abs() o altre funzioni java native.
//             if (obj.hasOwnProperty(token)) tokens[i] = obj[token];
//         }
//         let ret: boolean;
//         try {
//             ret = eval(tokens.join(' '));
//         } catch (e) {
//             // UU.pw(true, 'Invalid conditional attribute (UIF), error:', e, 'html:', html, 'attrStr:', attrstr, 'tokens:', tokens, 'dic:', obj, 'caseSensitive:', caseSensitive);
//             ret = null;
//         }
//         // if (ret === null) console.log('rrer', tokens);
//         return ret;
//         // ipotesi 1:
//         //   computa hide = concatenazione hide1 || hide2 || hide3.... (es: m1hide || m1hideifclass), simile per "show"
//         // se ottengo:
//         // hide = null, show = null --> non computato, com'era rimane.
//         // hide = null  --> valueof(showif)
//         // show = null  --> valueof(hideif)
//
//         // hide = true, show = true    --> hide
//         // hide = true, show = false   --> hide
//         // hide = false, show = false  --> hide
//         // hide = false, show = true   --> show
//     }
//
//     static deserialize(value: string): any{
//         if (value === '') return '';// json.parse fail on ''
//         if (value == 'undefined') return undefined;// json.parse fail on undefined and 'undefined' too
//         let ret: any;
//         try {
//             ret = JSON.parse(value);
//         } catch(e) {
//             // UU.pe(true, 'failed to deserialize: |', value, '|', e);
//             return value; // means it's a raw string different from 'true', 'null', ...
//         }
//         return ret;
//     }
//
//
//     static makeCssSheet(): HTMLStyleElement{
//         const style: HTMLStyleElement = document.createElement('style');
//         // Add a media (and/or media query) here if you'd like!
//         // style.setAttribute("media", "screen")
//         // style.setAttribute("media", "only screen and (max-width : 1024px)")
//         style.type = 'text/css';
//         style.appendChild(document.createTextNode("")); // necessario per un bug in webkit
//         return style; }
//
//     static getActualInlineStyles(el: HTMLElement): string[][] {
//         const ret: string[][] = [];
//         for (let i = 0, len = el.style.length; i < len; ++i) {
//             let name: string = el.style[i];
//             ret.push ([name, el.style[name]]);
//             // console.log(name, ':', value);
//         }
//         return ret;
//     }
//
//     static disableConsole(){
//         // @ts-ignore
//         console['logg'] = console.log;
//         console.log = () => {};
//     }
//     static enableConsole() {
//         // @ts-ignore
//         if (console['logg']) console.log = console['logg'];
//     }
//
//     // copia propietà da un oggetto deserializzato (senza funzioni) in un oggetto non serializzato ma privo di dati
//     static cloneProperties(param: GenericObject, json: Json): void{
//         for (let key in json) { param[key] = json[key]; }
//     }
//
//     static findFirstAncestor<T extends Node>(startingNode: T, condition: (node) => boolean): T {
//         let current: T = startingNode;
//         while (current && !condition(current)) { current = current.parentNode as any; }
//         return current; }
//
//     static insertNodeAt(parent: Element, child: Element, index: number): void {
//         const futureNextSibling: Element | null = index < 0 ? parent.firstElementChild : (index > parent.children.length ? null : parent.children[index]);
//         parent.insertBefore(child, futureNextSibling);
//     }
//
//
// }


const $smap: Dictionary<string, JQuery<Element>> = {};
// selettore query "statico", per memorizzare in cache i nodi del DOM read-only per recuperarli più efficientemente. (es: nodi template)
export function $s<T extends Element>(selector: string, clone: boolean = true): JQuery<T>{
    let ret: JQuery<T>;
    if ($smap[selector]) { ret = $smap[selector] as JQuery<T>; }
    else {
        ret = ($(selector) as any);
        $smap[selector] = ret;
    }
    if (clone) ret = ret.clone(false);
    return ret; }

export enum Keystrokes {
    escape = 'Escape',
    capsLock = 'CapsLock',
    shift = 'Shift',
    tab = 'Tab',
    alt = 'Alt',
    control = 'Control',
    end = 'End',
    home = 'Home',
    pageUp = 'PageUp',
    pageDown = 'PageDown',
    enter = 'Enter', // event.code = 'NumpadEnter' se fatto da numpad, oppure "numpad3", "NumpadMultiply", ShiftLeft, etc...
    numpadEnter = 'NumpadEnter',
    audioVolumeMute = 'AudioVolumeMute',
    audioVolumeUp = 'AudioVolumeUp',
    audioVolumeDown = 'AudioVolumeDown',
    mediaTrackPrevious = 'MediaTrackPrevious',
    delete = 'Delete', // canc
    backspace = 'Backspace',
    space = ' ',
    altGraph = 'AltGraph',
    arrowLeft = 'ArrowLeft',
    arrowRight = 'ArrowRight',
    arrowUp = 'ArrowUp',
    arrowDown = 'ArrowDown',
    insert = 'Insert',
    f1 = 'F1',
    // weird ones:
    meta = 'Meta', // f1, or other f's with custom binding and windows key
    unidentified = 'Unidentified', // brightness
    __NotReacting__ = 'fn, print, maybe others', // not even triggering event?
}

export class AutocompleteMatch {
    hiddenprecondition: string;
    key: string;

    constructor(hiddenprecondition: string = '', key: string = ''){
        this.hiddenprecondition = hiddenprecondition;
        this.key = key; }

    matches(preCursorString: string): number{
        let fullkey: string = this.hiddenprecondition + this.key;
        for (let i = this.hiddenprecondition.length; i < fullkey.length; i++){
            let keystart = fullkey.substring(0, i);
            //console.log('str:', preCursorString, ' matches:', keystart);
            let matchindex = preCursorString.lastIndexOf(keystart);
            if (matchindex !== -1 &&  matchindex === preCursorString.length - keystart.length){
                //console.log('matched!  at index:', preCursorString.lastIndexOf(keystart) );
                return i - this.hiddenprecondition.length; // indice dove posso splittare key
            }
        }
        return -1; }

    getLI(splitIndex: number): HTMLLIElement{
        const li: HTMLLIElement = document.createElement('li');
        const matched: HTMLElement = document.createElement('span');
        matched.style.fontWeight = '900';
        matched.classList.add('matched');
        const suggestion: HTMLElement = document.createElement('span');
        suggestion.classList.add('prediction');
        li.classList.add('suggestion');
        li.style.cursor = 'pointer';
        li.append(matched);
        li.append(suggestion);
        matched.innerText = this.key.substr(0, splitIndex);
        suggestion.innerText = this.key.substr(splitIndex);
        return li; }

}

/*

export enum TSON_JSTypes {
    'null' = 'null',
    'undefined' = 'undefined',
    'boolean' = 'boolean',
    'number' = 'number',
    'string' = 'string',
    'object' = 'object',
    'Array' = 'array',
    'Date' = 'date',
    'Boolean' = 'boolean',// type is obj, serialized as bool.
    'Number' = 'number',
    'String' = 'string',// type is obj, serialized as str.
    'function' = 'function',
}

export enum TSON_UnsupportedTypes {
    'BigInt' = 'bigint',
    'symbol' = 'symbol',
    'arrowFunction?' = 'arrowfunction?',
    'RegExp' = 'regexp',
    'Int8Array' = 'int8array',
    'Uint8Array' = 'uint8array',
    'Uint8ClampedArray' = 'uint8clampedarray',
    'Int16Array' = 'int16array',
    'Uint16Array' = 'uint16array',
    'Int32Array' = 'int32array',
    'Uint32Array' = 'uint32array',
    'Float32Array' = 'float32array',
    'Float64Array' = 'float64array',
    'BigInt64Array' = 'bigint64array',
    'BigUint64Array' = 'biguint64array',
    'Keyed' = 'keyed',
    'collections' = 'collections',
    'Map' = 'map',
    'Set' = 'set',
    'WeakMap' = 'weakmap',
    'WeakSet' = 'weakset',
    'ArrayBuffer' = 'arraybuffer',
    'SharedArrayBuffer' = 'sharedarraybuffer',
    'Atomics' = 'atomics',
    'DataView' = 'dataview',
    'Promise' = 'promise',
    'Generator' = 'generator',
    'GeneratorFunction' = 'generatorfunction',
    'AsyncFunction' = 'asyncfunction',
    'Iterator' = 'iterator',
    'AsyncIterator' = 'asynciterator',
    'Reflection' = 'reflection',
    'Reflect' = 'reflect',
    'Proxy' = 'proxy',
}

export type TSONString = string;
export class TSON { //typed json (js impl.) actually dovrei fare una map che converte JS_Types in TSON_Types per scrivere e leggere types language-indipendent.
    private values: any;
    private types: any;

    public static stringify(val: any): TSONString {
        try { JSON.stringify(val); } catch(e) { U.pe(true, 'U.deepCloneWithFunctions() Object might have circular references.', e); } // just to throw exception if the object have circular references
        let tmp = TSON.cloneAndGetTypings(val);
        const ret = new TSON();
        ret.values = tmp.val as any;//  JSON.stringify(val);
        ret.types = tmp.type as any;// JSON.stringify(typings);
        return JSON.stringify(ret); }

    public static parse(tson: string): any {
        try{
            // let tson: TSON = typeof(Tson) === TSON_JSTypes.string ? JSON.parse(Tson as string) : Tson;
            return TSON.parse0(JSON.parse(tson));
        }
        catch (e) { let er = new Error('TSON.parse failed, it maybe the argument is not a valid TSON string / object.'); er['suberror'] = e; throw e; }
    }

    private static parse0(jsontson: TSON): any {
        TSON.fixTypes(jsontson.values, jsontson.types);
        return jsontson; }

    private static cloneAndGetTypings(obj: any): {val: any, type: string | any[] | object} {
        // let copy: object;
        let key: string;
        let ret: {val: object, type: string | any[] | object} = {val: undefined, type: undefined};
        let tmp: {val: object, type: string | any[] | object} = {val: undefined, type: undefined};
        // Handle primitives
        if (null === obj) { ret.val = obj; ret.type = TSON_JSTypes.null; return ret; }
        if (undefined === obj) { ret.val = obj; ret.type = TSON_JSTypes.undefined; return ret; }
        switch(typeof obj){
            default: U.pe(true, 'unexpected type:', obj, typeof obj); break; // do not use, too dangerous for types not defined in TSON_JSTypes
            case TSON_JSTypes.boolean: ret.val = obj; ret.type = TSON_JSTypes.boolean; return ret;
            case TSON_JSTypes.number: ret.val = obj; ret.type = TSON_JSTypes.number; return ret;
            case TSON_JSTypes.string: ret.val = obj; ret.type = TSON_JSTypes.string; return ret;
            case TSON_JSTypes.function: break;
            case TSON_JSTypes.object: break; // those should cover everything. array and date = object
        }
        if (typeof obj === TSON_JSTypes.boolean) { ret.val = obj; ret.type = TSON_JSTypes.undefined; return ret; }

        // handle non-primitives
        if (obj instanceof Date) { ret.val = new Date(obj.toString()); ret.type = TSON_JSTypes.Date; return ret; }
        if (obj instanceof Boolean) { ret.val = new Boolean(obj.valueOf()); ret.type = TSON_JSTypes.Boolean; return ret; }
        if (obj instanceof Number) { ret.val = new Number(obj.valueOf()); ret.type = TSON_JSTypes.Number; return ret; }
        if (obj instanceof String) { ret.val = new String(obj.valueOf()); ret.type = TSON_JSTypes.String; return ret; }
        // takes lambda too
        if (obj instanceof Function) { ret.val = obj.toString(); ret.type = TSON_JSTypes.function; return ret; }
        if (Array.isArray(obj)) { ret.val = []; ret.type = []; }
        else if (obj instanceof Object) { ret.val = {}; ret.type = {}; }
        if (typeof(obj) === TSON_JSTypes.string) { ret.val = obj; ret.type = TSON_JSTypes.string; return ret; }
        // Handle Object
        for (key in obj) {
            //if (!obj.hasOwnProperty(key)) continue;
            tmp = TSON.cloneAndGetTypings(obj[key]);
            if (key === 'cc') console.log('cc:', tmp);
            ret.val[key] = tmp.val;
            ret.type[key] = tmp.type; }
        return ret; }

    private static fixTypes(values: any, types: any): any {
        let key: string;
        let i: number;
        let exampleval = {a:0, b:'0', c:[1, 'kk', ()=>{}, {k:''}]};
        let exampletyp = {a:'number', b:'string', c:['number', 'string', 'arrowfunc', {k:'string'}]};
        let leafvalstr: string;
        switch (typeof(values)){
            default: // is leaf-type and i can read my typemap
            case TSON_UnsupportedTypes.BigInt: case TSON_UnsupportedTypes.symbol:
                U.pe (true, 'TSON parse found an unsupported type:', typeof(values)); break;
            case TSON_JSTypes.string:
            case TSON_JSTypes.function:
            case TSON_JSTypes.undefined:
            case TSON_JSTypes.number:
            case TSON_JSTypes.boolean:
                leafvalstr = '' + values;
                switch(types) { // primitivi secondo JSON
                    default: U.pe(true, 'Unimplemented TSON type found:', types); break;
                    case TSON_JSTypes.null: return null;
                    case TSON_JSTypes.undefined: return undefined;
                    case TSON_JSTypes.Date: return new Date(leafvalstr);
                    case TSON_JSTypes.boolean: return new Boolean(leafvalstr).valueOf();
                    case TSON_JSTypes.number: return +leafvalstr;
                    case TSON_JSTypes.Boolean: return new Boolean(leafvalstr);
                    case TSON_JSTypes.Number: return new Number(leafvalstr);
                    case TSON_JSTypes.string: return leafvalstr;
                    case TSON_JSTypes.String: return new String(leafvalstr);
                    case TSON_JSTypes.function: return eval('let a=' + leafvalstr + '; a;');
                }
            //
            case TSON_JSTypes.object:
                let typestr = typeof(types) === 'string' ? types : null; // null if non-leaf type.
                switch(typestr) { // non primitivi secondo JSON
                    default: U.pe(true, 'Unimplemented TSON typing found:', types); break;
                    case null: // object or array (non primitivi secondo json e non-leaf per tson)
                        // if (Array.isArray(values)){ same as object fallback, will ignore length.
                        for (key in values) { values[key] = TSON.fixTypes(values[key], types[key]); }
                        // problema: Json stringify and parse trasforma (let a = []; a[600] = 1;) in un array con 600 elementi (599 null). problema ereditato da TSON.
                        return values; }
        }
        U.pe(true, 'TSON.fixtypes() should not reach here');
    }

}*/

export enum AttribETypes {
//  FakeElementAddFeature = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//FakeElement',
// era il 'pulsante per aggiungere feature nel mm.',
    // reference = 'reference??',
    void = '???void',
    EChar = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EChar',
    EString = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
    EDate = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDate',
    EFloat = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloat',
    EDouble = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble',
    EBoolean = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
    EByte = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByte',
    EShort = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShort',
    EInt = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
    ELong = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELong',
    /*
  ECharObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ECharObject',
  EStringObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EStringObject',
  EDateObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDateObject',
  EFloatObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloatObject',
  EDoubleObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDoubleObject',
  EBooleanObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBooleanObj',
  EByteObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByteObject',
  EShortObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShortObject',
  EIntObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EIntegerObject',
  ELongObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELongObject', */
    // EELIST = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EEList', // List<E> = List<?>
}

// export type Json = object;

export class ParseNumberOrBooleanOptions{
    defaultValue?: any;
    allowNull?: boolean; nullValue?: any;
    allowUndefined?: boolean; undefinedValue?: any;
    allowedNan?: boolean; nanValue?: any;
    allowBooleans?: boolean; trueValue?: any; falseValue?: any;
    constructor(
        defaultValue: any = null, allowNull: boolean = false, nullValue: any = null,
        allowUndefined: boolean = false, undefinedValue: any = undefined,
        allowedNan: boolean = false, nanValue: any = NaN,
        allowBooleans: boolean = true, trueValue : any = 1, falseValue: any = 0) {
        this.defaultValue = defaultValue; this.allowNull = allowNull; this.nullValue = nullValue;
        this.allowUndefined = allowUndefined; this.undefinedValue = undefinedValue;
        this.allowedNan = allowedNan; this.nanValue = nanValue;
        this.allowBooleans = allowBooleans; this.trueValue = trueValue; this.falseValue = falseValue;
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
            // console.log(prefix, {i, restArgs, curr:restArgs[i]});
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



/*
export class JsonUtil {
    static getAnnotations(thiss: Json): Json[] {
        const ret = thiss[ECorePackage.eAnnotations];
        if (!ret || $.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    static getDetails(thiss: Json): Json[] {
        const ret = thiss[ECoreAnnotation.details];
        if (!ret || $.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; } }

    static getChildrens(thiss: Json, throwError: boolean = false, functions: boolean = false): Json[] {
        if (!thiss && !throwError) { return []; }
        const mod = thiss[ECoreRoot.ecoreEPackage];
        const pkg = thiss[ECorePackage.eClassifiers];
        const cla = thiss[functions ? ECoreClass.eOperations : ECoreClass.eStructuralFeatures];
        const fun = thiss[ECoreOperation.eParameters];
        const lit = thiss[ECoreEnum.eLiterals];

        const ret: any = mod || pkg || cla || fun || lit;
        /*if ( ret === undefined || ret === null ) {
      if (thiss['@name'] !== undefined) { ret = thiss; } // if it's the root with only 1 child arrayless
    }* /
        // U.pe(true, debug, 'getchildrens(', thiss, ')');
        U.pe( throwError && !ret, 'getChildrens() Failed: ', thiss, ret);
        // console.log('ret = ', ret, ' === ', {}, ' ? ', ($.isEmptyObject(ret) ? [] : [ret]));
        if (!ret || $.isEmptyObject(ret)) { return []; }
        if (Array.isArray(ret)) { return ret; } else { return [ret]; }
    }

    static read(json: Json, field: string, valueIfNotFound: any = 'read<T>()CanThrowError'): string {
        let ret: any = json ? json[field] : null;
        if (ret !== null && ret !== undefined && field.indexOf(Status.status.XMLinlineMarker) !== -1) {
            U.pe(U.isObject(ret, false, false, true), 'inline value |' + field + '| must be primitive.', ret);
            ret = U.multiReplaceAll('' + ret, ['&amp;', '&#38;', '&quot;'], ['&', '\'', '"']);
        }
        if ((ret === null || ret === undefined)) {
            U.pe(valueIfNotFound === 'read<T>()CanThrowError', 'Json.read<',  '> failed: field[' + field + '], json: ', json);
            return valueIfNotFound; }
        return ret; }

    static write(json: Json, field: string, val: string | any[]): string | any[] {
        if (val !== null && field.indexOf(Status.status.XMLinlineMarker) !== -1) {
            U.pe(val !== '' + val, 'inline value |' + field + '| must be a string.', val);
            val = U.multiReplaceAll(val as string, ['&', '\'', '"'], ['&amp;', '&#38;', '&quot;']);
        }
        else U.pe(val !== '' + val || !U.isObject(val, true), 'primitive values should be inserted only inline in the xml:', field, val);
        json[field] = val;
        return val; }
}
*/

/*
export class DetectZoom {
    static device(): number { return detectzoooom.device(); }
    static zoom(): number { U.pe(true, 'better not use this, looks like always === 1'); return detectzoooom.zoom(); }
}*/



export class FileReadTypeEnum {
    public static image: FileReadTypeEnum = "image/*" as any;
    public static audio: FileReadTypeEnum = "audio/*" as any;
    public static video: FileReadTypeEnum = "video/*" as any;
    /// a too much huge list https://www.iana.org/assignments/media-types/media-types.xhtml
    public static AndManyOthersButThereAreTooMuch: string = "And many others... https://www.iana.org/assignments/media-types/media-types.xhtml";
    public static OrJustPutFileExtension: string = "OrJustPutFileExtension";
}

console.warn('loaded ts U');
