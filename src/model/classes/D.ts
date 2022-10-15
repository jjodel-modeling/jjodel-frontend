import {DPointerTargetable, LPointerTargetable, RuntimeAccessible} from "../../joiner";

@RuntimeAccessible
export class DLog extends DPointerTargetable {
    static logic: typeof LPointerTargetable;
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
        this.className = this.constructor.name;
    }
}
