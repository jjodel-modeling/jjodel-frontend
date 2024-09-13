import React, {Dispatch} from 'react';
import {DState, DViewElement, LPointerTargetable, LViewElement, Pointer} from '../../../../joiner';
import {JsxEditor} from "../../languages";
import {Function} from "../../../forEndUser/FunctionComponent";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

function TemplateData(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <section className={'p-3'}>
            {/*<TextArea data={view} field={"constants"} label={"Constants"}  readonly={readOnly} />*/}
            {/*<TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"}  readonly={readOnly} />*/}
            <JsxEditor viewid={view.id}  readonly={readOnly} />
        </section>
        <section className={'p-3'}>
            <Function data={view} field={"constants"} jsxLabel={<label className={"d-block jj-editor-title"}>Constants (<i>Evaluated Once</i>)</label>} readonly={readOnly} />
            <Function data={view} field={"usageDeclarations"} jsxLabel={<label className={"d-block jj-editor-title"}>Listed dependencies</label>} readonly={readOnly} />
            { false && <Function data={view} field={"preRenderFunc"} jsxLabel={<label className={"d-block jj-editor-title"}>Preparations before JSX</label>} readonly={readOnly} /> }
        </section>
    </>);
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

export const TemplateDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TemplateData);

export default TemplateDataConnected;
