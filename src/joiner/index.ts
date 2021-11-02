import * as jsxtt from 'jsx-transform/lib/jsx.js';
import $$ from 'jquery';
import {ReactNode} from "react";

// true imports for this file (should all be import type
import type { DocString } from './types';


(window as any).$ = $$;
export const $: JQueryStatic = $$;

// import types
//import {$s, GraphPoint, GraphSize, IPoint, ISize, Log, Point, Size, U} from "../common/U";
export {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from "../graph/graphElement/sharedTypes/sharedTypes";

// nb: export type è un export "finto" che esiste solo in compilazione per fare capire a typescript i tipi. permette export di alias con nomi diversi (l'export normale no)
export type {GetPath} from './proxy';
export {windoww} from './types';
export type {Class, Empty, Json, GObject, bool, Dictionary, Proxyfied, Temporary, RawObject, NotFoundv, NotFound, DocString, nbool, nnumber, nstring, Nullable, Pointer, TODO, UnixTimestamp, UObject, IsActually, Function, Function2, InOutParam} from "./types";
export {RuntimeAccessibleClass, RuntimeAccessible, JsType, DPointerTargetable, LPointerTargetable, MyError} from "./classes";
export {getPath, TargetableProxyHandler, MyProxyHandler, MapProxyHandler, LogicContext, MapLogicContext} from './proxy';
// import independent generic modules (only dependent from types and RuntimeAccessible
export {Uarr, CSSParser, DDate, GraphSize, RawVertex, DPoint, GraphPoint, IPoint, ISize, Size, $s, ParseNumberOrBooleanOptions, TagNames, Point, RawGraph, RawEdge, myFileReader, Log, AutocompleteMatch,
    Keystrokes, CSSRuleSorted, ShortAttribETypes, AttribETypes, FileReadTypeEnum, FocusHistoryEntry, LPoint, SelectorOutput, U} from "../common/U";
export {UX} from "../common/UX";


// import domain-specific classes
export {
    DModelElement,
    DModel,
    DValue,
    DNamedElement,
    DObject,
    DEnumerator,
    DEnumLiteral,
    DAttribute,
    DReference,
    DStructuralFeature,
    DClassifier,
    DDataType,
    DClass,
    DParameter,
    DOperation,
    DPackage,
    DTypedElement,
    DAnnotation,
    EJavaObject,
    DFactory_useless_,
} from "../model/dataStructure/modelElement";

console.error('joiner here 3');

export {
    LModelElement,
    LAnnotation,
    LAttribute,
    LClass,
    LClassifier,
    LEnumerator,
    LEnumLiteral, LModel,
    LObject, LOperation,
    LPackage, LParameter, LReference,
    LStructuralFeature, LDataType, LTypedElement, LNamedElement, // DMap, LMap,
    LValue,
} from "../model/logicWrapper/LModelElement";
export {DVertex, defaultVSize, LGraph, DGraph, LVoidVertex, DEdgePoint, LEdgePoint, DVoidVertex, DVoidEdge, LVoidEdge, DEdge, DExtEdge, LExtEdge, LRefEdge, DRefEdge, LEdge, LGraphElement, DGraphElement, LVertex} from "../model/dataStructure/GraphDataElements";

export {GraphDragHandler} from "../graph/vertex/GraphDragHandler";

export {DViewTransientProperties, LViewTransientProperties, DViewPrivateTransientProperties, LViewElement, DViewElement, LViewPrivateTransientProperties} from "../view/viewElement/view";
export {DUser, LUser} from "../model/user/User";
export {Action, CreateElementAction, DeleteElementAction, SetFieldAction, SetRootFieldAction, CompositeAction, ParsedAction, TRANSACTION, BEGIN, ABORT, END} from "../redux/action/action";
export {IStore, DUserState, ModelStore, ViewPointState} from "../redux/store";
export {Selectors} from "../redux/selectors/selectors";
export {reducer, jodelInit} from "../redux/reducer/reducer";
export {store} from "../redux/createStore";



class JSXT_TYPE{
    fromString(str: string, options?:
        {   factory: string,
            spreadFn?:Function,
            unknownTagPattern?:string,
            passUnknownTagsToFactory?:boolean,
            unknownTagsAsString?:boolean,
            arrayChildren?:boolean
        }): DocString<ReactNode, 'compiled code as string, like React.CreateElement(...)'> { return ''; }
    fromFile(path: string, options?:
        {   factory: string,
            spreadFn?:Function,
            unknownTagPattern?:string,
            passUnknownTagsToFactory?:boolean,
            unknownTagsAsString?:boolean,
            arrayChildren?:boolean
        }): DocString<ReactNode, 'compiled code as string, like React.CreateElement(...)'> { return ''; }
    browserifyTransform(...params: any): any {}
    visitor: unknown = null;
}

export const JSXT = jsxtt as any as JSXT_TYPE/*as {
    fromString: (str: string, options?:
        {   factory: string,
            spreadFn?:Function,
            unknownTagPattern?:string,
            passUnknownTagsToFactory?:boolean,
            unknownTagsAsString?:boolean,
            arrayChildren?:boolean
        }) =>string,
    fromFile: (path: string, options?:
        {   factory: string,
            spreadFn?:Function,
            unknownTagPattern?:string,
            passUnknownTagsToFactory?:boolean,
            unknownTagsAsString?:boolean,
            arrayChildren?:boolean
        }) =>string,
    browserifyTransform: unknown | Function,
    visitor: unknown
}*/



export type Event = JQuery.Event;
export type EventBase = JQuery.EventBase;
export type EventHandlerBase<T1, T2> = JQuery.EventHandlerBase<T1, T2>;
export type MouseEventBase = JQuery.MouseEventBase;
export type MouseUpEvent = JQuery.MouseUpEvent;
export type ChangeEvent = JQuery.ChangeEvent;
export type ContextMenuEvent = JQuery.ContextMenuEvent;
export type ClickEvent = JQuery.ClickEvent;
export type MouseDownEvent = JQuery.MouseDownEvent;
export type BlurEvent = JQuery.BlurEvent;
export type KeyDownEvent = JQuery.KeyDownEvent;
export type KeyPressEvent = JQuery.KeyPressEvent;
export type DoubleClickEvent = JQuery.DoubleClickEvent;
export type DragEndEvent = JQuery.DragEndEvent;
export type DragEnterEvent = JQuery.DragEnterEvent;
export type DragEvent = JQuery.DragEvent;
export type DragExitEvent = JQuery.DragExitEvent;
export type DragLeaveEvent = JQuery.DragLeaveEvent;
export type DragOverEvent = JQuery.DragOverEvent;
export type DragStartEvent = JQuery.DragStartEvent;
export type DropEvent = JQuery.DropEvent;
export type FocusEvent = JQuery.FocusEvent;
export type FocusInEvent = JQuery.FocusInEvent;
export type FocusOutEvent = JQuery.FocusOutEvent;
export type FocusEventBase = JQuery.FocusEventBase;

// todo: continua


// window (NB: most of them should be replaced by RuntimeAccessibleClass)
let w: any = window;/*
w.$ = $;
w.Log = Log;
w.U = U;
w.Size = Size;
w.ISize = ISize;
w.GraphSize = GraphSize;
w.Point = Point;
w.IPoint = IPoint;
w.GraphPoint = GraphPoint;
w.$s = $s;
*/
export {
    // GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps,
    GraphElementComponent,
    VertexComponent,
    GraphElement,
    TextareaConnected, InputConnected,
    Textarea,    Input,
    InputRawComponent,
    TextAreaRawComponent,
    MyInputComponent,
    Field,
    GraphComponent,
    fakeexport,
    QA,
    GraphsContainerComponent,
    DataOutputComponent,
    Overlap, LoggerComponent,
    GraphsContainer,
    Vertex,    Graph,
    StyleEditor,
    DockLayoutComponent,
} from './components'

export {createOrOpenModelTab} from "../components/abstract/DockLayoutComponent"; // needs to be after docklayoutcomponent or to split the file
export {fakeExport} from './ExecuteOnRead';
console.info('joiner loaded');
