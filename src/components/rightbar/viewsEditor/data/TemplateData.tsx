import React from 'react';
import {LViewElement, TextArea} from '../../../../joiner';
import JsxEditor from "../../jsxEditor/JsxEditor";
import {Function} from "../../../forEndUser/FunctionComponent";

interface Props {view: LViewElement, readonly: boolean}

function TemplateData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <section className={'p-3'}>
            {/*<TextArea data={view} field={"constants"} label={"Constants"}  readonly={readOnly} />*/}
            {/*<TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"}  readonly={readOnly} />*/}
            <JsxEditor viewid={view.id}  readonly={readOnly} />
        </section>
        <section className={'p-3'}>
            <Function data={view} field={"constants"} jsxLabel={<label>Constants (<i>Evaluated Once</i>)</label>} readonly={readOnly} />
            <Function data={view} field={"usageDeclarations"} jsxLabel={<label>Listed dependencies</label>} readonly={readOnly} />
            { false && <Function data={view} field={"preRenderFunc"} jsxLabel={<label>Preparations before JSX</label>} readonly={readOnly} /> }
        </section>
    </>);
}

export default TemplateData;
