/* Viewpoints > Template */

import React, {Dispatch} from 'react';
import {DState, DViewElement, LPointerTargetable, LViewElement, Pointer} from '../../../../joiner';
import {JsxEditor} from "../../languages";
import {Function} from "../../../forEndUser/FunctionComponent";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {HRule} from '../../../widgets/Widgets';
import {HelpText} from '../../../ui';

function TemplateData(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <section className={'p-3 template-tab'}>
            {/* Inert runtime notice, same pattern as the Events tab (CustomData): a view
                without an `ir` has no engine left to interpret its jsxString. The editor
                stays mounted and readable on purpose (the template is the only surviving
                trace of the original notation) but is opened read-only by ViewData. */}
            {props.legacyNoIR && (
                <HelpText>
                    Questo template non viene più interpretato. Il rendering usa la notazione
                    astratta; per definire una sintassi concreta, abilita l'IR.
                </HelpText>
            )}
            {/*<TextArea data={view} field={"constants"} label={"Constants"}  readonly={readOnly} />*/}
            {/*<TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"}  readonly={readOnly} />*/}
            <JsxEditor viewid={view.id} readOnly={readOnly} />
            <HRule theme={'light'} style={{paddingTop: '40px!important', display: 'block'}}/>
            <Function
                data={view}
                field={"constants"}
                getter={(l)=> (l as LViewElement).__raw.constants || ''}
                jsxLabel={<label className={"d-block jj-editor-title"}>Constants</label>}
                payoff={'Evaluated once'}
                readOnly={readOnly}
            />

            <Function
                data={view}
                field={"usageDeclarations"}
                jsxLabel={<label className={"d-block jj-editor-title"}>Observed properties</label>}
                readOnly={readOnly}
            />

            { false && <Function data={view} field={"preRenderFunc"} jsxLabel={<label className={"d-block jj-editor-title"}>Preparations before JSX</label>} readOnly={readOnly} /> }

        </section>
    </>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
    /** View without an `ir`: the jsxString has no interpreter left (classic shutdown,
     *  Fase 5a). Drives the inert-runtime notice only; the read-only gate travels on
     *  `readonly`, which ViewData raises for the same views. */
    legacyNoIR?: boolean;
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
