import {IStore} from "../../redux/store";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import type {DModel, Pointer} from "../../joiner";
import {LClass, LClassifier, LModel, LObject} from "../../joiner";
import ReferenceEdge from "./ReferenceEdge";
import ExtendEdge from "./ExtendEdge";
import ValueEdge from "./ValueEdge";

interface IReferenceEdge { source: LClass, target: LClassifier, containment: boolean }
interface IExtendEdge { source: LClass, target: LClass }
interface IValueEdge { source: LObject, target: LObject }
function EdgesManagerComponent(props: AllProps) {
    const model = props.model;

    const classes = model.classes ? [...model.classes] : [];
    const _references: IReferenceEdge[] = [];
    const _extends: IExtendEdge[] = [];
    for(let classifier of classes) {
        for(let reference of classifier.references) {
            _references.push({source: reference.father, target: reference.type, containment: reference.containment});
        }
        for(let father of classifier.extends) {
            _extends.push({source: classifier, target: father});
        }
    }

    const objects = model.objects;
    const _values: IValueEdge[] = [];
    for(let object of objects) {
        console.log('testing', object)
        for(let feature of object.features) {
            const instanceOf = feature.instanceof;
            if(instanceOf.className === 'DReference') {
                const values = feature.value;
                if(Array.isArray(values)) {
                    for(let value of values) {
                        if(value && value !== 'null') {
                            _values.push({source: object, target: value as LObject})
                        }
                    }
                } else {
                    if(values && values !== 'null') {
                        _values.push({source: object, target: values as LObject})
                    }
                }
            }
        }
    }

    return <div>
        {_references.map((referenceEdge, index) => {
            const source = referenceEdge.source.nodes[0];
            const target = referenceEdge.target.nodes[0];
            const containment = referenceEdge.containment;
            if(source && target) {
                return(<ReferenceEdge key={index} sourceID={source.id} targetID={target.id} containment={containment} />);
            }
        })}
        {_extends.map((extendEdge, index) => {
            const source = extendEdge.source.nodes[0];
            const target = extendEdge.target.nodes[0];
            if(source && target) {
                return(<ExtendEdge key={index} sourceID={source.id} targetID={target.id} />);
            }
        })}
        {_values.map((valueEdge, index) => {
            const source = valueEdge.source.nodes[0];
            const target = valueEdge.target.nodes[0];
            if(source && target) {
                return(<ValueEdge key={index} sourceID={source.id} targetID={target.id} />);
            }
        })}
    </div>
}
interface OwnProps { modelid: Pointer<DModel, 1, 1, LModel> }
interface StateProps { model: LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = { } as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgesManagerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgesManagerComponent);

export const EdgesManager = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EdgesManagerConnected {...{...props, childrens}} />;
}
export default EdgesManager;
