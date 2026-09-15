import {Pointer, DViewElement, DViewPoint, Dictionary, U, RuntimeAccessible, DClass} from '../joiner';
@RuntimeAccessible('Defaults')
export class Defaults { /// TODO: this really needs to become dynamically generated, after view creations.
    static cname: string = 'Defaults';
    static views: Pointer<DViewElement>[] = [
        "Pointer_ViewModel",
        "Pointer_ViewPackage",
        "Pointer_ViewClass",
        "Pointer_ViewEnum",
        "Pointer_ViewAttribute",
        "Pointer_ViewReference",
        "Pointer_ViewOperation",
        "Pointer_ViewParameter",
        "Pointer_ViewLiteral",
        "Pointer_ViewObject",
        "Pointer_ViewValue",
        "Pointer_ViewEdgeAssociation",
        "Pointer_ViewEdgeDependency",
        "Pointer_ViewEdgeInheritance",
        "Pointer_ViewEdgeAggregation",
        "Pointer_ViewEdgeComposition",
        "Pointer_ViewEdgePoint",
        "Pointer_ViewAnchors",
        "Pointer_ViewSingleton",
        "Pointer_ViewFallback",
    ];
    static viewpoints: Pointer<DViewPoint>[] = ["Pointer_ViewPointDefault"];
    static types: Pointer<DViewPoint>[] = [
        "Pointer_EVOID",
        "Pointer_ECHAR",
        "Pointer_ESTRING",
        "Pointer_EDATE",
        "Pointer_EBOOLEAN",
        "Pointer_EBYTE",
        "Pointer_ESHORT",
        "Pointer_EINT",
        "Pointer_ELONG",
        "Pointer_EFLOAT",
        "Pointer_EDOUBLE",
        "Pointer_EOBJECT"];

    //static Pointer_ViewDefaultPackage' = 'Pointer_ViewDefaultPackage';
    static Pointer_ViewPointDefault: Pointer<DViewPoint> = 'Pointer_ViewPointDefault';
    static Pointer_ViewModel: Pointer<DViewElement> = 'Pointer_ViewModel';
    static Pointer_ViewPackage: Pointer<DViewElement> = 'Pointer_ViewPackage';
    static Pointer_ViewClass: Pointer<DViewElement> = 'Pointer_ViewClass';
    static Pointer_ViewEnum: Pointer<DViewElement> = 'Pointer_ViewEnum';
    static Pointer_ViewAttribute: Pointer<DViewElement> = 'Pointer_ViewAttribute';
    static Pointer_ViewReference: Pointer<DViewElement> = 'Pointer_ViewReference';
    static Pointer_ViewOperation: Pointer<DViewElement> = 'Pointer_ViewOperation';
    static Pointer_ViewParameter: Pointer<DViewElement> = 'Pointer_ViewParameter';
    static Pointer_ViewLiteral: Pointer<DViewElement> = 'Pointer_ViewLiteral';
    static Pointer_ViewObject: Pointer<DViewElement> = 'Pointer_ViewObject';
    static Pointer_ViewValue: Pointer<DViewElement> = 'Pointer_ViewValue';
    static Pointer_ViewEdgeAssociation: Pointer<DViewElement> = 'Pointer_ViewEdgeAssociation';
    static Pointer_ViewEdgeDependency: Pointer<DViewElement> = 'Pointer_ViewEdgeDependency';
    static Pointer_ViewEdgeInheritance: Pointer<DViewElement> = 'Pointer_ViewEdgeInheritance';
    static Pointer_ViewEdgeAggregation: Pointer<DViewElement> = 'Pointer_ViewEdgeAggregation';
    static Pointer_ViewEdgeComposition: Pointer<DViewElement> = 'Pointer_ViewEdgeComposition';
    static Pointer_ViewEdgePoint: Pointer<DViewElement> = 'Pointer_ViewEdgePoint';
    static Pointer_ViewAnchors: Pointer<DViewElement> = 'Pointer_ViewAnchors';
    static Pointer_ViewSingleton: Pointer<DViewElement> = 'Pointer_ViewSingleton';
    static Pointer_ViewFallback: Pointer<DViewElement> = 'Pointer_ViewFallback';
    // static Pointer_fallback = 'Pointer_fallback'; // legacy
    // Retired validation viewpoint. The four ids below are NOT seeded any more (they left
    // `views` and `viewpoints` above), but the constants stay: they are the ids the migration
    // needs in order to find the records inside already-saved projects. Do not reuse them.
    static Pointer_ViewPointValidation: Pointer<DViewPoint> = 'Pointer_ViewPointValidation';
    static Pointer_ViewCheckName: Pointer<DViewElement> = 'Pointer_ViewCheckName';
    static Pointer_ViewOverlay: Pointer<DViewElement> = 'Pointer_ViewOverlay';
    static Pointer_ViewLowerbound: Pointer<DViewElement> = 'Pointer_ViewLowerbound';
    // types
    static Pointer_EVOID: Pointer<DClass> = 'Pointer_EVOID';
    static Pointer_ECHAR: Pointer<DClass> = 'Pointer_ECHAR';
    static Pointer_ESTRING: Pointer<DClass> = 'Pointer_ESTRING';
    static Pointer_EDATE: Pointer<DClass> = 'Pointer_EDATE';
    static Pointer_EBOOLEAN: Pointer<DClass> = 'Pointer_EBOOLEAN';
    static Pointer_EBYTE: Pointer<DClass> = 'Pointer_EBYTE';
    static Pointer_ESHORT: Pointer<DClass> = 'Pointer_ESHORT';
    static Pointer_EINT: Pointer<DClass> = 'Pointer_EINT';
    static Pointer_ELONG: Pointer<DClass> = 'Pointer_ELONG';
    static Pointer_EFLOAT: Pointer<DClass> = 'Pointer_EFLOAT';
    static Pointer_EDOUBLE: Pointer<DClass> = 'Pointer_EDOUBLE';
    static Pointer_EOBJECT: Pointer<DClass> = 'Pointer_EOBJECT';

