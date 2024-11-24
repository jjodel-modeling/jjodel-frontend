import {DPointerTargetable, LPointerTargetable, RuntimeAccessible, RuntimeAccessibleClass} from "../../joiner";

@RuntimeAccessible('DLog')
export class DLog extends DPointerTargetable {
    public static cname: string = "DLog";
    static logic: typeof LPointerTargetable;
    value: string;
    constructor(value: string) {
        super('todo' as any);
        this.value = value;
        this.className = (this.constructor as typeof RuntimeAccessibleClass).cname || this.constructor.name;
    }
}
