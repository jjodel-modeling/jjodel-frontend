import {DocString, DPointerTargetable, LPointerTargetable, Pointer, RuntimeAccessible} from "../../joiner";
import {Mixin} from "ts-mixer";

@RuntimeAccessible
export class DUser extends DPointerTargetable{
    static current: DocString<Pointer<DUser, 1, 1>> = "currentUserPointerToDo";
}

@RuntimeAccessible
export class LUser extends Mixin(DUser, LPointerTargetable) {

}