    // @ts-ignore reduce is not well-typed in ts
    static defaultViewsMap: Dictionary<Pointer, DViewElement> = Defaults.views.reduce((acc, val) => { acc[val] = true; return acc; }, {}); // U.objectFromArrayValues(Defaults.views);
    // @ts-ignore reduce is not well-typed in ts
    static defaultViewPointsMap: Dictionary<Pointer, DViewPoint> = Defaults.viewpoints.reduce((acc, val) => { acc[val] = true; return acc; }, {});
    // @ts-ignore reduce is not well-typed in ts
    static defaultTypesMap: Dictionary<Pointer, boolean> = Defaults.types.reduce((acc, val) => { acc[val] = true; return acc; }, {});

    // Fresh views cache - stores the original fresh views created at startup, NOT from loaded projects
    // This is used by updateDefaultView to ensure old project views get updated with fresh code
    static freshViewsMap: Dictionary<Pointer, DViewElement> = {};
    static freshViewPointsMap: Dictionary<Pointer, DViewPoint> = {};
    static freshViewsInitialized: boolean = false;

    static check(id: Pointer): boolean {
        return !!(Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]); // id.indexOf('Pointer_View') !== -1
    }

    /** True for the viewpoints Jjodel seeds itself. Matched by pointer and never by
     *  name, so a user viewpoint called "Default" is unaffected. */
    static isSystemViewpoint(id: Pointer): boolean {
        return (Defaults.viewpoints as string[]).includes(id as string);
    }

    /** A seeded viewpoint is hidden from user-facing lists only while it holds nothing
     *  but system views. Authored views can end up inside `Default` (a view is parented
     *  to the active viewpoint, falling back to the seeded one), and hiding their
     *  container would make them unreachable: four such views sit inside `Default` in
     *  `examples/statechartplus.ts`.
     *
     *  The test is on the pointer NAMESPACE, not on `Defaults.views`. That registry
     *  lists what the tool seeds TODAY, while saved projects also carry system views
     *  that left it or that never entered it. Measured on the `Default` of
     *  `examples/statechartplus.ts`: 39 subViews, 35 system and 4 authored, and an
     *  allowlist built from `Defaults.views` would MISS 3 of the 35 —
     *  `Pointer_ViewVoid` (37 occurrences across the saved-state corpus, zero in the
     *  source) and `Pointer_ViewDefaultPackage` (39, and only a commented-out constant
     *  at line 42 here). Such an allowlist would keep the viewpoint visible even after
     *  the authored views were moved out, which is the whole point of the predicate.
     *  `Pointer_ViewEdge` — the unnamed sixth edge view of `store.tsx:423`, id built as
     *  `'Pointer_ViewEdge' + name` in `DV.tsx:1066` — is the same case seen from the
     *  other side: seeded today, in no registry. Same convention `VersionFixer.tsx:861`
     *  already uses, and the one the commented-out alternative next to `check()` had in
     *  mind. Still matching by pointer, never by name.
     *
     *  Two shapes, both real: `subViews` is a Dictionary in current code
     *  (`view.tsx:255`) and an ARRAY in saved states (measured: 39 entries in
     *  `examples/statechartplus.ts`). `clonedCounter` is skipped because the reducer
     *  injects it into that dictionary as a version counter (`reducer.ts:104`) —
     *  `get_SubViews` and `get_allSubViews` delete it before enumerating for the same
     *  reason (`view.tsx:1074,1110`). Without that skip the predicate would answer
     *  `false` forever on any touched viewpoint and silently disable R-IRN-9. */
    static holdsOnlySystemViews(vp: DViewPoint | undefined): boolean {
        const subs: any = vp && (vp as any).subViews;
        const ids: string[] = Array.isArray(subs) ? subs : (subs ? Object.keys(subs) : []);
        return ids.every(id => id === 'clonedCounter'
            || (typeof id === 'string' && id.startsWith('Pointer_View')));
    }

    // Store fresh views - should only be called once during init with newly created views
    static storeFreshViews(views: DViewElement[], viewpoints: DViewPoint[]): void {
        if (Defaults.freshViewsInitialized) return; // Only store once
        for (const v of views) {
            Defaults.freshViewsMap[v.id] = v;
        }
        for (const vp of viewpoints) {
            Defaults.freshViewPointsMap[vp.id] = vp;
        }
        Defaults.freshViewsInitialized = true;
    }

    // Get fresh view for updating old views
    static getFreshView(id: Pointer): DViewElement | DViewPoint | undefined {
        return Defaults.freshViewsMap[id] || Defaults.freshViewPointsMap[id];
    }
}
