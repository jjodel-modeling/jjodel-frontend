// import {StyleEditor as SE} from "../components/rightbar/StyleEditor/StyleEditor"; // required by DockLayout
// import DockLayoutComponentt from "../components/abstract/DockLayoutComponent";
export {MyInputComponent} from "../components/abstract/MyInput";
export {TextAreaRawComponent, InputRawComponent, TextareaConnected, InputConnected, Input, Textarea} from "../components/forEndUser/bidirectionalInput";
export {DataOutputComponent} from "../components/logger/DataOutput";
export {LoggerComponent} from "../components/logger/loggerComponent";



/// import components that must save themselves to global variable to be accessible for user

export {Overlap} from "../components/forEndUser/Overlap";
export {QA} from "../graph/droppable/droppable";
export {GraphElement, GraphElementComponent} from "../graph/graphElement/graphElement";
export {Graph, GraphComponent} from "../graph/graph/graph"; // require graphelement
export {DefaultNode, DefaultNodeComponent} from "../graph/defaultNode/DefaultNode"; // require graphelement
export {Vertex, VertexComponent} from "../graph/vertex/Vertex"; // require overlap, graphelement
export {GraphsContainer, GraphsContainerComponent} from "../graph/graph/graphContainer"; // require vertex, graph
export {Field, FieldComponent} from "../graph/field/Field";
export {fakeexport} from "../graph/edge/Edge";
// export {StyleEditor} from "../components/rightbar/StyleEditor/StyleEditor";
// export const StyleEditor = SE; // se non lo importo non lo trova quando faccio l'import di DockLayoutComponent che lo utilizza. se non fingo di usarlo in una variabile, l'ottimizzatore del codice rimuove l'import.
// export let DockLayoutComponent = DockLayoutComponentt;
export {StyleEditor} from "../components/rightbar/StyleEditor/StyleEditor"; // required by DockLayout
export {DockLayoutComponent} from "../components/abstract/DockLayoutComponent";

console.info('components loaded');
