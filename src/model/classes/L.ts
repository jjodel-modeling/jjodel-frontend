import {LPointerTargetable, MixOnlyFuncs, RuntimeAccessible} from "../../joiner";
import {DLog} from "./D";

@RuntimeAccessible
export class LLog extends LPointerTargetable {
    // static structure: typeof DLog;
    // static singleton: LLog;
    value!: string;
//    protected constructor(value: string) {super(); }
}
