import {EdgeOptions, IStore} from "../../redux/store";
import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import {connect} from "react-redux";
import {
    DClass,
    DUser,
    GObject,
    LClass, LGraphElement,
    LPointerTargetable,
    LViewElement,
    Pointer,
    SetFieldAction,
    SetRootFieldAction
} from "../../joiner";
import {AllPropss as VertexProps} from "./Vertex";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";

interface ThisState {}
function RootVertexComponent(props: AllProps, state: ThisState) {
    const rootProps = props.props;
    const data = rootProps.data;
    const isEdgePending = !!(rootProps.isEdgePending?.source);
    const user = rootProps.isEdgePending.user;
    const source = rootProps.isEdgePending.source;
    const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
    const canBeExtend = isEdgePending &&
                        rootProps.data.className === "DClass" &&
                        source.canExtend(rootProps.data as any as LClass, extendError);
    const [classes, setClasses] = useStateIfMounted<string[]>([data.className]);

    const select = (forUser:Pointer<DUser, 0, 1> = null) => {
        if (!forUser) forUser = DUser.current;
        // rootProps.node.isSelected[forUser] = true;
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

    const view: LViewElement|undefined = rootProps.view;
    useEffect(() => {
        const element: GObject = $('[id="' + rootProps.nodeid + '"]');
        if(element && rootProps.data.className !== 'DModel') {
            if(view) {
                element.draggable({
                    cursor: 'grabbing',
                    containment: 'parent',
                    disabled: !(view.draggable),
                    start: function(event: GObject, obj: GObject) {
                        select();
                        SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 });
                    },
                    drag: function(event: GObject, obj: GObject) {
                        SetRootFieldAction.new("dragging", {})
                    },
                    stop: function (event: GObject, obj: GObject) {
                        const y: number = obj.position.top;
                        const x: number = obj.position.left;
                        const dNode = rootProps.node?.__raw;
                        if(dNode) {
                            SetFieldAction.new(dNode, 'x', x, '', false);
                            SetFieldAction.new(dNode, 'y', y, '', false);
                        }
                    }
                });
                element.resizable({
                    containment: 'parent',
                    disabled: !(view.resizable),
                    start: function(event: GObject, obj: GObject) {
                        select();
                        SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 });
                    },
                    resize: function(event: GObject, obj: GObject) {
                        SetRootFieldAction.new("dragging", {})
                    }
                });
            }
        }
    }, )

    const viewStyle: GObject = {};
    viewStyle.overflow = 'hidden'; viewStyle.position = 'absolute';
    viewStyle.display = rootProps.view?.display;
    viewStyle.zIndex = rootProps.node?.zIndex;
    if(view.adaptWidth) viewStyle.width = '-webkit-fill-available';
    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
    if(view.adaptHeight) viewStyle.height = '-webkit-fill-available';
    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';
    return(
        <div id={rootProps.nodeid}
             data-nodeid={rootProps.nodeid}
             data-dataid={rootProps.data?.id}
             data-viewid={rootProps.view?.id}
             data-modelname={rootProps.data?.className}
             data-userselecting={JSON.stringify(rootProps.node?.__raw.isSelected || {})}
             style={{...viewStyle}}
             className={classes.join(' ')}
             onClick={onClick}
             onContextMenu={onContextMenu}
             onMouseEnter={onEnter}
             onMouseLeave={onLeave}
             key={rootProps.key}
        >
            {props.render}
        </div>
    );

}
interface OwnProps {props: VertexProps, render: ReactNode}
interface StateProps {selected: boolean}
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




