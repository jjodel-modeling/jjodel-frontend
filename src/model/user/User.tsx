import {DocString, Pointer} from "../../joiner";

export class User{
    static current: DocString<Pointer<User, 1, 1>> = "currentUserPointerToDo";
}
