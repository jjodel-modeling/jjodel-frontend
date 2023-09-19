import React from 'react';
import {EdgeBendingMode, Input, LViewElement, LViewPoint} from '../../../../joiner';

interface Props {view: LViewElement, readonly: boolean}

function EdgeData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <section><h1>Edge options</h1>
            <b>to do</b>
            <div>
                <select data-data={view} data-field={"bendingMode"} onChange={(e)=> view.bendingMode = e.target.value as any} value={view.bendingMode} data-value={view.bendingMode}>
                    <optgroup label={"How the edge should bend to address EdgePoints"}>{
                        Object.keys(EdgeBendingMode).map( k => <option value={(EdgeBendingMode as any)[k]}>{k}</option>)
                    }</optgroup></select>

                <Input data={view} field={"edgeEndStopAtBoundaries"} />
                {/*view.*/}
            </div>
        </section>
    </>);
}

export default EdgeData;
