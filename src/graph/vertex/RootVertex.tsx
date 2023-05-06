import {EdgeOptions, IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, ReactNode, RefObject, useEffect, useRef} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import {connect} from "react-redux";
import {
    BEGIN,
    DClass,
    DUser, END,
    GObject,
    LClass, LGraphElement,
    LPointerTargetable,
    LViewElement,
    Pointer,
    SetFieldAction,
    SetRootFieldAction,
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


function RootVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props; const node = rootProps.node;
    const data = rootProps.data;
    const isEdgePending = !!(rootProps.isEdgePending?.source);
    const user = rootProps.isEdgePending.user;
    const source = rootProps.isEdgePending.source;
    const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
    const canBeExtend = isEdgePending &&
                        rootProps.data.className === "DClass" &&
                        source.canExtend(rootProps.data as any as LClass, extendError);
    let [classes, setClasses] = useStateIfMounted<string[]>([data.className]);
    // let [resized, setResized] = useStateIfMounted<boolean>(false);

    let nodeType = "NODE_TYPE_ERROR";
    if ( props.props.isGraph &&  props.props.isVertex) nodeType = "GraphVertex";
    if ( props.props.isGraph && !props.props.isVertex) nodeType = "Graph";
    if (!props.props.isGraph &&  props.props.isVertex) nodeType = "Vertex";
    if (!props.props.isGraph && !props.props.isVertex) nodeType = "Field";
    classes = [...classes, nodeType];
    if (Array.isArray(props.props.className)) { U.arrayMergeInPlace(classes, props.props.className); }
    else if (props.props.className) { classes.push(props.props.className); }
    if (Array.isArray(props.props.class)) { U.arrayMergeInPlace(classes, props.props.class); }
    else if (props.props.class) { classes.push(props.props.class); }

    const view: LViewElement|undefined = rootProps.view;
    /// EVENT TRIGGER FUCTIONS START
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
                // SetFieldAction.new(lClass.id, "extendedBy", source.id, "", true); // todo: this should throw a error for wrong type.
                // todo: use source.addExtends(lClass); or something (source is LClass)
                SetFieldAction.new(lClass.id, "extendedBy", source.id, "+=", true);
                SetFieldAction.new(source.id, "extends", lClass.id, "+=", true);
            }
            SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });
        } else { select(); }
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        e.stopPropagation();
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
        if (isEdgePending && rootProps.data.className === "DClass") {
            if (canBeExtend) setClasses([...classes, "class-can-be-extended"]);
            else setClasses([...classes, "class-cannot-be-extended"]);
        }
    }
    const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if(rootProps.data.className === "DClass") {
            setClasses(classes.filter((classname) => {
                return classname !== "class-can-be-extended" && classname !== "class-cannot-be-extended"
            }));
        }
    }
    /// EVENT TRIGGER FUCTIONS END


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


    const htmlRef: RefObject<HTMLDivElement> = useRef(null);

    useEffect(() => {
        const viewIsUpdated = true; // todo, run this only if view is different from old render
        console.log("useeffect", {htmlRef, name:(props.props.data as any).name, view});
        if (!htmlRef.current) return;
        if (!viewIsUpdated) return;
        const element: GObject<"JQuery + ui plugin"> = $(htmlRef.current); // todo: install typings
        switch(nodeType) {
            case "GraphVertex":
            case "Vertex":
                element.draggable({
                    cursor: 'grabbing',
                    containment: 'parent',
                    // disabled: !(view.draggable),
                    start: function(event: GObject, obj: GObject) {
                        select();
                        SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 });
                        if(view.onDragStart) {
                            try{ eval(view.onDragStart); }
                            catch (e) { console.log(e) }
                        }
                    },
                    drag: function(event: GObject, obj: GObject) {
                        // SetRootFieldAction.new("dragging", {})
                    },
                    stop: function (event: GObject, obj: GObject) {
                        if(node) {
                            node.y = obj.position.top;
                            node.x = obj.position.left;
                        }
                        if(view.onDragEnd) {
                            try{ eval(view.onDragEnd); }
                            catch (e) { console.log(e) }
                        }
                    }
                });
                element.resizable({
                    containment: 'parent',
                    // disabled: !(view.resizable),
                    start: function(event: GObject, obj: GObject) {
                        select();
                        SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 });
                        if(view.onResizeStart) {
                            try{ eval(view.onResizeStart); }
                            catch (e) { console.log(e) }
                        }
                    },
                    resize: function(event: GObject, obj: GObject) {
                        // SetRootFieldAction.new("resizing", {})
                    },
                    stop: function(event: GObject, obj: GObject) {
                        if (!classes.includes("resized")) setClasses([...classes, "resized"]);
                        if(node) {
                            node.width = obj.size.width;
                            node.height = obj.size.height;
                        }
                        if(view.onResizeEnd) {
                            try{ eval(view.onResizeEnd); }
                            catch (e) { console.log(e) }
                        }
                    }
                });break;
            case "Graph":
            case "Field":
        }
    }, )

    let viewStyle: GObject = {};
    viewStyle.overflow = 'hidden';
    // viewStyle.position = 'relative'; // 'absolute';
    viewStyle.display = rootProps.view?.display;
    viewStyle.zIndex = rootProps.node?.zIndex;
    if (view.adaptWidth) viewStyle.width = view.adaptWidth; // '-webkit-fill-available';
    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
    if (view.adaptHeight) viewStyle.height = view.adaptHeight; //'fit-content'; // '-webkit-fill-available'; if needs to actually fill all it's not a vertex but a field.
    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';

    viewStyle = {};
    return(
        <div ref={htmlRef}
             id={rootProps.nodeid}
             data-nodeid={rootProps.nodeid}
             data-dataid={rootProps.data?.id}
             data-viewid={rootProps.view?.id}
             data-modelname={rootProps.data?.className}
             data-userselecting={JSON.stringify(rootProps.node?.__raw.isSelected || {})}
             data-nodetype={nodeType}
             style={{...viewStyle}}
             className={classes.join(' ')}
             onClick={onClick}
             onContextMenu={onContextMenu}
             onMouseEnter={onEnter}
             onMouseLeave={onLeave}
             key={rootProps.key || rootProps.nodeid}
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






