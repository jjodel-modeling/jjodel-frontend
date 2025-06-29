import {Pointer, DViewElement, DViewPoint, Dictionary, U, RuntimeAccessible} from '../joiner';
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
        "Pointer_ViewVoid",
        "Pointer_ViewEdgeAssociation",
        "Pointer_ViewEdgeDependency",
        "Pointer_ViewEdgeInheritance",
        "Pointer_ViewEdgeAggregation",
        "Pointer_ViewEdgeComposition",
        "Pointer_ViewEdgePoint",
        "Pointer_ViewAnchors",
        "Pointer_ViewSingleton",
        "Pointer_ViewFallback",
        "Pointer_fallback",
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
    static Pointer_ViewPointDefault = 'Pointer_ViewPointDefault';
    static Pointer_ViewModel = 'Pointer_ViewModel';
    static Pointer_ViewPackage = 'Pointer_ViewPackage';
    static Pointer_ViewClass = 'Pointer_ViewClass';
    static Pointer_ViewEnum = 'Pointer_ViewEnum';
    static Pointer_ViewAttribute = 'Pointer_ViewAttribute';
    static Pointer_ViewReference = 'Pointer_ViewReference';
    static Pointer_ViewOperation = 'Pointer_ViewOperation';
    static Pointer_ViewParameter = 'Pointer_ViewParameter';
    static Pointer_ViewLiteral = 'Pointer_ViewLiteral';
    static Pointer_ViewObject = 'Pointer_ViewObject';
    static Pointer_ViewValue = 'Pointer_ViewValue';
    static Pointer_ViewVoid = 'Pointer_ViewVoid';
    static Pointer_ViewEdgeAssociation = 'Pointer_ViewEdgeAssociation';
    static Pointer_ViewEdgeDependency = 'Pointer_ViewEdgeDependency';
    static Pointer_ViewEdgeInheritance = 'Pointer_ViewEdgeInheritance';
    static Pointer_ViewEdgeAggregation = 'Pointer_ViewEdgeAggregation';
    static Pointer_ViewEdgeComposition = 'Pointer_ViewEdgeComposition';
    static Pointer_ViewEdgePoint = 'Pointer_ViewEdgePoint';
    static Pointer_ViewAnchors = 'Pointer_ViewAnchors';
    static Pointer_ViewSingleton = 'Pointer_ViewSingleton';
    static Pointer_ViewFallback = 'Pointer_ViewFallback';
    static Pointer_fallback = 'Pointer_fallback'; // legacy
    // validation vp
    static Pointer_ViewPointValidation = 'Pointer_ViewPointValidation';
    static Pointer_ViewCheckName = 'Pointer_ViewCheckName';
    static Pointer_ViewOverlay = 'Pointer_ViewOverlay';
    static Pointer_ViewLowerbound = 'Pointer_ViewLowerbound';
    // types
    static Pointer_EVOID = 'Pointer_EVOID';
    static Pointer_ECHAR = 'Pointer_ECHAR';
    static Pointer_ESTRING = 'Pointer_ESTRING';
    static Pointer_EDATE = 'Pointer_EDATE';
    static Pointer_EBOOLEAN = 'Pointer_EBOOLEAN';
    static Pointer_EBYTE = 'Pointer_EBYTE';
    static Pointer_ESHORT = 'Pointer_ESHORT';
    static Pointer_EINT = 'Pointer_EINT';
    static Pointer_ELONG = 'Pointer_ELONG';
    static Pointer_EFLOAT = 'Pointer_EFLOAT';
    static Pointer_EDOUBLE = 'Pointer_EDOUBLE';
    static Pointer_EOBJECT = 'Pointer_EOBJECT';

    // @ts-ignore reduce is not well-typed in ts
    static defaultViewsMap: Dictionary<Pointer, boolean> = Defaults.views.reduce((acc, val) => { acc[val] = true; return acc; }, {}); // U.objectFromArrayValues(Defaults.views);
    // @ts-ignore reduce is not well-typed in ts
    static defaultViewPointsMap: Dictionary<Pointer, boolean> = Defaults.viewpoints.reduce((acc, val) => { acc[val] = true; return acc; }, {});
    // @ts-ignore reduce is not well-typed in ts
    static defaultTypesMap: Dictionary<Pointer, boolean> = Defaults.types.reduce((acc, val) => { acc[val] = true; return acc; }, {});

    static check(id: string): boolean {
        return Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]; // id.indexOf('Pointer_View') !== -1
    }
}
