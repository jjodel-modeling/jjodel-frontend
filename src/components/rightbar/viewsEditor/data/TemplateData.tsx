import React from 'react';
import {LViewElement, TextArea} from '../../../../joiner';
import JsxEditor from "../../jsxEditor/JsxEditor";

interface Props {view: LViewElement, readonly: boolean}

function TemplateData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<section className={'p-3'}>
        {/*<TextArea data={view} field={"constants"} label={"Constants"}  readonly={readOnly} />*/}
        {/*<TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"}  readonly={readOnly} />*/}
        <JsxEditor viewid={view.id}  readonly={readOnly} />
    </section>);
}

export default TemplateData;
