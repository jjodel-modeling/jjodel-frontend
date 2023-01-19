import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DModel, LModel, LClass, LObject} from "../../model/logicWrapper";
import './M1.scss';
import EObject from "./components/EObject";
import {Pointer} from "../../joiner";

function M1Component(props: AllProps) {

    const model = props.model;
    const classes = model.classes;
    const objects = props.objects;

    const test = (concept: LClass) => {
        concept.instance();
    }

    return <div className={"h-100 w-100"}>
        {/* LEFT BAR */}
        <div className={"concepts-container shadow"}>
            {classes && classes.map((concept: LClass) => {
                return <div className={"item"} onClick={() => test(concept)}>
                    +{concept.name}
                </div>
            })}
        </div>
        {/* GRAPH*/}
        <div className={"m1-graph"}>
            {objects.map((object, index) => {
                return <EObject key={index} object={object} />
            })}
        </div>

    </div>
}
interface OwnProps { modelid: Pointer<DModel, 1, 1, LModel> }
interface StateProps { model: LModel, objects: LObject[] }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const model = LModel.from(ownProps.modelid);
    const objects: LObject[] = [];
    const ids = state.objects;
    for(let id of ids) {
        const object: LObject = LObject.from(id);
        if(model.classes) {
            // here I'm checking if the object is an instance of a class that is in the fixed metamodel
            const check = model.classes.filter((concept) => {return concept.id === object.instanceof[0].id});
            if(check.length > 0) {
                objects.push(object);
            }
        }
    }
    const ret: StateProps = { model, objects };
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

