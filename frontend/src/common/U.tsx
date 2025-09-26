// import * as detectzoooom from 'detect-zoom'; alternative: https://www.npmjs.com/package/zoom-level
// import {Mixin} from "ts-mixer";
import {Any, DClass, DGraphElement, LClass, LGraphElement} from "../joiner";
import {
    AbstractConstructor,
    Constructor,
    Dictionary,
    DocString,
    GObject,
    Pointer,
    PrimitiveType,
    Temporary,
    LPointerTargetable,
    DPointerTargetable,
    Log,
    EMeasurableEvents,
    TRANSACTION,
    SetRootFieldAction,
    LoadAction,
    KeyDownEvent, KeyUpEvent,
    stateInitializer,
    DUser,
    DProject, D, L, ClickEvent,
} from "../joiner";
import {
    DClassifier,
    DModelElement, DState,
    Json,
    JsType,
    LClassifier,
    LModelElement,
    LNamedElement,
    LogicContext,
    MyError,
    RuntimeAccessible,
    RuntimeAccessibleClass, store,
    windoww
} from "../joiner";
import Swal from "sweetalert2";
import Storage from '../data/storage';
import {compressToUTF16, decompressFromUTF16} from "async-lz-string";
import {NumberControl, PaletteControl, PaletteType, PathControl, StringControl} from "../view/viewElement/view";
import tinycolor from "tinycolor2";
import util from "util";
import Convert from "ansi-to-html";
import React, {isValidElement} from "react";
import IoT from "../iot/IoT";
import Collaborative from "../components/collaborative/Collaborative";
import {Await, NavigateFunction} from "react-router-dom";
// var Convert = require('ansi-to-html');
// import KeyDownEvent = JQuery.KeyDownEvent; // https://github.com/tombigel/detect-zoom broken 2013? but works

// console.warn('ts loading U log');

@RuntimeAccessible('Color')
export class Color {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    static fromHex(hex: string): Color {
        return undefined as any;
    }

    static fromHLS({h, l, s}: { h: number, l: number, s: number }): Color {
        return undefined as any;
    }

    getHex(): string {
        return undefined as any;
    }

    mixWith(c: Color): void {

    }

    getHLS(): { h: number, l: number, s: number } {
        return undefined as any;
    }

    duplicate(): Color {
        return undefined as any;
    }
}

@RuntimeAccessible('R')
export class R {
    public static cname: string = 'R';

    // from: 1.com/2/3
    // /5       --> 1.com/5/
    // ./5      --> 1.com/1/2/3/5
    // 5        --> 1.com/1/2/3/5
    //
    public static open_new_page(url: string): void {
        window.open(url, '_blank');
    }

    public static replace(path: string): void {
        window.location.replace(path);
    }

    public static navigate(path: string, refresh: (true | NavigateFunction) = true): void {
        // window.location.assign = window.location = window.location.href = window.open(url, '_self')
        console.warn('R.navigate()', {path, refresh});

        //if (path.indexOf('allProject') >= 0) return;
        if (windoww.preventNavigation) return;
        let absPathIndex = path.indexOf('//');
        if (absPathIndex >= 0 && absPathIndex <= 'https:'.length) { // other protocols are not supported
            window.location.href = path;
            return;
        }
        if (true as any || refresh === true) {
            let hash: string;
            if (path[0] !== '/') hash = '#/' + path;
            else hash = '#' + path;
            console.warn('navigating: ', {path, url:window.location.origin + path, currHash:window.location.hash});
            if (window.location.hash === hash) {
                console.error('R.navigate() called twice');
                // return;
            }
            U.navigating = true;
            window.location.hash = hash;
            window.location.reload();
            // let counter = +(U.getSearchParam('p') as string) || 0;
            // U.setSearchParam('p', counter+1);
            //window.location.href = window.location.origin + '/'+hash;
            // window.location.reload(); // i think this is causing a firefox bug, it refreshes old url. so i'm using location.search
        } else refresh(path); // useNavigator()(path);
    }
}


export type DialogButton = { txt: string, action?: () => {} };
export type DialogOptions = {
    title: string,
    question: string,
    options: DialogButton[],
    promise: Promise<string>,
    resolve: (val: string | PromiseLike<string>) => void,
    reject: (val: string | PromiseLike<string>) => void
};

export type BrowserInfo =  {
    screen: string,
    browser: string,
    browserVersion: string,
    browserMajorVersion: number,
    mobile: boolean,
    os: string,
    osVersion: string,
    cookies: boolean,
    userAgent: string,
};

@RuntimeAccessible('U')
export class U {
    private static clickedOutsideMap: WeakMap<Element, (e: Element, evt: JQuery.ClickEvent)=>void> = null as any;
    private static clickedOutsideMapEntries: Element[] = null as any; // because weak maps are not iterable and cannot get a list of keys
    static UpdatingTimer: number = 300;


    // to register call with both parameters. to remove a listener call with callback=undefined
    public static navigating: boolean = false; // if i'm changing page, i stop rendering to prevent meaningless errors.
    static debug: boolean = false;
    static clickedOutside(currentTarget0: Element|Any<Event>, callback: undefined | ((e: Element, evt: JQuery.ClickEvent) => void)) {
        if (!currentTarget0) return;
        let currentTarget: Element = (currentTarget0 as any)?.currentTarget || currentTarget0 as any;
        if (!currentTarget) return;
        let map = U.clickedOutsideMap;
        let arr = U.clickedOutsideMapEntries;
        if (!map) {
           U.clickedOutsideMap = map = new WeakMap();
           U.clickedOutsideMapEntries = arr = [];
           document.addEventListener('click', U.clickedOutsideCallback, true); // bubbling event! called before normal events.
           // $(document).on('click', U.clickedOutsideCallback);
        }
        // console.log('clickedOutside registering', {currentTarget, callback, map, arr});
        if (callback) {
            map.set(currentTarget, callback);
            if (!arr.includes(currentTarget)) arr.push(currentTarget);
        }
        else {
            map.delete(currentTarget);
            U.arrayRemoveAll(arr, currentTarget);
        }
    }

    //private static lastClicked?: Element;
    private static lastClickedAncestors: Element[] = [];
    private static lastClickedTime: number = 0;
    public static userHasInteracted: boolean = false;
    public static isProjectModified: boolean = false;
    private static clickedOutsideCallback(e: any & ClickEvent){
        let target = e.target as Element;
        let clickedAncestors = U.ancestorArray(target, undefined, true);

        // when i click on something containined in a label+input, the event fires twice:
        // once for actually clicked element and 1 emulating a click on input/select
        if ((Date.now() - U.lastClickedTime < U.UpdatingTimer)){
            let labelAncestors = clickedAncestors.filter((e, i) => i>0 && e.tagName === 'LABEL');
            if (U.lastClickedAncestors.filter(e=>labelAncestors.includes(e))) return;
            //if (labelAncestors.includes(U.lastClicked)) return;
        }
        //U.lastClicked = target;
        U.lastClickedAncestors = clickedAncestors;
        U.lastClickedTime = Date.now();
        let map = U.clickedOutsideMap;
        let arr = U.clickedOutsideMapEntries;

        // console.log('clickedOutside callback exec', {e, target, clickedAncestors, arr, map, callbacks: arr.map(e=>map.get(e))});
        for (let elem of arr) {
            let callback = map.get(elem);
            if (!callback) continue;
            // if (target === elem) continue;
            if (clickedAncestors.includes(elem)) continue;
            callback(target, e);
        }
    }

    static publish(topic: string, value: unknown) {
        if(!IoT.client.connected) {
            SetRootFieldAction.new('alert', '3:Cannot connect to broker!:','');
            return;
        }
        IoT.client.emit('push-action', {
            topic: topic,
            value: JSON.stringify(value)
        });
        SetRootFieldAction.new('alert', '1:Publish done!:','');
    }

    static extractValueFromTopic(obj: Dictionary, path: string) {
        const keys = path.split('.');
        let result = obj;
        for (let key of keys) {
            result = result[key];
            if (result === undefined) return undefined;
        }
        return result;
    }

