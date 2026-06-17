/* Viewpoints > Options */

import React, {Dispatch} from 'react';
import {DState, DViewElement, LPointerTargetable, LViewElement, Pointer, Select} from '../../../../joiner';
import {FakeStateProps} from '../../../../joiner/types';
import {connect} from 'react-redux';

function FieldDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let dview = view.__raw;
    /*const changeFN = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        view.forceNodeType = value;
        // SetFieldAction.new(dview.id, 'forceNodeType', value, '', false);
    }*/

    const appliableTo = dview.appliableTo;
    let preferredDisplay: string = dview.forceNodeType as string;
    switch (appliableTo){
        case undefined: case 'Any': break;
        case 'GraphVertex': if (preferredDisplay !== 'Graph' || (preferredDisplay as any) !== 'Vertex') preferredDisplay = appliableTo; break;
        default: preferredDisplay = appliableTo; break;
    }
    const graphElementOptions = [{
        label: 'Type of GraphElement',
        options: ['Any', 'Graph', 'GraphVertex', 'Vertex', 'Edge', 'EdgePoint', 'Field'].map(o => ({ value: o, label: o })),
    }];
    return(<section className={'options-field'}>
        <h5>Field</h5>
        <div className={'jj-field'}>
            <div className={'jj-field-label'}>Applicable to</div>
            <Select data={view} field={'appliableTo'}
                    readOnly={readOnly}
                    jjSelect={true}
                    options={graphElementOptions as any}
                    getter={() => dview.appliableTo || 'Any'}
                    setter={(v: string, data: DViewElement, field: string, )=>view.appliableTo = v as any} />
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

export const FieldData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(FieldDataComponent);

export default FieldData;
