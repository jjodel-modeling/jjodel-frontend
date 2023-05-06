import {initializeApp} from "firebase/app";
import {doc, collection, getFirestore, setDoc, updateDoc, CollectionReference, QueryFieldFilterConstraint, where, Query, query, getDocs, or} from '@firebase/firestore';
import {Env} from "./environment";
import {
    CreateElementAction,
    DModel,
    DModelElement,
    DPackage,
    DPointerTargetable, Pointer,
    PrimitiveType,
    Selectors, SetFieldAction, SetRootFieldAction
} from "../joiner";

type OPERATOR = '=='|'!=';
export interface CONSTRAINT {field: string, operator: OPERATOR, value: any}

export class Firebase {
    static config = {
        apiKey: Env.apiKey,
        authDomain: Env.authDomain,
        projectId: Env.projectId,
        storageBucket: Env.storageBucket,
        messagingSenderId: Env.messagingSenderId,
        appId: Env.appId
    };

    static app = initializeApp(Firebase.config);
    static db = getFirestore(Firebase.app);

    static async select(collectionName: string, constraints?: CONSTRAINT|CONSTRAINT[], isAND: boolean = true): Promise<any> {
        const DOC = collection(Firebase.db, collectionName);
        if(constraints) {
            const _constraints = (Array.isArray(constraints)) ? constraints : [constraints];
            if(_constraints.length > 0) return await Firebase._selectWithConditions(DOC, _constraints, isAND);
            else return await Firebase._selectWithoutConditions(DOC);
        }
        else return await Firebase._selectWithoutConditions(DOC);
    }

    private static async _selectWithConditions(DOC: CollectionReference, constraints: CONSTRAINT[], isAND: boolean): Promise<any> {
        const objects: any = [];
        const conditions: QueryFieldFilterConstraint[] = [];
        for(let constraint of constraints) {
            const field = constraint.field;
            const operator = constraint.operator;
            const value = constraint.value;
            conditions.push(where(String(field), operator, value));
        }
        let q: Query;
        if(isAND) q = query(DOC, ...conditions);
        else q = query(DOC, or(...conditions));
        const qs = await getDocs(q);
        qs.forEach((doc) => {objects.push({...doc.data()})});
        return objects;
    }

    private static async _selectWithoutConditions(DOC: CollectionReference): Promise<any> {
        const objects: any = [];
        const q = query(DOC); const qs = await getDocs(q);
        qs.forEach((doc) => {objects.push({...doc.data()})});
        return objects
    }

    static async add(collection: string, id: string, obj: any): Promise<void> {
        const DOC = doc(Firebase.db, collection, id);
        await setDoc(DOC, obj,{merge: false});
    }

    static async edit(room: string, field: string, value: any): Promise<void> {
        const collection = 'rooms';
        const DOC = doc(Firebase.db, collection, room);
        await updateDoc(DOC, field, value);
    }

    static async saveAddAction(me: DModel|DPackage|any): Promise<void> {
        const room = Selectors.getRoom(); if(!room) return;
        let action: {[key: string]: PrimitiveType} = {type: 'ADD'}
        switch(me.className) {
            case 'DModel':
                action.classname = me.className;
                action.id = me.id;
                action.name = me.name;
                action.instanceof = me.instanceof;
                action.isMetamodel = me.isMetamodel;
                break;
            case 'DPackage':
                action.classname = me.className;
                action.id = me.id;
                action.father = me.father;
                action.name = me.name;
                action.uri = me.uri;
                action.prefix = me.prefix;
                break;
            default: break;
        }
        const results = await Firebase.select('rooms', {field: 'code', operator: '==', value: room});
        await Firebase.edit(room, 'actions', [...results[0].actions, action]);
    }

    static async saveEditAction(me: string, field: string, val: any, accessModifier: '+='|'', isPointer: boolean): Promise<void> {
        const room = Selectors.getRoom(); if(!room) return;
        let action: {[key: string]: PrimitiveType} = {type: 'EDIT'}
        action.me = me;
        action.field = field;
        action.val = val;
        action.accessModifier = accessModifier;
        action.isPointer = isPointer;
        const results = await Firebase.select('rooms', {field: 'code', operator: '==', value: room});
        await Firebase.edit(room, 'actions', [...results[0].actions, action]);
    }

    static loadAction(action: {[key: string]: PrimitiveType}): void {
        switch(action.type) {
            case 'ADD': return Firebase.loadAddAction(action);
            case 'EDIT': return Firebase.loadEditAction(action);
            default: return;
    }
    }

    private static loadAddAction(action: {[key: string]: PrimitiveType}): void {
        const state = Selectors.getState();
        const obj = state.idlookup[String(action.id)];
        if(obj) return;
        let me!: DModelElement;
        switch (action.classname) {
            case 'DModel': // @ts-ignore
                me = DModel.new(action.name, action.instanceof, action.isMetamodel, false);
                me.id = String(action.id);
                CreateElementAction.new(me);
                SetRootFieldAction.new('m2models', me.id, '+=', true);
                break;
            case 'DPackage': // @ts-ignore
                me = DPackage.new(action.name, action.uri, action.prefix, action.father, false, DModel);
                me.id = String(action.id);
                CreateElementAction.new(me);
                SetFieldAction.new(action.father as Pointer<DModel>, 'packages', me.id, '+=', true);
                break;
            default: break;
        }
    }

    private static loadEditAction(action: {[key: string]: PrimitiveType}): void {
        // @ts-ignore
        SetFieldAction.new(action.me, action.field, action.val, action.accessModifier, action.isPointer);
    }

}