    static extractTopics(obj: Dictionary, parentKey = ''): string[] {
        let keys: string[] = [];
        for (let key in obj) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]))
                keys = keys.concat(this.extractTopics(obj[key], `${parentKey}${key}.`));
            else keys.push(parentKey + key);
        }
        return keys.filter(k => k !== 'clonedCounter');
    }

    static keepKeys(dict: GObject, keys: string[]): Dictionary {
        return Object.fromEntries(
            Object.entries(dict).filter(([key]) => keys.includes(key))
        );
    }

    static proxyDeduplicator<T extends LPointerTargetable|DPointerTargetable|Pointer>(arr: T[]): T[] {
        let map: Dictionary<Pointer, T> = {};
        if (!arr || !Array.isArray(arr)) return arr as any;
        for (let v of arr) {
            let id = windoww.Pointers.from(v);
            if (map[id]) continue;
            map[id] = v;
        }
        return Object.values(map);
    }

    static alertSeparator: string = '£';
    static alert(type: 'i'|'w'|'e', title: React.ReactNode, message: React.ReactNode = ''): void {
        if (typeof title !== 'string') {
            windoww.__jjAlertTitle = title;
            title = '';
        } else windoww.__jjAlertTitle = null;
        if (typeof message !== 'string') {
            windoww.__jjAlertMessage = message;
            message = '';
        } else windoww.__jjAlertMessage = null;

        SetRootFieldAction.new('alert', type + U.alertSeparator + title + U.alertSeparator + message, '');
    }

    static dialog(message: string, label: string, action: () => any): void {
        windoww.dialog_action = action;
        SetRootFieldAction.new('dialog', message + U.alertSeparator + label + U.alertSeparator + message, '', false);
    }

    static dialogOptions?: DialogOptions = undefined;

    static async dialog2(title: string, question: string, options: {txt:string, acton?: ()=>{}}[]): Promise<string> {
        let resolve: ((str: string | PromiseLike<string>) => void) = null as any;
        let reject: ((str: string | PromiseLike<string>) => void) = null as any;
        let promise = new Promise<string>(
            (doResolve, doReject) => { resolve = doResolve; reject = doReject; });
        U.dialogOptions = {title, question, options, promise, resolve, reject};
        SetRootFieldAction.new('dialog', 'dialog2_on', '', false);
        return promise;
    }

    static async decompressState(state: string): Promise<string> {
        return await decompressFromUTF16(state);
    }
    static async compressedState(dproject: DProject): Promise<string> {
        let id: Pointer<DProject> = dproject.id;
        const state = {...store.getState()};
        const idlookup: Record<Pointer, DPointerTargetable> = {};
        for (const [pointer, object] of Object.entries(state.idlookup) as [Pointer, DPointerTargetable][]) {
            if ((object as DGraphElement).isSelected) (object as DGraphElement).isSelected = {};
            if (object.className === DProject.name && pointer !== id) continue;
            idlookup[pointer] = object;

        }
        state.idlookup = idlookup;
        state.idlookup[id] = {...dproject, state: ''} as any;
        state.projects = [id];
        return await compressToUTF16(JSON.stringify(state));
    }
    static isOffline(): boolean {
        return Storage.read('offline') === true;
    }
    static resetState(): void {
        LoadAction.new({...DState.new(), 'isLoading':true});
        stateInitializer().then(() => SetRootFieldAction.new('isLoading', false));
    }

    public static inspect(object: any, showHidden?: boolean, depth?: number | null, color?: boolean): string {
        let o0 = object;
        object = object?.__raw || object;
        if (Array.isArray(object)) object = object.map(o => o?.__raw || o);
        // todo: use lodash "clonedeepwith" to clean proxies
        // console.error("inspect", {o0, object});
        return util.inspect(object, showHidden, depth, color);
    }

    public static objectInspect(val: GObject, depth: number = 2, color: boolean = true, showHidden = true): string{
        if (typeof val === 'string') return val;
        let ansiConvert = (window as any).ansiConvert;
        if (!ansiConvert) (window as any).ansiconvert = ansiConvert = new Convert();
        return U.replaceAll(ansiConvert.toHtml(U.inspect(val, showHidden, depth, color)),
            "style=\"color:#FFF\"", "style=\"color:#000\"");
    }

    // exponential: undefined = only if it's over digits. false = never, true = always.
    public static cropNum(num: number|undefined|null, digits: number=5, exponential?: boolean, atLeast1Decimal:boolean=true): number | string{
        if (!digits || num === null || num === undefined || isNaN(num)) return num as any;
        let sign = (num < 0 ? '-' : '');
        if (sign.length) digits--;
        if (exponential) return num.toExponential(digits-1);
        else if (exponential === undefined) {
            if (digits <= 4) digits = 4; // 4 extra chars for .e+x
            // NB: i'm not checking if exponent is over 1 char (tens of billions)
            let limit = 10**(digits);
            if (num >= limit || -num >= limit) return num.toExponential(Math.max(0, digits-5));
        }
        let intpart: number = Math.trunc(num);
        if (intpart === num) { return num; }
        /*let s = ''+num;
        let excess = (s.length - digits);
        if (excess <= 0) return num;*/
        // must cut decimals
        let intpart_s = intpart + '';
        let allowedDecimals = digits - intpart_s.length - 1;

        // console.log('cropnum', {digits,num, intpart, is:intpart_s.length, allowedDecimals});
        if (allowedDecimals <= 0) {
            if (!atLeast1Decimal) return intpart;
            else allowedDecimals = 1;
        }
        let decimalPart = num%1;
        //console.log('cropnum', {allowedDecimals, decimalPart});

        // nb: here in concatenation ((-0)+'') --> '0'. it will lose sign on cropNum(x) with x € (-1, 0)
        // so need to check if it was negative
        // let exp = (10**allowedDecimals);
        // return sign + (intpart_s)+'.'+ (Math.round(decimalPart * exp)/exp).substring(2, allowedDecimals+2);
        let decimal_s = decimalPart+'';
        let firsti = sign.length + 2; // 0. in decimal string
        let lasti = allowedDecimals + firsti;
        while (--lasti > firsti && decimal_s[lasti] === '0') {   }
        if (++lasti <= firsti) return intpart;
        let ret = +((num < 0 && intpart === -0 ? '-' : '') + (intpart_s)+'.'+ (decimal_s.substring(firsti, lasti)));
        // console.log('cropNum', {num, ret, oth:{sign, firsti, lasti, decimal_s, intpart_s}});
        return ret;
    }
    public static cropStr(msg: string, linesStart: number = 5, linesEnd: number = 5, stringRowStart: number = 25, stringRowEnd: number = 25): string{
        let arr = msg.split('\n');
        if (linesEnd + linesStart + 1 < arr.length) {
            //arr = arr.slice(0, 10) + arr.slice(10, 0);
            arr.splice(linesStart, arr.length - linesStart - linesEnd, '...')
        }
        let ret: string = '';
        let i = 0;
        for (let line of arr){
            if (stringRowEnd + stringRowStart + 1 < line.length) {
                ret += line.substring(0, stringRowStart) + '...' + line.substring(line.length - stringRowEnd) + (i === arr.length-1 ?'':'\n');
            }
            else ret += line + (i === arr.length-1 ?'':'\n');
            i++;
        }
        return ret;
    }

    // eseguire una funzione costa in performance, anche se è brutto fare questi cast
    static wrapper<T>(obj: any): T {
        return obj as unknown as T;
    }
    // mi sa che c'era un metodo l.__serialize or something
    static json(dElement: GObject): Json {
        return JSON.parse(JSON.stringify(dElement.__raw));
    }

    static hexToPalette(...hexs: string[]): PaletteControl{
        return {type: "color", value: hexs.map( hex => {
                if (hex[0] === '#') hex = hex.substring(1);
                let r: number, g: number, b: number, a: number = 1;
                if (hex.length === 4) {
                    a = Number.parseInt('0x' + hex[3] + hex[3])/255;
                    hex = hex.substring(0, 3);
                }
                if (hex.length === 7) {
                    a = Number.parseInt('0x' + hex[5] + hex[6])/255;
                    hex = hex.substring(0, 6);
                }
                Log.exDev(hex.length !== 3 && hex.length !== 6, "invalid hex length", {hex, a});
                let i: number = 0;
                if (hex.length === 3) {
                    r =  Number.parseInt('0x' + hex[i] + hex[i++]);
                    g =  Number.parseInt('0x' + hex[i] + hex[i++]);
                    b =  Number.parseInt('0x' + hex[i] + hex[i]);
                }
                else {
                    r =  Number.parseInt('0x' + hex[i++] + hex[i++]);
                    g =  Number.parseInt('0x' + hex[i++] + hex[i++]);
                    b =  Number.parseInt('0x' + hex[i++] + hex[i]);
                }
                return {r,g,b,a} as tinycolor.ColorFormats.RGBA;
            })};
    }
    public static fatherChain(me: LModelElement): Pointer<DModelElement, 0, 'N', LModelElement> {
        if(!me) return [];  // without this line go through delete error
        const fathers: Pointer<DModelElement, 0, 'N', LModelElement>= [me.id];
        const toCheck: LModelElement[] = [me];
        while(toCheck.length > 0) {
            const element = toCheck.pop();
            if(element && element.father) {
                fathers.push(element.father.id);
                toCheck.push(element.father);
            }
        }
        return fathers;
    }

    /// maxDepth = 2 is the minimum to check the content of objects inside usageDeclarations or node state. like node.errors.naming
    static isShallowEqualWithProxies(obj1?: any, obj2?: any, skipKeys: Dictionary<string>={}, out?: {reason?: string},
                                     depth: number = 0, maxDepth: number = 2, returnIfMaxDepth:boolean = false): boolean {
        if (obj1 === obj2) {
            // if (out) { out.reason = "identical objects"; }
            return true; }
        let tobj1 = obj1 === null ? 'null' : typeof obj1;
        let tobj2 = obj2 === null ? 'null' : typeof obj2;
        if (tobj1 !== tobj2) { if (out) { out.reason = "type changed: " + tobj1 + " --> " + tobj2; } return false; }

        //
        // at this point: same type, but different values
        //

        if (!obj1 || !obj2) return false; // cannot happen but compiler wants it to narrow types
        switch (tobj1) {
            default: // primitive with different values
                console.error("unexpected case in isshallowequal:", {tobj1, obj1, obj2});
                if (out) {
                    if (undefined === tobj1) out.reason = 'primitive value newly introduced';
                    else if (undefined === tobj2) out.reason = 'primitive value got deleted';
                    else out.reason = 'primitive value changedd';
                }
                return false;
            case 'string': case 'boolean': // primitive with different values
                if (out) {
                    if (undefined === tobj1) out.reason = 'primitive value newly introduced';
                    else if (undefined === tobj2) out.reason = 'primitive value got deleted';
                    else out.reason = 'primitive value changedd';
                }
                return false;
            case "number": // if both re nan it fails
                // NB: infinities are not nan, and they compare with === like normal numbers. weird js...
                if (isNaN(obj1 as any) && isNaN(obj2 as any)) return true;
                if (out) out.reason = 'number changed';
                return false;

            case "function":
                if (obj1.toString() === obj2.toString()) break;
                if (out) out.reason = 'function body changed';
                return false;

            case "object":
                let tmpcheck = obj1.__raw;
                if (tmpcheck) {
                    let o1Raw = tmpcheck; // those should be kept local just to replace obj1 && obj2 if both are proxies.
                    let o2Raw = obj2.__raw;
                    if (!o2Raw) {
                        if (out) out.reason = o1Raw.className + 'replaced by: ' + (typeof o2Raw);
                        return false;
                    }
                    obj1 = o1Raw as GObject;
                    obj2 = o2Raw as GObject;
                }
                // for proxies and DObjects
                if (obj1.clonedCounter !== undefined && obj2.clonedCounter !== obj1.clonedCounter) {
                    if (out) out.reason = 'clonedCounter difference ' + obj1.clonedCounter + ' != ' + obj2.clonedCounter;
                    return false;
                }
                /* should be detected by clonedCounter
                if (obj1.className !== undefined && obj1.className !== obj2.className) {
                    if (out) out.reason = obj1.className + 'replaced by another object type:' + obj2?.className;
                    return false;
                }*/
                /*if (obj1.className !== obj2.className) {
                 removed: too unlikely to happen that a DObject is raplaced in the same path with another type of DObject with same clonedCounter
                 nd it's checked anyway in for(let key in obj1)
                    if (out) out.reason = o1Raw.className + 'replaced by another object type:' + o2Raw?.className;
                    return false;
                }*/
                if (Array.isArray(obj1)) {
                    if (obj1.length !== obj2.length) {
                        if (out) out.reason = 'array length different: ' + obj1.length + " !== " + obj2.length;
                        return false;
                    }
                    if (!Array.isArray(obj2)){
                        if (out) out.reason = 'array became an object';
                        return false;
                    }
                }
                switch (obj1.className) {
                    default: break;
                    case "ISize": case "IPoint": case "GraphPoint": case "Point": case "Size":
                        skipKeys.id = true;
                        skipKeys.dontMixWithGraphSize = true;
                        skipKeys.dontMixWithSize = true;
                        skipKeys.dontmixwithGPoint = true;
                        skipKeys.dontmixwithPoint = true;
                        skipKeys.rad = true;
                        break;
                }
                // if EdgeSegment is changed, this needs update too: search in IDE for "5khi2"
                if (U.objectIncludeKeys(obj1, 'd', 'dpart', 'svgLetter')){
                    let ret = obj1.d === obj2.d && obj1.dpart === obj2.dpart;
                    if (out && !ret) out.reason = 'EdgeSegment changed:' + obj1.d +' --> ' + obj2.d;
                    return ret;
                }

                // if it is any kind of unknown object type, do deep check on every subkey
                if (depth > maxDepth) {
                    // to debug and see where is too deep, make returnIfMaxDepth = false, so the path is displayed in out.reason
                    if (out) out.reason = 'max depth reached, assumed ' + returnIfMaxDepth;
                    return returnIfMaxDepth;
                }
                for (let key in obj1) {
                    if (key in skipKeys) continue;
                    let oldp: any = obj2[key];
                    let newp: any = obj1[key];
                    if (oldp === newp) continue;
                    if (!U.isShallowEqualWithProxies(newp, oldp, skipKeys, out, depth +1, maxDepth, returnIfMaxDepth)) {
                        if (out) out.reason = '['+key+']'+out.reason;
                        return false;
                    }
                }
                // just check for keys that were in props and are not in nextProps
                for (let key in obj2) {
                    if ((key in skipKeys) || (key in obj1)) continue;
                    if (out) out.reason = "deleted subobject property: " + key;
                    return false;
                }
            // else retIfMaxDepthReached; split the above if
        }



        return true;
    }

    public static deepEqual (x: GObject, y: GObject): boolean {
        const tx = typeof x, ty = typeof y;
        return x && y && tx === 'object' && tx === ty ? (
            Object.keys(x).length === Object.keys(y).length && Object.keys(x).every(key => U.deepEqual(x[key], y[key]))
        ) : (x === y);
    }

    public static sleep(s: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, s * 1000));
    }

    public static getRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomString = '';
        let index = 0;
        while(index < length) {
            const randomNumber = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomNumber);
            index += 1;
        }
        return randomString;
    }

    public static popup(element: any) {
        let html = '<style>body.swal2-no-backdrop .swal2-container {background-color: rgb(0 0 0 / 60%) !important}</style>'+ element;
        const result = Swal.fire({
            html: html,
            backdrop: false,
            showCloseButton: true,
            showConfirmButton: false
            //confirmButtonText: 'GOT IT'
        })
    }
    public static filteredPointedBy(data: LModelElement, label: string): LModelElement[] {
        const models: LModelElement[] = [];
        for(let dict of data.pointedBy) {
            const pointedBy = dict.source.split('.');
            if(pointedBy.length === 3 && pointedBy[2] === label) {
                models.push(LModelElement.fromPointer(pointedBy[1]));
            }
        }
        return models;
    }

    public static getFatherFieldToDelete(data: LModelElement): keyof DModelElement|null {
        const father = data.father;
        let field = '';
        switch(father.className + '|' + data.className) {
            // DPackage
            case 'DModel|DPackage': field = 'packages'; break;
            case 'DPackage|DPackage': field = 'subpackages'; break;
            // DEnumerator and DClass
            // case 'DPackage|DEnumerator': case 'DPackage|DClass': field = 'classifiers'; break;
            case 'DPackage|DEnumerator': field = 'enumerators'; break;
            case 'DPackage|DClass': field = 'classes'; break;
            // DAttribute
            case 'DClass|DAttribute': field = 'attributes'; break;
            // DReference
            case 'DClass|DReference': field = 'references'; break;
            // DOperation
            case 'DClass|DOperation': field = 'operations'; break;
            // DEnumLiteral
            case 'DEnumerator|DEnumLiteral': field = 'literals'; break;
            // DObject
            case 'DModel|DObject': field = 'objects'; break;
            // DParameter
            case 'DOperation|DParameter': field = 'parameters'; break;
            // DValue
            case 'DObject|DValue': field = 'features'; break;
            // Error
            default: return null;
        }
        return field as keyof DModelElement;
    }

    public static initializeValue(typeclassifier: undefined|DClassifier|LClassifier|Pointer<DClassifier, 1, 1, LClassifier>): string {
        // if(!classifier) return 'null';
        const pointer: Pointer = typeof typeclassifier === 'string' ? typeclassifier : (typeclassifier as DClassifier)?.id;
        const me: LNamedElement = LNamedElement.fromPointer(pointer);
        switch(me?.name) {
            default:
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
        const children = context.proxyObject.children;
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


    public static followPath(base: GObject, path: string|string[]): {chain: GObject[], lastObject: GObject, keys:string[], lastkey: string, lastval: any, failedRemainingPath: string[]} {
        let ret: {chain: GObject[], lastObject: GObject, keys: string[], lastkey: string, lastval: any, failedRemainingPath: string[]}
            = {lastObject:base, chain:[base], keys:[], failedRemainingPath:[]} as any;
        if (!path) return ret;
        let patharr: string[] = Array.isArray(path) ? path : (path+'').split('.');
        ret.keys = patharr;
        if (!base) return ret;

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

    static multiReplaceAllKV(a: string, kv: string[][] = []): string {
        const keys: string[] = [];
        const vals: string[] = [];
        let i: number;
        for (i = 0; i < kv.length; i++) { keys.push(kv[i][0]); vals.push(kv[i][0]); }
        return U.multiReplaceAll(a, keys, vals); }

    // if replacement is empty, it will be filled with '';
    // if replacement length < searchText, replacement will be filled with copies of his elements cycling from 0 to his length until his length matches searchText.length
    static multiReplaceAll(a: string, searchText: string[] = [], replacement: string[] = []): string {
        // Log.ex(searchText.length !== replacement.length, 'search and replacement must be have same length: ' + searchText.length + "vs" + replacement.length + " " +JSON.stringify(searchText) + "   " + JSON.stringify(replacement));
        let i = -1;
        while (replacement.length !== 0 && replacement.length < searchText.length) replacement.push(replacement[++i]);
        i = -1;
        while (++i < searchText.length) { a = U.replaceAll(a, searchText[i], replacement[i]); }
        return a; }

    static replaceAll(str: string, searchText: string, replacement: string | undefined, debug: boolean = false, warn: boolean = true): string {
        if (!str) { return str; }
        return str.split(searchText).join(replacement||''); }

    static toFileName(a: string = 'nameless.txt'): string {
        if (!a) { a = 'nameless.txt'; }
        a = U.multiReplaceAll(a.trim(), ['\\', '//', ':', '*', '?', '<', '>', '"', '|'],
            ['[lslash]', '[rslash]', ';', '°', '_', '{', '}', '\'', '!']);
        return a;
    }


    // warn: this check if the scope containing the function is strict, to check if a specific external scope-file is strict
    // you have to write inline the code:        var isStrict = true; eval("var isStrict = false"); if (isStrict)...
    // @ts-ignore
    public static isStrict: boolean = ( function() { return !this; })();

    // merge properties with first found first kept (first parameters have priority on override). only override null|undefined values, not (false|0|'') values
    static objectMergeInPlace<A extends object, B extends object>(output: A, ...objarr: B[]): void {
        const out: GObject = output;
        if (objarr)
            for (let o of objarr) {
                if (o && typeof o === "object")
                    for (let key in o) {
                        // noinspection BadExpressionStatementJS,JSUnfilteredForInLoop
                        out[key] ?? (out[key] = o[key]);
                    }
            }
    }
/*
    public static log(obj: unknown, label: string = '###') {
        console.clear();
        console.log(label, obj);
    }*/

    static removeEmptyObjectKeys(obj: GObject): void{
        for (let key of Object.keys(obj)) {
            if (obj[key] === null || obj[key] === undefined) delete obj[key];
        }
    }

    // usage example: objectMergeInPlace_conditional(baseobj, (out, key, current) => !out[key] && current[key];
    // culprit of "couldn't find intersection" problem: condition type: (out:A&B, key: string | number, current:B, objarr?: B[], indexOfCurrent?: number) => boolean
    static objectMergeInPlace_conditional<A extends GObject, B extends GObject>(output: A, condition: (...a:any)=>any, ...objarr: B[]): A & B {
        const out: GObject<"A & B"> = output;
        let i: number = 0;
        for (let o of objarr) for (let key in o) { if (condition(out, key, o, objarr, i++)) out[key] = o[key]; }
        return out as  A & B; }

    static buildFunctionDocumentation(f: Function): {fullSignature: string, parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string} {
        Log.e(!JsType.isFunction(f), 'getFunctionSignature() parameter must be a function', f);
        // let parameters: {name: string, defaultVal: string, typedesc: string}[] = []; //{name: '', defaultVal: undefined, typedesc: ''};
        let ret: {fullSignature: string, parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string}
            = {fullSignature: '', fname: undefined, signature: '', parameters: [], returns: undefined, f: f, isLambda: null as Temporary};
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
        ret.isLambda =  bodystarti === -1 || str.substring((window as any).Math.max(endi, returnendi)+1, bodystarti).trim() === '=>';

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

        ret.fullSignature = ret.isLambda? ret.signature + '=>' + ret.returns : (ret.fname ||'function') + ret.signature+': '+ret.returns;
        return ret; }



    // NB: need to use result.apply(context) to have a usable "this"
    // if you want to pass a parameter to the function, pass it through scope insteand !! AND UNDECLARE the parameter in function string signature !!
    //if inner funcstr have parameters, need to declare them as codestrParamNames arr, and pass them in that order, after the scope which is fixed as first argument.
    // rest values are declared with ellipsis in codestrParamNames
    // !!! scope passed here, is only used for keys. values are not bound. scope is set as first parameter when you call the function.
    // context is bound, but can be re-assigned by calling .bind(), .call() or .apply(), so neither context nor scope assigned in parsing phase are final.
    // innerfunc params do not have to match the name on the string function, but only the correct amount. they can have any name i think, but i list them correctly to documentate.
    public static parseFunctionWithContextAndScope<ParamNames extends string[], T extends Function = Function, TT extends GObject | undefined = GObject>(
        codeStr0: string | Function, context0: GObject | undefined, scope0: TT, codestrParamNames?: ParamNames, protectShallowValues: boolean = false, doIdentifierValidation: boolean = false):
        (TT extends undefined ? (...params: any)=>any : (scopee:TT, ...paramss: { [K in keyof ParamNames]: any;})=>any){
        if (!codestrParamNames) codestrParamNames = [] as any;

        let codeStr: string = typeof codeStr0 === "function" ? codeStr0.toString() : codeStr0;
        let scopeParams: string = '';
        let scope: GObject | undefined;
        let context: GObject | undefined;
        if (protectShallowValues) {
            if (scope0) { //scope = {...scope0}; scope.__proto__ = scope0.__proto__; // for...in gets values in __proto__ too, {...o} instead gets only hasOwnProperty copied
                scope = {};
                for (let k in scope0) scope[k] = scope0[k];
            } else scope = undefined;
            if (context0) { // context = {...context0}; context.__proto__ = context0.__proto__;
                context = {};
                for (let k in context0) context[k] = context0[k];
            } else context = undefined;
        } else { scope = scope0; context = context0; }


        if (scope) {
            let scopekeys: string[] = Object.keys(scope);
            if (doIdentifierValidation) scopekeys.map((key)=>{
                key = key?.trim() || '';
                if (!key || !U.validIdentfierRegexp.test(key)) return undefined;
                return key;
            }).filter(k=>!!k);
            scopeParams = '{'+scopekeys.join(',')+'}';
        }

        let innerFuncParams = (codestrParamNames as string[]).join(',');
        let _jevalfunc = undefined as any; // is set by eval
        const evalmode = false;
        console.log('parseFunctionWithContextAndScope', {codeStr, scope, context, params:{scopeParams, innerFuncParams}});
        scopeParams = scopeParams && innerFuncParams ? scopeParams + ',' + innerFuncParams : scopeParams + innerFuncParams;
        if (evalmode) {
            codeStr = "_jevalfunc = function ("+scopeParams+") { return ("+codeStr+")("+innerFuncParams+") }";
            eval(codeStr);
        } else {
            _jevalfunc = new Function(scopeParams, " return ("+codeStr+")("+innerFuncParams+")");
        }

        console.log('parseFunctionWithContextAndScope', {_jevalfunc, params:{scopeParams}});

        if (context) return _jevalfunc.bind(context);
        else return _jevalfunc;
    }/*
    public static evalInContextAndScope<T = any>(...a:any):any {return undefined}
    public static evalInContextAndScopeNew<T = any>(...a:any):any {return undefined}*/
    public static evalInContextAndScopeNew<T = any>(codeStr: string | ((...a:any)=>any), context0: GObject, injectScopeToo: boolean,
                                                    protectShallowValues?: boolean, doIdentifierValidation?: boolean): T {
        return U.evalInContextAndScope(codeStr, context0, injectScopeToo ? context0 : undefined, protectShallowValues, doIdentifierValidation);
    }

    // important! this is a simplified version. the correct one allows unicode chars and is 11kb long of regex expression
    public static validIdentfierRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

    // warn: if return is not explicitly inserted (if that's the case set imlicitReturn = false) with a scope and the code have multiple statemepts it will fail.
    // can modify scope AND context
    // warn: can access global scope (window)
    // if the context (this) is missing it will take the scope as context.
    // warn: cannot set different scope and context, "this" della funzione sovrascrive anche il "this" interno allo scope come chiave dell'oggetto
    // warn: !context && scope is impossible, so it gets autofixed by assigning context = scope; check Log messages inside function for details.
    // warn: context && scope is impossible if context !== scope and cannot be hotfixed, that will cause a crash.
    public static evalInContextAndScope<T = any>(codeStr: string | ((...a:any)=>any), scope0: GObject | undefined, context0?: GObject,
                                                 protectShallowValues?: boolean, doIdentifierValidation?:boolean): T {
        // console.log('evalInContextAndScope', {codeStr, scope, context});
        // scope per accedere a variabili direttamente "x + y"
        // context per accedervi tramite this, possono essere impostati come diversi.
        if (!scope0 && !context0) { Log.ex(true, 'evalInContextAndScope: must specify at least one of scope || context', {codeStr, scope0, context0}); }

        // scope.this = scope.this || context || scope; non funziona
        // console.log('"with(this){ return eval( \'" + codeStr + "\' ); }"', "with(this){ return eval( '" + codeStr + "' ); }");
        // eslint-disable-next-line no-restricted-syntax,no-with
        // if (allowScope && allowContext) { return function(){ with(this){ return eval( '" + codeStr + "' ); }}.call(scopeAndContext); }
        // if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr + "' ); }").call(scopeAndContext); }
        let _ret: T = null as any;
        let scope: GObject | undefined;
        let context: GObject | undefined;
        if (protectShallowValues) {
            if (scope0) { scope = {...scope0, __proto__: scope0.__proto__}; scope.__proto__ = scope0.__proto__; } else scope = undefined;
            if (context0) { context = {...context0, __proto__: context0.__proto__}; context.__proto__ = context0.__proto__; } else context = undefined;
        } else { scope = scope0; context = context0; }

        Log.w(!!(!context && scope),
            "evalInContextAndScope() Context is mandatory, as scope && !context case is not working properly \n" +
            "because scope is simulated by declaring variables pointing to \"this\" objects instead of doing a full deep copy.\n" +
            "Autofixed by assigning context = scope;");
        Log.eDev(!!((context && scope) && (context !== scope)),
            "evalInContextAndScope() Context and scope cannot be different if both present.\n" +
            "Because scope is simulated by declaring variables pointing to \"this\" objects instead of doing a full deep copy.");
        if (!context) context = scope; // se creo un nuovo contesto pulisco anche lo scope dalle variabili locali di questa funzione.


        /*
        if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr.replace(/'/g, "\\'") + "' ); }").call(scopeAndContext); }
        if (!allowScope && allowContext) { return new Function( "return eval( '" + codeStr + "' );").call(scopeAndContext); }
        if (allowScope && !allowContext) { return eval("with(scopeAndContext){ " + codeStr + " }"); }*/
//      U.pe(!!scope && U.isStrict(), 'cannot change scope while in strict mode ("use strict")');
        let prefixDeclarations: string = "", postfixDeclarations: string = '';
        if (scope) {
            if (U.isStrict) {
                for (let key in scope) {
                    if (doIdentifierValidation) {
                        key = key.trim();
                        if (!key || !U.validIdentfierRegexp.test(key)) continue;
                    }
                    // anche se li assegno non cambiano i loro valori nel contesto fuori dall'eval, quindi lancio eccezioni con const.
                    prefixDeclarations += "const " + key + "=this." + key + ";";
                    postfixDeclarations = "";
                }
            } else {
                prefixDeclarations = "with(" + (context ? "this._eval." : "") + "scope){ ";
                postfixDeclarations = " }";
            }
        }

        if (scope && context) {
            if (typeof codeStr === "function") { codeStr = codeStr.toString(); } // functions cannot change scope (with statement is deprecated)
            (context as any)._eval = {__codeStr: codeStr}; // necessary to reach this._eval.codeStr inside the eval()
            // console.log("evalincontextandscope: ", {fullCodeStr: prefixDeclarations + "return eval( this._eval._codeStr );" + postfixDeclarations, codeStr});
            _ret = new (Function as any)(prefixDeclarations + "; return eval( this._eval.__codeStr );" + postfixDeclarations).call(context);
            delete (context as any)._eval;
        } else
        if (!scope && context) {
            if (typeof codeStr === "function") {
                _ret = (function(...a: any){ return (codeStr as Function).call(context, ...a)}) as any;
                // _ret = (...a: any)=>codeStr.call(context, ...a);
            } else {
                // cannot just eval(codeStr).call(context) because the result might not be a function but only a piece of code or an expression
                (context as any)._eval = {__codeStr: codeStr}; // necessary to reach this._eval.codeStr inside the eval()
                _ret = new (Function as any)("return eval( this._eval.__codeStr );").call(context);
                delete (context as any)._eval;
                // this below  is not good, as i need to quote the expanded result of codeStr,
                // but since it might contain quotes as well i would need to escape them too.
                // _ret = new (Function as any)("return eval( " + codeStr + " );").call(context);
            }
        } else
        if (scope && !context) {
            // NB: potrei creare lo scope con "let key = value;" per ogni chiave, ma dovrei fare json stringify e non è una serializzazione perfetta e può dare eccezioni(circolarità)
            // console.log({isStrict: U.isStrict, eval: "eval(" + prefixDeclarations + codeStr + postfixDeclarations + ")"});
            if (typeof codeStr === "function") { codeStr = codeStr.toString(); } // functions cannot change scope (with statement is deprecated)
            _ret = eval(prefixDeclarations + codeStr + postfixDeclarations); }

        return _ret; }

    //T extends ( ((...args: any[]) => any) | (() => any)
    public static execInContextAndScope<T extends (...args: any) => any>(func: T, parameters: Parameters<T>, scope?: GObject, context?: GObject): ReturnType<T>{
        Log.l(false, 'execInCtxScope', {func, parameters, scope, context});
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


    static asClass<T extends Function>(obj: any, classe: T, elseReturn: T | null = null): null | T { return obj instanceof classe ? obj as any as T: elseReturn; }
    static asString<T>(propKey: unknown, elseReturn: T | null = null): string | null | T { return typeof propKey === 'string' ? propKey : elseReturn; }
    static isString(propKey: unknown): boolean { return typeof propKey === 'string'; }

    static loadScript(path: string, useEval: boolean = false): void {
        const script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        Log.eDev(useEval, 'loadScript', 'useEval','useEval todo. potrebbe essere utile per avviare codice fuori dalle funzioni in futuro.');
        document.body.append(script); }

    static ancestorArray<T extends Element>(domelem: T | null | undefined, stopNode?: Node, includeSelf: boolean = true): Array<T> {
        // [0]=element, [1]=father, [2]=grandfather... [n]=document
        if (!domelem) { return []; }
        const arr = includeSelf ? [domelem] : [];
        let tmp: T = domelem.parentNode as T;
        while (tmp !== null && tmp !== stopNode) {
            arr.push(tmp);
            tmp = tmp.parentNode as T; }
        return arr; }

    public static monitorObjectProperty(o: GObject, key: string, callback:((k:string, v:any, isWrite: boolean, oldVal: any)=>void),
                                        read: boolean=true, write: boolean=true): void{
        if (!o || !callback || !read && !write) return;
        let propDescriptor: GObject = {};
        let prefixed = '_monitorObject_' + key;
        o[prefixed] = o[key];
        if (read) propDescriptor.get = () => { callback(key, o[prefixed], false, undefined); return o[prefixed]; };
        if (write) propDescriptor.set = (newVal: any) => { callback(key, newVal, true, o[prefixed]); o[prefixed] = newVal; };
        Object.defineProperty(o, key, propDescriptor);
    }

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
        return (window as any).Math.min(
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

    //todo for console
    public static autoCorrectProxy<T extends GObject>(target: T, recursive: boolean, logger: Console): ProxyHandler<T> {
        return new Proxy(target, {
            get: function(target, name) {
                let namestr = U.asString(name, null);
                if (!namestr) return undefined;
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
        // console.log("importEcore: pre file reader");
        myFileReader.show(onChange, extensions, readContent);
    }

    public static clear(htmlNode: Element): void {
        if (htmlNode) while (htmlNode.firstChild) { htmlNode.removeChild(htmlNode.firstChild); }
    }

    static clearAllTimeouts(): void {
        const highestTimeoutId: number = setTimeout(() => {}, 1) as any;
        for (let i = 0 ; i < highestTimeoutId ; i++) { clearTimeout(i); }
    }

    static getStackTrace(sliceCalls: number = 2): string[] {
        const ret: string | undefined = Error().stack;
        // try { var a = {}; a.debug(); } catch(ex) { ret = ex.stack; }
        // if (Array.isArray(ret)) return ret;
        if (!ret) return ['UnknownStackTrace'];
        const arr: string[] = ret.split('\n');
        // first 2 entries are "Erorr" and "getStackTrace()"
        return sliceCalls > 0 ? arr.slice( sliceCalls ) : arr; }

    // 0 for caller, 1 for caller of caller, -1 for current function, up to -4 to see internal layers (useless)
    public static getCaller(stacksToSkip: number = 0): string {
        const stack: string[] = this.getStackTrace(4);
        // erase getStackTrace() and isFirstTimeCalled() + Error() first stack + n° of layer the caller wants.
        return stack[stacksToSkip]; }

    private static gotcalledby: Dictionary<string, boolean> = {};

    // todo: use in Log.once
    // returns true only the first time this line is reached, false in loops >1 loop, false in recursion >1 recursion, false even days after the first execution unless the page is reloaded
    public static isFirstTimeCalledByThisLine(stacksToSkip: number = 0): boolean {
        const caller: string = this.getCaller(stacksToSkip);
        if (U.gotcalledby[caller]) return false;
        return U.gotcalledby[caller] = true; }

    public static lineKey(): string { return this.getCaller(0); }

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

    static SetMerge<T>(modifyFirst: boolean = true, ...iterables: Iterable<T>[]): Set<T> {
        const set: Set<T> = modifyFirst ? iterables[0] as Set<T>: new Set<T>();
        Log.e(!(set instanceof Set), 'U.SetMerge() used with modifyFirst = true requires the first argument to be a set');
        for (let iterable of iterables) { for (let item of iterable) { set.add(item); } }
        return set; }

    // merge in-place with unique elements
    static ArrayMergeU(arr1: any[], ...arr2: any[]): any[] { return U.ArrayMerge0(true, arr1, arr2); }
    // merge in-place without unique check
    static ArrayMerge(arr1: any[], ...arr2: any[]): any[] { return U.ArrayMerge0(false, arr1, arr2); }
    // implementation
    static ArrayMerge0(unique: boolean, arrtarget: any[], ...arrays: any[]): any[] {
        if (!arrtarget || !arrays) return arrtarget as any;

        if (unique) { for (let arri of arrays) for (let e of arri) U.ArrayAdd(arrtarget, e); }
        else { for (let arri of arrays) Array.prototype.push.apply(arrtarget, arri); }
        return arrtarget;
    }

    static ArrayAdd<T>(arr: Array<T>, elem: T, unique: boolean = true, throwIfContained: boolean = false): boolean {
        Log.ex(!arr || !Array.isArray(arr), 'ArrayAdd arr null or not array:', arr);
        if (!unique) { arr.push(elem); return true; }
        if (arr.indexOf(elem) === -1) { arr.push(elem); return true; }
        Log.ex(throwIfContained, 'ArrayAdd element already contained:', arr, elem);
        return false; }


    private static maxID: number = 0;
    public static idPrefix: string = '';
    // static getID(): string { return U.idPrefix + U.maxID++; }
    static getID: Generator<number> = function* idgenerator(): Generator<number> { let i: number = 0; while(true) yield i++; }();


    static getType(param: any): string {
        switch (typeof param) {
            default: return typeof param;
            case 'object':
                return (param?.constructor as typeof RuntimeAccessibleClass)?.cname || param?.className || "{_rawobject_}";
            case 'function': // and others
                return "geType for function todo: distinguish betweeen arrow and classic";
        }
    }

    static stringCompare(s1: string, s2: string): -1 | 0 | 1 { return (s1 < s2) ? -1 : (s1 > s2) ? 1 : 0; }

    static endsWith(str: string|undefined|null, suffix: string | string[]): boolean {
        if (!str) return false;
        if (Array.isArray(suffix)) {
            for (let suf of suffix) {
                if (U.endsWith(str, suf)) return true;
            }
            return false;
        }
        // todo: improve performance, do a loop starting from lastindex of both, return early on mismatches. goes from O(string) to O(Min(suffix, string)) often returning after 1 check
        return str.length >= suffix.length && str.lastIndexOf(suffix) === str.length - suffix.length;
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
        if (increaseWhile && !increaseWhile(s)) return s;
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
        }
        if (increaseWhile) while (increaseWhile(prefix + num)) { num++; }
        return prefix + num; }


    public static shallowEqual(objA: GObject, objB: GObject): boolean {
        if (objA === objB) { return true; }

        if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') { return false; }

        var keysA = Object.keys(objA);
        var keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;

        // if (keysA.length !== keysB.length) { return false; }
        // Test for A's keys different from B.
        // var bHasOwnProperty = hasOwnProperty.bind(objB);
        for (let keya in objA) if (!Object.is(objA[keya], objB[keya])) return false;

        // for (var i = 0; i < keysA.length; i++) if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) { return false; }
        return true;
    }

    // returns true only if parameter is already a number by type. UU.isNumber('3') will return false
    static isNumber(o: any): o is number { return typeof o === "number" && !isNaN(o); }
    static isPrimitive(o: any, returnIfNull=true, returnIfUndefined=true, returnIfSymbol = false): o is PrimitiveType {
        switch (typeof o) {
            case 'symbol': return returnIfSymbol; // it is primitive by definition, but behaves too much differently
            case 'undefined': return returnIfUndefined;
            case 'function':
            case 'object':
                if (o === null) return returnIfNull;
                return false;
            default: return true;
            // case 'bigint':
        }
    }

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

    static objectFromArray<V extends any>(arr: V[], getKey: keyof V|((entry:V) => string)): Dictionary<string, V>{
        if (!arr || !Array.isArray(arr)) return {};
        // @ts-ignore
        return arr.reduce((acc, val) => {
            // @ts-ignore
            let key = typeof getKey === 'string' ? val[getKey] : getKey(val);
            // @ts-ignore
            acc[key] = val;
            return acc;
        }, {});
    }

    static objectFromArrayValues<T extends any>(arr: (string | number)[], val: T = true as T): Dictionary<string | number, T> {
        // @ts-ignore
        return arr.reduce((acc, v) => { acc[v] = val; return acc; }, {});
        /*let ret: Dictionary = {};
        for (let val of arr) { ret[val] = true; }
        return ret;*/
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

    static arrayDifference<T>(starting: T[], final: T[]): {added: T[], removed: T[], starting: T[], final: T[]} { return Uarr.arrayDifference(starting, final); }

    /*  {a: { b: { c1: 1, c2:2, c3:3 } }, d: 1 }     ---->  {"a.b.c1":1, "a.b.c2":2, "a.b.c3":3. "d":1}*/
    public static flattenObjectToRoot(obj: GObject, prefix: string = '', pathseparator: string = '.'): GObject{
        if (!obj) { Log.ee('invalid flattenobject call', {obj, prefix}); return obj; }
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
    /*public static ObjectToAssignementStrings2<R extends {str: string, fullstr: string, path:string[], fullpath:string[], val: string, fullvalue: string, pathlength?: number}>
    (obj: GObject, maxkeylength: number = 10, maxsubpaths: number = 6, maxvallength: number = 20, toolongreplacer: string = "…", out?:{best: R}&R[], quotestrings: boolean = true): {best: string}&string[] {
        out.__jjsplitstrings = true;
        let ret = U.ObjectToAssignementStrings(obj, maxkeylength, maxsubpaths, maxvallength, toolongreplacer, out, quotestrings)
        delete out.__jjsplitstrings;
        return ret;
    }*/
         public static ObjectToAssignementStrings<R extends {str: string, fullstr: string, path:string[], fullpath:string[],
             val: string, fullvalue: string, pathlength?: number}>
    (obj: GObject, maxkeylength: number = 10, maxsubpaths: number = 6, maxvallength: number = 20, toolongreplacer: string = "…",
     out?:{best: R, obj: GObject}&R[], quotestrings: boolean = true, filterFunction?: (e:R)=>boolean): {best: string}&string[] {
        const pathseparator = ".";
        const valueseparator = " = ";
        //const filterrow = (rowpaths: string[]) => { return (!rowpaths.includes("clonedCounter") && !rowpaths.includes("pointedBy")); };
        let flatten = U.flattenObjectToRoot(obj, '', pathseparator);
        let i = -1;
        let tmp;
        const ret: {best: string, obj: GObject} & string[] = [] as any;
        ret.obj = obj;
        tmp = (maxkeylength - toolongreplacer.length)/2;
        let halfpath = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };
        tmp = (maxvallength - toolongreplacer.length)/2;
        let halfval = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };
        tmp = (maxsubpaths - toolongreplacer.length)/2;
        let halfsubpaths = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };


        let bestpathsize = 0;
        let best: R | null = null;
        let countsize = (total: number, arrelem: string): number => total + arrelem.length;
        const filterbest = (row: R) => {
            row.pathlength = row.fullstr.length; // row.fullpath.reduce<number>(countsize, 0);
            if (!best || bestpathsize < row.pathlength) { // && filterrow(row.fullpath)) {
                best = row;
                bestpathsize = row.pathlength;
                if (out) out.best = best;
                ret.best = best.str;
            }
        }


        for (let key in flatten) {
            let row: R = {fullpath: key.split(pathseparator), fullstr: key} as R;
            if (filterFunction && !filterFunction(row)) continue;
            // stringify(undefined) = undefined, so i add + ""
            try {
                if (!quotestrings && typeof flatten[key] === "string") row.fullvalue = flatten[key];
                else row.fullvalue = JSON.stringify(flatten[key]) + "";
            } catch(e) { row.fullvalue = "⁜not serializable⁜"; }
            // console.log("U get assignements loop", {row, key, flatten, obj});
            row.val = row.fullvalue.length <= maxvallength ? row.fullvalue : row.fullvalue.substring(0, halfval.start) + toolongreplacer + row.fullvalue.substring(halfval.start);
            if (row.fullpath.length > maxsubpaths) {
                row.path = [...row.fullpath];
                row.path.splice( halfsubpaths.start, row.fullpath.length - halfsubpaths.start - halfsubpaths.end, toolongreplacer);
            } else row.path = row.fullpath;

            // row.path = row.fullpath.length <= maxsubpaths ? row.fullpath : [...row.fullpath.slice(0, halfsubpaths.start), ...row.fullpath.toomanyarraycopies];
            row.path = row.path.map((p: string) => (p.length <= maxkeylength ? p : p.substring(0, halfpath.start) + toolongreplacer + p.substring(p.length - halfpath.end)));
            if (out) { out.push(row); }

            if (row.val === '__jjObjDiffEmptyElem') row.str = 'DELETE '+row.path.join(pathseparator)+';';
            else row.str = row.path.join(pathseparator) + valueseparator + row.val;
            ret.push( row.str );
            filterbest(row);
        }
        return ret;
    }


    static download(filename: string = 'nameless.txt', text: string = '', debug: boolean = true): void {
        if (!text) return;
        filename = U.toFileName(filename);
        const htmlA: HTMLAnchorElement = document.createElement('a');
        const blob: Blob = new Blob([text], {type: 'text/plain', endings: 'native'});
        const blobUrl: string = URL.createObjectURL(blob);
        htmlA.style.display = 'none';
        htmlA.href = blobUrl;
        htmlA.download = filename;
        document.body.appendChild(htmlA);
        htmlA.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(htmlA);
    }

    static formatXml(xml: string): string {
        const reg = /(>)\s*(<)(\/*)/g;
        const wsexp = / *(.*) +\n/g;
        const contexp = /(<.+>)(.+\n)/g;
        xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
        const pad: string = '\t';
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
        if (obj.__raw) obj = obj.__raw;
        return JSON.stringify(obj, (key, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (value.__raw) value = value.__raw;
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
        ret = ret && ret[0]; // first match
        if (ret === null) return valueifmismatch;

        let tmpindex:number;
        if (allowDecimalComma) ret = U.replaceAll(ret, ",", ".");
        // while (allowDecimalComma && (tmpindex = ret.indexOf(",")) !== ret.lastIndexOf(",")) ret.substring(tmp+1) // ret.indexOf(.)
        while ((allowDecimalDot || allowDecimalComma) && (tmpindex = ret.indexOf(".")) !== ret.lastIndexOf(".")) ret = ret.substring(tmpindex+1) // ret.indexOf(.)
        // if (ret[0]==="-" && (ret[1]==="," || ret[1]===".")) ret = "-0."+ret.substring(2); automatically done bu js.    +"-.5" = -0.5
        return +ret;
    }

    // faster than jquery, underscore and many native methods checked https://stackoverflow.com/a/59787784
    public static isEmptyObject(obj: GObject | undefined): boolean {
        if (typeof obj !== "object") return false;
        for (var i in obj) return false;
        return true;
    }

    private static pairArrayElementsRepeatFunc<T>(val: T, index: number, arr:T[]): T[]{ return [arr[index], arr[index+1]] }
    private static pairArrayElementsReducerFunc<T>(accumulator: T[][], value: T, index: number, array: T[]):T[][] {
        if (index % 2 === 0) accumulator.push(array.slice(index, index + 2));
        return accumulator; }

    // from arr[] to arr[][]. if is with repetitions is: [1,2], [2,3], [3,4]... (ret.length = source.length-1)
    // if without repetitions is: [1,2], [3,4].... (ret.length = Math.ceil(source.length/2);
    public static pairArrayElements<T>(arr:T[], withRepetitions:boolean = false):T[][] {
        if (withRepetitions) { return arr.map(U.pairArrayElementsRepeatFunc).slice(0, arr.length-1); }
        return arr.reduce( U.pairArrayElementsReducerFunc as ((accumulator: T[][], value: T, index: number, array: T[]) => T[][]), []); }

    // removes line // and block /**/ comments  todo: can likely be improved by a regular expression
    public static decomment_all(str: string): string { return this.decomment_line(this.decomment_block(str)); }
    // removes line comments //
    public static decomment_line(str: string, trimLines: boolean = true): string {
        return str
            .split("\n")
            .map(s=> { let i = s.indexOf("//"); s = (i === -1 ? s : s.substring(i)); return trimLines ? s.trim() : s; } )
            .join("\n");
    }
    // removes block comments /**/
    public static decomment_block(str: string): string {
        // let maxcomments = 100;
        while(true){
            // if (--maxcomments===0) break;
            let s: number = str.indexOf("/*");
            if (s === -1) break;
            let e: number = str.indexOf("*/", s+1);
            if (e === -1) e = str.length;
            str = str.substring(0, s) + str.substring(e+2);
        }
        return str; }

    static uppercaseFirstLetter<T extends (string | GObject<"jsx">)>(str: T): T {
        if (typeof str !== "string") return str;
        return str.charAt(0).toUpperCase() + str.slice(1) as T;
    }

    // CAREFUL! it's imperfect.
    // Does not handle strings starting with ( that are not ()=> arrow functions
    // or codes whose last chars are () but not in (function)() form
    static wrapUserFunction(str: string): string {
        str = str.trim();
        if (str[0]!=='(' || str.indexOf("function") !== 0) {
            str = "()=>{" + str + "\n}"; // last \n important for line comments //
        }
        if (str[str.length - 2] !== "(" || str[str.length - 1] !== ")") str = "(" + str + ")()";
        return str;
    }

    // adds ellipsis in the middle of a string to truncate it when it's too long.
    public static stringMiddleCut<T extends boolean | undefined, RET extends string | string[] = T extends true ? string[] : string>
    (str: string, maxLength: number, ellipsisChar: string = '…', asArray?: T): RET{
        if (!str as unknown || maxLength < 0 || str.length <= maxLength) return (asArray ? [str] : str) as RET;
        var midpoint = Math.ceil(str.length / 2);
        var toremove = str.length - maxLength + ellipsisChar.length; // makes room for the additional ellipsis too
        var lstrip = Math.ceil(toremove/2); // left strip is the bigger one if odd chars
        var rstrip = toremove - lstrip;
        if (asArray) return [str.substring(0, midpoint-lstrip), ellipsisChar, str.substring(midpoint+rstrip)] as RET;
        else return str.substring(0, midpoint-lstrip) + ellipsisChar + str.substring(midpoint+rstrip) as RET;
    }

    // transform grays: if the color is <20% different from gray, transform it instead in black or white, 0 = don't, 1 = always black or white
    public static invertHex(s: string, prefix: string='#', transformGrays: number = 0.2): string {
        if (s.indexOf(prefix) === 0) s = s.substring(prefix.length);
        let r: number, g: number, b: number, h: number | undefined; // might be NaN if parseInt fails
        if (s.length === 3 || s.length === 4) {
            r = parseInt('0x'+s[0]);// works with hex numbers
            g = parseInt('0x'+s[1]);
            b = parseInt('0x'+s[2]);
            h = s.length === 4 ? parseInt('0x'+s[4]) : undefined;
        } else if (s.length === 6 || s.length === 8){
            r = parseInt('0x'+s.substring(0, 2));
            g = parseInt('0x'+s.substring(2, 4));
            b = parseInt('0x'+s.substring(4, 6));
            h = s.length === 8 ? parseInt('0x'+s.substring(6, 8)) : undefined;
        } else return Log.ee("cannot invert hex color " + s + ", invalid length", {s});
        if (isNaN(r)) return Log.ee("cannot invert hex color " + s +", invalid red", {s});
        if (isNaN(g)) return Log.ee("cannot invert hex color " + s +", invalid green", {g});
        if (isNaN(b)) return Log.ee("cannot invert hex color " + s +", invalid blue", {b});

        transformGrays = transformGrays * 128;
        r = Math.abs(r-128) <= transformGrays ? (r >= 128 ? 0 : 255) : 255 - r;
        g = Math.abs(g-128) <= transformGrays ? (g >= 128 ? 0 : 255) : 255 - g;
        b = Math.abs(b-128) <= transformGrays ? (b >= 128 ? 0 : 255) : 255 - b;
        if (h || h === 0) h = 255 - h;

        let rs = r.toString(16);
        if (rs.length === 1) rs = '0'+rs;
        let gs = g.toString(16);
        if (gs.length === 1) gs = '0'+gs;
        let bs = b.toString(16);
        if (bs.length === 1) bs = '0'+bs;
        let hs = h ? h.toString(16) : '';
        if (hs.length === 1) hs = '0'+hs;

        return (prefix) + rs+gs+bs+hs;
    }

    public static parentUntil(tagName: string, p: Element | null): Element | null {
        while (p && p.tagName !== tagName) p = p.parentElement;
        return p;
    }

    static paletteSplit(palette: Readonly<PaletteType>): {
        color: Dictionary<string, PaletteControl>,
        number: Dictionary<string, NumberControl>,
        text: Dictionary<string, StringControl>,
        path: Dictionary<string, PathControl>,
    } {
        type clist = PaletteControl | NumberControl | StringControl | PathControl;
        let ret = {
            color: {} as Dictionary<string, PaletteControl>,
            number: {} as Dictionary<string, NumberControl>,
            text: {} as Dictionary<string, StringControl>,
            path: {} as Dictionary<string, PathControl>,
        } as Dictionary<(clist)["type"], Dictionary<string, any>>;
        for (let entry of Object.entries(palette)) {
            let k = entry[0];
            let v = entry[1];
            ret[(v as clist).type][k] = v;
        }
        return ret;
    }


    // arrayMergeInPlace is faster for non-named ones
    static mergeNamedArray<T extends GObject>(ret: T[] & Dictionary<DocString<"$name">, T>, classes: T[] & Dictionary<DocString<"$name">, T>) {
        for (let key of Object.getOwnPropertyNames(classes)) { // ownPropertyNames skips "first, last, separator" created by extending array prototype
            if (key === "length") continue;
            if (!isNaN(+key)) ret.push(classes[key]);
            // not else, if a class is named like a number it can be accessed by name until is overwrite by index being reached.
            if (!ret[key]) ret[key] = classes[key];
        }
    }

    private static prefix = 'ULibrary_';
    private static clipboardinput: HTMLInputElement;
    static async clipboardCopy<T>(text: string, onSuccess?:()=>T, onFailure?:()=>T): Promise<T | undefined> {
        let ret: boolean = false;
        return navigator.clipboard.writeText(text).then(() => {
            ret = true;
            if (onSuccess) return onSuccess();
        },() => {
            ret = U.clipboardCopy_old(text);
            return ret ? onSuccess && onSuccess() : onFailure && onFailure();
        });
    }
    static clipboardCopy_old(text: string): boolean {
        try{
        if (!U.clipboardinput) {
            U.clipboardinput = document.createElement('input');
            U.clipboardinput.id = U.prefix + 'CopyDataToClipboard';
            U.clipboardinput.type = 'text';
            U.clipboardinput.style.display = 'block';
            U.clipboardinput.style.position = 'absolute';
            U.clipboardinput.style.top = '-100vh'; }
        document.body.appendChild(U.clipboardinput);
        U.clipboardinput.value = text;
        U.clipboardinput.select();
        if (!document.execCommand) return false;
        let ret = document.execCommand('copy');
        document.body.removeChild(U.clipboardinput);
        U.clearSelection();
        return ret;
        }
        catch(e){ return false; }
    }

    static clearSelection() {}

    static isError(obj: unknown): obj is Error {
        // obj istanceof Error // this is not iframe-safe, Errors from different iframes are considered different instances
        // this is iframe-safe and catches all error types
        return Object.prototype.toString.call(obj) === "[object Error]";
        // or err.toString --> "Error: message" dunno if stack is printed too i tested with a fake error.
    }

    static toNamedArray<D extends DPointerTargetable, L extends LPointerTargetable>(larr:L[], darr?:D[]): L[] & Dictionary<DocString<"$name">, L>{
        if (!darr || darr.length !== larr.length) darr = larr.map(l=>l.__raw as D);

        for (let i = 0; i < larr.length; i++) if (darr[i] && larr[i]) (larr as GObject)["$"+(darr[i] as GObject).name] = larr[i];
        /*for (let index of Object.getOwnPropertyNames(larr)) { // ownPropertyNames skips "first, last, separator" created by extending array prototype
            if (index === "length") continue;
            let d = darr[index as any as number];
            let l = larr[index as any as number];
            if (!d || !l) continue;
            (larr as any)["$" + (d as any).name] = l;
        }*/
        return larr as any;
    }
    public static isDPointerTargetable(e: any): e is (DPointerTargetable | LPointerTargetable){
        return e && (e.__isProxy || (e.className && e.id && e.pointedBy && e._state));
    }
    public static arrayCount<T extends any>(arr: T[], find: T | ((e:T)=>boolean)): number{
        if (typeof find === "function") return arr.reduce((total,x) => total+( (find as any as ((a:any)=>boolean) )(x) ? 1:0), 0);
        return arr.reduce((total,x) => total+(x===find?1:0), 0);
    }
    /*public static cropDObject(o: any): GObject{
        if (!o) return o as any;
        let d: any & Partial<DPointerTargetable> = {...(o.__raw || o)};
        // delete d.pointedBy;
        // defaultValue, instanceClassName, isPrimitive, partialdefault_ame, _storePath, _su_maps, OCL__EEDS_RECALCULATIO_, compiled_css, css, cssISGlo_al, isValidatio_, oclUpdateCo_ditio_, everythimg empty str or 0 or empty arr or empty ovj, palette,

        // remove all falsy properties, just knowing they are not there i know they are falsy, save space.
        for (let k in o){
            let v = o[k];
            //  v === "" || v === null || v === undefined
            if (!v || U.isEmptyObject(v) || Array.isArray(v) || v.lemgth === 0) delete o[k];
        }
        return d;
    }*/

    public static cropDeepObject(o: any, lines_start_crop: number=20, lines_end_crop: number=10, string_start_crop: number=45, string_end_crop: number=35, num_digit_crop: number=5): any{
        if (!o) return o;
        let replacer = (key: string | number | undefined, o: GObject, fullpath:string[], depth: number) => {
            switch (key) {
                case "props": return "[_props_]";
            }
            switch (typeof o) {
                default: return o;
                case "string":
                    return U.cropStr(o, lines_start_crop, lines_end_crop, string_start_crop, string_end_crop);
                case "function":
                    return U.cropStr(o.toString(), lines_start_crop, lines_end_crop, string_start_crop, string_end_crop);
                case "number":
                    return U.cropNum(o, num_digit_crop);
                case "object":
                    if (o === null) return null;
                    if (U.isHtmlNode(o)) return '[HTMLElement]';
                    if (isValidElement(o)) return '[ReactElement]';
                    // because native Error properties are not iterable. need to take them out manually.
                    if (U.isError(o)) return {...o, message:o.message, stack:o.stack};
                    /*if (Array.isArray(o)) {
                        let delements = U.arrayCount(o, U.isDPointerTargetable);
                        if (delements > 0){
                            o = o.map(e=>(U.isDPointerTargetable(e) ? U.cropDObject(o) : e));
                        }
                    }*/
                    if (U.isDPointerTargetable(o)) {
                        if (depth >= 5) return o.id;
                        // if (depth >= 2) return U.cropDObject(o);
                        else o = (o as LPointerTargetable).__raw || o;
                    }
                    if (o.className === 'IPoint') return {x:o.x, y:o.y};
                    if (o.className === 'ISize') return {x:o.x, y:o.y, w:o.w, h:o.h};

                    // remove all falsy properties, just knowing they are not there i know they are falsy, save space.
                    let isArr = Array.isArray(o);
                    o = isArr ? [...(o as any[])] : {...o};
                    for (let k in o) {
                        let v = o[k];
                        /*if (isArr) switch(k){ default: break;
                            case 'contains': case 'joinOriginal': case 'first': case 'last': case 'separator': delete o[k]; continue;
                        }*/
                        //  v === "" || v === null || v === undefined
                        if (!v || U.isEmptyObject(v) || (Array.isArray(v) && v.length === 0)) delete o[k];
                    }
                    // if (U.isDate(o)) return "[Date "+o.getTime()+"]";
                    return o;
            }
        }
        return U.deepReplace(o, replacer);
    }

    static deepCopy(obj: any, circularReferenceValue?: any | ((obj_alreadymet: GObject)=>any)): any {
        return U.deepReplace(obj, undefined, circularReferenceValue);
    }

    // does make a deep copy too.
    static deepReplace(obj: any, replacer?: ((key: undefined | string | number, o: any, fullpath:string[], depth: number) => any),
                       circularReferenceValue: any | ((obj_alreadymet: GObject)=>any) = (o: GObject)=>((o.__raw || o).id || '_circular_ref_')): any {
        U.debugcounter = 0;
        const avoidloop: WeakMap<any, true> = new WeakMap();
        return U.deepReplace_rec(obj, avoidloop, replacer, circularReferenceValue);
    }

    /**
     replacing always preserves same reference statuses. eg, when  {a:"x", b:"x"} -> {a:"y", b:"y"}
     if the original x,y values are the same reference (not just value),
     in the output object a,b will also be the same reference (replacer will not be called twice on the same string)

     note that let arr = ["a", "a"] is an array with 2 equal values but different references.
     while let a = "a"; let arr = [a, a] have equal references.

     circularReferenceValue === "__preserve" causes any duplicate reference causing a loop to be replaced
     with the target of the first reference instead of the "__preserve" string.

     todo: add parameter eagerLoopReturn (current behaviour is eagerLoopReturn = true)
     eagerLoopReturn = true returns as soon a duplicate objects is found, the returned structure is guaranteed to not have duplicates. [a,a] => [a,'loop','loop']
     eagerLoopReturn = false returns 'loop' only if an object is already found AND have subobjects.
     let a = {id:"a1", l:{b:1}};    [a,a] --> [{id:"a1", l:{b:1}, {id:"a1", l:'_loop_']
     finaly eagerLoopReturn = 'inline' replaces with '_loop_' only when there is really a circular ref
     (found an object already found in the current "path" from root to current obj)
     so i need to copy the current map and pass a new copy every time i go deep on a new subobject, branching a tree.
     let a = {id:"a1", l:{b:1}};    [a,a] will still return [a,a] with no '_loop_' tags
     instead let a = {l:{b:1}, a:a};    [a,a] will return [{l:{b:1}, a:'_loop_'}, {l:{b:1}, a:'_loop_'}] with no '_loop_' tags

     replacer func:
         @obj is the current object.
         @key is the last key followed to reach obj from the root.
         @fullpath is the full path from root to obj
     */
    static weakmapSet(m: WeakMap<any, any>, k: any, v: any): void { // because weakmaps cannot store non-object keys, if i try to store a primitive key i use it as a pojo
        if (k && typeof k === 'object') m.set(k, v)
        else (m as GObject)[k] = v;
    }
    static weakmapGet(m: WeakMap<any, any>, k: any): any { // because weakmaps cannot store non-object keys, if i try to get from a primitive key i use it as a pojo
        if (k && typeof k === 'object') return m.get(k)
        else return (m as GObject)[k];
    }
    static weakmapHas(m: WeakMap<any, any>, k: any): boolean {
        if (k && typeof k === 'object') return m.has(k);
        else return !!(m as GObject)[k];
    }

    static debugcounter = 0;
    static deepReplace_rec(obj: any, avoidloop: WeakMap<any, true>, replacer?: ((key: undefined | string | number, o: any, fullpath: string[], depth: number) => any),
                           circularReferenceValue?: any | ((obj_alreadymet: GObject)=>any), key?: number | string, fullpath:string[]=[], curdepth:number=0,
                           eagerLoopReturn: boolean = false, ignoreProto = true): any {

        // console.log('deepreplacer pre', {obj, fullpath, key, curdepth});
        if (++U.debugcounter % 100000 === 0) {
            Log.eDevv('possible loop in deepreplace', {fullpath, obj});
            return obj;
        }
        switch (typeof obj) {
            case "symbol": // don't know what really do with symbols and funcs
            case "function":
                return replacer ? replacer(key, obj, fullpath, curdepth) : obj;
            default: // because primitive types cannot be used as WeakMap.set(key), but can as Object keys
                /*if (obj in avoidloop) return U.weakmapGet(avoidloop, obj);
                else U.weakmapSet(avoidloop, obj, obj); */
                break;

            case "object":
                if (obj === null) {
                    /*if (avoidloop.has(obj)) return avoidloop.get(obj);
                    else avoidloop.set(obj, obj);*/
                    break;
                }
                if (avoidloop.has(obj)) { // for objects
                    // for duplicate empty arr or objects, i avoid printing the {__circular_reference__} message and just display the empty obj, pretending is not duped.
                    // if (!replacer && ((Array.isArray(obj) && obj.length === 0) || Object.keys(obj).length === 0)) break; // return obj;

                    if (circularReferenceValue === "__preserve" || typeof obj !== "object") return avoidloop.get(obj);
                    else return typeof circularReferenceValue === "function" ? circularReferenceValue(obj) : circularReferenceValue;
                } else avoidloop.set(obj, obj);
                break;
        }

        let old_obj = obj;

        if (replacer) obj = replacer(key, obj, fullpath, curdepth);
        // console.log('deepreplacer replaced', {obj, old_obj, fullpath, key, curdepth, changed: obj === old_obj});
        switch (typeof obj){
            default: break; // obj = obj; return obj; // for any leaf type
            case "object":
                if (obj === null) return null;
                if (U.isHtmlNode(obj)) return obj;
                if (isValidElement(obj)) return obj;
                if (U.isError(obj)) return obj;
                if (Array.isArray(obj)) {
                    obj = obj.map((o, i) => U.deepReplace_rec(o, avoidloop, replacer, circularReferenceValue, i, [...fullpath, ''+i], curdepth+1));
                    break;
                }
                let o: GObject = {};
                for (let k in obj) {
                    if (ignoreProto && !obj.hasOwnProperty(k)) continue;
                    o[k] = U.deepReplace_rec(obj[k], avoidloop, replacer, circularReferenceValue, k, [...fullpath, k], curdepth+1);
                }
                obj = o;
                break;
        }

        return obj;
    }



    // returns path to that object to find
    public static deepFindInObject(obj: any, subobject: any, compareFunc?:(a:any,b:any)=>boolean, maxDepth: number = Number.POSITIVE_INFINITY): string | undefined {
        const avoidloop: WeakMap<any, true> = new WeakMap();
        let ret = U.deepFindInObject_rec(obj, subobject, avoidloop, maxDepth, compareFunc);
        if (ret === '') return 'this';
        else return ret;
    }
    private static deepFindInObject_rec(obj: any, subobject: any, avoidloop: GObject & WeakMap<any, true>, maxDepth: number, compareFunc?:((a:any,b:any)=>boolean), curdepth:number=0): string | undefined {
        if (compareFunc ? compareFunc(obj, subobject) : obj === subobject) return ''
        if (curdepth >= maxDepth) return undefined;

        let old_obj = obj;
        switch (typeof old_obj) {
            default: return undefined;
            case "object":
                if (old_obj === null) return undefined;
                if (avoidloop.has(obj)) { // for objects
                    return undefined;
                } else avoidloop.set(old_obj, obj);
                break;
        }

        switch (typeof obj){
            default: return undefined;
            case "object":
                if (U.isHtmlNode(obj)) return undefined;
                if (isValidElement(obj)) return undefined; // ReactElement
                if (U.isError(obj)) return undefined;

                if (Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; i++) {
                        let found = U.deepFindInObject_rec(obj[i], subobject, avoidloop, maxDepth, compareFunc, curdepth+1);
                        if (found === '') return i+'';
                        else if (found !== undefined) return i+'.'+found;
                    }
                    return undefined;
                }
                for (let k in obj) {
                    let found = U.deepFindInObject_rec(obj[k], subobject, avoidloop, maxDepth, compareFunc, curdepth+1);
                    if (found === '') return k+'';
                    if (found !== undefined) return k+'.'+found;
                }
                return undefined;
        }
        return undefined;
    }


    public static mailerror(recipients: string[], title: string, msgbody_notencoded: string, canUseClipboard: boolean, clipboardSuccess?: ()=>any, clipboardFailure?: ()=>any) {

        const msgbody: string = encodeURIComponent(msgbody_notencoded);
        const mailtitle: string =  encodeURIComponent(title);
        // "mailto:no-one@snai1mai1.com?subject=look at this website&body=Hi,I found this website and thought you might like it http://www.geocities.com/wowhtml"
        const gitissue = "https://github.com/MDEGroup/jjodel/issues/new?title="+mailtitle+"&body="+msgbody;
        let mailto: string | undefined = "mailto:"+recipients.join(';')+"?subject="+mailtitle+"&body="+msgbody;
        const mailtolimit = 2042 - 23/*for safety*/;
        /*
            git uri limit: the requests start failing at exactly 8202 characters.

            mailto: limits
            2042 characters on Chrome 64.0.3282.186
            2046 characters on Edge 16.16299
            approximately 32700 characters on Firefox 58.0

            max URI lengths:
            chrome: 15613 chars
            firefox: 15708
        */
        if (mailto.length > mailtolimit){
            if (canUseClipboard) {
                const mailfallback = encodeURIComponent("mail body exceeded maximum mailto: link length.\n" +
                    "It has been copied to your clipboard, please past it here or use github issue report.");
                U.clipboardCopy(msgbody_notencoded, clipboardSuccess, clipboardFailure);
                mailto =  "mailto:"+recipients.join(';')+"?subject="+mailtitle+"&body=" + mailfallback;
            }
            else mailto = undefined;
        }
        return {gitissue, mailto};
    }



    // NB: does not owrk if there is an overflow of pos:absolute elements needs to be updated before use.
    public static findOverflowingNodes_broken(element : Element) : {element: Element, overflowingFrom: string }[] {
        if (!element) return [];
        // type Direction = {v: number, e: Element};
        // const biggestChilds: Partial<{[k: keyof DOMRect]: {v: number, e: Element}}> = {};
        //const biggestChilds: Partial<{[k: keyof DOMRectReadOnly]: {v: number, e: Element}}> = {};
        const biggestChilds: Record<keyof DOMRectReadOnly, {v: number, e: Element}> = {} as any;
        let childarr: {element: Element, size: DOMRect}[] = [];
        let ret: {element: Element, overflowingFrom: string }[] = [];
        while (element) {
            const size = element.getBoundingClientRect();
            childarr.push({element, size});
            let k: keyof DOMRectReadOnly;
            for (k in size) {
                let v = size[k] as number;
                if (!biggestChilds[k] || v > biggestChilds[k].v) biggestChilds[k] = {e: element, v};
            }
            if (childarr.length <= 1) continue;
            let {element: child, size: childSize} = childarr[childarr.length -1];

            for (k in size) {
                let v = size[k];
                if (childSize[k] > v) ret.push({element, overflowingFrom:k});
            }
            element = element.parentElement as Element;
        }
        return ret;
    }
/*
    public static makeDraggable(e: HTMLElement, v: LViewElement, n: LGraphElement, type: "draggable" | "resizable" | "rotatable" = "draggable"): boolean {
        let draggableOptions: string = e.dataset[type];
        let disabled = !!e.attributes.disabled;

        let options: GObject;
        switch (typeof draggableOptions){
            case "string":
                try{ options = JSON.parse(draggableOptions); }
                catch(e) { Log.ee("JSX error in " + type + ", cannot parse options. Make sure they are a valid JSON object in string format."); return false; }
                break;
            case "object": options = draggableOptions; break;
            default: Log.ee("JSX error in " + type + ", unexpected type of options, only strings and objects are allowed, found instead: " + typeof draggableOptions); return false;
        }

        let $measurable: GObject<'JQuery + ui plugin'> = $(e);
        if (disabled && $measurable.data("uiDraggable")) { $measurable.draggable('disable'); return false; }
        if ($measurable.data("uiDraggable")) $measurable.draggable('enable');
        // todo: change options, put disable then remove disable attr and check if changing options at runtime works

        let defaultoptions = {
            cursor: 'grabbing',
            // containment: 'parent',
            opacity: 0.0,
            distance: 5,
            helper: 'clone', // 'original' or 'csselector'? or func=>html
            // disabled: !(view.draggable),
            drag: (event: GObject, obj: GObject) => {
                TRANSACTION(()=>{
                    if (!this.props.view.lazySizeUpdate) this.setSize({x:obj.position.left, y:obj.position.top});
                    for (let vid of allviews) this.doMeasurableEvent(EMeasurableEvents.whileDragging, vid);
                })
            },
            stop: (event: GObject, obj: GObject) => {
                TRANSACTION(()=>{
                    this.setSize({x:obj.position.left, y:obj.position.top});
                    for (let vid of allviews) this.doMeasurableEvent(EMeasurableEvents.onDragEnd, vid);
                })
            }
        };

        let aval: string;
        let eventmap = {
            's':    {'draggable': 'onDragStart',    'rotatable': 'onRotateStart',   'resizable': 'onResizeStart'},
            'ing':  {'draggable': 'whileDragging',  'rotatable': 'whileRotating',   'resizable': 'whileResizing'},
            'e':    {'draggable': 'onDragEnd',      'rotatable': 'onRotateEnd',     'resizable': 'onResizeEnd'  },
        }
        let event = {'s': eventmap.s[type], 'ing': eventmap.ing[type], 'e': eventmap.e[type]};
        let jqui_ing: string;
        switch (type){
            default: jqui_ing = Log.eDevv("unexpected measurable event: " + type); return false;
            case "draggable": jqui_ing = 'drag'; break;
            case "resizable": jqui_ing = 'resize'; break;
            case "rotatable": jqui_ing = 'rotate'; break;
        }
        let jquievent = {'s': 'start', 'ing': jqui_ing, 'e':'end'};
        for (let evtkey in jquievent) {
            // @ts-ignore
            aval = e.attributes[event[evtkey]]?.value || '';
            if (aval) defaultoptions[jquievent[evtkey]] = (event: GObject, obj: GObject) => {
                // jqui event callback
                // 1) call html-defined events (onDragStart="my_custom_event_name")
                // todo: currently only support jqui default parameters, not custom ones. make an eval and allow using stuff like whileDragging="(coords)=>myevent(coords, 1,2,3)"
                v.events[aval](event, obj);
                let evt = options[evtkey];
                delete options[evtkey];
                switch(evt){
                    case "string": v.events[evt]?.(event, obj);break;
                    case "function": evt(); break;
                    default: break;
                }
            }
            U.objectMergeInPlace(options, defaultoptions);
            $measurable[type](options);
        }

        return true;
    }
*/
    static getOSBrowserData(): BrowserInfo{
        /**
         * JavaScript Client Detection
         * (C) viazenetti GmbH (Christian Ludwig)
         */
        /** source: https://stackoverflow.com/a/18706818/24978590
         author comment:
         I started to write a Script to read OS and browser version that can be tested on Fiddle.
         Feel free to use and extend.
        */
        var unknown = '-';

        // screen
        var screenSize = '';
        let screen = window.screen;
        if (screen?.width) {
            let width = (screen.width) ? screen.width : '';
            let height = (screen.height) ? screen.height : '';
            screenSize += '' + width + " x " + height;
        }

        // browser
        var nVer = navigator?.appVersion || '';
        var nAgt = navigator?.userAgent || '';
        var browser = navigator?.appName || '';
        var version = '' + parseFloat(nVer);
        var nameOffset, verOffset, ix;

        // Yandex Browser
        if ((verOffset = nAgt.indexOf('YaBrowser')) != -1) {
            browser = 'Yandex';
            version = nAgt.substring(verOffset + 10);
        }
        // Samsung Browser
        else if ((verOffset = nAgt.indexOf('SamsungBrowser')) != -1) {
            browser = 'Samsung';
            version = nAgt.substring(verOffset + 15);
        }
        // UC Browser
        else if ((verOffset = nAgt.indexOf('UCBrowser')) != -1) {
            browser = 'UC Browser';
            version = nAgt.substring(verOffset + 10);
        }
        // Opera Next
        else if ((verOffset = nAgt.indexOf('OPR')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 4);
        }
        // Opera
        else if ((verOffset = nAgt.indexOf('Opera')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Legacy Edge
        else if ((verOffset = nAgt.indexOf('Edge')) != -1) {
            browser = 'Microsoft Legacy Edge';
            version = nAgt.substring(verOffset + 5);
        }
        // Edge (Chromium)
        else if ((verOffset = nAgt.indexOf('Edg')) != -1) {
            browser = 'Microsoft Edge';
            version = nAgt.substring(verOffset + 4);
        }
        // MSIE
        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // Chrome
        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (nAgt.indexOf('Trident/') != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if (browser.toLowerCase() == browser.toUpperCase()) {
                browser = navigator?.appName;
            }
        }
        // trim the version string
        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

        let majorVersion = parseInt('' + version, 10);
        if (isNaN(majorVersion)) {
            version = '' + parseFloat(nVer);
            majorVersion = parseInt(nVer, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        // cookie
        var cookieEnabled = (navigator?.cookieEnabled) ? true : false;

        if (typeof navigator?.cookieEnabled === 'undefined' && !cookieEnabled) {
            document.cookie = 'testcookie';
            cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
        }

        // system
        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Chrome OS', r:/CrOS/},
            {s:'Linux', r:/(Linux|X11(?!.*CrOS))/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        var os = unknown;
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }
        if (os === unknown){
            let s = nAgt.toLowerCase();
            if (s.indexOf('windows')) os = 'Windows';
            if (s.indexOf('mac')) os = 'Mac OS';
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)?.[1] || 'unknown';
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS':
            case 'Mac OS X':
            case 'Android':
                osVersion = /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([\.\_\d]+)/.exec(nAgt)?.[1] || 'unknown';
                break;

            case 'iOS':
                let match = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                if (match) osVersion = match[1] + '.' + match[2] + '.' + (match[3] || 0);
                else osVersion = 'unknown';
                break;
        }

        return {
            screen: screenSize,
            browser: browser,
            browserVersion: version,
            browserMajorVersion: majorVersion,
            mobile: mobile,
            os: os,
            osVersion: osVersion,
            cookies: cookieEnabled,
            userAgent: navigator.userAgent,
        };
    }

    // warning: nodes from other iframes will say are not instance from Element of the current frame, in that case need duck typing.
    public static isHtmlNode(element: any): element is Element {
        return element instanceof Element || element instanceof HTMLDocument || element instanceof SVGElement;
    }

    private static objectIncludeKeys(obj1: GObject, ...keys: string[]): boolean {
        for (let k of keys) if (!(k in obj1)) return false;
        return true;
    }

    static removeFromDom(e: Node): boolean {
        let p = e.parentNode;
        if (!p) return false;
        p.removeChild(e);
        return true;
    }

    static findInChildProperties<T extends D|L>(initialArr: (T)[], getChildrens: ((e:T) => (T)[]),
                                                getID:((e:T)=>PrimitiveType)|undefined, returnWhenFound:((e:T)=>boolean), filter?:((e:T)=>boolean)): (T) {
        return U.iterateChildProperties(initialArr, getChildrens, getID, returnWhenFound, filter)[0];
    }
    static iterateChildProperties<T extends D|L>(initialArr: (T)[], getChildrens: ((e:T) => (T)[]),
                                                 getID?:((e:T)=>PrimitiveType), returnWhenFound?:((e:T)=>boolean), filter?:((e:T)=>boolean)): (T)[] {
        let targets = initialArr;
        let alreadyParsed: Dictionary<string|number, (T)> = {};
        /*if (includeSelf) {
            for (let t of targets) {
                includeSelf
            }
        }*/
        while (targets.length) {
            let nextTargets: (T)[] = [];
            for (let target of targets) {
                if (!target) continue;
                let tid = (getID ? getID(target) : (target?.id)) as any as (string | number);
                if (alreadyParsed[tid]) continue;
                if (filter && !filter(target)) continue;
                alreadyParsed[tid] = target;
                if (returnWhenFound && returnWhenFound(target)) return [target];
                U.arrayMergeInPlace(nextTargets, getChildrens(target));
            }
            targets = nextTargets;
        }
        return Object.values(alreadyParsed);

    }

    static categorizeNode(c: LGraphElement|DGraphElement): {vertex: boolean, purevertex:boolean, field: boolean, graphvertex:boolean, puregraph: boolean, graph: boolean, edge:boolean, edgepoint: boolean}{
        let ret = {} as any;
        if (!c) return ret;
        switch (c.className) {
            case 'DEdge':
            case 'DVoidEdge': ret.edge = true; break;
            case 'DEdgePoint': ret.vertex = ret.edgepoint = true; ret.purevertex = false; break;
            case 'DVertex':
            case 'DVoidVertex': ret.vertex = ret.purevertex = true; break;
            case 'DGraphVertex': ret.graph = true; ret.puregraph = ret.purevertex = false; break;
            case 'DGraph': ret.graph = ret.puregraph = true; break;
            case 'DGraphElement': ret.field = true; break;
            default: Log.ee('unexpected node type:'+c.className); break;
        }
        return ret;
    }

    // returns: isFullscreen
    static toggleFullscreen(elem: HTMLElement): boolean {
        if (U.fullscreenElement() === elem) { U.exitFullscreen(); return false; }
        else { U.fullscreen(elem); return true; }
    }

    static fullscreen(elem: HTMLElement): Promise<void> {
        // Find the right method, call on correct element
        let e: any = elem;
        if (e.requestFullscreen) return e.requestFullscreen();
        if (e.mozRequestFullScreen) return e.mozRequestFullScreen();
        if (e.webkitRequestFullscreen) return e.webkitRequestFullscreen();
        if (e.msRequestFullscreen) return e.msRequestFullscreen();
        return Promise.reject('unsupported');

    }
    static isFullscreen(): boolean {
        let d: any = window.document;
        return d.fullscreenEnabled || d.mozFullScreenEnabled || d.webkitFullscreenEnabled;
    }
    static fullscreenElement(): Element {
        let d: any = window.document;
        return d.fullscreenElement || d.mozFullScreenElement || d.webkitFullscreenElement;
    }

    static exitFullscreen(): Promise<void> {
        let d: any = window.document;
        if (d.exitFullscreen) return d.exitFullscreen();
        if (d.mozCancelFullScreen) return d.mozCancelFullScreen();
        if (d.webkitExitFullscreen) return d.webkitExitFullscreen();
        return Promise.reject('unsupported');
    }

    static flattenObjectByKey<T extends GObject>(arr: (T|null|undefined)[], childKey: string):T[] {
        let isArray = Array.isArray(arr);
        if (!isArray) arr = [arr] as any;
        let ret: T[] = [...arr as any];
        for (let e of ret) {
            let children = (e as any)?.[childKey];
            if (!children || children.length === 0) continue;
            U.arrayMergeInPlace(ret, U.flattenObjectByKey(children, childKey));
        }
        return ret;
    }

    static isInfinite(m: number, positive = true, negative = true): m is (typeof NaN) {
        if (m === Number.POSITIVE_INFINITY) return positive;
        if (m === Number.NEGATIVE_INFINITY) return negative;
        return false;
    }

    public static getHashParams(value: string): Dictionary<string, string>{
        let search = window.location.hash;
        let _index = search.indexOf('?');
        if (_index >= 0) search = search.substring(_index+1);
        let ret: Dictionary<string, string> = {};
        for (let [key, entry] of new URLSearchParams(search).entries()) ret[key] = entry;
        return ret;
    }
    public static getProjectID_URL(): string | null { return U.getHashParam('id'); }
    public static getHashParam(arg_name: string): string | null {
        let search = window.location.hash;
        let _index = search.indexOf('?');
        if (_index >= 0) search = search.substring(_index+1);
        return new URLSearchParams(search).get(arg_name);
    }

    public static setHashParam(arg_name: string, val: number|string): string {
        let search = window.location.hash;
        let _index = search.indexOf('?');
        let prefix: string = '';
        if (_index >= 0) {
            prefix = search.substring(0, _index+1);
            search = search.substring(_index + 1);
        }
        let url = new URLSearchParams(search);
        url.set(arg_name, val+'');
        let hash = prefix + url.toString();
        window.location.hash = hash;
        return hash; }

    public static getSearchParam(arg_name: string): string | null {
        let search = window.location.search;
        return new URLSearchParams(search).get(arg_name);
    }
    public static setSearchParam(arg_name: string, val: number|string): string {
        let search = window.location.search;
        let url = new URLSearchParams(search);
        url.set(arg_name, ''+val);
        search = url.toString();
        window.location.search = search;
        return search;
    }

    static jsonSanitize_dangerous(text: string): string {
        // replace trailing comma, but risk of replacing string literals. better not use it
        text = text.replaceAll(/,(\s*[}\]])/, ',$1');
        return text;
    }

    static checkScrollDirectionIsUp(e: React.MouseEvent | any): boolean {
        if ('wheelDelta' in e) { return e.wheelDelta > 0; }
        return e.deltaY < 0;
    }
}
export class DDate{
    static cname: string = "DDate";

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
        }
        // || myFileReader.onchange;
    }
    private static reset(): void {
        myFileReader.fileTypes = undefined as any;
        myFileReader.onchange = undefined as any;
        myFileReader.input = undefined as any;
    }
    public static show(onChange: (e: Event, files: FileList | null, contents?: string[]) => void, extensions: undefined | string[] | FileReadTypeEnum[] = undefined, readContent: boolean): void {
        myFileReader.setinfos(extensions, onChange, readContent);
        // console.log("importEcore: pre file reader", myFileReader.input, {types:myFileReader.fileTypes, extensions});
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
@RuntimeAccessible('Uarr')
export class Uarr{
    // filter can either be a value or a filter function
    static findAllIndexes<T extends any>(arr: T[], filter: T | ((val: T, index: number, arr: T[]) => boolean)): number[] {
        const ret: number[] = [];
        let isFunc = typeof filter === 'function';
        for (let i = 0; i < arr.length; i++) {
            if (isFunc ? (filter as Function)(arr[i], i, arr) : arr[i] === filter) ret.push(i);
        }
        return ret;
    }

    static arrayShallowCopy<T extends any | undefined | null>(arr: T, includeCustomKeys: boolean = true): T{
        if (!arr) return arr;
        if (!Array.isArray(arr)) return arr;
        let ret: T&any[] = [] as any;
        if (!includeCustomKeys) ret = arr.map(e=>e) as any; // because [...arr] is transforming empty positions in undefined
        else {
            for (let k in arr) {
                if (!(arr as any[]).hasOwnProperty(k)) continue;
                ret[k] = arr[k]; // it takes array custom keys
            }
        }
        ret.length = (arr as any[]).length;
        return ret;
    }

    public static isSubArray(array: any[], subarray: any[]): boolean {
        return subarray.every((el) => array.includes(el));
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

    public static arrayIntersection<T>(arr1: T[], arr2: T[]): T[]{
        if (!arr1 || ! arr2) return null as any;
        return arr1.filter( e => arr2.indexOf(e) >= 0);
    }

    static arraySubtract(arr1: any[], arr2: any[], inPlace: boolean): any[]{
        let i: number;
        const ret: any[] = inPlace ? arr1 : [...arr1];
        for (i = 0; i < arr2.length; i++) { U.arrayRemoveAll(ret, arr2[i]); }
        return ret; }

    static equals<T extends any>(a1: T[], a2: T[], deep: boolean): boolean {
        Log.ex(deep, "deep array comparison is not supported yet");
        if (!a1 || !a2) return false;
        if (a1.length !== a2.length) return false;
        for (let i = 0; i < a1.length; i++) if (a1[i] !== a2[i]) return false;
        return true;
    }

    static equalsUnsorted(a1: any[], a2: any[]): boolean {
        let diff = Uarr.arrayDifference(a1, a2);
        return (diff.removed.length === 0 && diff.added.length === 0);
    }

    // NB: arrays give values in this order: positive indexes, negative indexes (in descending order, -1, -2...), string-based keys (in insertion order)
    static shiftIndexes<T extends any[]>(srcArr0: T[], indexes: number[], moveOffset: number, allowNegativeIndexes: boolean = false, allowArrayOutOfBound: boolean = false): T[] {
        // rationale: put object reference (weak_mapped) on values to delete and object with arr[i] = {oldItem: arr[i]} <--- weak_mapped object
        // move all elements and if new location is occupied, put a weak_mapped array with [original, inserted1, inserted2...] <--- weak_mapped array
        // then iterate array, erase oldItem placeholders, and expand weak_mapped arrays
        // NB: always use array.forEach to preserve index holes
        // computational cost: N to replace items, N to expand or remove weak_mapped stuff.
        type FakeItem = any[] & {__oldItem: T, __isAlsoRemoved?: boolean};
        type OldItem = { __oldItem: T };
        let srcArr: (T|FakeItem|OldItem)[] = [...srcArr0] as any;
        let moveDirection: number = 1;
        let originalIndexes = indexes;
        let totalOffset = moveOffset;
        let originalIndexesMap = U.objectFromArrayValues(originalIndexes, true);
        if (moveOffset < 0) { moveDirection = -1; moveOffset = -moveOffset; }


        let fakeItems: WeakMap<FakeItem, true> = new WeakMap<FakeItem, true>();
        let toDeleteItems: WeakMap<OldItem, true> = new WeakMap<OldItem, true>();
        // pretend to move each element, mark old position as removed and create a stack on target new index, remove and expand afterwards
        originalIndexes.forEach((e, i_donotuse_isconfusing) => {
            let oldIndex = e;
            let movingElement = srcArr[oldIndex];
            let movingElementRaw = srcArr[oldIndex];
            if (fakeItems.has(movingElement as FakeItem)) movingElement = (movingElement as any).__oldItem;
            else if (toDeleteItems.has(movingElement as OldItem)) movingElement = (movingElement as any).__oldItem;
            else toDeleteItems.set(srcArr[oldIndex] = {__oldItem: movingElement} as OldItem, true);
            Log.eDev(srcArr[oldIndex] !== movingElement, 'shiftIndexes error mismatching positions', {srcArr, e, oldIndex, originalIndexes});

            // if (!originalIndexesMap[i]) return;
            let newi = oldIndex+totalOffset;
            if (!allowNegativeIndexes) newi = Math.max(newi, 0);
            if (!allowArrayOutOfBound) newi = Math.min(newi, srcArr.length - 1);
            // if (newi === oldIndex) return;
            // todo: this below should not happen, when newi === oldi should keep oldItem empty? or what? do not need to duplicate
            //       but need to know it's moved or not because it depends on prepend or append 6
            // [6, __oldItem: 6, __isAlsoRemoved: true]
            if (newi >= 0) {
                console.log('shiftIndexes: debug 44', {srcArr:[...srcArr], oldITarget:movingElement, oldIndex, newi, totalOffset});
                console.log('shiftIndexes: debug 55', {srcArr:[...srcArr], srcArr0, oldIndex, oldITarget:movingElement, newi, newiTarget: srcArr[newi], isFake: fakeItems.has(srcArr[newi] as any), isDelete: toDeleteItems.has(srcArr[newi] as any), "in": newi in srcArr});
            }
            // moved element fell on empty slot
            if (!(newi in srcArr)) { srcArr[newi] = movingElement; return; } // fakeItems.set(srcArr[newi] = [srcArr[i]] as any, true);

            /*

            *                   deleted | stacked | pre-existing | empty |
            * deleted              -    |    -    |      -       |   -   | // it doesn't move, not appliable
            * stacked              -    |    -    |      -       |   -   | // pick original element to move, leave the rest of the stack todo: remove old item from subarray list or it duplicates
            * pre-existing              |         |              |       | // pre-existing -> create stack, stacked -> stack again  OR deleted->stack&deleted->stack&deleted Again
            * empty                     |         |              |       | // todo: what to do if asked to move an empty entry? delete target entry or remove from orginalIndexes list? and what if empty entry is stacked with other entries?
            *
            * handled?             y         y
            * */

            if (newi >= 5) {
                //console.log('shiftIndexes: debug 5', {srcArr:[...srcArr], srcArr0, newi, target: srcArr[newi], isFake: fakeItems.has(srcArr[newi] as any), isDelete: toDeleteItems.has(srcArr[newi] as any), "in": newi in srcArr});
            }
            // deleted: element fell on a new cell where other moved elements fell
            if (fakeItems.has(srcArr[newi] as FakeItem)) {
                // can only happen if:
                // 1) if different items can have different offsets which is not supported yet
                //    in that case maybe should prepend for direction === -1, run some tests if you enable different offsets.
                // 2) there is allowArrayOutOfBound = false or negative indexes and newi === 0 or newi === array.length
                (srcArr[newi] as FakeItem).push(movingElement);
                // Log.eDevv('shiftIndexes impossible case', {srcArr, newi, i, fakeItems, originalIndexes, originalIndexesMap});
                return;
            }
            // stacked: item fell on a cell that was moved      -->      it becomes both marked as deleted and with a new subarray to expand (required to count holes correctly later)
            if (toDeleteItems.has(srcArr[newi] as OldItem) ) {
                let isDeletedIndex = srcArr[newi];
                // a moved item fell on a cell that was about to be deleted
                let oldElement = srcArr[newi];
                fakeItems.set(srcArr[newi] = [movingElement] as FakeItem, true);
                (srcArr[newi] as FakeItem).__oldItem = (oldElement as OldItem).__oldItem;
                (srcArr[newi] as FakeItem).__isAlsoRemoved = true;
                // toDeleteItems.set(srcArr[newi], true);
                return;
            }
            // pre-existing: fell on normal element
            if (newi in srcArr) {
                // fakeItems.set(srcArr[newi] = (moveDirection === 1 ? [srcArr[newi], srcArr[i]] : [srcArr[i], srcArr[newi]]) as any, true);
                let oldElement = srcArr[newi];
                fakeItems.set(srcArr[newi] = [movingElement] as FakeItem, true);
                (srcArr[newi] as OldItem).__oldItem = (oldElement as any);
                return;
            }
            // empty: fell on empty,
            srcArr[newi] = movingElement;
        })
        let newArr: T[] = [];
        let holeCount = 0;
        let holecount_debug: { holeCount: number, j?: number, k?: number, i: number, e: any}[] = [];
        console.log('shiftIndexes: pre expansion', {srcArr:[...srcArr], srcArr0, originalIndexes, moveOffset, moveDirection, totalOffset, allowNegativeIndexes, allowArrayOutOfBound});
        srcArr.forEach((e, i) => {
            console.log('shiftIndexes: expansion', {e, srcArr:[...srcArr], isFake: fakeItems.has(e as any), isDelete: toDeleteItems.has(e as any)});
            if (toDeleteItems.has(e as OldItem)) { holeCount--; return; }
            if (fakeItems.has(e as FakeItem)) {
                console.log('shiftIndexes: expansion 2', {e, srcArr:[...srcArr], isRemoveToo: !!(e as any).__isAlsoRemoved});

                let subarr = e as any as T[];
                if (moveDirection === 1) { // if direction is >, i prepend old element
                    let newIndex = i + holeCount;
                    let k = 0;
                    while ((newIndex + k) in newArr) k++;
                    newArr[newIndex + k] = (e as FakeItem).__oldItem;
                }
                let k = 0;
                for (let j = 0; j < subarr.length; j++, k--) {
                    let newIndex = i + holeCount + j;
                    while ((newIndex + k) in newArr) k++;
                    newArr[newIndex + k] = subarr[j];
                    holecount_debug[newIndex + k] = {e, i, holeCount, j, k};
                }
                if (moveDirection === -1) { // if direction is <, i append old element
                    let newIndex = i + holeCount;
                    let k = 0;
                    while ((newIndex + k) in newArr) k++;
                    newArr[newIndex + k] = (e as FakeItem).__oldItem;
                }
                if (!(e as FakeItem).__isAlsoRemoved) holeCount++;
                return;
            }
            let k = 0;
            while ((i + holeCount + k) in newArr) k++;
            newArr[i + holeCount + k] = e as T;
            holecount_debug[i + holeCount] = {e, i, k, holeCount};
        })
        console.log('shiftIndexes: ret', {srcArr:[...srcArr], srcArr0, holeCount, holecount_debug, fakeItems, toDeleteItems});

        return newArr;
    }
    static shiftIndexes_old<T extends any[]>(srcArr: T[], indexes: number[], moveOffset: number): T[] {
        // untested and more verbose version
        let moveDirection: number = 1;
        let originalIndexes = indexes;
        if (moveOffset < 0) { moveDirection = -1; moveOffset = -moveOffset; }

        //todo: problem of moving N elements inside an array
        let additionalOffsets: (number|undefined)[] = [];
        // this is all for direction ->  need to do for <-   the core is: everything gets moved by X minus n°of elements in the same set encountered within X
        if (moveDirection === 1 ){
            for (let i = 0; i < originalIndexes.length; i++) {
                let additionalOffset = 0;
                for (let j = i+1; originalIndexes[i]+moveOffset < originalIndexes[j] && j < originalIndexes.length; j++) additionalOffset--;
                if (additionalOffset) additionalOffsets[i] = additionalOffset;
            }
        } else {
            for (let i = originalIndexes.length-1; i >= 0; i--) {
                let additionalOffset = 0;
                for (let j = i-1; Math.max(0, originalIndexes[i]+moveOffset) <= originalIndexes[j] && j >= 0; j--) additionalOffset++;
                if (additionalOffset) additionalOffsets[i] = additionalOffset;
            }
        }
        let currentHolesNumber: number = 0;
        let newArr: any[] = [];
        let oIndex: number = moveDirection === 1 ? 0 : originalIndexes.length - 1;

        if (moveDirection === 1) {
            for (let i = 0; i < srcArr.length; i++) {
                if (i === originalIndexes[oIndex]) { // move elements that have to move.
                    oIndex++;
                    currentHolesNumber++;
                    newArr[(+i + moveOffset + (additionalOffsets[i] || 0))] = srcArr[i];
                    continue;
                }
                // move other elements behind filling empty spaces left behind.
                while (newArr[i-currentHolesNumber]) currentHolesNumber++;
                newArr[i-currentHolesNumber] = srcArr[i];
            }
        } else {
            for (let i = srcArr.length; i >= 0; i--) {
                if (i === originalIndexes[oIndex]) { // move elements that have to move.
                    oIndex--;
                    currentHolesNumber++;
                    newArr[(+i + moveOffset + (additionalOffsets[i] || 0))] = srcArr[i];
                    continue;
                }
                // move other elements behind filling empty spaces left behind.
                while (newArr[i+currentHolesNumber]) currentHolesNumber--;
                newArr[i+currentHolesNumber] = srcArr[i];
            }
        }
        console.log('Array shift debug', {srcArr, newArr, additionalOffsets, moveOffset, moveDirection});
        return newArr;
    }
}

export class FocusHistoryEntry {
    static cname: string = "FocusHistoryEntry";
    time: Date;
    evt: JQuery.FocusInEvent;
    element: Element;
    constructor(e: JQuery.FocusInEvent, element?: Element, time?: Date) {
        this.evt = e;
        this.element = element || e.target;
        this.time = time || new Date();
    }
}
export enum ShortDefaultEClasses{
    EObject = "EObject",
    EAnnotation = "EAnnotation",
    EClass = "EClass",
    EPackage = "EPackage",
    ENamedElement = "ENamedElement",
}

//NB: if add, remove, modify a attribute type, need also to add/remove/modify a static entry in class Defaults
export enum ShortAttribETypes {
    EVoid = 'EVoid',
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
    // EDiagnosticChain = "EDiagnosticChain", // present in uml.ecore, without definition. i guess it's a custom installed package which is commonly used
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
windoww.ShortAttribETypes = ShortAttribETypes;

export const ShortAttribSuperTypes: Dictionary<ShortAttribETypes, ShortAttribETypes[]> = {
    "EVoid"    : [],
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
let ecoreprefix = "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//";
let ecoreclasprefix = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//";
export function toShortEType(a: AttribETypes): ShortAttribETypes{ return a.substring(ecoreprefix.length) as any; }
export function toLongEType(a: ShortAttribETypes): AttribETypes {
    return AttribETypes[a];
    // return ecoreprefix + a as any;
}

export function toShortEClass(a: DefaultEClasses): ShortDefaultEClasses{ return a.substring(ecoreclasprefix.length) as any; }
export function toLongEClass(a: ShortDefaultEClasses): DefaultEClasses { return DefaultEClasses[a]; }

export class SelectorOutput {
    jqselector!: string;
    attrselector!: string;
    attrRegex!: RegExp;
    exception!: any;
    resultSetAttr!: Attr[];
    resultSetElem!: JQuery<Element>;
}
// compare it with event.key
export type Key = string;
@RuntimeAccessible('Keystrokes')
export class Keystrokes {
    static cname: string = 'Keystrokes'
    public static clickLeft = 0;
    public static clickWheel = 1;
    public static clickRight = 2;
    public static clickBackMouseButton = 3;
    public static clickForwardMouseButton = 4;

    // keyboard
    public static escape = 'Escape';
    public static capsLock = 'CapsLock';
    public static shift = 'Shift';
    public static tab = 'Tab';
    public static alt = 'Alt';
    public static cmd = 'Control';
    public static control = 'Control';
    public static end = 'End';
    public static home = 'Home';
    public static pageUp = 'PageUp';
    public static pageDown = 'PageDown';
    public static enter = 'Enter'; // event.code = 'NumpadEnter' se fatto da numpad, oppure "numpad3", "NumpadMultiply", ShiftLeft, etc...
    public static numpadEnter = 'NumpadEnter';
    public static audioVolumeMute = 'AudioVolumeMute';
    public static audioVolumeUp = 'AudioVolumeUp';
    public static audioVolumeDown = 'AudioVolumeDown';
    public static mediaTrackPrevious = 'MediaTrackPrevious';
    public static delete = 'Delete'; // canc
    public static backspace = 'Backspace';
    public static space = ' ';
    public static altGraph = 'AltGraph';
    public static arrowLeft = 'ArrowLeft';
    public static arrowRight = 'ArrowRight';
    public static arrowUp = 'ArrowUp';
    public static arrowDown = 'ArrowDown';
    public static insert = 'Insert';
    public static f1 = 'F1';
    // weird ones:
    public static meta = 'Meta'; // f1, or other f's with custom binding and windows key
    public static unidentified = 'Unidentified'; // brightness
    public static __NotReacting__ = 'fn, print, maybe others'; // not even triggering event?
    private static RegisteredKeyStrokes: Dictionary<DocString<'selector'>, {keyup: (e:any)=>any, keydown: (e:any)=>any}> = {};
    public static register(selector: string, arr: {function?: ()=>any, keystroke?: Key[]}[]): void{
        if (Keystrokes.RegisteredKeyStrokes[selector]) return;
        let $elems = $(selector);// sort from most "uncommon" to most common key
        let metakeysmap = {
            [Keystrokes.alt]: 'altKey',
            [Keystrokes.shift]: 'shiftKey',
            [Keystrokes.control]: 'ctrlKey',/*
            'altKey': Keystrokes.alt,
            'shiftKey': Keystrokes.shift,
            'ctrlKey': Keystrokes.control,*/
        }; //  '??': 'metaKey'];*/
        // let metakeys = ['altKey', 'shiftKey', 'ctrlKey'];


        Log.exDev(!($elems.on as any), 'jQuery is required for Keystrokes.register');
        let optimizedKeyPaths: GObject = {
            [Keystrokes.alt]: {},
            [Keystrokes.shift]: {},
            [Keystrokes.control]: {},
        }
        for (let entry of arr) {
            if (!entry || !entry.function || !entry.keystroke || !entry.keystroke.length) continue;
            let keymap = U.objectFromArrayValues(entry.keystroke);
            let root = optimizedKeyPaths
            if (keymap[Keystrokes.alt]) {
                if (!root[Keystrokes.alt]) root = root[Keystrokes.alt] = {};
                else root = root[Keystrokes.alt];
            }
            if (keymap[Keystrokes.shift]) {
                if (!root[Keystrokes.shift]) root = root[Keystrokes.shift] = {};
                else root = root[Keystrokes.shift];
            }
            if (keymap[Keystrokes.control]) {
                if (!root[Keystrokes.control]) root = root[Keystrokes.control] = {};
                else root = root[Keystrokes.control];
            }
            let terminalKeys = entry.keystroke.filter(k => !(k in metakeysmap));
            Log.eDev(terminalKeys.length !== 1, "found a keystroke combination with multiple terminal keys", {entry, selector});
            let terminal = terminalKeys[0].toLowerCase();
            root[terminal] = entry.function;
        }
        let keyup = (e: KeyUpEvent) => {
            // skip events happened in graph
            let curr = e.target;
            while (curr) {
                if (curr.classList.contains('Graph')) return;
                curr = curr.parentElement;
            }
            // handle event
            if (e.altKey) { $elems.removeClass('key-alt'); }
            if (e.shiftKey) { $elems.removeClass('key-shift'); }
            if (e.ctrlKey) { $elems.removeClass('key-ctrl'); }
        }
        let keydown = (e: KeyDownEvent) => {
            // skip events happened in graph
            let curr = e.target;
            console.log('keydown', {key: e.key, selector, e, curr, ct:e.currentTarget});
            switch (e.key) {
                case Keystrokes.escape:
                    if (store.getState()?.isEdgePending?.source) SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });
                    break;
                // if those are the last key pressed is not an event, it is still typing.
                case 'Control': case 'Shift': case 'Alt': return;
            }
            while (curr) {
                if (curr.classList.contains('Graph')) return;
                curr = curr.parentElement;
            }
            // handle event
            let root = optimizedKeyPaths;
            if (e.altKey) { root = root[Keystrokes.alt] || {}; $elems.addClass('key-alt'); }
            if (e.shiftKey) { root = root[Keystrokes.shift] || {}; $elems.addClass('key-shift'); }
            if (e.ctrlKey) { root = root[Keystrokes.control] || {}; $elems.addClass('key-ctrl'); }
            let f = root[e.key];
            console.log("execute keystrokes", {e, root, optimizedKeyPaths, up:{$elems, keydown, optimizedKeyPaths, arr}});
            Log.exDev(f && typeof f !== 'function','found keystroke with invalid func',
                {key: e.key, shift:e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey, f, root, e})
            f?.();
        };
        /// todo: for graph can attack evt to graph root and use selector in on() lieke $graphcontainer.on('keydown', '.Class', classkeystrokehandler...)
        Keystrokes.RegisteredKeyStrokes[selector] = {keydown, keyup, arr, optimizedKeyPaths} as any;
        // $elems.off('keydown').on('keydown', null, keydown);
        // $elems.off('keydown').on('keyup', null, keyup);
        let $doc = $(document.body);
        $doc.off('keydown', selector, keydown).on('keydown', selector, keydown);
        $doc.off('keyup', selector, keyup).on('keyup', selector, keyup);

    }
    public static unregister(selector: string): void{
        if (!Keystrokes.RegisteredKeyStrokes[selector]) return;
        //$(selector).off('keydown', null as any, Keystrokes.RegisteredKeyStrokes[selector].keydown);
        //$(selector).off('keyup', null as any, Keystrokes.RegisteredKeyStrokes[selector].keyup);

        let $doc = $(document.body);
        $doc.off('keydown', selector, Keystrokes.RegisteredKeyStrokes[selector].keydown);
        $doc.off('keyup', selector, Keystrokes.RegisteredKeyStrokes[selector].keyup);

        delete Keystrokes.RegisteredKeyStrokes[selector];
    }


    public static getKeystrokeJsx(key: string, allowBootIcons: boolean = true, allowBoxIcons: boolean=true, allowTextIcons: boolean = true){
        let os = U.getOSBrowserData().os.substring(0, 3).toLowerCase();
        let obj = iconKeys['bi_' + os];
        if (!obj) return Log.eDevv('Found unexpected OS: ' + os, {data:U.getOSBrowserData()}) && '';
        if (allowBootIcons && key in obj) { let val = obj[key]; return <i key={key} className={"bi " + val} title={key}/>; }
        //obj = iconKeys['box_' + os];
        // if (!obj) return Log.eDevv('Found unexpected OS: ' + os, {data:U.getOSBrowserData()}) && '';
        //if (allowBoxIcons && key in obj) { let val = obj[key]; return <span><i className={"box-icons?? " + val todo} title={key}/></span>; }
        obj = iconKeys['text_' + os];
        if (!obj) return Log.eDevv('Found unexpected OS: ' + os, {data:U.getOSBrowserData()}) && '';
        if (allowTextIcons && key in obj) { let val = obj[key]; return <i key={key} className={"text-icon " + val} title={key} data-val={val} data-content={key}/>; }
        return <span key={key}>{key.toUpperCase()}</span>;
    }
    public static NamedKeys: Dictionary<string, boolean>;
}

const iconKeys: Dictionary<string, Dictionary<string, string>> = {
        bi_win: {
            [Keystrokes.shift] : "bi-shift"
        },
        bi_mac: {
            [Keystrokes.cmd]   : "bi-command",
            [Keystrokes.control]   : "bi-command",
            [Keystrokes.alt]   : "bi-alt",
            [Keystrokes.shift] : "bi-shift"
        },
    box_win: {},
    box_mac: {},
    text_win: {
        [Keystrokes.cmd]   : "ctrl",
        [Keystrokes.control]   : "ctrl",
        [Keystrokes.alt]   : "alt",
        [Keystrokes.shift] : "shift"
    },
    text_mac: {},
};

// Keystrokes.NamedKeys: Dictionary<string, boolean> = Object.values(Keystrokes).reduce((acc, v) => { acc[v] = true; return acc; }, Keystrokes.NamedKeys as GObject);
/*const windowsKeys: Dictionary<string, string> = {
    [Key.cmd]: "ctrl", //'windows'; // <i className="bi bi-windows"></i>
    [Key.shift]: "shift",
    [Key.alt]: "alt",
}*/


export enum DefaultEClasses{
    EObject = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject",
    EAnnotation = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EAnnotation",
    EClass = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EClass",
    EPackage = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EPackage",
    ENamedElement = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//ENamedElement",
}
export enum AttribETypes {
    EVoid = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EVoid', // ??? i invented this.
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
    // present in uml.ecore, without definition. i guess it's a custom installed package which is commonly used
    // EDiagnosticChain = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDiagnosticChain',
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
/*
interface LoggerInterface{
    log: (category: string, key: string, data: any[], fullconcat?: string, stringified?: string) => any;
}*/



export class FileReadTypeEnum {
    public static image: FileReadTypeEnum = "image/*" as any;
    public static audio: FileReadTypeEnum = "audio/*" as any;
    public static video: FileReadTypeEnum = "video/*" as any;
    /// a too much huge list https://www.iana.org/assignments/media-types/media-types.xhtml
    public static AndManyOthersButThereAreTooMuch: string = "And many others... https://www.iana.org/assignments/media-types/media-types.xhtml";
    public static OrJustPutFileExtension: string = "OrJustPutFileExtension";
}

// console.info('loaded ts U');
