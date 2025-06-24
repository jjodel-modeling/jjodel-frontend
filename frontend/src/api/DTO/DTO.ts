import type {Dictionary, DProject, GObject} from "../../joiner";
import {Log, U} from "../../joiner";
import {UpdateProjectRequest} from "./UpdateProjectRequest";

export abstract class DTO<S extends GObject = GObject>{
    constructor(src: S) {
        let setFields: Dictionary<string, boolean> = {};
        try {
            this._dto_copyInterections(src, setFields)
            this._dto_convert(src, setFields);
            let diff = U.arrayDifference(Object.keys(this), Object.keys(setFields));
            Log.eDevv('incomplete conversion to DTO', {dto: {...this}, setFields, diff, src});
        }
        catch(e){
            Log.eDevv('failed to convert to DTO',{dto: {...this}, src, e});
        }
    }
    protected _dto_set<K extends keyof this = string & keyof this>(k: K,val: this[K], setFields: Dictionary<string, boolean>){
        this[k] = val;
        setFields[k as string] = true;
    }
    private _dto_copyInterections(src: S, setFields: Dictionary<string, boolean>): void {
        for (let k in src) {
            if (k in this) this._dto_set(k as keyof this, src[k] as any, setFields);
        }
    }
    abstract _dto_convert(src: Partial<S>, setFields: Dictionary<string, boolean>): void;
}