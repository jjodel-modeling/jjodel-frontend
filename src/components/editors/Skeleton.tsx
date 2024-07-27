import type {FakeStateProps} from '../../joiner/types';
import {DState, LModelElement,} from '../../joiner';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './skeleton.scss';
import Tree from "../forEndUser/Tree";

function SkeletonComponent(props: AllProps) {
    const {data} = props;

    if(!data) return(<section>
        <label className={'d-block text-center'}>
            No Data to display!
        </label>
    </section>);
    else return(<section>
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
