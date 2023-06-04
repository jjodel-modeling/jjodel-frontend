import {initializeApp} from "firebase/app";
import {
    collection,
    CollectionReference,
    doc,
    getDocs,
    getFirestore,
    or,
    Query,
    query,
    QueryFieldFilterConstraint,
    setDoc,
    updateDoc,
    where
} from '@firebase/firestore';
import {Env} from "./environment";
import firebase from "firebase/compat";
import { GObject } from "../joiner";

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
        qs.forEach((doc: GObject) => {objects.push({...doc.data()})});
        return objects;
    }

    private static async _selectWithoutConditions(DOC: CollectionReference): Promise<any> {
        const objects: any = [];
        const q = query(DOC); const qs = await getDocs(q);
        qs.forEach((doc: GObject) => {objects.push({...doc.data()})});
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

    static async addAction(room: string, action: JSON): Promise<void> {
        const collection = 'rooms';
        const DOC = doc(Firebase.db, collection, room);
        await updateDoc(DOC, 'actions', firebase.firestore.FieldValue.arrayUnion(action));
    }

}
