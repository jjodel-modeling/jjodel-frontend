/*
******************************* this is for view->node.  instead NodeEditor is for node *******************************
*/

import React, {Dispatch} from 'react';
import {DState, DViewElement, Input, LPointerTargetable, LViewElement, Pointer} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {Toggle} from '../../../ui/Toggle/Toggle';

function NodeDataComponent(props: AllProps) {
    const view = props.view;
    let dview = (view.__raw || view) as DViewElement;
    const readOnly = props.readonly;

    // Helper to update view field
    const setField = (field: string, value: boolean) => {
        if (!readOnly && view) {
            (view as any)[field] = value;
        }
    };

    return(<section className='node'>
        <h5>Vertex</h5>
        <div className={'px-2'}>
            <div className={'input-container'}>
                <b>Store Size in View</b>
                <Toggle
                    checked={!!view?.storeSize}
                    onChange={(val) => setField('storeSize', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>
            <div className={'input-container'}>
                <b>Lazy Update</b>
                <Toggle
                    checked={!!view?.lazySizeUpdate}
                    onChange={(val) => setField('lazySizeUpdate', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'input-container'}>
                <b>Adapt Width</b>
                <Toggle
                    checked={!!view?.adaptWidth}
                    onChange={(val) => setField('adaptWidth', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'input-container'}>
                <b>Adapt Height</b>
                <Toggle
                    checked={!!view?.adaptHeight}
                    onChange={(val) => setField('adaptHeight', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'input-container'}>
                <b>Draggable</b>
                <Toggle
                    checked={!!view?.draggable}
                    onChange={(val) => setField('draggable', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'input-container'}>
                <b>Resizable</b>
                <Toggle
                    checked={!!view?.resizable}
                    onChange={(val) => setField('resizable', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'input-container number-field'} hidden={dview.adaptWidth}>
                <b>Default Width</b>
                <Input data={view} type={"number"} readOnly={readOnly}
                       inputClassName="number-input-compact"
                       getter={() => (view.defaultVSize?.w ?? 0).toFixed(2)}
                       setter={(val) => view.defaultVSize = {w: +val} as any}/>
            </div>

            <div className={'input-container number-field'} hidden={dview.adaptHeight}>
                <b>Default Height</b>
                <Input data={view} type={"number"} readOnly={readOnly}
                       inputClassName="number-input-compact"
                       getter={() => (view.defaultVSize?.h ?? 0).toFixed(2)}
                       setter={(val) => view.defaultVSize = {h: +val} as any} />
            </div>
        </div>
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
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

export const NodeData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NodeDataComponent);

export default NodeData;
