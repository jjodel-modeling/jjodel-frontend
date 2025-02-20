import {
    DeleteElementAction,
    DState,
    GObject,
    Log,
    LPointerTargetable, Pointer,
    SetFieldAction, U,
    SetRootFieldAction, TRANSACTION, DPointerTargetable, LViewPoint
} from '../joiner';
import {Dependency} from "../joiner/types";

export class Dummy {
    protected static get_dependencies(context: any): () => Dependency[] {
        const data = context.data;
        const dependencies: Dependency[] = [];
        const ret = () => {
            for (let pointedBy of data.pointedBy) {
                const raw = pointedBy.source.split('.');
                let root = raw[0];
                const obj = raw[1] || '';
                let field = raw[2] || '';

                // Delete chars from end that are not in [azAZ].
                const regex = /[^a-zA-Z]+$/;
                root = root.replace(regex, '');
                field = field.replace(regex, '');
                // damiano: this is likely to cause a bug for sure somewhere when a key ends with "s" but is not an array. keep in mind when naming variables.
                let op: ''|'-=' = (field && field.endsWith('s')) ? '-=' : '';
                if(!field && root.endsWith('s')) op = '-=';

                const dependency: Dependency = {root: root  as keyof DState, obj, field: field as keyof DPointerTargetable, op};
                if(!dependencies.includes(dependency)) dependencies.push(dependency);
            }
            return dependencies
        }
        return ret;
    }
    static get_delete(thiss: any, context: any): () => void {
        const lData: LPointerTargetable & GObject = context.proxyObject;
        const dData = context.data;
        const dependencies = Dummy.get_dependencies(context)();
        console.log('get_delete '+(dData as any).name, {dData, dependencies});

        const ret = () => {
            console.log('0 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className, dependencies});
            SetRootFieldAction.new('_lastSelected', undefined, '');
            const dataID = dData.id as any;

            if (dData.id.indexOf('Pointer_View') !== -1 ) return; // cannot delete default views/viewpoints
            if (dData.__readonly) return;
            console.log('1 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className, dependencies});
            for (let child of lData.children) {
                child.delete();
                // todo: if a m1-dvalue which conforms to a m2-reference with "containment" is deleted, need to delete also target.
                // maybe better to do through override?
                // child.node?.delete();
            }

            console.log('2 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className});
            // those 2 are exceptions because the pointer is a key in an object instead of a normal value as a field or array member.
            switch (dData.className) {
                case 'DViewElement':
                    SetFieldAction.new(dData.father, 'subViews', dataID, '-=', false);
                    break;
                case 'DViewPoint':
                    let projectid = (lData as LViewPoint)?.project?.id;
                    Log.eDevv('cannot find project id while deleting a viewpoint', {dData, context, dependencies});
                    if (projectid) SetFieldAction.new(projectid, 'viewpoints', dataID, '-=', false);
                    break;
            }

            for (let dependency of dependencies) {
                const root: keyof DState = dependency.root;
                if(root !== 'idlookup') {
                    SetRootFieldAction.new(root, dataID, '-=', false);
                    continue;
                }
                const pointer: Pointer<any>|null = dependency.obj; // the pointing element (delete a DClass => DAttribute)
                const field = dependency.field;
                const lObj: any = LPointerTargetable.wrap(pointer);
                if (!pointer || !lObj) continue;
                const dObj: any = lObj.__raw;
                switch (field as string) {
                    /* on '-=' pointedby would be removed from the element we are deleting, so it is irrelevant */
                    default:
                        Log.eDevv('Unexpected case in delete:', field, lData);
                        break;
                    case 'metamodels':
                        console.log('mm filter', {newmm:dObj.metamodels.filter((id: Pointer) => id !== dataID), oldmm:dObj.metamodels, dataID})
                        lObj.metamodels = dObj.metamodels.filter((id: Pointer) => id !== dataID);
                        break;
                    case 'dependencies':
                        lObj.dependencies = dObj.dependencies.filter((id: Pointer) => id !== dataID);
                        break;
                    case 'values':
                        lObj.values = dObj.values.filter((o: any) => o !== dataID);
                        break;
                    case 'type':
                        switch (dObj.className) {
                            case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;
                            case 'DReference': case 'DOperation':
                                // would be nice to set dObj.extends[0] instead but i cannot tell if it was deleted too.
                                // dobj.father instead is safe as even if it's deleted it does not matter as it will delete the feature together
                                lObj.type = dObj.father;
                                break;
                        }
                        break;
                    case 'model':
                        if(dObj.className === 'DPackage') {
                            lObj.father[field] = lObj.father.__raw[field].filter((id: any) => id != dataID);
                            continue;
                        } else {
                            /* Node is deleted in nodes.delete() */
                            continue;
                        }
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
                        lObj[field] = dObj[field].filter((id: any) => id != dataID);
                        continue;
                    case 'instanceof':
                        lObj.delete();
                        continue;
                    /* No operations required (children) */
                    case 'father':
                    case 'subElements':
                    case 'annotations':
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

            console.log('3 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className});
            if (lData.nodes) lData.nodes.map((node: any) => node.delete());
            console.log('4 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className});
            SetRootFieldAction.new('ELEMENT_DELETED', dataID, '+=', false); // here no need to IsPointer because it only affects Transient stuff
            //U.sleep(1).then(() => SetRootFieldAction.new(`idlookup.${dataID}`, undefined, '', false));
            //SetRootFieldAction.new(`idlookup.${dataID}`, undefined, '', false);
            console.log('5 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className});
            DeleteElementAction.new(dData.id);
        };
        console.log('00 get_delete '+(dData as any)?.name, {dData, cn:dData?.className});
        return () => {
            console.log('00 get_delete() '+(dData as any)?.name, {dData, cn:dData?.className});
            TRANSACTION('delete ' + thiss.get_name(context), ()=>{
                console.log('0000 get_delete '+(dData as any)?.name, {dData, cn:dData?.className}); ret(); })
        }
    }
}
