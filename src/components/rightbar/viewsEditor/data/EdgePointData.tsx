import React from 'react';
import {CoordinateMode, LViewElement} from '../../../../joiner';
import {EdgeGapMode} from "../../../../joiner/types";

interface Props {view: LViewElement, readonly: boolean}

function EdgePointData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;

    return(<>
        <section><h1>EdgePoint options</h1>
            <b>to do</b>
            <div>
                <select data-data={view} data-field={"edgePointCoordMode"} onChange={(e)=> view.edgePointCoordMode = e.target.value as any}
                        value={view.edgePointCoordMode} data-value={view.edgePointCoordMode}>
                    <optgroup label={"How the edge should bend to address EdgePoints"}>{
                        Object.keys(CoordinateMode).map( k => <option value={(CoordinateMode as any)[k]}>{k}</option>)
                    }</optgroup></select>
                <select data-data={view} data-field={"edgeGapMode"} onChange={(e)=> view.edgeGapMode = e.target.value as any}
                        value={view.edgeGapMode} data-value={view.edgeGapMode}>
                    <optgroup label={"How to stop upon meeting an EdgePoint"}>{
                        Object.keys(EdgeGapMode).map( k => <option value={(EdgeGapMode as any)[k]}>{k}</option>)
                    }</optgroup></select>
            </div>
        </section>
    </>);
}

export default EdgePointData;
