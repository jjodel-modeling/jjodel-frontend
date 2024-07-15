import {
    DAttribute, DClass, DEnumerator, Dictionary, DocString, DReference,
    DState,
    Input, LAttribute, LClass, LClassifier, LEnumerator,
    LGraphElement,
    LModel,
    LModelElement,
    LObject, LPointerTargetable, LReference, LStructuralFeature, LValue,
    LViewElement, Pointer,
    Select,
    Selectors, SetFieldAction, U, ValueDetail
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import Tree from "../forEndUser/Tree";

function SkeletonComponent(props: AllProps) {
    const {data} = props;

    if(!data) return(<section className={'p-2'}>
        <label className={'d-block text-center'}>
            No Data to display!
        </label>
    </section>);
    else return(<section className={'p-2'}>
        <Tree data={data} />
    </section>)

}

interface OwnProps {}
interface StateProps {
    data?: LModelElement
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const dataID = state._lastSelected?.modelElement;
    if(dataID) ret.data = LModelElement.fromPointer(dataID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const SkeletonConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SkeletonComponent);

export const Skeleton = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <SkeletonConnected {...{...props, children}} />;
}
export default Skeleton;
