import {IStore} from "../../redux/store";
import React, {Dispatch, MouseEventHandler, ReactElement} from "react";
import {connect} from "react-redux";
import {DObject, DValue, LClass, LObject, LValue} from "../../model/logicWrapper";
import './M1.scss';
import {
    CreateElementAction,
    LPointerTargetable,
    Pointer, SetFieldAction,
    SetRootFieldAction,
    U,
    WPointerTargetable
} from "../../joiner";
import { DefaultNode } from "../../joiner/components";

function M1Component(props: AllProps) {

    const click = (concept: LClass) => {
        if(concept.instance) {
            console.log('ok')
        }
    }

    return <div className={"h-100 w-100"}>

        {/* LEFT BAR */}
        <div className={"concepts-container shadow"}>
            {props.concepts.map((concept) => {
                return <div className={"item"} onClick={() => click(concept)}>
                    +{concept.name}
                </div>
            })}
            <button className={"btn btn-success"} onClick={() => {
                const obj: LObject = props.objects[0];
                const ref = props.concepts[0]?.references[0];
                if(obj && obj.features[0]) {
                    U.log(obj.features[0].value);
                    const val = DValue.new('reference');
                    val.instanceof = [ref.id];
                    val.value = obj.id;
                    CreateElementAction.new(val);
                    SetFieldAction.new(obj, 'features', val.id,'+=', false);
                }

            }}>asss</button>


        </div>

        <div className={"m1-graph"}>
            {props.objects.map((object) => { return <DefaultNode data={object.id} graphid={props.graphid} nodeid={props.nodeid} /> })}
        </div>

    </div>
}
interface OwnProps {nodeid: string, graphid: string}
interface StateProps { concepts: LClass[]; objects: LObject[] }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const concepts: LClass[] = [];
    const objects: LObject[] = [];
    let index = 0;
    for(let dClass of state.classs) {
        if (index > 5) concepts.push(LClass.from(dClass));
        index += 1;
    }
    for(let object of state.objects) { objects.push(LObject.from(object)); }
    const ret: StateProps = { concepts, objects };
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const M1Connected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(M1Component);

export const M1 = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <M1Connected {...{...props, childrens}} />;
}
export default M1;

