import {
    Constructors,
    DPointerTargetable,
    LPointerTargetable,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass
} from "../../joiner";


@RuntimeAccessible
export class DViewPoint extends DPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;

    public static new(name: string): DViewPoint {
        return new Constructors(new DViewPoint('dwc')).DPointerTargetable().DViewPoint(name).end();
    }
}

@RuntimeAccessible
export class LViewPoint extends LPointerTargetable {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    public __raw!: DViewPoint;
    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;
}

DPointerTargetable.subclasses.push(DViewPoint);
LPointerTargetable.subclasses.push(LViewPoint);

