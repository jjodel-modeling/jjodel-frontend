import type { Dictionary } from "./types";

// export {Graph, GraphComponent} from "../graph/graph/graph"; // require graphelement
// export {Graph} from "../graph/vertex/Vertex"; // require graphelement
// classic graphelement imports removed (de-entanglement stage 4 — the classic
// component classes are no longer registered; the dictionaries below survive as
// pure {cname} metadata for the view-properties dropdowns)
// GraphsContainer removed (classic shutdown Fase 5a — graph/graph/graphContainer.tsx deleted, no external consumers)
import {GenericInput} from "../components/forEndUser/GenericInput"
import {U} from "./index";
import { Control } from "../components/forEndUser/Control";
// classic graphelement exports removed (de-entanglement stage 4)
// DerivedReferenceEdge removed (de-entanglement stage 6 — died with the DV templates;
// its <DerivedReferenceEdge> occurrences in DV.tsx are string-level jsxString sources, never eval'd)
export {GenericInput} from "../components/forEndUser/GenericInput"
// other exports
//export {DockLayoutComponent} from "../components/abstract/DockLayoutComponent";

export {Input, Edit, TextArea, Select} from "../components/forEndUser/Input";
export {T2M, M2T} from "../components/forEndUser/MTM";
// export {TextArea} from "../components/forEndUser/TextArea";
export {Selector} from "../components/forEndUser/Selector";
export {View} from "../components/forEndUser/Aliases";
export {Try} from "../components/forEndUser/Try";
export {Grid} from "../components/forEndUser/grid";
export {ContextMenu, ContextualEntry} from "../components/forEndUser/ContextMenu";


// export {Image} from "../components/forEndUser/Image";

export {CountryPicker} from "../components/forEndUser/CountryPicker";


export {DataOutputComponent} from "../components/logger/DataOutput";

/// import components that must save themselves to global variable to be accessible for user

export {Overlap} from "../components/forEndUser/Overlap";

export {ControlPanel} from '../components/forEndUser/ControlPanel';
export {Control, Slider, Toggle_Obsolete, Toggle_Obsolete as Toggle, Zoom, Panel, Panell, MetaElementPicker, /*ContextualEntry*/} from '../components/forEndUser/Control';

// de-entanglement stage 4: the classic component classes are gone from the
// barrel. The dictionaries survive as pure {cname} metadata because
// editors/views/data/InfoData.tsx and editors/viewpoint/properties/ViewProperties.tsx
// read Object.keys(...) and .cname to populate the view-component dropdowns.
// The cname strings below are copied verbatim from the deleted classes.
export interface ClassicComponentMeta { cname: string; }
type dict = Dictionary<string, ClassicComponentMeta>;


export const Graphs = {
    Graph: {cname: 'Graph'}, GraphVertex: {cname: 'GraphVertex'},
}
export const Edges = {
    Edge: {cname: 'Edge'},
    EdgePoint: {cname: 'EdgePoint'},
}
export const Fields = {
    Field: {cname: 'Field'},
    // GraphElement
}
export const Vertexes = {
    Vertex: {cname: 'Vertex'},
    // VoidVertex
    Circle: {cname: 'Ellipse/Circle'},
    Polygon: {cname: 'N-Polygon'},
    Cross: {cname: 'N-Cross'},
    Asterisk: {cname: 'Cross/Asterisk'},
    //Star
    SimpleStar: {cname: 'N-SimpleStar'}, DecoratedStar: {cname: 'N-DecoratedStar'},
    Triangle: {cname: 'Polygon/Triangle'}, Square: {cname: 'Rectangle/Square'}, Pentagon: {cname: 'Polygon/Pentagon'},
    Hexagon: {cname: 'Polygon/Hexagon'}, Heptagon: {cname: 'Polygon/Heptagon'}, Octagon: {cname: 'Polygon/Octagon'},
    Enneagon: {cname: 'Polygon/Nonagon'}, Decagon: {cname: 'Polygon/Decagon'},
    // Nonagon, Septagon, Diamond, Rhombus
    Ellipse: {cname: 'Ellipse'},
    Rectangle: {cname: 'Rectangle (alias for default <Vertex />)'},
    Trapezoid: {cname: 'Trapezoid'}
}
export const GraphElements: dict = {...Graphs, ...Vertexes, ...Fields, ...Edges}; // T & {vertexes: T, edges: T, graphs: T, fields: T} = {} as any;
for (let key in GraphElements) if (!(GraphElements as any)[key]) { throw new Error("wrong initialization fo components"); }
// U.objectMergeInPlace(GraphElements, Graphs, Edges as any, Vertexes, Fields, {Graphs, Edges, Vertexes, Fields});
// console.info('components loaded');
export {Measurable, MeasurableComponent, ScrollableComponent, Scrollable, Pan, Viewport, ViewPort, Draggable, Resizable, Rotatable, Scalable, Transformable, Interactive} from "../components/forEndUser/Measurable";

// icons
export * as Tb from 'react-icons/tb';
export * as Fa from 'react-icons/fa';
