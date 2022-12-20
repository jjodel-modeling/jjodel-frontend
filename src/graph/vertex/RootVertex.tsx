import {EdgeOptions, IStore} from "../../redux/store";
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
import {useXarrow, Xwrapper} from "react-xarrows";

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
    const [isDragged, setIsDragged] = useState(false);

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
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        e.stopPropagation();
        //e.nativeEvent.stopPropagation();
    }
    const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        select();
        SetRootFieldAction.new("contextMenu", {
            display: true,
            x: e.clientX,
            y: e.clientY
        });
        e.preventDefault();
        e.stopPropagation();
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
                drag: function(event: GObject, obj: GObject) {
                    setIsDragged(true);
                    edgeRefresh();
                    SetRootFieldAction.new("dragging", {random: Math.floor(Math.random() * 10000), id: rootProps.data.id});
                },
                stop: function (event: GObject, obj: GObject) {
                    const y: number = obj.position.top;
                    const x: number = obj.position.left;
                    if(rootProps.node) {
                        SetFieldAction.new(rootProps.node, "x", x, "", false);
                        SetFieldAction.new(rootProps.node, "y", y, "", false);
                    }
                    setIsDragged(false);
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
             style={{...sizeStyle, zIndex: (isDragged) ? 999 : 0}}
             className={[...classes, ...props.classes].join(' ')}
             onClick={onClick}
             onContextMenu={onContextMenu}
             onMouseEnter={onEnter}
             onMouseLeave={onLeave}
             key={rootProps.key}
        >
            <div style={{display: props.selected ? 'none' : 'block', zIndex: props.index}} className={"saturated"}></div>
            {props.render}
        </div>
    );

}
interface OwnProps {props: VertexProps, render: ReactNode}
interface StateProps {classes: Set<string>, edges: EdgeOptions[], selected: boolean, index: number}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const classes = new Set<string>();
    const edges = state.edges;
    const props = ownProps.props;
    classes.add(props.data.className);
    const selected: boolean = (props.lastSelected && props.data.id === props.lastSelected.id) as boolean;
    //if(selected) classes.add("selected");
    let index = 0;
    switch (ownProps.props.data.className) {
        default: index = -1; break;
        case 'DModel': break;
        case 'DPackage': index = 1; break;
        case 'DClass': index = 2; break;
        case 'DEnumerator': index = 2; break;
    }
    const ret: StateProps = {classes, edges, selected, index};
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




