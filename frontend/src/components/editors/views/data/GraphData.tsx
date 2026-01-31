import React, {Dispatch} from 'react';
import {
    DState,
    DViewElement,
    Info,
    Input,
    LGraph,
    LPointerTargetable,
    LViewElement,
    Pointer,
    Select
} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {SizeInput} from "../../../forEndUser/SizeInput";
import {Tooltip} from "../../../forEndUser/Tooltip";

function GraphDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let empty = true;
    // if (empty) return null;
    let grid = view.grid;
    return(<section className="graph>
        <h5>Graph</h5>
        <div className={'px-2'}>
            <SizeInput data={view} label={'Grid'}
                       xlabel={grid!.type === 'polar' ? 'modulo' : 'x'}
                       ylabel={grid!.type === 'polar' ? 'angle' : 'y'}
                       xgetter={(l) => '' + ((l as LGraph).grid.x || 0)}
                       xsetter={(val, l) => l.grid = {x: +val || 0} as any}
                       ygetter={(l) => '' + ((l as LGraph).grid.y || 0)}
                       ysetter={(val, l) => l.grid = {y: +val || 0} as any}
                       readOnly={readOnly}
            />
            {/*
            <label className={'input-container'}>
                <b className={'me-2 my-auto'}>Grid coordinates:</b>
                <Tooltip tooltip={Info.grid.txt}>
                    <Select data={view}
                            readOnly={readOnly}
                            getter={l => l.grid?.type || "cartesian"}
                            setter={(v, l) => {
                                l.grid = {type: v};
                            }}>
                        <optgroup label={"Coordinate type"}></optgroup>
                        <option value="cartesian">Cartesian</option>
                        <option value="polar">Polar</option>
                    </Select>
                </Tooltip>
            </label>*/}
            <label className={'input-container'}>
                <b className={'me-2 my-auto'}>Grid snaps to:</b>
                <Select data={view}
                        id='grid'
                        readOnly={readOnly}
                        getter={(l) => l.grid?.center || "cc"}
                        setter={( //@ts-ignore
                            (val, l: LViewElement) => l.grid = {center: val} as any ) as any}>
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
            </label>

            <label className={'input-container'}>
                <b className={'me-2 my-auto  h-auto'}>Grid visible:</b>
                <Input type={'checkbox'}
                       data={view}
                       getter={(l) => l.grid?.visible}
                       setter={((val: boolean, l: LViewElement) => l.grid = {visible: !!val} as any) as any}
                />
            </label>
        </div>
    </section>
);
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
