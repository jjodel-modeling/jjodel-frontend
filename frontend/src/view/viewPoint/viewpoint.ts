import {
    Constructors,
    DPointerTargetable,
    DViewElement,
    GraphSize, LogicContext,
    LPointerTargetable,
    LViewElement,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    store
} from "../../joiner";

export type ViewpointType = 'syntax' | 'decoration' | 'validation' | 'semantics' | 'editor_behavior' | 'dataManager';

/** Derives the viewpoint type from legacy booleans + explicit field */
export function getViewpointType(vp: DViewElement): ViewpointType {
    if ((vp as any).viewpointType) return (vp as any).viewpointType;
    if (vp.isValidation) return 'validation';
    if (vp.isExclusiveView) return 'syntax';
    return 'decoration';
}

/**
 * The Data Manager Viewpoint singleton (R-DMV-1).
 *
 * One per project, and not a viewpoint like the others: it is not created from «New
 * viewpoint», not duplicated, not deleted, it does not appear among the canvas syntaxes
 * and the canvas never opens it. The Data Manager reads from it and never from
 * `state.viewpoint`.
 *
 * TWO NAMES, ONE OBJECT, and the asymmetry is deliberate. `viewpointType` says WHAT it
 * is and is read wherever a `DViewElement` is in hand; the pointer says WHICH one it is
 * and is read where only an id travels (the megamodel takes `{id, name}` and no D
 * element). The creator writes both, and no other writer exists — the segmented «Type»
 * of the rail is not reachable with the singleton selected (R-DMV-4) and the dialog of
 * «New viewpoint» does not offer this value.
 *
 * NOT in `Defaults.viewpoints`: that list is what the store SEEDS at startup
 * (`redux/store.tsx`), and R-DMV-6 wants the singleton born at the first write, not at
 * every project open. `Defaults.isSystemViewpoint` therefore stays false for it, and the
 * exclusions below are a second, independent test rather than an entry in that list.
 *
 * INVARIANT — `isExclusiveView` STAYS TRUE. The constructor default is already true
 * (`joiner/classes.ts`), and it must never be turned off: `selectors.ts` applies as
 * DECORATIVE the views of every viewpoint that is neither active nor exclusive, so a
 * non-exclusive singleton would pour its per-class views over the classic canvas of
 * every project. The instinct that says «it is not a syntax, so it is not exclusive» is
 * exactly the one that breaks this.
 */
export const DATA_MANAGER_VIEWPOINT_TYPE: ViewpointType = 'dataManager';

/** The singleton's fixed pointer (R-DMV, Q3), on the precedent of
 *  `Pointer_ViewPointDefault`: one lookup in `idlookup` finds it, with no scan by type. */
export const DATA_MANAGER_VIEWPOINT_ID = 'Pointer_ViewPointDataManager';

/** True for the Data Manager singleton, from a `DViewElement` in hand. */
export function isDataManagerViewpoint(vp: DViewElement | null | undefined): boolean {
    return !!vp && getViewpointType(vp) === DATA_MANAGER_VIEWPOINT_TYPE;
}

/** True for the Data Manager singleton, from its pointer alone — for the lists that
 *  carry an id and no D element. */
export function isDataManagerViewpointId(id: string | null | undefined): boolean {
    return id === DATA_MANAGER_VIEWPOINT_ID;
}

/** The name the singleton is born with. Editable afterwards like any other viewpoint's:
 *  nothing identifies it by name (the pointer and the type do that), so a rename is
 *  cosmetic and safe. */
export const DATA_MANAGER_VIEWPOINT_NAME = 'Data Manager';

/**
 * The singleton as it stands in the loaded project, or null when nobody has written to
 * it yet — which is the state of every project that exists today (R-DMV-6).
 *
 * A read of `idlookup` and not `DPointerTargetable.fromPointer`: absence is the ORDINARY
 * answer here, and it must come back as null rather than as a throw or a hollow proxy.
 */
export function findDataManagerViewpoint(state?: any): DViewPoint | null {
    const st = state ?? store.getState();
    const d = st?.idlookup?.[DATA_MANAGER_VIEWPOINT_ID];
    return d && isDataManagerViewpoint(d) ? (d as DViewPoint) : null;
}

/**
 * The singleton, created on the spot if it is not there yet — the materialization of
 * R-DMV-6. Call it from the FIRST WRITE and never on mount: an `ensure` on render would
 * put the object in every project that ever opened the panel, which is what «born at the
 * first write» exists to avoid.
 *
 * NO OUTER TRANSACTION, here or around a call to this (CLAUDE.md §3.3): `newVP` opens
 * its own, and a creator nested in another TRANSACTION loses its writes. The two rungs of
 * the materialization — this viewpoint, then a per-class `DViewElement` inside it — are
 * therefore two bare calls, exactly as `handleCreateViewpoint` and
 * `createBlankViewInViewpoint` already do it.
 *
 * It does NOT go through the type switch of `handleCreateViewpoint`, and that is the
 * point: that switch turns `isExclusiveView` off for every type but `syntax`, and a
 * non-exclusive singleton pours its views over every classic canvas (see the invariant
 * on `DATA_MANAGER_VIEWPOINT_TYPE`). The constructor default is true and is left alone.
 */
export function ensureDataManagerViewpoint(): DViewPoint | null {
    const existing = findDataManagerViewpoint();
    if (existing) return existing;
    return DViewPoint.newVP(DATA_MANAGER_VIEWPOINT_NAME, (vp) => {
        (vp as any).viewpointType = DATA_MANAGER_VIEWPOINT_TYPE;
        // `isExclusiveView` is NOT written: the constructor already set it to true and
        // the invariant is that nothing ever turns it off.
        vp.isValidation = false;
    }, true, DATA_MANAGER_VIEWPOINT_ID);
}

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
    /*protected* / get_duplicate(c: Context): ((deep?: boolean, new_vp?: DuplicateVPChange) => LViewElement){
        return (deep?: boolean, new_vp?: DuplicateVPChange)=>super.get_duplicate(c)(deep, new_vp);
    }*/
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewPoint);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewPoint);
