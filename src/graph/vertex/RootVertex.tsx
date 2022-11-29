import {IStore} from "../../redux/store";
import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect, useState} from "react";
import {connect} from "react-redux";
import {
    DClass,
    DGraph,
    DModelElement,
    DUser,
    GObject, LClass, LPointerTargetable,
    Pointer,
    SetFieldAction,
    SetRootFieldAction,
    U
} from "../../joiner";
import {AllPropss as VertexProps} from "./Vertex";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";
import LeaderLine from "leader-line-new";

interface ThisState {}
function RootVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props;
    const isEdgePending = !!(rootProps.isEdgePending?.source);
    const user = rootProps.isEdgePending.user;
    const source = rootProps.isEdgePending.source;
    const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
    const canBeExtend = isEdgePending &&
                        rootProps.data.className === "DClass" &&
                        source.canExtend(rootProps.data as any as LClass, extendError);
    console.log("canextend", {src: rootProps.isEdgePending, target:rootProps.data, extendError});

    const [classes, setClasses] = useState<string[]>([]);

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
        if (isEdgePending) {
            const user = rootProps.isEdgePending.user;
            const source = rootProps.isEdgePending.source;
            if (canBeExtend) {
                const lClass: LClass = LPointerTargetable.from(rootProps.data.id);
                SetFieldAction.new(lClass.id, "extendedBy", source.id, "", true); // todo: this should throw a error for wrong type.
                SetFieldAction.new(lClass.id, "extendedBy", source.id, "+=", true);
                SetFieldAction.new(source.id, "extends", lClass.id, "+=", true);
            }
            SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });
        } else {
            select();
        }
        e.stopPropagation();
        e.nativeEvent.stopPropagation();
    }

    const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if(isEdgePending && rootProps.data.className === "DClass") {
            const user = rootProps.isEdgePending.user;
            const source = rootProps.isEdgePending.source;
            if(canBeExtend) setClasses([...classes, "class-can-be-extended"]);
            else setClasses([...classes, "class-cannot-be-extended"]);
        }
    }
    const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if(rootProps.data.className === "DClass") {
            setClasses(classes.filter((classname) => {
                return classname !== "class-can-be-extended" && classname !=="class-cannot-be-extended"
            }));
        }
    }

    const sizeStyle: CSSProperties = {};
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
                    edgeRefresh();
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


    return(
        <div id={rootProps.nodeid}
             data-nodeid={rootProps.nodeid}
             data-dataid={rootProps.data?.id}
             data-viewid={rootProps.view?.id}
             data-modelname={rootProps.data?.className}
             data-userselecting={JSON.stringify(rootProps.node?.__raw.isSelected || {})}
             style={{...sizeStyle}}
             className={[...classes, ...props.classes].join(' ')}
             onClick={onClick}
             onMouseEnter={onEnter}
             onMouseLeave={onLeave}
             key={rootProps.key}
        >
            {props.render}
        </div>
    );

}
interface OwnProps {props: VertexProps, render: ReactNode}
interface StateProps {classes: Set<string>}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const classes = new Set<string>();
    const props = ownProps.props;
    classes.add(props.data.className);
    if(props.lastSelected && props.data.id === props.lastSelected.id) classes.add("selected");
    const ret: StateProps = {classes};
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




