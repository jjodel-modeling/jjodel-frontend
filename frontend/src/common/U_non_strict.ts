import {GObject} from "../joiner";
type GFunction<T> = (...any:any)=>T
/*
export class EvalContext{
    public context: GObject = {};
    public constructor(context: GObject){
        this.setContext(context);
    }
    public setContext(context: GObject) {
        this.context = context || {};
        this.context.this = this.context;
    }
    // ha 2 contesti: uno persistente e uno pseudo-read-only (sealed-like)
    public eval(code: string, additionalSealedContext: GObject = {}): any {
        if (additionalSealedContext) {
            this.setContext({additionalSealedContext, ...this.context}); }
        return EvalContext.innerEval(this.context, code);
    }

    public execInContext<T extends (...args: any[]) => any>(func: T, parameters: Parameters<T> = [] as any, additionalSealedContext: GObject = {}): ReturnType<T>{
        if (additionalSealedContext) {
            this.setContext({additionalSealedContext, ...this.context}); }
        // eslint-disable-next-line no-restricted-syntax,no-with
        // @ts-ignore
        // with (this.context) { return func(...parameters); }
        return null;
    }
    private static innerEval(context: GObject, code: string) {
        // eslint-disable-next-line no-restricted-syntax,no-with
        // @ts-ignore
        with (context) { return eval(code); }
        return null;
    }
}
*/
