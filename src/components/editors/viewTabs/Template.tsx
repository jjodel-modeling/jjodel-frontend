import {LViewElement} from '../../../joiner';
import JsxEditor from '../../rightbar/jsxEditor/JsxEditor';
import {Function} from '../../forEndUser/FunctionComponent';
import React from 'react';

type Props = {view: LViewElement};
function ViewTemplate(props: Props): JSX.Element {
    const {view} = props;
    return(<>
        <JsxEditor viewid={view.id} />
        <section className={'p-3'}>
            <Function data={view} field={'constants'} jsxLabel={<label className={'d-block jj-editor-title'}>Constants(<i>Evaluated Once</i>)</label>} />
            <Function data={view} field={'usageDeclarations'} jsxLabel={<label className={'d-block jj-editor-title'}>Listed dependencies</label>} />
        </section>
    </>);
}

export {ViewTemplate};
