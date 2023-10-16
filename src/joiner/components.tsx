import {OCLEditorAce} from "../components/forEndUser/OCLEditor";

export {OclEditor} from "../components/rightbar/oclEditor/OclEditor";
export {OCLEditorAce} from "../components/forEndUser/OCLEditor"


export {Input} from "../components/forEndUser/Input";
export {TextArea} from "../components/forEndUser/TextArea";
export {Select} from "../components/forEndUser/Select";
export {Image} from "../components/forEndUser/Image";


export {DataOutputComponent} from "../components/logger/DataOutput";
export {LoggerComponent} from "../components/logger/loggerComponent";

/// import components that must save themselves to global variable to be accessible for user

export {Overlap} from "../components/forEndUser/Overlap";
export {ColorScheme} from "../components/colorScheme/colorScheme";
export {GraphElement, GraphElementComponent} from "../graph/graphElement/graphElement";
// export {Graph, GraphComponent} from "../graph/graph/graph"; // require graphelement
// export {Graph} from "../graph/vertex/Vertex"; // require graphelement
export {DefaultNode, DefaultNodeComponent} from "../graph/defaultNode/DefaultNode"; // require graphelement
export {Graph, Vertex, VoidVertex, GraphVertex, Field, EdgePoint, VertexComponent} from "../graph/vertex/Vertex"; // require overlap, graphelement
export {GraphsContainer, GraphsContainerComponent} from "../graph/graph/graphContainer"; // require vertex, graph
//export {DockLayoutComponent} from "../components/abstract/DockLayoutComponent";
export {DamEdge, EdgeComponent,} from "../graph/damedges/damedge";
export {GenericInput} from "../components/forEndUser/GenericInput"



// console.info('components loaded');
