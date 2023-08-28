import * as jsxtt from 'jsx-transform/lib/jsx.js';
import $$ from 'jquery';
import {ReactNode} from "react";
import * as _pr_json2xml from '../common/libraries/prj_json2xml.js';
import * as _pr_xml2json from '../common/libraries/prj_xml2json.js';
// true imports for this file (should all be import type
import type {DocString, GObject as GObjectt} from './types';
import type {U as UType} from "../common/U";
import type {Selectors as SelType} from "../redux/selectors/selectors";

export type {Constructor, AbstractConstructor} from "../joiner/types";
export type {ValueDetail, SetValueAtPoisitionInfoType} from "../model/logicWrapper/LModelElement";
var windoww = (window as any);
windoww.windoww = windoww;


// console.error('iiiiiiiiiiiiiiii 0');

windoww.$ = $$;
export const $: JQueryStatic = $$;
export const prjson2xml = _pr_json2xml;
export const prxml2json = _pr_xml2json;
windoww.prjson2xml = prjson2xml;
windoww.prxml2json = prxml2json;

// import types
//import {$s, GraphPoint, GraphSize, IPoint, ISize, Log, Point, Size, U} from "../common/U";

// nb: export type è un export "finto" che esiste solo in compilazione per fare capire a typescript i tipi. permette export di alias con nomi diversi (l'export normale no)
export type {GetPath} from './proxy';

export type {Subtract, Class, Empty, Json, GObject, bool, Dictionary, Proxyfied, Temporary, RawObject, NotFoundv,
    NotFound, DocString, nbool, nnumber, nstring, Nullable, TODO, UnixTimestamp, UObject, IsActually,
    Function, Function2, InOutParam,
    unArr, orArr, PrimitiveType, CClass, NonEmptyString, Overlap, Info
} from "./types";
export type {Pointer, PtrString, getWParams, WUser, WtoD, WtoL, DtoW, LtoW, LtoD, DtoL, PackArr, Pack, Pack1 } from "./classes";

export type { WAnnotation, WNamedElement, WFactory_useless_, WClass, WAttribute, WClassifier, WDataType, WMap, WModel,
    WModelElement, WEnumerator, WObject, WPackage, WOperation, WValue, WParameter, WReference, WTypedElement, WEnumLiteral, WStructuralFeature,
} from "../model/logicWrapper/LModelElement";
export type {WEdge, WEdgePoint, WExtEdge, WGraph, WRefEdge, WGraphElement, WVoidEdge, WGraphVertex, WVertex, WVoidVertex, EdgeSegment, EdgeFillSegment} from "../model/dataStructure/GraphDataElements";

export {windoww} from './types';
export {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps, EdgeStateProps, EdgeOwnProps} from "../graph/graphElement/sharedTypes/sharedTypes";
export {EdgeBendingMode} from "./types";
export {Constructors, JsType, RuntimeAccessibleClass, DPointerTargetable,
    LPointerTargetable, WPointerTargetable, MyError, RuntimeAccessible,
    Obsolete, Leaf, Node, Abstract, Instantiable, MixOnlyFuncs,
    LUser, DUser, Pointers, PointedBy, PendingPointedByPaths, CoordinateMode, EdgeHead} from "./classes";

// export type {Pointer} from './typeconverter';
export {getPath, TargetableProxyHandler, MyProxyHandler, MapProxyHandler, LogicContext, MapLogicContext} from './proxy';
// console.error('iiiiiiiiiiiiiiii 3');
// import independent generic modules (only dependent from types and RuntimeAccessible

export {Uarr,  DDate, ParseNumberOrBooleanOptions, myFileReader,
    Keystrokes, ShortAttribETypes, AttribETypes, FileReadTypeEnum, FocusHistoryEntry, SelectorOutput, U as UU, ShortAttribSuperTypes,
    } from "../common/U";
