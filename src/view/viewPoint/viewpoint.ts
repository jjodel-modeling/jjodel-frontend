import {
    Constructors,
    DPointerTargetable,
    DViewElement,
    GraphSize, LogicContext,
    LPointerTargetable,
    LViewElement,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass
} from "../../joiner";


@RuntimeAccessible('DViewPoint')
export class DViewPoint extends DViewElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;

/*
    public static new(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '', priority: number = 1 , persist: boolean = true): DViewPoint {
        return new Constructors(new DViewPoint('dwc'), undefined, persist, undefined).DPointerTargetable()
            .DViewElement(name, jsxString, undefined, defaultVSize, usageDeclarations, constants,
                preRenderFunc, appliableToClasses, oclApplyCondition, priority).DViewPoint().end();
    }*/
    public static newVP(name: string, callback?: (d:DViewElement)=>void, persist: boolean = true, id?: string): DViewPoint {
        let c = new Constructors(
            new DViewPoint('dwc'), undefined, persist, undefined, id)
            .DPointerTargetable();
        // @ts-ignore
        c.thiss.viewpoint = c.thiss.id;
    return c.DViewElement(name, '').DViewPoint().end(callback)
    }
}

@RuntimeAccessible('LViewPoint')
export class LViewPoint<Context extends LogicContext<DViewPoint, LViewPoint> = any, D extends DViewPoint = any> extends LViewElement {
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    //public __raw!: DViewPoint;
    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;
    /*protected*/ get_duplicate(c: Context){
        return ()=>super.get_duplicate(c)(true);
    }
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewPoint);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewPoint);
