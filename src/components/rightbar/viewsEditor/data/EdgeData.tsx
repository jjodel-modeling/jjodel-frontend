import React from 'react';
import {
    Dictionary,
    DViewElement,
    EdgeBendingMode,
    GenericInput,
    GObject,
    Info,
    Input,
    LViewElement,
    LViewPoint
} from '../../../../joiner';

interface Props {view: LViewElement, readonly: boolean}

function EdgeData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;
    let l: GObject & LViewElement = LViewElement.singleton as any;
    let prefixLength = "__info_of__".length;
    let rows: JSX.Element[] = [];
    for (let fullkey in l) {
        if (fullkey[0] !== "_" || fullkey.indexOf("__info_of__") !== 0) continue;
        let info: Info = l[fullkey];
        // infos[key] = info;
        let key: string = fullkey.substring(prefixLength);
        if (info.hidden || info.obsolete || info.todo) continue;
        if (!info.isEdge) continue;
        rows.push(//<div className={"d-flex mx-3 mt-1  w-100 capitalize-first-letter"}>{
            <GenericInput rootClassName={"mx-3 mt-1 d-flex"} className={"d-flex"} data={view} field={key as any} infoof={info} disabled={readOnly}/>
            // }</div>
        );
    }

    return(<>
        <section>
            {rows}
        </section>
    </>);
}

export default EdgeData;
