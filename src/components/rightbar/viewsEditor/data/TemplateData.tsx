import React from 'react';
import {LViewElement, TextArea} from '../../../../joiner';
import JsxEditor from "../../jsxEditor/JsxEditor";

interface Props {view: LViewElement, readonly: boolean}

function TemplateData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <TextArea data={view} field={"constants"} label={"Constants"} />
        <TextArea data={view} field={"preRenderFunc"} label={"PreRender Function"} />
        <JsxEditor viewid={view.id} />
    </>);
}

export default TemplateData;
