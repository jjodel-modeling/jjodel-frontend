import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import EValue from "./EValue";
import {LObject} from "../../../model/logicWrapper";
import {GObject, Input, SetRootFieldAction} from "../../../joiner";
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

    return <div className={object.className + " default-EObject"} id={object.id} onClick={click}>
        <div className={"EObject-header"}>
            <div className={"EObject-header-label"}> <b>{object.instanceof[0].name}:</b>
                <Input className={"mx-1 transparent-input"} field={"name"} obj={object}
                       pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"} />
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

