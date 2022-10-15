import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {AllPropss as VertexProps} from "./Vertex";
import Draggable, {DraggableData, DraggableEvent} from "react-draggable";
import RootVertex from "./RootVertex";
import {useXarrow} from "react-xarrows";
import {Size} from "../../common/U";
import {U} from "../../joiner";

interface ThisState {}
function RootDraggableVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props;
    const updateArrow = useXarrow();
    const dragStart = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        updateArrow();
    }
    const dragging = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        updateArrow();
    }
    const dragStop = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        updateArrow();
        rootProps.data.x = data.x;
        rootProps.data.y = data.y;
        /*
        const graphElement = $('.DModel:visible')[0];
        const htmlElement = e.target as HTMLDivElement;
        if(htmlElement) {
            const offset: Size = Size.of(htmlElement).subtract(Size.of(graphElement));
            rootProps.data.x = offset.x;
            rootProps.data.y = offset.y;
        }
        $('.drag-wrapper.react-draggable.react-draggable-dragged').css("transform", "");
        */
    }

    return(
        <RootVertex props={rootProps} render={props.render} />
    );
}
interface OwnProps {props: VertexProps, render: ReactNode}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const RootDraggableVertexConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RootDraggableVertexComponent);

export const RootDraggableVertex = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <RootDraggableVertexConnected {...{...props, childrens}} />;
}
export default RootDraggableVertex;




