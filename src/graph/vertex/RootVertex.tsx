import {IStore} from "../../redux/store";
import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {DUser, GObject, Pointer, SetRootFieldAction, U} from "../../joiner";
import {AllPropss as VertexProps} from "./Vertex";
import ToolButton from "../toolButton/ToolButton";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";

interface ThisState {}
function RootVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props;
    const classname = rootProps.data.className;
    const classes: string[] = [];
    classes.push(classname);
    if(rootProps.data.id === rootProps.lastSelected) classes.push("selected");

    const select = (forUser:Pointer<DUser, 0, 1> = null) => {
        if (!forUser) forUser = DUser.current;
        rootProps.node.isSelected[forUser] = true;
        SetRootFieldAction.new('_lastSelected', {
            node: rootProps.nodeid,
            view: rootProps.view.id,
            modelElement: rootProps.data?.id
        });
    }
    const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
        select();
        e.stopPropagation();
        e.nativeEvent.stopPropagation();
    }

    const sizeStyle: CSSProperties = {};
    if(rootProps.isVertex) {
        sizeStyle.position = "absolute";
    }

    useEffect(() => {
        const element: GObject = $('[id="' + rootProps.nodeid + '"]'); // todo: install jqueryui types and remove GObject cast
        if(element && rootProps.isVertex) {
            element.draggable({
                cursor: "grabbing",
                containment: "parent",
                drag: function(event: GObject, obj: GObject){
                    const y: number = obj.position.top;
                    const x: number = obj.position.left;
                    // rootProps.node.x = x;
                    // rootProps.node.y = y;

                }
            });
            element.resizable({
                containment: "parent",
                resize: function(event: GObject, obj: GObject) {

                }
            });
        }
    }, [])


    //id = rootProps.node?.id
    return(
        <div id={rootProps.nodeid}
             data-nodeid={rootProps.nodeid}
             data-dataid={rootProps.data?.id}
             data-viewid={rootProps.view?.id}
             data-modelname={rootProps.data?.className}
             data-userselecting={JSON.stringify(rootProps.node?.__raw.isSelected || {})}
             style={{...sizeStyle}}
             className={classes.join(' ')}
             onClick={onClick}
             key={rootProps.key}
        >
            {props.render}
        </div>
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


export const RootVertexConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RootVertexComponent);

export const RootVertex = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <RootVertexConnected {...{...props, childrens}} />;
}
export default RootVertex;




