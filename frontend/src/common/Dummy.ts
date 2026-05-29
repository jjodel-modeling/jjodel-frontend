import {
    DState,
    GObject,
    Pointer,
    LClass,
    LViewPoint,
    Dictionary,
    DocString,
    LogicContext,
    DModelElement,
    LModelElement,
    LNamedElement,
    DClassifier,
    LModel,
    LValue,
    Dependency, DValue, DAnnotation,
} from '../joiner';

import {
    DPointerTargetable,
    DeleteElementAction,
    Log,
    SetFieldAction,
    U,
    SetRootFieldAction,
    TRANSACTION,
    L,
    Uarr,
    Pointers,
    store,
    ShortAttribETypes,
    D,
    Uobj,
    DModel,
    DPackage,
    DClass,
    DEnumerator,
    DEnumLiteral,
    DReference, DAttribute,
    DOperation, DParameter,
    EcoreXmiTags,
} from '../joiner';

import ActivityLogger from '../services/ActivityLogger';
import { ActivityType } from '../types/activity';
import {i} from "vite/dist/node/chunks/moduleRunnerTransport";

export class Dummy {
    static t2mIgnoreKeys = ['id','pointedBy','className'];
    static get_delete(thiss: L, context: any): () => void {
        const lDeleted: L & GObject = context.proxyObject;
        const dDeleted = context.data;
        const dependencies = thiss.get__jjdependencies(context);

        const ret = () => {
            //console.log('0 get_delete() '+(dDeleted as any)?.name, {dData: dDeleted, cn:dDeleted?.className, dependencies});
            const deletedID = dDeleted.id as any;
            if (dDeleted.__readonly) return;
            if (deletedID.indexOf('Pointer_View') !== -1 ) return; // cannot delete default views/viewpoints

            // Log activity for model/metamodel deletion
            if (dDeleted.className === 'DModel') {
                try {
                    const lModel = lDeleted as unknown as LModel;
                    const project = lModel.project;
                    if (project) {
                        const isMetamodel = (dDeleted as any).isMetamodel;
                        ActivityLogger.log({
                            type: isMetamodel ? ActivityType.METAMODEL_DELETED : ActivityType.MODEL_DELETED,
                            projectId: project.id,
                            projectName: project.name || 'Unnamed Project',
                            entityId: deletedID,
                            entityName: (dDeleted as any).name || (isMetamodel ? 'Unnamed Metamodel' : 'Unnamed Model'),
                        });
                    }
                } catch (e) {
                    console.warn('Failed to log delete activity:', e);
                }
            }

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
                if (!pointer) {
                    Log.eDevv('unexpected pointedBy found in delete', {pointer, dependency, dependencies});
                    continue;
                }
                const field = dependency.lastKey;
                const lObj: any = L.wrap(pointer); // the object pointing to the deleted element
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

    static doT2M<THIS extends LNamedElement>(c: LogicContext<any>, thiss: GObject/*<THIS>*/): ((json:GObject)=>THIS) {
        return (json: GObject): THIS => {
            if (!json || typeof json !== 'object') return c.proxyObject as THIS;
            let old = {...json};
            TRANSACTION(thiss.get_name(c) + '.t2m()', () => {
                json = thiss._convertEcoreToJom_m2(json);
                console.log('L'+c.data.className.substring(1)+'.t2m() called.', {d:c.data, j: JSON.parse(JSON.stringify(json)), jj: json, old});
                let childrenToUpdateByID: Dictionary<Pointer,  {json:GObject, l: LModelElement, id: Pointer, k: string}> = {};
                let childrenToUpdateByName: Dictionary<string, {json:GObject, l: LModelElement, id: Pointer, k: string, i: number}> = {};
                let childrenToUpdateBySource: Dictionary<string, {json:GObject, l: LModelElement, id: Pointer, k: string, i: number}> = {};
                let childrenToUpdateByIndex: {json:GObject, l: LModelElement, id: Pointer, k: string, i: number}[] = [];
                let childrenToUpdateByNew: {json:GObject, k:string, i:number}[] = []; // valid unmatch (because by name or id or index it doesn't exist)   -> new
                let childrenToUpdateInvalidMismatches: {json:GObject, k:string, i:number, reason: string}[] = []; // invalid unmatch (2 obj with same name or id conflict) -> skip and warn (debug)
                let unregisteredChildren: {k: string, i: number}[] = []; // stuff not immediately registrable by id or name, stored to be later registered by index
                let registeredMap: WeakMap<GObject, boolean> = new WeakMap<GObject, boolean>();

                // can only fail if: c.data.className === 'DModel' && k is invalid
                // used in [registerByCollection, doChildrenUpdate]
                const getParent = (k: string, gv: GObject): [DModelElement, LModelElement] => {
                    let dparent: DModelElement = null as any;
                    let lparent: LModelElement = null as any;

                    // console.log('t2m children by name getparent', {k, gv, json});
                    if (c.data.className !== 'DModel') {
                        dparent = c.data;
                        lparent = c.proxyObject as LModelElement;
                        return [dparent, lparent];
                    }
                    switch (k) { // model.t2m only collections available in models
                        case 'classes': case 'enumerators': case 'subpackages': case 'annotations':
                            lparent = thiss.get_package(c);
                            if (gv.isPrimitive) return [null, null] as any;
                            if (lparent) { dparent = lparent.__raw; }
                            else {
                                dparent = DPackage.new3({father: c.data.id as Pointer<DModel>}, () => {}, DModel, true);
                                lparent = L.from(dparent);
                            }
                            return [dparent, lparent];
                        case 'packages':
                            dparent = c.data;
                            lparent = c.proxyObject as LModelElement;
                            return [dparent, lparent];
                        default: Log.exx('Unexpected collection found inside model in T2M', {k, c, ecore_object:gv});
                            dparent = null as any;
                            lparent = null as any;
                            return [dparent, lparent];
                    }
                }
                // used in [registerByCollection]
                // uses __childrenToSort
                const getChildrenCollection = (k:string, v: any, gv: GObject, arr: any[], i: number): string => {
                    // from ecore, it can be determined by ecoredatatype mapped to classname
                    let childEcore = gv;
                    // (1) solve xsi types, it help assigning the right collection
                    /* obsolete: ecore properties should be traduced to jom by thiss._convertEcoreToJom_m2()
                    if (!childEcore.className && ECoreClass.xsitype in childEcore) {
                        let xsi = childEcore[ECoreClass.xsitype];
                        if (xsi.indexOf('ecore:E') !== 0) Log.exDevv('unexpected XSI type: ' + xsi, {ecore:gv, childEcore, xsi});
                        delete childEcore[ECoreClass.xsitype];
                        childEcore.className = xsi.substring('ecore:E'.length);
                    }
                    if (ECoreAttribute.eType in childEcore) childEcore.type = U.solveEcoreType(childEcore[ECoreAttribute.eType]);
                    */
                    // (2) try to sort the element in a collection (classes, enumerators...)
                    let collection: string = '';
                    switch (c.data.className) {
                        case 'DClass':
                            assignCollection:
                                switch (childEcore.className?.toLowerCase()) {
                                    case null: case undefined:
                                        if ('containment' in childEcore || 'container' in childEcore || 'aggregation' in childEcore || 'composition' in childEcore){
                                            collection = 'references';
                                            break;
                                        }
                                        if ('exceptions' in childEcore || 'parameters' in childEcore || 'implementation' in childEcore) {
                                            collection = 'operations';
                                            break;
                                        }
                                        if ('type' in childEcore) {// || ECoreAttribute.eType in childEcore || 'eType' in childEcore) {
                                            let type = childEcore.type; // || childEcore[ECoreAttribute.eType] || childEcore.eType;
                                            switch (type) {
                                                case ShortAttribETypes.EVoid:
                                                case ShortAttribETypes.EChar:
                                                case ShortAttribETypes.EString:
                                                case ShortAttribETypes.EDate:
                                                case ShortAttribETypes.EBoolean:
                                                case ShortAttribETypes.EByte:
                                                case ShortAttribETypes.EShort:
                                                case ShortAttribETypes.EInt:
                                                case ShortAttribETypes.ELong:
                                                case ShortAttribETypes.EFloat:
                                                case ShortAttribETypes.EDouble: collection = 'attributes'; break assignCollection;
                                                default:
                                                    if (Pointers.isPointer(type)) {
                                                        let pointedType = D.from(childEcore.type as Pointer<DClassifier>);
                                                        if (pointedType) {
                                                            if (pointedType.className === DClass.cname) collection = 'references'; break assignCollection;
                                                            if (pointedType.className === DEnumerator.cname) collection = 'attributes'; break assignCollection;
                                                            Log.eDevv('eCore unexpected child element type', {json, type, childEcore, parent:c.data, pointedType});
                                                        }
                                                    }
                                                    collection = 'references';
                                                    break assignCollection;
                                            }
                                        }
                                        Log.ee('Skipped invalid eCore subElement, the feature type cannot be determined.\n' +
                                            'It is required to put a type, classname or xsi:type', {childEcore: {...childEcore}, k, v, c, sw:childEcore.className?.toLowerCase()});
                                        break;
                                    case 'dattribute': case 'attribute': collection = 'attributes'; break;
                                    case 'dreference': case 'reference': collection = 'references'; break;
                                    default: Log.eDevv('eCore unexpected child element type', {childEcore, json, gv, c});
                                }
                            break;
                        case 'DPackage': case 'DModel':
                            let cname = childEcore.className?.toLowerCase();
                            switch (cname) {
                                case null: case undefined:
                                    if ('subpackages' in childEcore || 'uri' in childEcore || 'prefix' in childEcore || 'classes' in childEcore || 'enumerators' in childEcore)
                                        collection = (c.data.className === 'DModel') ? 'packages' : 'subpackages';
                                    if ('literals' in childEcore) collection = 'enumerators';
                                    else collection = 'classes';
                                    break;
                                case 'dpackages': case 'dpackage': case 'package': case 'dsubpackages': case 'dsubpackage': case 'subpackage':
                                    collection = (c.data.className === 'DModel') ? 'packages' : 'subpackages';
                                    break;
                                case 'dclasses': case 'dclass': case 'class': collection = 'classes'; break;
                                case 'denumerators': case 'denumerator': case 'enumerator': case 'enum': case 'denum': collection = 'enumerators'; break;
                                default:/*
                                                    if (c.data.className !== 'DModel') {
                                                        Log.eDevv('eCore unexpected child element type', {childEcore, json, gv, parent:c});
                                                        break;
                                                    }
                                                    let e = childEcore as DPackage;
                                                    if (cname.indexOf('package')>=0 || e.uri || e.prefix || e.classes || e.enumerators) collection = 'packages';
                                                    else */
                                    Log.exx('T2M Unexpected classname "'+childEcore.className+'"found as children of "'+c.data.className+'"', {childEcore, json, data:c.data});
                                    break;
                            }
                            break;
                        case 'DEnumerator': collection = 'literals'; break;
                        case 'DOperation': collection = 'parameters'; break;
                        case 'DObject': collection = 'features'; break;
                        default:
                            Log.eDevv('eCore ambiguous child collection found in a leaf element', {childJson:json, k, v, parent:c.data});
                            break;
                    }
                    if (collection) {
                        // if (!Array.isArray(json[collection])) json[collection] = [];
                        // json[collection].push(childEcore);
                        k = collection;
                    }

                    // console.log('convert delete children', {gv:JSON.parse(JSON.stringify(gv)), k, json:JSON.parse(JSON.stringify(json)), arr, i});
                    // move element from mixed collection (__childrenToSort) to existing proper collection
                    if (k !== '__childrenToSort') {
                        if (!json[k]) json[k] = [];
                        else if (!Array.isArray(json[k])) json[k] = ([json[k]]);
                        json[k].push(gv);
                        arr[i] = undefined as any; // delete from old ambiguous collection 'children'
                    }
                    Log.e(!collection || collection === '__childrenToSort', "T2M failed to find sublement collection: ", {k, v, json, arr, i});
                    return collection || '';
                }

                (window as any).__debugt2m_getChildrenCollection = getChildrenCollection;

                // populates all 3 collections "childrenToUpdateBy"
                const registerChildren = (k: string) => {
                    let type = !json ? 'null' : typeof json;
                    if (type !== 'object' && !Pointers.isPointer(json)) {
                        Log.ee('invalid T2M transformation, attempted to store a ' + type + ' inside ' + k, {k, json, type});
                        // childrenToUpdateInvalidMismatches.push({k, i:-1, json});
                        return;
                    }
                    let v = json[k];
                    let arr: (Pointer|D|L)[] = Array.isArray(v) ? v : [v];
                    let i: number = -1;
                    // if (v) console.log("register children", {k, v, json, arr});
                    for (let v of arr) {
                        ++i;
                        if (!v) {
                            childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'nullish element'});
                            continue;
                        }
                        (v as GObject) = arr[i] = thiss._convertEcoreToJom_m2(v);
                        let type = v === null ? 'null' : (Array.isArray(v) ? 'subarray' : typeof v);
                        let isPointer = Pointers.isPointer(v);
                        if (type !== 'object' && !isPointer) {
                            Log.ee('invalid T2M transformation, attempted to store a ' + type + ' inside ' + k, {k, json, v, type});
                            childrenToUpdateInvalidMismatches.push({k, i, json:v, reason:'wrong element type'});
                            continue;
                        }
                        // add ptr
                        let gv: GObject = v;
                        // let isD: boolean = !!(isL || gv.className && gv.id);
                        // let isEcorePointer: boolean = Pointers.isEcorePointer(gv); cannot happen, ecore pointers should only exist in m1
                        let child: LModelElement = null as any;

                        if (isPointer) {
                            let cid = v as any as Pointer<DModelElement>;
                            child = L.fromPointer(cid); //|| L.fromPointer(Pointers.prefix + v);
                            if (childrenToUpdateByID[cid]) {
                                Log.ww('M2T found 2 subelements with the same id within the same container. The second one will be ignored.',
                                    {first: childrenToUpdateByID[cid], second:gv, container: c.proxyObject, containerM2T:json});
                                childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'duplicate id'});
                                continue;
                            }
                            if (child) childrenToUpdateByID[cid] = {json: gv, l: child, id: cid, k};
                            else {} // if the value is a raw invalid pointer (not matching) what i'm gonna do? for now ignore/skip it.
                            registeredMap.set(child, true);
                            continue; // valid, completed registration
                        }
                        /*else if (gv.__isProxy) {
                            child = v.r as any;
                            if (child) childrenToUpdate[child.id] = {l: child, id: child.id, by:'id'};
                            continue; // no need to proceed with t2m, a L-object is already updated, i'm just moving it
                        }*/

                        // match priority (1) by id
                        if (gv.id) {
                            child = L.fromPointer(gv.id) || L.fromPointer(Pointers.prefix + gv.id);
                            if (!child) {
                                // console.warn("doChildrenupdate", {k, i, json: v, src:"id"});
                                childrenToUpdateByNew.push({k, i, json:v});
                                continue; // valid, new element
                            }
                            let cid = child.id;
                            if (childrenToUpdateByID[cid]) {
                                Log.ww('M2T found 2 subelements with the same id within the same container. The second one will be ignored.',
                                    {first: childrenToUpdateByID[cid], second:gv, container: c.proxyObject, containerM2T:json});
                                childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'duplicate id'});
                                continue;
                            }
                            childrenToUpdateByID[cid] = {json: gv, l: child, id: cid, k};
                            registeredMap.set(child, true);
                            continue; // valid, completed registration
                        }

                        // match priority (2) by name, if 2 elements have same name, second is fully discarded
                        if (gv.name) {
                            if (childrenToUpdateByName[gv.name] && U.uniqueNames) {
                                Log.ww('M2T found 2 subelements with the same name within the same container. The second one will be ignored.',
                                    {first: childrenToUpdateByName[gv.name], second:gv, container: c.proxyObject, containerM2T:json});
                                childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'duplicate name'});
                                continue;
                            }
                            child = (c.proxyObject as GObject<LValue>)["$"+gv.name];
                            if (child) {
                                childrenToUpdateByName[gv.name] = {json: gv, l: child, id: child.id, k, i};
                                // registeredMap.set(child, true); not yet, first only register by id. then register by name if the target is not already matched by an id.
                                continue; // valid, completed registration
                            }
                            // if name not matching, don't create it yet, it might be renamed -> attempt match by index.
                        }

