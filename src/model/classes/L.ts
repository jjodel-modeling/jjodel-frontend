import {LPointerTargetable, RuntimeAccessible} from "../../joiner";

@RuntimeAccessible
export class LLog extends LPointerTargetable {
    // static structure: typeof DLog;
    // static singleton: LLog;
    value!: string;
//    protected constructor(value: string) {super(); }
}
