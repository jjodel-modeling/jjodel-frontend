import {Dictionary, MyError, RuntimeAccessible, windoww} from "../joiner";
import {U} from "./U";
import {NotBool} from "../joiner/types";

export type LoggerType = "l" | "i" | "w" | "e" | "ex" | "eDev" | "exDev";
export class LoggerCategoryState{
    static counter: number = 0;
    category: LoggerType;
    time: number;
    raw_args: any[];
    short_string: string;
    long_string: string;
    exception?: Error
    key: string | number;


    constructor(args: any[], short_string: string, cat: LoggerType, exception?: Error) {
        this.raw_args = args;
        this.time = new Date().getTime();
        this.category = cat;
        this.short_string = short_string;
        this.long_string = '';
        this.exception = exception;
        this.key = (LoggerCategoryState.counter++); // + '_' + this.time + '_' + this.short_string;

        // this.long_string = JSON.stringify(U.cropDeepObject(args, 10, 20, 45, 35, 5), null, '\t');
        /*
        const maxChars: Dictionary<string, [number, number]> = {
            function: [50, 0],
            object: [100, 0],
            string: [80, 20],
        }
        let ansiConvert = (window as any).ansiConvert;
        if (!ansiConvert) {
            (window as any).ansiconvert = ansiConvert = new Convert();
        }
        for (let a of args){
            let s: string;
            let ta: string = typeof a;
            switch(ta){
                case "function": s = a.toString(); break;
                case "object":
                    let outstr = U.inspect(a, true, 2, true);
                    outstr = U.replaceAll(ansiConvert.toHtml(outstr), "style=\"color:#FFF\"", "style=\"color:#000\"");
                    let regexpCloseTags = new RegExp("(\\<span style\\=\"color\\:\\#)", "gm");
                    outstr = U.replaceAll( outstr, "$", "£");
                    outstr = outstr.replace(regexpCloseTags,  "</span>$1");
                    outstr = U.replaceAll(outstr, "£", "$");
                    s = outstr;
                    break;
                default: s = ''+a;
            }
            if (maxChars[ta]) s = U.cropStr(s, maxChars[ta][0], maxChars[ta][1]);
            this.long_string += s;
        }*/
    }
}

@RuntimeAccessible('Log')
export class Log{
    // public static history: Dictionary<string, Dictionary<string, any[]>> = {}; // history['pe']['key'] = ...parameters
    public static lastError: any[];/*
    public static last_e: LoggerCategoryState[] = [];
    public static last_eDev: LoggerCategoryState[] = [];
    public static last_ex: LoggerCategoryState[] = [];
    public static last_exDev: LoggerCategoryState[] = [];
    public static last_w: LoggerCategoryState[] = [];
    public static last_i: LoggerCategoryState[] = [];*/
    // private static loggerMapping: Dictionary<string, LoggerInterface[]> = {} // takes function name returns logger list
    public static allMessages: LoggerCategoryState[] = []
    public static messageMapping: Dictionary<LoggerType, LoggerCategoryState[]> = {
        l: [],
        i: [],
        w: [],
        e: [],
        ex: [],
        eDev: [],
        exDev: [],
    } // takes function name returns log messages list


    static disableConsole(){
        // @ts-ignore
        console['logg'] = console.log;
        console.log = () => {}; }

    static enableConsole() {
        // @ts-ignore
        if (console['logg']) console.log = console['logg']; }

    private static log(prefix: string, category: LoggerType, originalFunc: typeof console.log, b: boolean, canthrow: boolean, ...restArgs: any[]): string {
        if (!b) { return ''; }
        const key: string = windoww.U.getCaller(1); // todo: remove replace heavy fumc
        if (restArgs === null || restArgs === undefined) { restArgs = []; }
        let str = key + ': ';
        for (let i = 0; i < restArgs.length; i++) {
            // console.log(prefix, {i, restArgs, curr:restArgs[i]});
            str += '' +
                (typeof restArgs[i] === 'symbol' ?
                    '' + String(restArgs[i]) :
                    restArgs[i])
                + '\t\r\n'; }
        let prefixedstr = '[' + prefix + ']' + str;

        let exception: Error | undefined = (canthrow ? new MyError(prefixedstr, ...restArgs) : undefined);

        Log.updateLoggerComponent(category, restArgs, str, category, exception);
        // merged loggers if (Log.loggerMapping[category]) for (const logger of Log.loggerMapping[category]) { logger.log(category, key, restArgs, str); }
        originalFunc(key, ...restArgs);
        if (exception) throw exception;
        return prefixedstr;
    }

    public static e(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        const str = Log.log('Error', 'e', console.error, b, false, ...restArgs);
        Log.lastError = restArgs;
        return str;
        // throw new Error(str);
    }

    public static eDev(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        return Log.log('Dev Error','eDev', console.error, b, false, ...restArgs);
    }

    public static ex(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        Log.log('Error', 'e', console.error, b, true, ...restArgs);}

    public static exDev(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        Log.log('Dev Error','eDev', console.error, b, true, ...restArgs);
    }

    public static i(b: boolean, ...restArgs: any[]): string | null {
        if (!b) return null;
        return Log.log('Info', 'i', console.log, b, false, ...restArgs);
    }
    public static _loggerComponent: any = undefined as any;
    private static get_loggercomponent(): any { return Log._loggerComponent; }
    private static updateLoggerComponent(type: LoggerType, args: any[], short_str: string, cat: LoggerType, exception?: Error): void {
        let c = Log.get_loggercomponent();
        let update: LoggerCategoryState = new LoggerCategoryState(args, short_str, cat, exception);
        Log.messageMapping[type].push(update);
        Log.allMessages.push(update);
        if (!c) return;
        c.setState({[type+"_counter"]: c.state[type+"_counter"]+1}); // so it doesn't pass through redux
    }
    public static l(b: boolean, ...restArgs: any[]): string | null {
        if (!b) return null;
        return Log.log('Log', 'l', console.log, b, false, ...restArgs);
    }
    public static w(b: boolean, ...restArgs: any[]): string | null {
        if (!b) return null;
        return Log.log('Warn', 'w', console.warn, b, false, ...restArgs); }


    public static eDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): string { return Log.eDev(true, ...[firstParam, ...restAgs]); }
    public static ee(...restAgs: any): string { return Log.e(true, ...restAgs); }
    public static exDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): never | any { return Log.exDev(true, ...[firstParam, ...restAgs]); }
    public static exx(...restAgs: any): never | any { return Log.ex(true, ...restAgs); }
    public static ii(...restAgs: any): string { return Log.i(true, ...restAgs) as string; }
    public static ll(...restAgs: any): string { return Log.l(true, ...restAgs) as string; }
    public static ww(...restAgs: any): string { return Log.w(true, ...restAgs) as string; }


    static getByError(error: Error) {
        for (let m of Log.allMessages){
            if (m.exception === error) return m;
            /*
            switch (m.category){
                case 'l': case 'i': case 'w': continue;
                default: break;
            }
            if (U.deepFindInObject(m.raw_args, error, undefined, 3)) return m;*/
        }

    }
}
// (window as any).Log = Log;
