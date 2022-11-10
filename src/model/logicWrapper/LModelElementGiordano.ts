export const fakeexport = {};

// import {
//     CreateElementAction,
//     DAnnotation,
//     DAttribute,
//     DClass,
//     DClassifier,
//     DDataType, DEdgePoint,
//     DeleteElementAction,
//     DEnumerator,
//     DEnumLiteral,
//     DModel,
//     DModelElement,
//     DNamedElement,
//     DObject,
//     DOperation,
//     DPackage,
//     DParameter,
//     DPointerTargetable, DRefEdge,
//     DReference,
//     DStructuralFeature,
//     DTypedElement,
//     DValue, GObject,
//     IsActually,
//     Log,
//     LogicContext,
//     LPointerTargetable, LRefEdge, MDE,
//     MixOnlyFuncs,
//     MyProxyHandler,
//     Pointer,
//     RuntimeAccessible, Selectors,
//     SetFieldAction, SetRootFieldAction,
//     store,
//     U
// } from "../../joiner";
//
// function resolvePointersFunction<T extends DPointerTargetable = DPointerTargetable,
//     LB extends number=number,
//     UB extends number | string= number | string,
//     RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>[]): (RET | null)[] {
//     return (ptr && ptr.map( p => LModelElement.ResolvePointer<T, LB, UB, RET>(p)) as RET[]) || []; }
//
// function resolvePointerFunction<T extends DPointerTargetable = DModelElement,
//     LB extends number=number,
//     UB extends number | string= number | string,
//     RET extends LPointerTargetable = LModelElement>(ptr: Pointer<T, LB, UB, RET>): RET | null {
//     if (!ptr) return null;
//     let obj: DPointerTargetable | LPointerTargetable | undefined = store.getState().idlookup[ptr as string];
//     if (!obj) return null;
//     if (obj instanceof DModelElement) obj = MyProxyHandler.wrap(obj);
//     return obj as RET; }
//
// @RuntimeAccessible
// export class LModelElement extends MixOnlyFuncs(DModelElement, LPointerTargetable) {
//     static singleton: IsActually<LModelElement>;
//     // @ts-ignore
//     parent!: LModelElement[];
//     // @ts-ignore
//     annotations!: LAnnotation[];
//     childrens!: LModelElement[]; //LAnnotation[];
//     static ResolvePointer = resolvePointerFunction;
//     private static ResolvePointers? = resolvePointersFunction;
//     private resolvePointer<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, UB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, UB, RET>): RET | null {
//         return LModelElement.ResolvePointer(ptr); }
//     private resolvePointers<T extends DPointerTargetable = DPointerTargetable, LB extends number = 0, RET extends LPointerTargetable = LPointerTargetable>(ptr: Pointer<T, LB, 'N', RET>)
//         : (RET | null)[] { return resolvePointersFunction(ptr); }
//
//     //per ogni field creo getter e setter che vengono chiamati dal proxy
//     get_id(context: LogicContext<this>): string { return context.data.id; }
//     set_id(): boolean { return Log.exx('id is read-only', this); }
//
//     get_childrens_idlist(context: LogicContext<DModelElement>): Pointer<DAnnotation, 1, 'N'> {
//         return [...context.data.annotations];
//     }
//     get_childrens(context: LogicContext<DModelElement>): LModelElement[] {
//         return this.get_childrens_idlist(context).map(e => MyProxyHandler.wrap(e));
//     }
//     set_childrens(): boolean { return Log.exx('childrens is a derived read-only collection', this); }
//
//     add_parent(val: Pointer<DAnnotation> | LModelElement, logicContext: LogicContext<DNamedElement>): boolean {
//         return new SetFieldAction(logicContext.data, 'parent[]', val).fire();
//     }
//
//     remove_parent(logicContext: LogicContext<DNamedElement>): boolean {
//         return new SetFieldAction(logicContext.data, 'parent', []).fire();
//     }
//
//     get_parent(context: LogicContext<DModelElement>): LModelElement[] {
//         return U.arrayFilterNull(this.resolvePointers(context.data.parent)) as LModelElement[];
//     }
//
//     set_parent(val: Pointer<DAnnotation> | LModelElement[], logicContext: LogicContext<DNamedElement>): boolean {
//         return new SetFieldAction(logicContext.data, 'parent', val).fire();
//     }
//
//     add_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
//         return true;
//     }
//     remove_annotation(val: Pointer<DAnnotation> | LAnnotation, logicContext: LogicContext<DNamedElement>): boolean {
//         return true;
//     }
//     get_annotations(context: LogicContext<DModelElement>): (LAnnotation | null)[] {
//         return this.resolvePointers<DAnnotation, 1, LAnnotation>(context.data.annotations);
//     }
//
//     set_annotations(val: Pointer<DAnnotation>[] | LAnnotation[], logicContext: LogicContext<DNamedElement>): boolean {
//         if (!Array.isArray(val)) val = [val];
//         val = val.map( v => (v instanceof LAnnotation ? v.id : ( isValidPointer(v, DAnnotation) ? v : null ))) as Pointer<DAnnotation>[];
//         new SetFieldAction(logicContext.data, 'annotations', val);
//         return true;
//     }
//
//     remove(context: LogicContext): void {
//         new DeleteElementAction(context.data);
//     }
//
//     get_addChild(context: LogicContext<any>): (type:string) => void {
//         return (type) => {
//             switch ((type || '').toLowerCase()){
//                 default: Log.ee('cannot find children type requested to add:', {type: (type || '').toLowerCase(), context}); break;
//                 case "attribute": return this.get_addAttribute(context);
//                 case "class": return this.get_addClass(context);
//                 case "package": return this.get_addPackage(context);
//                 case "reference": return this.get_addReference(context);
//                 case "enumerator": return this.get_addEnumerator(context);
//                 case "literal": return this.get_addEnumLiteral(context);
//             }
//         }
//     }
//
//     get_addPackage(context: LogicContext<any>): (() => void) {
//         let ret = () => {};
//         switch (context.data?.className) {
//             default: break;
//             case "DModel": ret = () => LModelElement.addPackage(context.data); break;
//             case "DPackage": ret = () => LModelElement.addSubPackage(context.data); break;
//         }
//         ret();
//         return ret;
//     }
//
//     private static addPackage(dModel: DModel): void {
//         const lModel: LModel = MyProxyHandler.wrap(dModel);
//         let name = 'package_' + 0;
//         let childrenNames: (string)[] = lModel.childrens.map( p => (p as LPackage).name);
//         name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
//         const dPackage = new DPackage(name);
//         dPackage.parent = [dModel.id];
//         dPackage.father = dModel.id;
//         LModelElement.addPackage_(dModel, dPackage);
//     }
//
//     private static addSubPackage(dPackage: DPackage): void {
//         const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
//         let name = 'subpackage_' + 0;
//         let childrenNames: (string)[] = lPackage.childrens.map( p => (p as LPackage).name);
//         name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
//         const dSubPackage = new DPackage(name);
//         dSubPackage.parent = [dPackage.id];
//         dSubPackage.father = dPackage.id;
//         LModelElement.addSubPackage_(dPackage, dSubPackage);
//     }
//
//     get_addClass(context: LogicContext<DPackage>): () => void {
//         const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data as DPackage : null;
//         let ret = () => {};
//         if (dPackage) {
//             const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
//             let name = 'class_' + 0;
//             let childrenNames: (string)[] = lPackage.childrens.map( c => (c as LClassifier).name);
//             name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0)
//             const dClass = new DClass(name);
//             dClass.parent = [dPackage.id];
//             dClass.father = dPackage.id;
//             ret = () => LModelElement.addClass_(dPackage, dClass);
//         }
//         ret();
//         return ret;
//     }
//
//     get_addAttribute(context: LogicContext<DClass>): () => void {
//         let ret = () => {};
//         const  dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
//         if (dClass) {
//             const lClass: LClass = MyProxyHandler.wrap(dClass);
//             let name = 'attribute_' + 0;
//             let childrenNames: (string)[] = lClass.childrens.map( c => (c as LStructuralFeature).name);
//             name = U.increaseEndingNumber(name, false, false, (newName) => childrenNames.indexOf(newName) >= 0);
//             const dAttribute = new DAttribute(name);
//             dAttribute.parent = [dClass.id];
//             dAttribute.father = dClass.id;
//             const lString: LPointerTargetable = MyProxyHandler.wrap(Selectors.getFirstPrimitiveTypes());
//             dAttribute.type = lString.id;
//             U.addPointerBy(lString, dAttribute);
//             ret = () => LModelElement.addAttribute_(dClass, dAttribute);
//         }
//         ret();
//         return ret;
//     }
//
//     get_addReference(context: LogicContext<DClass>): (() => void) {
//         let ret = () => {};
//         const dClass: DClass | null = (context.data?.className === "DClass") ? context.data : null;
//         if(dClass) {
//             const lClass: LClass = MyProxyHandler.wrap(dClass);
//             let name = 'reference_' + 0;
//             const childrenNames: (string)[] = lClass.childrens.map( c => (c as LNamedElement).name);
//             name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
//             const dReference = new DReference(name);
//             dReference.parent = [dClass.id];
//             dReference.father = dClass.id;
//             dReference.type = dClass.id;
//
//             //todo: fix constructor with properly graphid and nodeid(?)
//             const dRefEdge: DRefEdge = new DRefEdge(false, undefined, "");
//             dRefEdge.start = dReference.id;
//             dRefEdge.end = dClass.id;
//
//             U.addPointerBy(lClass, dReference);
//             ret = () => LModelElement.addReference_(dClass, dReference, dRefEdge);
//         }
//         ret();
//         return ret;
//     }
//
//     get_addEnumerator(context: LogicContext<DPackage>): () => void {
//         let ret = () => {};
//         const dPackage: DPackage | null = (context.data?.className === "DPackage") ? context.data : null;
//         if(dPackage) {
//             const lPackage: LPackage = MyProxyHandler.wrap(dPackage);
//             let name = 'enum_' + 0;
//             const childrenNames: (string)[] = lPackage.childrens.map( c => (c as LNamedElement).name);
//             name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
//             const dEnumerator = new DEnumerator(name);
//             dEnumerator.parent = [dPackage.id];
//             dEnumerator.father = dPackage.id;
//             ret = () => LModelElement.addEnumerator_(dPackage, dEnumerator);
//         }
//         ret();
//         return ret;
//     }
//
//     get_addEnumLiteral(context: LogicContext<DEnumerator>): () => void {
//         let ret = () => {};
//         const dEnum: DEnumerator | null = (context.data?.className === "DEnumerator") ? context.data : null;
//         if(dEnum) {
//             const lEnum: LEnumerator = MyProxyHandler.wrap(dEnum);
//             let name = 'literal_' + 0;
//             const childrenNames: (string)[] = lEnum.childrens.map(c => (c as LNamedElement).name);
//             name = U.increaseEndingNumber(name, false, false, (newname) => childrenNames.indexOf(newname) >= 0)
//             const dLiteral = new DEnumLiteral(name);
//             dLiteral.parent = [dEnum.id];
//             dLiteral.father = dEnum.id;
//             ret = () => LModelElement.addEnumLiteral_(dEnum, dLiteral);
//         }
//         ret();
//         return ret;
//     }
//
//     // activated by user in JSX
//     addClass(): void { Log.exDevv('addClass should never be called directly, but should trigger get_addClass(), this is only a signature for type checking.'); }
//     addPackage(): void { Log.exDevv('addPackage should never be called directly, but should trigger get_addClass(), this is only a signature for type checking.'); }
//     addAttribute(): void { Log.exDevv('addAttribute should never be called directly, but should trigger get_addAttribute(), this is only a signature for type checking.'); }
//     addReference(): void { Log.exDevv('addReference should never be called directly, but should trigger get_addReference(), this is only a signature for type checking.'); }
//     addEnumerator(): void { Log.exDevv('addEnumerator should never be called directly, but should trigger get_Enumerator(), this is only a signature for type checking.'); }
//     addEnumLiteral(): void { Log.exDevv('addLiteral should never be called directly, but should trigger get_Literal(), this is only a signature for type checking.'); }
//     addChild(type: string): void { Log.exDevv('addAttribute("'+type+'") should never be called directly, but should trigger get_addAttribute(), this is only a signature for type checking.'); }
//
//     private static addReference_(dClass: DClass, dReference: DReference, dRefEdge: DRefEdge): void {
//         new CreateElementAction(dReference);
//         new SetFieldAction(dClass, "references+=", dReference.id);
//         new CreateElementAction(dRefEdge);
//         new SetRootFieldAction("refEdges+=", dRefEdge.id);
//     }
//     private static addAttribute_(dClass: DClass, dAttribute: DAttribute): void {
//         new CreateElementAction(dAttribute);
//         new SetFieldAction(dClass, 'attributes+=', dAttribute.id);
//     }
//     private static addClass_(dPackage: DPackage, dClass: DClass): void {
//         new CreateElementAction(dClass);
//         new SetFieldAction(dPackage, 'classifiers+=', dClass.id);
//     }
//     private static addPackage_(dModel: DModel, dPackage: DPackage): void {
//         new CreateElementAction(dPackage);
//         new SetFieldAction(dModel, 'packages+=', dPackage.id);
//     }
//     private static addSubPackage_(dPackage: DPackage, dSubPackage: DPackage): void {
//         new CreateElementAction(dSubPackage);
//         new SetFieldAction(dPackage, 'subpackages+=', dSubPackage.id);
//     }
//     private static addEnumerator_(dPackage: DPackage, dEnumerator: DEnumerator): void {
//         new CreateElementAction(dEnumerator);
//         new SetFieldAction(dPackage, 'classifiers+=', dEnumerator.id);
//     }
//     private static addEnumLiteral_(dEnum: DEnumerator, dLiteral: DEnumLiteral): void {
//         new CreateElementAction(dLiteral);
//         new SetFieldAction(dEnum, "literals+=", dLiteral.id);
//     }
//
//     changeAttributeType(newType: string): void {}
//     changeReferenceType(newType: string): void {}
//     changeType(newType: string): void {}
//
//     get_changeType(context: LogicContext<any>): (newType: string) => void {
//         const classname = context.data.className;
//         return (newType) => {
//             switch (classname){
//                 default: alert(`You can't call changeType on ${classname}`); break;
//                 case "DAttribute": return this.get_changeAttributeType(context, newType);
//                 case "DReference": return this.get_changeReferenceType(context, newType);
//             }
//         }
//     }
//     get_changeAttributeType(context: LogicContext<DAttribute>, newType: string): () => void {
//         let ret = () => {};
//         const dAttribute: DAttribute = context.data;
//         const dOldClassifier: DClassifier = Selectors.getDElement<DClassifier>(dAttribute.type as string);
//         const dNewClassifier: DClassifier = Selectors.getDElement<DClassifier>(newType);
//         //const index: number = dOldClassifier.pointedBy.indexOf(dAttribute.id);
//         ret = () => {
//             new SetFieldAction(dAttribute, "type", newType);
//             new SetFieldAction(dOldClassifier, "pointedBy", U.removeFromList(dOldClassifier.pointedBy, dAttribute.id));
//             //new SetFieldAction(dOldClassifier, `pointedBy.${index}-=`, undefined);
//             new SetFieldAction(dNewClassifier, "pointedBy+=", dAttribute.id);
//         };
//         ret();
//         return ret;
//     }
//     //move to LRef? yes
//     get_changeReferenceType(context: LogicContext<DReference>, newType: string): () => void {
//         let ret = () => {};
//         const dReference: DReference = context.data;
//         const dOldClass: DClass = Selectors.getDElement<DClass>(dReference.type as string);
//         const dNewClass: DClass = Selectors.getDElement<DClass>(newType);
//         const dRefEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
//         ret = () => {
//             new SetFieldAction(dReference, "type", newType);
//             new SetFieldAction(dOldClass, "pointedBy", U.removeFromList(dOldClass.pointedBy, dReference.id));
//             //new SetFieldAction(dOldClass, "pointedBy-=", dOldClass.pointedBy.indexOf(dReference.id))
//             new SetFieldAction(dNewClass, "pointedBy+=", dReference.id);
//             if(dRefEdge) {
//                 new SetFieldAction(dRefEdge, "end", newType);
//             }
//         };
//         ret();
//         return ret;
//     }
//
//
//     //delete
//     delete(): void {}
//
// }
// // type UserDefinedClassTODO = Function;
// function isValidPointer<T extends DPointerTargetable = DModelElement, LB extends number = 0, UB extends number = 1, RET extends LPointerTargetable = LModelElement>
// (p: Pointer<T, LB, UB, RET>, constraintType?: typeof DPointerTargetable): boolean {
//     const pointerval: RET | null = LModelElement.ResolvePointer(p);
//     if (!pointerval) return false;
//     if (!constraintType) return true;
//     return (pointerval instanceof constraintType); }
//
// @RuntimeAccessible
// export class LAnnotation extends MixOnlyFuncs(DAnnotation, LModelElement) {
//     static singleton: IsActually<LAnnotation>;
//     get_source(context: LogicContext<this>): string {
//         return context.data.source; }
//     set_source(val: string, logicContext: LogicContext<this>): boolean {
//         new SetFieldAction(logicContext.data, 'source', !!(val as unknown));
//         return true; }
// }
//
// @RuntimeAccessible
// export class LNamedElement extends MixOnlyFuncs(DNamedElement, LModelElement) {
//     static structure: typeof DNamedElement;
//     static singleton: LNamedElement;
//     // private static proxyHandler: DNamedElementProxyHandler = new DNamedElementProxyHandler();
//     // [key: string]: any; // uncomment to allow custom properties typed with any while keeping typed existing ones
//     // todo: per ogni field creo getter e setter che vengono chiamati dal proxy
//     get_name(context: LogicContext<this>): string { return context.data.name; }
//     set_name(val: string,  logicContext: LogicContext<this>): boolean {
//         if (val.match(/\s/)) val = this.autofix_name(val, logicContext);
//         // todo: validate if operation can be completed or need autocorrection, then either return false (invalid parameter cannot complete) or send newVal at redux
//         const fixedVal: string = val;
//         new SetFieldAction(logicContext.data, 'name', fixedVal);
//         return true;
//     }
//     autofix_name(val: string, logicContext: LogicContext<this>): string {
//         // NB: NON fare autofix di univocità nome tra i childrens o qualsiasi cosa dipendente dal contesto, questo potrebbe essere valido in alcuni modelli e invalido in altri e modificare un oggetto condiviso.
//         return val.replaceAll(/\s/g, '_');
//     }
// }
//
// @RuntimeAccessible
// export class LTypedElement extends MixOnlyFuncs(DTypedElement, LNamedElement) {
//     static structure: typeof DTypedElement;
//     static singleton: LTypedElement;
//
//     get_ordered(context: LogicContext<this>): boolean {
//         return context.data.ordered; }
//     set_ordered(val: boolean, logicContext: LogicContext<this>): boolean {
//         new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
//         return true; }
//     get_unique(context: LogicContext<this>): boolean {
//         return context.data.unique; }
//     set_unique(val: boolean, logicContext: LogicContext<this>): boolean {
//         new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
//         return true; }
// }
//
// @RuntimeAccessible
// export class LClassifier extends MixOnlyFuncs(DClassifier, LNamedElement) {
//     static structure: typeof DClassifier;
//     static singleton: LClassifier;
//
//     ordered: boolean = true;
//     unique: boolean = true;
//     lowerBound: number = 0;
//     upperBound: number = 1;
//     many!: boolean; // ?
//     required!: boolean; // ?
//
//     get_ordered(context: LogicContext<LModelElement>): boolean {
//         return this.ordered; }
//     set_ordered(val: boolean, logicContext: LogicContext<DNamedElement>): boolean {
//         new SetFieldAction(logicContext.data, 'ordered', !!(val as unknown));
//         return true; }
//     get_unique(context: LogicContext<LModelElement>): boolean {
//         return this.unique; }
//     set_unique(val: boolean, logicContext: LogicContext<DNamedElement>): boolean {
//         new SetFieldAction(logicContext.data, 'unique', !!(val as unknown));
//         return true; }
//
// }
//
// @RuntimeAccessible
// export class LPackage extends MixOnlyFuncs(DPackage, LNamedElement) {
//     static structure: typeof DPackage;
//     static singleton: LPackage;
//     // @ts-ignore
//     childrens!: (LClassifier | LPackage | LAnnotation)[];
//     // @ts-ignore
//     subpackages!: LPackage[];
//     // @ts-ignore
//     parent!: LModel;
//
//     get_childrens_idlist(context: LogicContext<DPackage>): Pointer<DAnnotation | DPackage | DClassifier |DEnumerator, 1, 'N'> {
//         return [...super.get_childrens_idlist(context), ...context.data.subpackages, ...context.data.classifiers]; }
//
//     get_delete(context: LogicContext<DPackage>): () => void {
//         let ret = () => {};
//         const dPackage: DPackage = context.data;
//         const dFather: (DModel | DPackage) & GObject = Selectors.getDElement<DModel>(dPackage.father);
//         const children = new Set([...dPackage.classifiers, ...dPackage.subpackages]);
//         for(let dChild of children) {
//             const lChild: LClass | LEnumerator | LPackage = MyProxyHandler.wrap(dChild);
//             lChild.delete();
//         }
//         if(dFather.className === "DModel") {
//             ret = () => {
//                 new SetFieldAction(dFather, "packages", U.removeFromList(dFather.packages, dPackage.id));
//                 //new SetRootFieldAction("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id));
//                 new DeleteElementAction(dPackage);
//             }
//         }
//         if(dFather.className === "DPackage") {
//             ret = () => {
//                 new SetFieldAction(dFather, "subpackages", U.removeFromList(dFather.subpackages, dPackage.id));
//                 //new SetRootFieldAction("packages", U.removeFromList(Selectors.getAllPackages(), dPackage.id));
//                 new DeleteElementAction(dPackage);
//             }
//         }
//         ret();
//         return ret;
//     }
//
// }
//
// @RuntimeAccessible
// export class LOperation extends MixOnlyFuncs(DOperation, LTypedElement) {
//     static structure: typeof DOperation;
//     static singleton: LOperation;
//
//     // @ts-ignore
//     // childrens!: (LPackage | LAnnotation)[];
//     // @ts-ignore
//     parent!: LModel;
//     // @ts-ignore
//     parameters!: LParameter[];
//     // @ts-ignore
//     exceptions!: LClassifier[];
//
//     get_childrens_idlist(context: LogicContext<DOperation>): Pointer<DAnnotation | DClassifier | DParameter, 1, 'N'> {
//         return [...super.get_childrens_idlist(context), ...context.data.exceptions, ...context.data.parameters]; }
// }
//
// @RuntimeAccessible
// export class LParameter extends MixOnlyFuncs(DParameter, LTypedElement) {
//     static structure: typeof DParameter;
//     static singleton: LParameter;
// }
//
// @RuntimeAccessible
// export class LClass extends MixOnlyFuncs(DClass, LClassifier) {
//     static structure: typeof DClass;
//     static singleton: LClass;
//
//     // @ts-ignore
//     childrens!: (LAnnotation | LAttribute | LReference | LOperation)[];
//     // @ts-ignore
//     parent!: LPackage;
//     // @ts-ignore
//     attributes!: LAttribute[];
//     // @ts-ignore
//     references!: LReference[];
//     // @ts-ignore
//     operations!: LOperation[];
//
//     get_childrens_idlist(context: LogicContext<DClass>): Pointer<DAnnotation | DAttribute | DReference | DOperation, 1, 'N'> {
//         return [...super.get_childrens_idlist(context), ...context.data.attributes, ...context.data.references, ...context.data.operations]; }
//
//     get_delete(context: LogicContext<DClass>): () => void {
//         const dClass: DClass = context.data;
//         const dPackage: DPackage = Selectors.getDElement<DPackage>(dClass.father);
//         const children = new Set([...dClass.attributes, ...dClass.references, ...dClass.pointedBy]);
//         for(let dChild of children) {
//             const lChild: LAttribute | LReference = MyProxyHandler.wrap(dChild);
//             lChild.delete();
//         }
//         const ret = () => {
//             new SetFieldAction(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dClass.id));
//             //new SetRootFieldAction("classs", U.removeFromList(Selectors.getAllClasses(), dClass.id));
//             new DeleteElementAction(dClass);
//         }
//         ret();
//         return ret;
//     }
//
// }
//
// @RuntimeAccessible
// export class LDataType extends MixOnlyFuncs(DDataType, LClassifier) {
//     static structure: typeof DDataType;
//     static singleton: LDataType;
// }
//
// @RuntimeAccessible
// export class LStructuralFeature extends MixOnlyFuncs(DStructuralFeature, LTypedElement) {
//     static structure: typeof DStructuralFeature;
//     static singleton: LStructuralFeature;
// }
//
// @RuntimeAccessible
// export class LReference extends MixOnlyFuncs(DReference, LStructuralFeature) {
//     static structure: typeof DReference;
//     static singleton: LReference;
//
//     get_delete(context: LogicContext<DReference>): () => void {
//         const dReference: DReference = context.data;
//         const dClass: DClass = Selectors.getDElement<DClass>(dReference.father);
//         const dType: DClass = Selectors.getDElement<DClass>(dReference.type as string);
//         const dEdge: DRefEdge | undefined = U.getReferenceEdge(dReference);
//         const ret = () => {
//             new SetFieldAction(dClass, "references", U.removeFromList(dClass.references, dReference.id));
//             new SetFieldAction(dType, "pointedBy", U.removeFromList(dType.pointedBy, dReference.id));
//             //new SetRootFieldAction("references", U.removeFromList(Selectors.getAllReferences(), dReference.id));
//             if(dEdge) {
//                 new SetRootFieldAction("refEdges", U.removeFromList(Selectors.getAllReferenceEdges(), dEdge.id));
//             }
//             new DeleteElementAction(dReference);
//         }
//         ret();
//         return ret;
//     }
// }
//
// @RuntimeAccessible
// export class LAttribute extends MixOnlyFuncs(DAttribute, LStructuralFeature) {
//     static structure: typeof DAttribute;
//     static singleton: LAttribute;
//
//     get_delete(context: LogicContext<DAttribute>): () => void {
//         const dAttribute: DAttribute = context.data;
//         const dClass: DClass = Selectors.getDElement<DClass>(dAttribute.father);
//         const dClassifier: DClassifier = Selectors.getDElement<DClass>(dAttribute.type as string);
//         const ret = () => {
//             new SetFieldAction(dClass, "attributes", U.removeFromList(dClass.attributes, dAttribute.id));
//             new SetFieldAction(dClassifier, "pointedBy", U.removeFromList(dClassifier.pointedBy, dAttribute.id));
//             //new SetRootFieldAction("attributes", U.removeFromList(Selectors.getAllAttributes(), dAttribute.id));
//             new DeleteElementAction(dAttribute);
//         }
//         ret();
//         return ret;
//     }
// }
//
// @RuntimeAccessible
// export class LEnumLiteral extends MixOnlyFuncs(DEnumLiteral, LNamedElement) {
//     static structure: typeof DEnumLiteral;
//     static singleton: LEnumLiteral;
//
//     get_delete(context: LogicContext<DEnumLiteral>): () => void {
//         const dEnumLiteral: DEnumLiteral = context.data;
//         const dEnumerator: DEnumerator = Selectors.getDElement<DEnumerator>(dEnumLiteral.father);
//         const ret = () => {
//             new SetFieldAction(dEnumerator, "literals", U.removeFromList(dEnumerator.literals, dEnumLiteral.id));
//             //new SetRootFieldAction("enumliterals", U.removeFromList(Selectors.getAllEnumLiterals(), dEnumLiteral.id));
//             new DeleteElementAction(dEnumLiteral);
//         }
//         ret();
//         return ret;
//     }
// }
//
// @RuntimeAccessible
// export class LEnumerator extends MixOnlyFuncs(DEnumerator, LDataType) {
//     static structure: typeof DEnumerator
//     static singleton: LEnumerator;
//
//     // @ts-ignore
//     parent!: LPackage;
//     // @ts-ignore
//     childrens!: (LAnnotation | LEnumLiteral)[];
//     // @ts-ignore
//     literals!: LEnumLiteral[];
//
//     get_childrens_idlist(context: LogicContext<DEnumerator>): Pointer<DAnnotation | DEnumLiteral, 1, 'N'> {
//         return [...super.get_childrens_idlist(context), ...context.data.literals]; }
//
//     get_delete(context: LogicContext<DEnumerator>): () => void {
//         const dEnumerator: DEnumerator = context.data;
//         const dPackage: DPackage = Selectors.getDElement<DPackage>(dEnumerator.father);
//         const children = new Set([...dEnumerator.literals, ...dEnumerator.pointedBy]);
//
//         for(let dChild of children) {
//             const lChild: LEnumLiteral | LAttribute = MyProxyHandler.wrap(dChild);
//             lChild.delete();
//         }
//
//         /*
//         const pointedBy = new Set([...dEnumerator.pointedBy]);
//         for(let dPointer of pointedBy) {
//             const lPointer: LAttribute = MyProxyHandler.wrap(dPointer);
//             lPointer.changeAttributeType(Selectors.getFirstPrimitiveTypes().id);
//         }
//         */
//
//
//         const ret = () => {
//             new SetFieldAction(dPackage, "classifiers", U.removeFromList(dPackage.classifiers, dEnumerator.id));
//             //new SetRootFieldAction("enumerators", U.removeFromList(Selectors.getAllEnumerators(), dEnumerator.id));
//             new DeleteElementAction(dEnumerator);
//         }
//         ret();
//
//         return ret;
//     }
//
// }
//
// @RuntimeAccessible
// export class LObject extends MixOnlyFuncs(DObject, LNamedElement) {
//     static structure: typeof DObject;
//     static singleton: LObject;
// }
//
// @RuntimeAccessible
// export class LValue extends MixOnlyFuncs(DValue, LModelElement) {
//     static structure: typeof DValue;
//     static singleton: LValue;
// }
//
// @RuntimeAccessible
// export class LModel extends MixOnlyFuncs(DModel, LNamedElement) {
//     static structure: typeof DModel;
//     static singleton: LModel;
//
//     constructor() {
//         super();
//     }
//
//     // @ts-ignore
//     parent!: never;
//     // @ts-ignore
//     packages!: LPackage[];
//     // @ts-ignore
//     childrens!: (LAnnotation | LPackage)[];
//
//     get_childrens_idlist(context: LogicContext<DModel>): Pointer<DAnnotation | DModel, 1, 'N'> {
//         return [...super.get_childrens_idlist(context), ...context.data.packages]; }
//
//     get_packages(context: LogicContext<DModel>): LPackage[] {
//         return context.data.packages.map(p => MyProxyHandler.wrap(p)); }
//
//     get_delete(context: LogicContext<DModelElement>): () => void {
//         const ret = () => { alert("todo delete LModel"); }
//         return ret;
//     }
//
// }
