import React, {Dispatch} from 'react';
import {DState, DViewElement, LPointerTargetable, LViewElement, Pointer, Select} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

function GraphDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let empty = true;
    // if (empty) return null;
    return(<section>
        <h5>Graph</h5>
        <div className={'px-2 no-padding-left'}>
            <div className={'input-container'}>
                <b className={'me-2'}>Grid coordinates:</b>
                <Select data={view} getter={l => l.grid?.type || "cartesian"} setter={(v, l) => l.grid = {type: v}}>
                    <optgroup label={"Coordinate type"}></optgroup>
                    <option value={'cartesian'}>Cartesian</option>
                    <option value={'polar'}>Polar</option>
                </Select>
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Grid snaps to:</b>
                <Select data={view} getter={(l) => l.grid?.center || "cc"}
                        setter={(val, l) => l.grid = {center: val} as any}>
                    <optgroup label={"Coordinate type"}>
                        <option value={'cc'}>center</option>
                        <option value={'tt'}>top</option>
                        <option value={'ll'}>left</option>
                        <option value={'bb'}>bottom</option>
                        <option value={'rr'}>right</option>
                        <option value={'tl'}>top left</option>
                        <option value={'tr'}>top right</option>
                        <option value={'bl'}>bottom left</option>
                        <option value={'br'}>bottom right</option>
                    </optgroup>
                </Select>
            </div>
        </div>
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly: boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {
}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const GraphData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(GraphDataComponent);

export default GraphData;
