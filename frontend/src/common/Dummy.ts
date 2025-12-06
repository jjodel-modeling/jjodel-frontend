import type {
    DState,
    GObject,
    Pointer,
    LClass,
    LViewPoint,
    Dictionary,
    DocString,
    DModelElement,
    LValue,
    LModelElement, LogicContext,
    LNamedElement,
    DClassifier,
    } from '../joiner';
import {
    DPackage,
    DModel,
    DClass,
    DEnumerator,
    DEnumLiteral,
    DReference,
    DAttribute, DOperation, DParameter,
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
} from '../joiner';

export class Dummy {

    static get_delete(thiss: L, context: any): () => void {
        const lDeleted: L & GObject = context.proxyObject;
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
            let old = json;
            TRANSACTION(thiss.get_name(c) + '.t2m()', () => {
                json = thiss._convertEcoreToJom_m2(json);
                console.log('L'+c.data.className.substring(1)+'.t2m() called.', {d:c.data, j: JSON.parse(JSON.stringify(json)), old});
                let childrenToUpdateByID: Dictionary<Pointer,  {json:GObject, l: LModelElement, id: Pointer, k: string}> = {};
                let childrenToUpdateByName: Dictionary<string, {json:GObject, l: LModelElement, id: Pointer, k: string, i: number}> = {};
                let childrenToUpdateByIndex: {json:GObject, l: LModelElement, id: Pointer, k: string, i: number}[] = [];
                let childrenToUpdateByNew: {json:GObject, k:string, i:number}[] = []; // valid unmatch (because by name or id or index it doesn't exist)   -> new
                let childrenToUpdateInvalidMismatches: {json:GObject, k:string, i:number, reason: string}[] = []; // invalid unmatch (2 obj with same name or id conflict) -> skip and warn (debug)
                let unregisteredChildren: {k: string, i: number}[] = []; // stuff not immediately registrable by id or name, stored to be later registered by index
                let registeredMap: WeakMap<GObject, boolean> = new WeakMap<GObject, boolean>();

                // can only fail if: c.data.className === 'DModel' && k is invalid
                const getParent = (k: string, gv: GObject): [DModelElement, LModelElement] => {
                    let dparent: DModelElement = null as any;
                    let lparent: LModelElement = null as any;
                    if (c.data.className !== 'DModel') {
                        dparent = c.data; lparent = c.proxyObject as LModelElement;
                        return [dparent, lparent];
                    }
                    switch(k) { // model.t2m only collections available in models
                        case 'classes': case 'enumerators': case 'subpackages': case 'annotations':
                            lparent = thiss.get_package(c);
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
                const getChildrenCollection = (k:string, v: any, gv: GObject, arr: any[], i: number): string => {
                    // from ecore, it can be determined by ecoredatatype mapped to classname
                    let childEcore = gv;
                    // (1) solve xsi types, it help assigning the right collection
                    /*
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
                                                            Log.eDevv('eCore unexpected child element type', {json, childEcore, parent:c.data, pointedType});
                                                        }
                                                    }
                                                    collection = 'references';
                                                    break assignCollection;
                                            }
                                        }
                                        Log.ee('Skipped invalid eCore subElement, the feature type cannot be determined.\nIt is required to put a type, classname or xsi:type', {childJson:json, k, v, parent:c});
                                        break;
                                    case 'DAttribute': case 'attribute': collection = 'attributes'; break;
                                    case 'DReference': case 'reference': collection = 'references'; break;
                                    default: Log.eDevv('eCore unexpected child element type', {childEcore, json, gv, parent:c});
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
                        default:
                            Log.eDevv('eCore ambiguous child collection found in a leaf element', {childJson:json, k, v, parent:c.data});
                            break;
                    }
                    if (collection) {
                        // if (!Array.isArray(json[collection])) json[collection] = [];
                        // json[collection].push(childEcore);
                        k = collection;
                    }

                    console.log('convert delete children', {gv:JSON.parse(JSON.stringify(gv)), k, json:JSON.parse(JSON.stringify(json)), arr, i});
                    // move element from mixed collection (__childrenToSort) to existing proper collection
                    if (k !== '__childrenToSort') {
                        if (!json[k]) json[k] = [];
                        else if (!Array.isArray(json[k])) json[k] = ([json[k]]);
                        json[k].push(gv);
                        arr[i] = undefined as any; // delete from old ambiguous collection 'children'
                    }
                    return collection || '';
                }

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
                        if (gv.id) { // match priority (1) by id
                            child = L.fromPointer(gv.id) || L.fromPointer(Pointers.prefix + gv.id);
                            if (!child) {
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
                        if (gv.name) { // match priority (2) by name, if 2 elements have same name, second is fully discarded
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
                        unregisteredChildren.push({k, i});
                    }
                }

                const registerByCollection = (k0: string, i: number)=> {
                    let child: LModelElement = null as any;
                    let v = json[k0];
                    let arr = Array.isArray(v) ? v : (v ? [v] : []);
                    let gv = arr[i];
                    let k: string = k0;
                    let msg: string = ''
                    let [dparent, lparent] = getParent(k, gv);
                    if (!dparent) {
                        childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'parent element not found'});
                        return;
                    }
                    let oldValues: LModelElement[];
                    // if unsorted, assign collection
                    if (!child && k === '__childrenToSort') {
                        console.log('convert get old index', {gv, k0, json, old_i:i, oldColl:json[k0]});
                        k = getChildrenCollection(k, v, gv, arr, i);
                        i = json[k].indexOf(gv);
                        if (!k || k === '__childrenToSort' || i === -1) {
                            Log.ee(msg = 'M2T could not disambiguate a children element in ambiguous collection (eg: classifiers, features, children)', {
                                gv:JSON.parse(JSON.stringify(gv)), k, json:JSON.parse(JSON.stringify(json)), arr:JSON.parse(JSON.stringify(arr)), i,
                                collection:json[k], oldValues:(lparent as GObject)[k] || []});
                            childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: msg+" i:"+i + " k:"+k});
                            return;
                        }
                        console.log('convert get new index', {k, new_i:i, newColl:json[k], child});
                    }
                    oldValues = (lparent as GObject)[k] || [];
                    child = oldValues?.[i];
                    if (!child) {
                        // Log.ee('M2T could not match a children element', {gv:JSON.parse(JSON.stringify(gv)), k0, k, json:JSON.parse(JSON.stringify(json)), arr:JSON.parse(JSON.stringify(arr)), i, oldValues});
                        // childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: 'match by index failed, old index is not populated'});
                        childrenToUpdateByNew.push({k, i, json:v});
                        return; // valid, completed registration
                    }
                    if (registeredMap.get(child)) {
                        Log.ee(msg = 'M2T element matched by index matched the same modelElement matched by other elements by name or id.\n' +
                                'Please give id or names to all elements or none.',
                            {gv:JSON.parse(JSON.stringify(gv)), k0, k, json:JSON.parse(JSON.stringify(json)), arr:JSON.parse(JSON.stringify(arr)), i, oldValues});
                        childrenToUpdateInvalidMismatches.push({k, i, json:v, reason: msg+" i:"+i + " k:"+k});
                        return;
                    }
                    // valid, completed registration
                    registeredMap.set(child, true);
                    childrenToUpdateByIndex.push({json:gv, id: child.id, l:child, k, i});
                }
                // todo: should first solve all childrentosort and sort them, then create the stuff
                // todo2: first match by id, then by name (unmatch if it matched id too and go by 3rd criteria) then by index
                const doChildrenUpdate = (child: LModelElement | null, k: string, v: GObject) => {
                    // if exist in another container, change parent.
                    let [dparent, lparent] = getParent(k, v);
                    {// change parent block
                        if (Pointers.isPointer(v)) {
                            child = L.from(v);
                            if (child) (child as any as LModelElement).father = dparent.id as any;
                            return; // if collection contains a pointer, just change parent without updating anything (there isn't a json for it anyway)
                        }
                        else if (child && Pointers.from((child as any as LModelElement).father) !== dparent.id) (child as any as LModelElement).father = dparent.id as any;
                    }
                    // should never happen, v should only be pointer or object.
                    if (typeof v !== 'object') { return; }

                    // if does not exist, create subelement
                    if (!dparent) return; // cannot proceed
                    if (!child) {
                        let ptrs = {id: Pointers.from(v) as any as Pointer<any>, father: dparent.id as Pointer<any>, 'instanceof': undefined};
                        let callback: (d: any) => void = (d: DModelElement) => {};
                        let d: DModelElement = null as any;
                        console.log('m2t create subelement', {ptrs, v, thisData:c.data, dparent});
                        // try to automatically determine the holding collection (class, enumerator or attrib, reference
                        switch (k) {
                            default: Log.ee('eCore unexpectd child collection found', {k, c, json}); break;
                            case 'packages': d = DPackage.new3(ptrs, callback, DModel, true); break;
                            case 'subpackages': d = DPackage.new3(ptrs, callback, DPackage, true); break;
                            case 'classes': d = DClass.new3(ptrs, callback, true); break;
                            case 'enumerators': d = DEnumerator.new3(ptrs, callback, true); break;
                            case 'literals': d = DEnumLiteral.new3(ptrs, callback, true); break;
                            case 'references': d = DReference.new3(ptrs, callback, true); break;
                            case 'attributes': d = DAttribute.new3(ptrs, callback, true); break;
                            case 'operations': d = DOperation.new3(ptrs, callback, true); break;
                            case 'parameters': d = DParameter.new3(ptrs, callback, true); break;
                        }
                        console.log('M2 L'+c.data.className.substring(1)+'.t2m()', {d, v: JSON.parse(JSON.stringify(v))});
                        child = L.from(d); // (this as LValue).get_addObject(c)({});
                    }
                    if (!child) return;
                    child.t2m(v);
                }

                // do other properties first
                for (let k in json) {
                    let v = json[k];
                    switch (k) {
                        case 'id':
                        case 'pointedBy':
                        case 'className': continue;
                    }
                    let oldV = (c.data as any)[k];
                    switch (typeof v){
                        default:
                            if (v === oldV) continue;
                            break;
                        case 'object':
                            // if (Array.isArray(v)) { U.arrayDifference() }
                            let diff = Uobj.objdiff(v, oldV, false, false);
                            if (diff.added.length + diff.changed.length/* + diff.removed.length*/ === 0) continue;
                            break;
                        case 'function': if (v.toString() === oldV.toString()) continue;
                    }

                    switch (k) {
                        case '_state': thiss.set_state(v, c); continue;

                        default:
                            // @ts-ignore
                            c.proxyObject[k] = v;
                            continue;
                    }
                }
                // do childs last
                const childKeys = ['annotations', '__childrenToSort', 'packages', 'subpackages', 'classes', 'enumerators',
                    'attributes', 'references', 'operations', 'parameters', 'literals'];
                for (let k of childKeys) {
                    switch (k) {
                        case 'annotations':
                            // todo
                            continue;
                        case '__childrenToSort': // if they got id or name they can be registered right away. not ambiguous.
                        case 'packages': case 'subpackages': case 'classes': case 'enumerators':
                        case 'attributes': case 'references': case 'operations': case 'parameters': case 'literals':
                            registerChildren(k);
                            break;
                    }
                }

                // checks if there is an ambiguous match between id and name, to move it to ambiguous unregistered collection
                for (let name in childrenToUpdateByName) {
                    let l = childrenToUpdateByName[name].l;
                    if (!childrenToUpdateByID[l.id]) {
                        let l = childrenToUpdateByName[name].l;
                        registeredMap.set(l, true);
                        continue; // ok, no conflict
                    }
                    // conflict: adds it to list childrenToUpdateByIndex
                    let k = childrenToUpdateByName[name].k;
                    let i = childrenToUpdateByName[name].i;
                    unregisteredChildren.push({k, i});
                }
                for (let e of unregisteredChildren) {
                    registerByCollection(e.k, e.i); // todo: remove all delete from child collections or get by index fails.
                }

                // actually handle childrens mapped by id or name
                for (let id in childrenToUpdateByID) {
                    let json = childrenToUpdateByID[id].json;
                    let l = childrenToUpdateByID[id].l;
                    let k = childrenToUpdateByID[id].k;
                    doChildrenUpdate(l, k, json);
                }
                // handle children mapped by index
                for (let name in childrenToUpdateByName) {
                    let json = childrenToUpdateByName[name].json;
                    let l = childrenToUpdateByName[name].l;
                    let k = childrenToUpdateByName[name].k;
                    doChildrenUpdate(l, k, json);
                }
                for (let elem of childrenToUpdateByIndex) {
                    let json = elem.json;
                    let l = elem.l;
                    let k = elem.k;
                    doChildrenUpdate(l, k, json);
                }
                for (let elem of childrenToUpdateByNew) {
                    let json = elem.json;
                    let k = elem.k;
                    doChildrenUpdate(null, k, json);
                }

            })
            return c.proxyObject as THIS;
        }
    }
}
