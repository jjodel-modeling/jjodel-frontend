import {
    DeleteElementAction,
    DState,
    GObject,
    Log,
    LPointerTargetable, Pointer,
    SetFieldAction, U,
    SetRootFieldAction, TRANSACTION, DPointerTargetable, LViewPoint, DClass, L, LClass, Uarr, Pointers, store
} from '../joiner';
import {Dependency} from "../joiner/types";

export class Dummy {

    static get_delete(thiss: LPointerTargetable, context: any): () => void {
        const lDeleted: LPointerTargetable & GObject = context.proxyObject;
        const dDeleted = context.data;
        const dependencies = thiss.get__jjdependencies(context);

        const ret = () => {
            //console.log('0 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className, dependencies});
            const deletedID = dDeleted.id as any;
            if (dDeleted.__readonly) return;
            if (deletedID.indexOf('Pointer_View') !== -1 ) return; // cannot delete default views/viewpoints
            SetRootFieldAction.new('_lastSelected', undefined, '');

            // console.log('1 get_delete() '+(dDeleted as any)?.name, {carr: lDeleted.children, dData: dDeleted, cn:dDeleted?.className, dependencies});
            for (let child of lDeleted.children) {
                child?.delete();
                // if a m1-dvalue which conforms to a m2-reference with "containment" is deleted, the target is also deleted because is a "children" of it.
            }

            // those 2 are exceptions because the pointer is a key in an object instead of a normal value as a field or array member.
            switch (dDeleted.className) {
                case 'DViewElement':
                    SetFieldAction.new(dDeleted.father, 'subViews', deletedID, '-=', false);
                    break;
                case 'DViewPoint':
                    let projectid = (lDeleted as LViewPoint)?.project?.id;
                    Log.eDevv('cannot find project id while deleting a viewpoint', {dData: dDeleted, context, dependencies});
                    if (projectid) SetFieldAction.new(projectid, 'viewpoints', deletedID, '-=', false);
                    break;
                case 'DClass':
                    this.dclass(context, thiss);
                    break;
            }

            for (let dependency of dependencies) {

                const root: keyof DState = dependency.firstKey;
                if (root !== 'idlookup') {
                    Log.eDev(root[root.length - 1] !== 's', 'Unexpected root pointedBy found in delete: ', {field: root, context, dependency, dependencies});
                    SetRootFieldAction.new(root, deletedID, '-=', false);
                    continue;
                }
                const pointer: Pointer|undefined = dependency.obj; // the object pointing to the deleted element
                Log.exDev(!pointer, 'unexpected pointedBy found in delete', {pointer, dependency, dependencies});
                if (!pointer) continue;
                const field = dependency.lastKey;
                const lObj: any = LPointerTargetable.wrap(pointer); // the object pointing to the deleted element
                if (!lObj) continue; // already deleted?
                const dObj: any = lObj.__raw;
                //console.log('3 get_delete() '+(dObj as any)?.name + '.' + field, {field, dData: dDeleted, cn:dDeleted?.className});


                switch (field as string) {
                    /* on '-=' pointedby would be removed from the element we are deleting, so it is irrelevant */
                    default:
                        Log.eDevv('Unexpected case in delete: '+field, {dDeleted, '.':'.', field, '=':'=', dObj});
                        break;
                    case 'end': case 'start':
                        // no-op
                        break;
                    case 'extends':
                    case 'extendedBy':/* both handled in this.DClass()
                        // just remove the entry
                        lObj[field as any] = dObj[field as any].filter((id: Pointer)=> !!id && id !== deletedID);
                        break;
                    case 'extends':
                        let superclasses = (dDeleted as DClass).extends;
                        let newArr = dObj[field as any].filter((id: Pointer)=> !!id && id !== deletedID);
                        if (!superclasses.length){
                            newArr.push(...superclasses);
                        }
                        lObj[field as any] = newArr*/
                        break;
                    case 'type':
                        switch (dObj.className) {
                            default: Log.eDevv('unexpected pointer to type:' + dObj.className, {dObj, dDeleted, field}); break;
                            case 'DParameter': case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;
                            case 'DReference': case 'DOperation':
                                // would be nice to set dObj.extends[0] instead but i cannot tell if it was deleted too.
                                // lData.father instead is safe as even if it's deleted it does not matter as it will delete the feature together
                                lObj.type = lDeleted.father;
                                break;
                        }
                        break;

                    case 'subElements':
                    case 'values':
                    case 'packages':
                    case 'subpackages':
                    case 'classifiers':
                    case 'enumerators':
                    case 'literals':
                    case 'classes':
                    case 'attributes':
                    case 'references':
                    case 'operations':
                    case 'parameters':
                    case 'features':
                    case 'instances':
                    case 'objects':
                    case 'annotations':
                    case 'models': // from DProject
                    case 'edgesIn': case 'edgesOut':
                    case 'metamodels':
                    case 'dependencies':
                        /* obj.annotations -> removed element, just remove the entry from the list*/
                        // NB: "models" etc are not from DState.models but from idlookup[someid].models or so, the root arrays are handled above.
                        // console.log('delete() update subcollection '+ field, {dObj:{...dObj}, dDeleted:{...dDeleted}, field});
                        SetFieldAction.new(dObj.id, field, deletedID, '-=', true);
                        /*let oldList = [...dObj[field]];
                        let newList = dObj[field].filter((id: Pointer) => id && id !== deletedID);
                        lObj[field] = newList;*/
                        break;

                    case 'instanceof': // all elements being instance of a removed element are also removed
                        lObj.delete();
                        break;
                    case 'model':
                        // pkg.model --> deleted element should delete but i ignore because is already removed through children
                        /*if (dObj.className === 'DPackage') {
                            //?? lObj.father.model = lObj.father.__raw.model.filter((id: any) => id && id !== deletedID);
                            break;
                        } else {
                            /* Node is deleted in nodes.delete() * /
                            break;
                        }*/
                    case 'father': // obj.father -> deleted element. should be deleted but is already removed through deleted.children
                        break;
                }
                /*
                if ((root === 'idlookup') && obj && field) {
                    console.log('Delete', `SetFieldAction.new('${obj}', '${field}', '${val}', '${op}');`, {dependency});
                    SetFieldAction.new(obj, field, val, op, false);
                } else {
                    console.log('Delete', `SetRootFieldAction.new('${root}', '${val}', '${op}');`);
                    SetRootFieldAction.new(root, val, op, false);
                }
                */
            }

            //console.log('4 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
            if (lDeleted.nodes) lDeleted.nodes.map((node: any) => node.delete());
            //console.log('5 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
            SetRootFieldAction.new('ELEMENT_DELETED', deletedID, '+=', false); // here no need to IsPointer because it only affects Transient stuff
            //U.sleep(1).then(() => SetRootFieldAction.new(`idlookup.${deletedID}`, undefined, '', false));
            //SetRootFieldAction.new(`idlookup.${deletedID}`, undefined, '', false);
            //console.log('6 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
            DeleteElementAction.new(dDeleted.id);
        };
        //console.log('00 get_delete '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
        return () => {
            //console.log('00 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
            TRANSACTION('delete ' + (thiss as any).get_name(context), ()=>{
                // console.log('0000 get_delete '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className});
                ret();
            })
        }
    }

    private static dclass(c: any, thiss: any) {
        let dDeleted = c.data as DClass;
        let lDeleted = c.proxyObject as LClass;
        for (let p of dDeleted.extends){

        }
        let replacementClasses: Pointer<DClass>[] = dDeleted.extends;
        for (let p of lDeleted.extendedBy){
            let l = p; // L.from(p) as LClass;
            if (!l) continue;
            let newValues = l.__raw.extends;
            for (let r of replacementClasses) U.ArrayAdd(newValues, r);
            l.extends = newValues.filter((e) => e && e !== dDeleted.id) as any;
        }
    }
}
