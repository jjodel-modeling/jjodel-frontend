import type { Dictionary } from "./types";

// export {Graph, GraphComponent} from "../graph/graph/graph"; // require graphelement
// export {Graph} from "../graph/vertex/Vertex"; // require graphelement
// imports graphelements
import {GraphElement, GraphElementComponent} from "../graph/graphElement/graphElement";
import {Graph, Vertex, VoidVertex, GraphVertex, Field, EdgePoint, VertexComponent} from "../graph/vertex/Vertex"; // require overlap, graphelement
import { Polygon, Circle, Cross, Decagon,
    Asterisk, Ellipse, Enneagon, Hexagon, Nonagon,
    Octagon, Heptagon, Pentagon, Rectangle, Septagon,
    Square, Star, SimpleStar, DecoratedStar, Trapezoid, Triangle
} from  "../graph/vertex/Shapes";
import {DefaultNode, DefaultNodeComponent} from "../graph/defaultNode/DefaultNode"; // require graphelement
import {GraphsContainer, GraphsContainerComponent} from "../graph/graph/graphContainer"; // require vertex, graph
import {Edge, EdgeComponent} from "../graph/damedges/damedge";
import {GenericInput} from "../components/forEndUser/GenericInput"
import {U} from "./index";
// exports graphelements
export {GraphElement, GraphElementComponent} from "../graph/graphElement/graphElement";
export {Graph, Vertex, VoidVertex, GraphVertex, Field, EdgePoint, VertexComponent} from "../graph/vertex/Vertex"; // require overlap, graphelement
export { Polygon, Circle, Cross, Decagon,
    Asterisk, Ellipse, Enneagon, Hexagon, Nonagon,
    Octagon, Heptagon, Pentagon, Rectangle, Septagon,
    Square, Star, SimpleStar, DecoratedStar, Trapezoid, Triangle
} from  "../graph/vertex/Shapes";
export {DefaultNode, DefaultNodeComponent} from "../graph/defaultNode/DefaultNode"; // require graphelement
export {GraphsContainer, GraphsContainerComponent} from "../graph/graph/graphContainer"; // require vertex, graph
export {Edge, EdgeComponent,} from "../graph/damedges/damedge";
export {GenericInput} from "../components/forEndUser/GenericInput"
// other exports
//export {DockLayoutComponent} from "../components/abstract/DockLayoutComponent";
export {OclEditor} from "../components/rightbar/oclEditor/OclEditor";

export {Input, Edit} from "../components/forEndUser/Input";
export {TextArea} from "../components/forEndUser/TextArea";
export {Select} from "../components/forEndUser/Select";
export {View} from "../components/forEndUser/Aliases";
export {Try} from "../components/forEndUser/Try";

// export {Image} from "../components/forEndUser/Image";


export {DataOutputComponent} from "../components/logger/DataOutput";
export {LoggerComponent} from "../components/logger/loggerComponent";

/// import components that must save themselves to global variable to be accessible for user

export {Overlap} from "../components/forEndUser/Overlap";

type dict = Dictionary<string, typeof GraphElement | typeof Edge>;


export const Graphs = {
    Graph: Graph, GraphVertex: GraphVertex,
}
export const Edges = {
    Edge: Edge,
    EdgePoint: EdgePoint,
}
export const Fields = {
    Field: Field,
    // GraphElement: GraphElement,
}
export const Vertexes = {
    Vertex: Vertex,
    // VoidVertex: VoidVertex,
    Circle: Circle,
    Polygon: Polygon,
    Cross: Cross,
    Asterisk: Asterisk,
    //Star: Star,
    SimpleStar: SimpleStar, DecoratedStar: DecoratedStar,
    Triangle: Triangle, Square: Square, Pentagon: Pentagon,
    Hexagon: Hexagon, Heptagon: Heptagon, Octagon: Octagon,
    Enneagon: Enneagon, Decagon: Decagon,
    // Nonagon: Nonagon, Septagon: Septagon,
    // Diamond: Diamond, Rhombus: Rhombus,
    Ellipse: Ellipse,
    Rectangle: Rectangle,
    Trapezoid: Trapezoid
}
export const GraphElements: dict = {...Graphs, ...Vertexes, ...Fields, ...Edges}; // T & {vertexes: T, edges: T, graphs: T, fields: T} = {} as any;
for (let key in GraphElements) if (!(GraphElements as any)[key]) { console.log({GraphElements, v:(GraphElements as any)[key]}); throw new Error("wrong initialization fo components"); }
// U.objectMergeInPlace(GraphElements, Graphs, Edges as any, Vertexes, Fields, {Graphs, Edges, Vertexes, Fields});
// console.info('components loaded');
