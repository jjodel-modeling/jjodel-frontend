import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import EValue from "./EValue";
import {LObject} from "../../../model/logicWrapper";
import {GObject, Input, SetRootFieldAction} from "../../../joiner";
import $ from "jquery";

function EObjectComponent(props: AllProps) {

    const object = props.object;
    const name = object.features.filter((feature) => { return feature.instanceof[0].name === 'name' })[0]?.value;

    const select = () => {
        SetRootFieldAction.new('_lastSelected', {
            modelElement: object.id
        });
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

    const click = (e: React.MouseEvent<HTMLDivElement>) => {
        select();
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        e.stopPropagation();
    }

    useEffect(() => {
        const element: GObject = $('[id="' + object.id + '"]');
            element.draggable({
                cursor: "grabbing",
                containment: "parent",
                start: function(event: GObject, obj: GObject) { select() },
                drag: function(event: GObject, obj: GObject) {},
                stop: function (event: GObject, obj: GObject) {}
            });
            element.resizable({
                containment: "parent",
                resize: function(event: GObject, obj: GObject) {}
            });

    });

    return <div
        className={object.className + " default-EObject"}
        id={object.id}
        onClick={click}
        onContextMenu={onContextMenu}>
        <div style={{display: props.selected ? 'none' : 'block', zIndex: 0}} className={"saturated fix-saturated"}></div>
        <div className={"EObject-header"}>
            <div className={"EObject-header-label"}> <b>{object.instanceof[0].name}{(name) ? ':' : ''}</b>
                <label className={"ms-1 my-auto"}>{(name) ? String(name) : ''}</label>
            </div>
        </div>
        <div className={"children"}>
            {(object.features.length > 0) && <div className={"children-EValue"}>
                {object.features.map((value, index) => {
                    return <EValue key={index} value={value} />
                })}
            </div>}
        </div>
    </div>
}
interface OwnProps { object: LObject }
interface StateProps { selected: boolean }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const lastSelected = state._lastSelected?.modelElement;
    const selected = ownProps.object.id === lastSelected;
    const ret: StateProps = {selected};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EObjectConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EObjectComponent);

export const EObject = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EObjectConnected {...{...props, childrens}} />;
}
export default EObject;

