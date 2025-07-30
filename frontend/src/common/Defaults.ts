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
        // validation
        "Pointer_ViewCheckName",
        "Pointer_ViewOverlay",
        "Pointer_ViewLowerbound",
    ];
    static viewpoints: Pointer<DViewPoint>[] = ["Pointer_ViewPointDefault", "Pointer_ViewPointValidation"];
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
    // validation vp
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

    static check(id: Pointer): boolean {
        return !!(Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]); // id.indexOf('Pointer_View') !== -1
    }
}