                        if (gv.source) {
                            let name = gv.source;
                            if (U.uniqueNames && (gv.source && childrenToUpdateBySource[gv.source])) {
                                Log.ww('M2T found 2 annotations with the same name within the same container. The second one will be ignored.',
                                    {first: childrenToUpdateBySource[name], second:gv, container: c.proxyObject, containerM2T:json});
                                childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'duplicate source'});
                                continue;
                            }
                            child = (c.proxyObject as GObject<LValue>).annotations[gv.source];
                            if (child) {
                                childrenToUpdateBySource[name] = {json: gv, l: child, id: child.id, k, i};
                                continue; // valid, completed registration
                            }
                        }
                        // console.log("register children not match", {child, k, i})
                        unregisteredChildren.push({k, i});
                    }
                }

                // calls [childrenToUpdateByName, getParent, registerPhase]
                // uses __childrenToSort
                const registerByCollection = (k0: string, i: number)=> {
                    let child: LModelElement = null as any;
                    let arr_0 = json[k0];
                    let arr = Array.isArray(arr_0) ? arr_0 : (arr_0 ? [arr_0] : []);
                    let gv = arr[i];
                    let k: string = k0;
                    let msg: string = ''
                    let [dparent, lparent] = getParent(k, gv);
                    if (!dparent) {
                        childrenToUpdateInvalidMismatches.push({k, i, json:gv, reason: 'parent element not found'});
                        return;
                    }
                    let oldValues: LModelElement[];
                    oldValues = (lparent as GObject)[k] || [];
                    child = oldValues?.[i];
                    if (!child) {
                        // Log.ee('M2T could not match a children element', {gv:JSON.parse(JSON.stringify(gv)), k0, k, json:JSON.parse(JSON.stringify(json)), arr:JSON.parse(JSON.stringify(arr)), i, oldValues});
                        // childrenToUpdateInvalidMismatches.push({k, i, json:gv, reason: 'match by index failed, old index is not populated'});
                        // console.warn("doChildrenupdate", {k, i, json: gv, src:"collection/index", arr, jjson:json});
                        childrenToUpdateByNew.push({k, i, json:gv});
                        return; // valid, completed registration
                    }
                    if (registeredMap.get(child)) {
                        Log.ee(msg = 'M2T element matched by index matched the same modelElement matched by other elements by name or id.\n' +
                                'Please give id or names to all elements or none.',
                            {gv:JSON.parse(JSON.stringify(gv)), k0, k, json:JSON.parse(JSON.stringify(json)), arr:JSON.parse(JSON.stringify(arr)), i, oldValues});
                        childrenToUpdateInvalidMismatches.push({k, i, json:gv, reason: msg+" i:"+i + " k:"+k});
                        return;
                    }
                    // valid, completed registration
                    registeredMap.set(child, true);
                    childrenToUpdateByIndex.push({json:gv, id: child.id, l:child, k, i});
                }
                // todo: should first solve all childrentosort and sort them, then create the stuff
                // todo2: first match by id, then by name (unmatch if it matched id too and go by 3rd criteria) then by index

                // calls [getparent]
                const doChildrenUpdate = (child: LModelElement | null, k: string, v: GObject, matchedBy: 'id' | 'name' | 'source' | 'index' | 'new') => {
                    let lparent: LModelElement, dparent: DModelElement;
                    // console.log('doChildrenUpdate ' + v.name, {cn: child?.name, child, k, v, matchedBy, json});
                    // should never happen, v should only be pointer or object.
                    if (typeof v !== 'object') { return; }
                    if (true as any /*matchedBy !== 'name' && matchedBy !== 'index'*/) {
                        [dparent, lparent] = getParent(k, v);
                        // if exist in another container, change parent.
                        {// change parent block
                            if (Pointers.isPointer(v)) {
                                child = L.from(v);
                                if (child) (child as any as LModelElement).father = dparent.id as any;
                                return; // if collection contains a pointer, just change parent without updating anything (there isn't a json for it anyway)
                            }
                            else if (child && Pointers.from((child as any as LModelElement).father) !== dparent.id) (child as any as LModelElement).father = dparent.id as any;
                        }
                    } else {
                        dparent = c.data;
                        lparent = c.proxyObject as LModelElement;
                    }
                    // if does not exist, create subelement
                    if (!dparent) return; // cannot proceed
                    if (!child) {
                        if (matchedBy !== 'new') {
                            Log.eDevv('Element incorrectly matched, assumed to be matched by ' + matchedBy+ ' but no value found.', {matchedBy, child, k, v});
                            return;
                        }
                        let ptrs = {
                            id: Pointers.from(v) as any as Pointer<any>,
                            father: dparent.id as (Pointer<any> | undefined),
                            'instanceof': undefined
                        };
                        let callback: (d: any) => void = (d: DModelElement) => {};
                        let d: DModelElement = null as any;
                        console.log('m2t create subelement', {ptrs, v, thisData:c.data, dparent});
                        // try to automatically determine the holding collection (class, enumerator or attrib, reference
                        switch (k) {
                            default: Log.ee('eCore unexpected child collection found', {k, c, json}); break;
                            case 'packages': d = DPackage.new3(ptrs, callback, DModel, true); break;
                            case 'subpackages': d = DPackage.new3(ptrs, callback, DPackage, true); break;
                            case 'classes':
                                if (json.isPrimitive) { delete ptrs.father; }
                                d = DClass.new3(ptrs, callback, true);
                                break;
                            case 'enumerators': d = DEnumerator.new3(ptrs, callback, true); break;
                            case 'literals': d = DEnumLiteral.new3(ptrs, callback, true); break;
                            case 'references': d = DReference.new3(ptrs, callback, true); break;
                            case 'attributes': d = DAttribute.new3(ptrs, callback, true); break;
                            case 'operations': d = DOperation.new3(ptrs, callback, true); break;
                            case 'parameters': d = DParameter.new3(ptrs, callback, true); break;
                            case 'annotations': d = DAnnotation.new3(ptrs, callback, true); break;
                        }
                        // console.log('M2 L'+c.data.className.substring(1)+'.t2m()', {d, v: JSON.parse(JSON.stringify(v))});
                        child = L.from(d); // (this as LValue).get_addObject(c)({});
                    }
                    if (!child) return;
                    child.t2m(v);
                }

                // calls [registerChildren, registerByCollection, doChildrenUpdate]
                // uses __childrenToSort

                // do non-children properties first
                for (let k in json) {
                    let v = json[k];
                    let oldV = (c.data as any)[k];
                    // ignore some unsettable keys / skip non-changes.
                    if (Dummy.t2mIgnoreKeys.includes(k) || EcoreXmiTags.includes(k) || U.isShallowEqual(v, oldV)) continue;
                    // do childs last
                    if (DPointerTargetable.childKeys.includes(k)) continue;


                    // do assignment
                    switch (k) {
                        case '_state': thiss.set_state(v, c); continue;
                        default:
                            if (k[0] === "@") console.error("setting wrong stuff", {d:c.data, k, v, json, old});
                            // @ts-ignore
                            c.proxyObject[k] = v;
                            continue;
                    }
                }

                // do childs last
                for (let k of ['__childrenToSort']) { switch (k) {
                    case '__childrenToSort': // if they got id or name they can be registered right away. not ambiguous.
                        if (Array.isArray(json[k])) for (let i = 0; i < json[k].length; i++) {
                            let child = json[k][i];
                            if (!child) continue;
                            json[k][i] = child = thiss._convertEcoreToJom_m2(child);
                            let collection = getChildrenCollection(k, child, child, json[k], i);

                            //console.log('getChildrenCollection post', {collection, k, child, json, old, i});
                        }
                        break;
                }}

                for (let k of DPointerTargetable.childKeys) { switch (k) {
                    case 'annotations':
                        // todo
                        continue;
                    case '__childrenToSort': // if they got id or name they can be registered right away. not ambiguous.
                    case 'packages': case 'subpackages': case 'classes': case 'enumerators':
                    case 'attributes': case 'references': case 'operations': case 'parameters': case 'literals':
                        registerChildren(k);
                        break;
                }}

                // uses [registerByCollection]
                const registerPhase = ()=> {
                    // checks if there is an ambiguous match between id and name, to move it to ambiguous unregistered collection
                    /*console.log('childrenToUpdateByName, register phase ' + c.data.name, {
                        childrenToUpdateByName_pre: {...childrenToUpdateByName},
                        unregisteredChildren_pre: [...unregisteredChildren],
                    })*/
                    for (let name in childrenToUpdateByName) {
                        let l = childrenToUpdateByName[name].l;

                        // can happen if there is a json entry with id, and another with name without id, but the name resolves to the same id as the first.
                        // eg: [{id: "x"}, {name: "xobj"}] -> are both resolving to {className: "DObject", id: "x", name: "xobj"}
                        if (!childrenToUpdateByID[l.id]) {
                            let l = childrenToUpdateByName[name].l;
                            registeredMap.set(l, true);
                            continue; // ok, no conflict
                        }
                        // conflict: adds it to list childrenToUpdateByIndex
                        let k = childrenToUpdateByName[name].k;
                        let i = childrenToUpdateByName[name].i;
                        delete childrenToUpdateByName[name];
                        unregisteredChildren.push({k, i});
                    }
                    for (let name in childrenToUpdateBySource) {
                        let l = childrenToUpdateBySource[name].l;
                        if (!childrenToUpdateByID[l.id]) {
                            let l = childrenToUpdateBySource[name].l;
                            registeredMap.set(l, true);
                            continue; // ok, no conflict
                        }
                        // conflict: adds it to list childrenToUpdateByIndex
                        let k = childrenToUpdateBySource[name].k;
                        let i = childrenToUpdateBySource[name].i;
                        delete childrenToUpdateBySource[name];
                        unregisteredChildren.push({k, i});
                    }
                    for (let e of unregisteredChildren) {
                        registerByCollection(e.k, e.i); // todo: remove all delete from json's subelement collections or get by index fails.
                    }/*
                    console.log('childrenToUpdateByName, register phase end ' + c.data.name, {
                        childrenToUpdateByName_post: {...childrenToUpdateByName},
                        unregisteredChildren_post: [...unregisteredChildren],
                    })*/
                }
                registerPhase();

                // uses [doChildrenUpdate]
                // final: actually handle childrens
                for (let id in childrenToUpdateByID) {
                    let json = childrenToUpdateByID[id].json;
                    let l = childrenToUpdateByID[id].l;
                    let k = childrenToUpdateByID[id].k;
                    doChildrenUpdate(l, k, json, 'id');
                }
                for (let name in childrenToUpdateByName) {
                    let json = childrenToUpdateByName[name].json;
                    let l = childrenToUpdateByName[name].l;
                    let k = childrenToUpdateByName[name].k;
                    doChildrenUpdate(l, k, json, 'name');
                }
                for (let name in childrenToUpdateBySource) {
                    let json = childrenToUpdateBySource[name].json;
                    let l = childrenToUpdateBySource[name].l;
                    let k = childrenToUpdateBySource[name].k;
                    doChildrenUpdate(l, k, json, 'source');
                }
                for (let elem of childrenToUpdateByIndex) {
                    let json = elem.json;
                    let l = elem.l;
                    let k = elem.k;
                    doChildrenUpdate(l, k, json, 'index');
                }
                for (let elem of childrenToUpdateByNew) {
                    let json = elem.json;
                    let k = elem.k;
                    doChildrenUpdate(null, k, json, 'new');
                }

            })
            return c.proxyObject as THIS;
        }
    }
}
