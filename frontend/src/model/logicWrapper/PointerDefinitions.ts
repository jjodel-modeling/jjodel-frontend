import {DStructuralFeature, LClass, LValue, LModel,  RuntimeAccessible} from "../../joiner";
import type {
    Pointer, PrimitiveType, DModelElement, DGraphElement,
    DModel, DPackage, DClass, DEnumerator, DEnumLiteral, DOperation, DAttribute, DReference,
    DObject, DValue, DParameter, DAnnotation,
    DClassifier,
    DVertex, DEdge, DGraph, DEdgePoint,
} from "../../joiner";
class CommonStuff{
    name!: string;
}

@RuntimeAccessible('ModelPointers')
export class ModelPointers extends CommonStuff{
    id!: Pointer<DAnnotation>;
    parent?: this["father"][];
    father?: Pointer<DModelElement>;
    annotations?: Pointer<DAnnotation>[];
    roots!: Pointer<DObject>[];
    objects!: Pointer<DObject>[];
    packages!: Pointer<DPackage>[];
    models!: Pointer<DModel>[];
    instanceof!: Pointer<DModel>;
}

@RuntimeAccessible('AnnotationPointers')
export class AnnotationPointers extends CommonStuff{
    id!: Pointer<DAnnotation>;
    parent?: this["father"][];
    father?: Pointer<DModelElement>;
    annotations?: Pointer<DAnnotation>[];
}

@RuntimeAccessible('PackagePointers')
export class PackagePointers extends CommonStuff{
    id!: Pointer<DPackage>;
    parent?: this["father"][];
    father?: Pointer<DPackage> | Pointer<DModel>;
    annotations?: Pointer<DAnnotation>[];
}

@RuntimeAccessible('OperationPointers')
export class OperationPointers extends CommonStuff{
    id!: Pointer<DOperation>;
    parent?: this["father"][];
    father?: Pointer<DClass>;
    annotations?: Pointer<DAnnotation>[];
    type?: Pointer<DClassifier>;
    exceptions!: Pointer<DClassifier>;
    parameters!: Pointer<DParameter>;
}

@RuntimeAccessible('ParameterPointers')
export class ParameterPointers extends CommonStuff{
    id!: Pointer<DParameter>;
    parent?: this["father"][];
    father?: Pointer<DOperation>;
    annotations?: Pointer<DAnnotation>[];
    type?: Pointer<DClassifier>;
}


@RuntimeAccessible('ReferencePointers')
export class ReferencePointers extends CommonStuff{
    id!: Pointer<DReference>;
    parent!: this["father"][];
    father!: Pointer<DClass>;
    annotations!: Pointer<DAnnotation>[];
    type!: Pointer<DClass>;
    instances!: Pointer<DValue>[];
    defaultValue!: Pointer<DObject>[];
    opposite?: Pointer<DReference>;
    target!: Pointer<DClass>[];
    edges!: Pointer<DEdge>[];
}

@RuntimeAccessible('AttributePointers')
export class AttributePointers extends CommonStuff{
    id!: Pointer<DAttribute>;
    parent!: this["father"][];
    father!: Pointer<DClass>;
    annotations!: Pointer<DAnnotation>[];
    type!: Pointer<DClass>;
    instances!: Pointer<DValue>[];
    defaultValue!: PrimitiveType[];
}

@RuntimeAccessible('LiteralPointers')
export class LiteralPointers extends CommonStuff{
    id!: Pointer<DEnumLiteral>;
    parent!: this["father"][];
    father!: Pointer<DEnumerator>;
    annotations!: Pointer<DAnnotation>[];
}

@RuntimeAccessible('ClassPointers')
export class ClassPointers extends CommonStuff{
    id!: Pointer<DClass>;
    parent!: this["father"][];
    father!: Pointer<DPackage>;
    annotations!: Pointer<DAnnotation>[];

    defaultValue?: Pointer<DObject>[];
    instances?: Pointer<DObject>[];
    operations?: Pointer<DOperation>[];
    features?: Pointer<DStructuralFeature>[];
    references?: Pointer<DReference>[];
    attributes?: Pointer<DAttribute>[];
    referencedBy?: Pointer<DReference>[];
    extends?: Pointer<DClass>[];
    // extendedBy?: Pointer<DClass>[];
    implements?: Pointer<DClass>[];
    implementedBy?: Pointer<DClass>[];
}

@RuntimeAccessible('EnumPointers')
export class EnumPointers extends CommonStuff{
    id!: Pointer<DEnumerator>;
    parent!: this["father"][];
    father!: Pointer<DPackage>;
    annotations!: Pointer<DAnnotation>[];
    literals!: Pointer<DEnumLiteral>[];
}

// L and D objects are fine instead of pointers too, but it makes trickier to do typings.
@RuntimeAccessible('ObjectPointers')
export class ObjectPointers extends CommonStuff{
    id!: Pointer<DObject>;
    parent?: this["father"][];
    father?: Pointer<DValue> | Pointer<DModel>; // | LValue | LModel
    annotations!: Pointer<DAnnotation>[];
    instanceof!: Pointer<DClass>; // | LClass
    features!: Pointer<DValue>[]; // | LValue[]

}

@RuntimeAccessible('ValuePointers')
export class ValuePointers extends CommonStuff{
    id!: Pointer<DValue>;
    parent?: this["father"][];
    father?: Pointer<DObject>;
    annotations?: Pointer<DAnnotation>[];
    instanceof!: Pointer<DAttribute> | Pointer<DReference>;
    edges!: Pointer<DEdge>[];
    values!: Pointer<DObject>[];

}





//// graph stuff

@RuntimeAccessible('GraphPointers')
export class GraphPointers extends CommonStuff{
    id!: Pointer<DGraph>;
    father!: Pointer<DGraphElement>;
    graph!: Pointer<DGraph>;
    model!: Pointer<DModelElement>;
    subElements!: Pointer<DGraphElement>[];
}

@RuntimeAccessible('VertexPointers')
export class VertexPointers extends CommonStuff{
    id!: Pointer<DVertex>;
    father!: Pointer<DGraphElement>;
    graph!: Pointer<DGraph>;
    model!: Pointer<DModelElement>;
    subElements!: Pointer<DGraphElement>[];
}

@RuntimeAccessible('EdgePointers')
export class EdgePointers extends CommonStuff{
    id!: Pointer<DEdge>;
    father!: Pointer<DGraphElement>;
    graph!: Pointer<DGraph>;
    model!: Pointer<DModelElement>;
    subElements!: Pointer<DGraphElement>[];
    midnodes!: Pointer<DEdgePoint>[];
    start!: Pointer<DGraphElement>;
    end!: Pointer<DGraphElement>;
}








