import {LPointerTargetable, MixOnlyFuncs, RuntimeAccessible} from "../../joiner";
import {DLog} from "./D";

@RuntimeAccessible
export class LLog extends MixOnlyFuncs(DLog, LPointerTargetable) {
    static structure: typeof DLog;
    static singleton: LLog;
}
