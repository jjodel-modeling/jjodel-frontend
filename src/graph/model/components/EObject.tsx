import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import EValue from "./EValue";
import {LObject} from "../../../model/logicWrapper";
import {GObject, SetRootFieldAction} from "../../../joiner";
import $ from "jquery";

function EObjectComponent(props: AllProps) {

    const object = props.object;

    const click = (e: React.MouseEvent<HTMLDivElement>) => {
        SetRootFieldAction.new('_lastSelected', {
            modelElement: object.id
        });
        e.stopPropagation();
    }

    useEffect(() => {
        const element: GObject = $('[id="' + object.id + '"]');
            element.draggable({
                cursor: "grabbing",
                containment: "parent",
                drag: function(event: GObject, obj: GObject) {},
                stop: function (event: GObject, obj: GObject) {}
            });
            element.resizable({
                containment: "parent",
                resize: function(event: GObject, obj: GObject) {}
            });

    });

    return <div className={"EObject-container"} id={object.id} onClick={click}>
        <h5>{object.name}</h5>
        {object.features.map((value, index) => {
            return <EValue key={index} value={value} />
        })}
    </div>
}
interface OwnProps { object: LObject }
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
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

