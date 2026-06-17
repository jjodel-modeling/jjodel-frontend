/*
******************************* this is for view->node.  instead NodeEditor is for node *******************************
*/

import React, {Dispatch} from 'react';
import {
    DState,
    DViewElement,
    GenericInput,
    Input,
    LPointerTargetable,
    LViewElement, LVoidVertex,
    Pointer,
    Select
} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {Toggle} from '../../../ui/Toggle/Toggle';
import {SizeInput} from "../../../forEndUser/SizeInput";

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
            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Store Size in View</span>
                <Toggle
                    checked={!!view?.storeSize}
                    onChange={(val) => setField('storeSize', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Lazy Update</span>
                <Toggle
                    checked={!!view?.lazySizeUpdate}
                    onChange={(val) => setField('lazySizeUpdate', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Adapt Width</span>
                <Toggle
                    checked={!!view?.adaptWidth}
                    onChange={(val) => setField('adaptWidth', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Adapt Height</span>
                <Toggle
                    checked={!!view?.adaptHeight}
                    onChange={(val) => setField('adaptHeight', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Draggable</span>
                <Toggle
                    checked={!!view?.draggable}
                    onChange={(val) => setField('draggable', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Resizable</span>
                <Toggle
                    checked={!!view?.resizable}
                    onChange={(val) => setField('resizable', val)}
                    disabled={readOnly}
                    size="sm"
                />
            </div>

            <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Snap</span>
                <SizeInput data={view} readOnly={true}
                           xgetter={(l) => '' + ((l as LVoidVertex).snap.x || 0)}
                           xsetter={(val, l) => l.snap = {x: +val || 0} as any}
                           ygetter={(l) => '' + ((l as LVoidVertex).snap.y || 0)}
                           ysetter={(val, l) => l.snap = {y: +val || 0} as any}
                />
            </div>

            {!dview.adaptWidth && <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Default Width</span>
                <Input data={view} type={"number"} readOnly={readOnly}
                       inputClassName="number-input-compact"
                       inputStyle={{width: '110px', maxWidth: '110px', textAlign: 'left'}}
                       getter={() => (view.defaultVSize?.w || 0).toFixed(2)}
                       setter={(val) => view.defaultVSize = {w: +val} as any}/>
            </div>}

            {!dview.adaptHeight && <div className={'jj-toggle-row'}>
                <span className={'jj-toggle-row__label'}>Default Height</span>
                <Input data={view} type={"number"} readOnly={readOnly}
                       inputClassName="number-input-compact"
                       inputStyle={{width: '110px', maxWidth: '110px', textAlign: 'left'}}
                       getter={() => (view.defaultVSize?.h || 0).toFixed(2)}
                       setter={(val) => view.defaultVSize = {h: +val} as any} />
            </div>}
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

export const NodeData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NodeDataComponent);

export default NodeData;
