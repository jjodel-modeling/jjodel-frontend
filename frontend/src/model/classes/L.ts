import {D, type DModel, L, LPointerTargetable, RuntimeAccessible, Selectors} from "../../joiner";

@RuntimeAccessible('LLog')
export class LLog extends LPointerTargetable {
    public static cname: string = "LLog";
    // static structure: typeof DLog;
    // static singleton: LLog;
    value!: string;
//    protected constructor(value: string) {super(); }

    get_getByFullPath(c: any): any { this.wrongAccessMessage('LLog.getByFullPath'); }
}