export {DV} from '../common/DV';
export {Size, GraphSize, GraphPoint, IPoint, ISize, Point} from "../common/Geom";
export { CSSRuleSorted, CSSParser, TagNames } from "../common/Uhtml";
// export {Log as Logg, Size, GraphSize, GraphPoint, IPoint, ISize, Point} from "../common/Log";
export const Log = windoww.Log;
export {UX} from "../common/UX";
export var U = windoww.U as typeof UType;
export {DLog} from "../model/classes/D";
export {LLog} from "../model/classes/L";
// console.error('iiiiiiiiiiiiiiii 4');

export {EcoreParser} from "../api/data";
// import domain-specific classes


export {
    DModelElement,
    LModelElement,
    DModel, LModel,
    DValue, LValue,
    DNamedElement, LNamedElement,
    DObject, LObject,
    DEnumerator, LEnumerator,
    DEnumLiteral, LEnumLiteral,
    DAttribute, LAttribute,
    DReference, LReference,
    DStructuralFeature, LStructuralFeature,
    DClassifier, LClassifier,
    DDataType, LDataType,
    DClass, LClass,
    DParameter, LParameter,
    DOperation, LOperation,
    DPackage, LPackage,
    DTypedElement, LTypedElement,
    DAnnotation, LAnnotation,
    EJavaObject,
    DFactory_useless_, LFactory_useless_, DMap, LMap
} from "../model/logicWrapper/LModelElement";

// console.error('joiner here 3');
/*
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
} from "../model/logicWrapper/LModelElement";*/
export {DExtEdge, DRefEdge, DVoidEdge, LGraphVertex, LRefEdge, LEdgePoint, DVoidVertex, DGraphVertex, DEdgePoint, DVertex, DEdge, LVertex, LGraph, DGraph, LVoidVertex, LVoidEdge, LEdge, LGraphElement, LExtEdge, DGraphElement} from "../model/dataStructure/GraphDataElements";



// export {GraphDragHandler} from "../graph/vertex/GraphDragHandler";

// console.error('iiiiiiiiiiiiiiii 11', windoww.DViewElement);
export type {WViewElement, WViewTransientProperties} from "../view/viewElement/view";
export {DViewTransientProperties, LViewTransientProperties, LViewElement, DViewElement} from "../view/viewElement/view";
export {DViewPoint, LViewPoint} from "../view/viewPoint/viewpoint";
// console.error('iiiiiiiiiiiiiiii 12', windoww.DViewElement);

export {Action, CreateElementAction, DeleteElementAction, SetFieldAction, SetRootFieldAction, CompositeAction, ParsedAction, LoadAction, CombineHistoryAction, RedoAction, UndoAction, TRANSACTION, BEGIN, ABORT, END} from "../redux/action/action";
export {DState, LState, ModelStore, ViewPointState, statehistory} from "../redux/store";
export {Selectors as Selectorss} from "../redux/selectors/selectors";
export var Selectors = windoww.Selectors as (GObjectt & typeof SelType);
export {reducer, jodelInit} from "../redux/reducer/reducer";
export {store} from "../redux/createStore";
export {Debug} from "../debugtools/debug";

export {OCL} from "../ocl/ocl";




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
    TextArea, Select, Input, Image, Edge, DamEdge,
    GraphsContainerComponent,
    Overlap as OverlapComponent,
    GraphsContainer,
    GraphElement,
    Vertex, VoidVertex, EdgePoint,
    Graph, GraphVertex,
    Field,
    DefaultNode,
    GraphElementComponent,
    VertexComponent,
    DefaultNodeComponent,
    // DockLayoutComponent,
    ColorScheme, Edges,
    EdgeComponent,
    DataOutputComponent, LoggerComponent
} from './components'

//export {createOrOpenModelTab} from "../components/abstract/DockLayoutComponent"; // needs to be after docklayoutcomponent or to split the file
export {fakeExport} from './ExecuteOnRead';
console.info('joiner loaded');
class Joiner{
    // just to help the file search
}

