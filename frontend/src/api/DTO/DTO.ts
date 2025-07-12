import type {Dictionary, DProject, GObject} from "../../joiner";
import {Log, U} from "../../joiner";
import {UpdateProjectRequest} from "./UpdateProjectRequest";

abstract class DTO<S extends GObject = GObject>{
    constructor() {}
    protected _dto_init(src: S){
        let setFields: Dictionary<string, boolean> = {};
        try {
            this._dto_copyInterections(src, setFields)
            this._dto_convert(src, setFields);
            let diff = U.arrayDifference(Object.keys(this), Object.keys(setFields));
            Log.eDev(diff.added.length+diff.removed.length > 0, 'incomplete conversion to DTO', {dto: {...this}, setFields, diff, src});
        }
        catch(e) {
            Log.eDevv('failed to convert to DTO', {dto: {...this}, src, e});
        }
    }
    protected _dto_set<K extends keyof this = string & keyof this>(k: K,val: this[K], setFields: Dictionary<string, boolean>){
        this[k] = val;
        setFields[k as string] = true;
    }
    protected _dto_copyInterections(src: S, setFields: Dictionary<string, boolean>): void {
        for (let k in src) {
            //@ts-ignore
            // console.log('_dto_copy', {k, in:k in this, t:{...this}, proto: this.__proto__, p2: this.prototype, sf:{...setFields}})
            if (k in this) this._dto_set(k as keyof this, src[k] as any, setFields);
        }
    }
    protected abstract _dto_convert(src: Partial<S>, setFields: Dictionary<string, boolean>): void;
}



export abstract class Request_DTO<S extends GObject = GObject> extends DTO {
    constructor() { super(); }
}


export abstract class Response_DTO<S extends GObject = GObject, T extends GObject = GObject> extends DTO {
    constructor() {
        super();
        // this._dto_init(data); NB: cannot do it here, need to be done in subclass because when subclass constructor is made,
        // after the superclass one, all the mandatory (! marked) properties missing from superclass are re-set to undefined.
    }

    protected _dto_convert(src: Partial<S>, setFields: Dictionary<string, boolean>): void {
        // meant to stay empty and hidde, subclasses should not need to override it.
    }

    public abstract toJodelClass(): T;

}