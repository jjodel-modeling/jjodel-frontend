import {
    LAttribute,
    LClass,
    DClass,
    LClassifier,
    LEnumerator,
    LPointerTargetable,
    LReference,
    MyProxyHandler,
    Pointer,
    RuntimeAccessible,
    U,
    DPointerTargetable,
    LPackage,
    SetRootFieldAction,
    Selectors,
    LEnumLiteral,
    LModelElement,
    DeleteElementAction, LViewElement, LogicContext, SetFieldAction
} from "../joiner";

@RuntimeAccessible
export class MDE {
    public static deleteModelElement(lModelElement: LModelElement): void {
        const dFather = lModelElement.father;
        if (dFather) {
            const lFather: LModelElement = MyProxyHandler.wrap(dFather);
            MDE.deleteChild_(lFather, lModelElement);
        }
        for (let dPointer of lModelElement.pointedBy) {
            try {
                const lPointer: LModelElement = MyProxyHandler.wrap(dPointer);
                lPointer.delete();
            } catch (e) {
                console.log(e);
            }
        }
        for (let dPointer of lModelElement.childrens) {
            try {
                const lPointer: LModelElement = MyProxyHandler.wrap(dPointer);
                lPointer.delete();
            } catch (e) {
                console.log(e);
            }
        }
        MDE.deleteModelElement_(lModelElement);
    }
    private static deleteChild_(father: LModelElement, childToRemove: LModelElement): void {
        const newList: string[] = [];
        const field = U.classnameToObjConverter(childToRemove.className);
        if(field) {
            // @ts-ignore
            const children = father[field];
            for(let child of children) {
                if(child !== childToRemove.id) {
                    newList.push(child);
                }
            }
            SetFieldAction.new(father.id, field as any, newList);
        }
    }
    private static deleteModelElement_(lModel: LModelElement) {
        //fix edges
        //todo: find a better way to manage children's delete(quando cancelli una classe o un enum (solo loro possono essere puntati)
        // chiedi conferma e cosa fare con gli attributi che lo puntano (delete cascade or autofix type to superclass or upper generic type))
        const newList: string[] = [];
        let field = U.classnameToRedux(lModel.className);
        if(field) {
            const modelElements = Selectors.getField(field);
            for(let modelElementPointer of modelElements) {
                if(modelElementPointer !== lModel.id) {
                    newList.push(modelElementPointer);
                }
            }
            new SetRootFieldAction(field, newList);
            new DeleteElementAction(lModel.id);
        }
    }
}
