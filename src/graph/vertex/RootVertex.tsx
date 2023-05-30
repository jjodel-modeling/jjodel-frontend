import {EdgeOptions, IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, ReactNode, RefObject, useEffect, useRef} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import {connect} from "react-redux";
import {
    BEGIN,
    DClass,
    DUser, END,
    GObject, GraphElementComponent, GraphPoint, GraphSize,
    LClass, LGraphElement,
    LPointerTargetable,
    LViewElement,
    Pointer,
    SetFieldAction,
    SetRootFieldAction,
    Size,
    U
} from "../../joiner";
import {AllPropss as VertexProps} from "./Vertex";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";
import { useEffectOnce } from "usehooks-ts";

interface ThisState {
    // resized: boolean;
    classes: string[];
}

function GraphElement(props: AllProps){}

var dragHelper = document.createElement("div");
dragHelper.style.backgroundColor = "transparent";
dragHelper.style.outline = "4px solid black";
function RootVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props;
    const node: LGraphElement = rootProps.node || LPointerTargetable.wrap(rootProps.nodeid);
    const data = rootProps.data;
    const view: LViewElement|undefined = rootProps.view;
    let [classes, setClasses] = useStateIfMounted<string[]>([data.className]);
    let currentClonedCounter: number = (view as any)?.clonedCounter;
    let [viewClonedCounter, setViewClonedCounter] = useStateIfMounted<number>(-1);
    let viewIsChanged = viewClonedCounter !== currentClonedCounter;
    if (viewIsChanged) setViewClonedCounter(currentClonedCounter);
    // let [resized, setResized] = useStateIfMounted<boolean>(false);

    let nodeType = "NODE_TYPE_ERROR";


    /*const sizeStyle: CSSProperties = {};
    if(rootProps.isVertex) { sizeStyle.position = "absolute"; }

    const edgeRefresh = () => {
        const nodeid = rootProps.nodeid;
        if(nodeid) {
            const sources : LeaderLine[] = (window as any).leaderline.bySource[nodeid] || [];
            const targets : LeaderLine[] = (window as any).leaderline.byTarget[nodeid] || [];
            for(let ll of sources) { ll.position(); }
            for(let ll of targets) { ll.position(); }
            const subNodes = rootProps.data.subNodes;
            if(subNodes) {
                for(let node of subNodes) {
                    const sources : LeaderLine[] = (window as any).leaderline.bySource[node.id] || [];
                    const targets : LeaderLine[] = (window as any).leaderline.byTarget[node.id] || [];
                    for(let ll of sources) { ll.position(); }
                    for(let ll of targets) { ll.position(); }
                }
            }
        }
    }*/



    let withSetSize: boolean = true;
    const htmlRef: RefObject<HTMLDivElement> = useRef(null);

    let viewStyle: GObject = {};/*
    viewStyle.overflow = 'hidden';
    // viewStyle.position = 'relative'; // 'absolute';
    viewStyle.display = rootProps.view?.display;
    viewStyle.zIndex = node?.zIndex;
    if (view.adaptWidth) viewStyle.width = view.adaptWidth; // '-webkit-fill-available';
    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
    if (view.adaptHeight) viewStyle.height = view.adaptHeight; //'fit-content'; // '-webkit-fill-available'; if needs to actually fill all it's not a vertex but a field.
    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';
    viewStyle = {};*/
    return(
        <div
        >
            {props.render}
        </div>

    );

}
interface OwnProps {
    props: VertexProps,
    render: ReactNode,
    super: GraphElementComponent;
    /*getSize(): GraphSize | undefined;
    // set_size(x_or_size_or_point: number, y?: number, w?:number, h?:number): void;
    setSize(x_or_size_or_point: Partial<GraphPoint>): void;
    setSize(x_or_size_or_point: Partial<GraphSize>): void;
    // set_size(x_or_size_or_point: number | GraphSize | GraphPoint, y?: number, w?:number, h?:number): void;
    setSize(size0: Partial<GraphSize> | Partial<GraphPoint>): void;*/
}

interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const props = ownProps.props;
    const selected = props.data.id === props.lastSelected?.id;
    const ret: StateProps = {selected};
    return ret;

}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const RootVertexConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RootVertexComponent);

export const RootVertex = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <RootVertexConnected {...{...props, childrens}} />;
}
export default RootVertex;






