import {LViewElement} from "../../../view/viewElement/view";
import FieldData from "../../rightbar/viewsEditor/data/FieldData";
import EdgeData from "../../rightbar/viewsEditor/data/EdgeData";
import EdgePointData from "../../rightbar/viewsEditor/data/EdgePointData";
import NodeData from "../../rightbar/viewsEditor/data/NodeData";
import GraphData from "../../rightbar/viewsEditor/data/GraphData";
import React from "react";

type Props = {view: LViewElement};
function ViewOptions(props: Props): JSX.Element {
    const {view} = props;
    let dview = view.__raw;
    const vid = view.id;
    const readOnly = false;
    let isField = true;
    let isGraph = false;
    let isVertex = false;
    let isEdge = false;
    let isEdgePoint = false;
    switch (dview.appliableTo) {
        case 'Graph': isGraph = true; break;
        case 'GraphVertex': isGraph = isVertex = true; break;
        case 'Vertex': isVertex = true; break;
        case 'Edge': isEdge = true; break;
        case 'EdgePoint': isEdgePoint = isVertex = true; break;
        case undefined: case 'Any': isGraph = isVertex = isEdge = isEdgePoint = true; break;
        default: case 'Field': break;
    }

    return(<section>
        {isField && <FieldData viewID={vid} readonly={readOnly} />}
        {isEdge && <EdgeData viewID={vid} readonly={readOnly} />}
        {isEdgePoint && <EdgePointData viewID={vid} readonly={readOnly} />}
        {isVertex && <NodeData viewID={vid} readonly={readOnly} />}
        {isGraph && <GraphData viewID={vid} readonly={readOnly} />}
    </section>);
}

export {ViewOptions};
