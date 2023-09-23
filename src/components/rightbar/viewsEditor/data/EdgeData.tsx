import React from 'react';
import {GenericInput, GObject, Info, LViewElement} from '../../../../joiner';

interface Props {view: LViewElement, readonly: boolean}
function EdgeData(props: Props) {
    const view = props.view;
    const readOnly = props.readonly;
    let l: GObject & LViewElement = LViewElement.singleton as any;
    let prefixLength = '__info_of__'.length;
    let rows: JSX.Element[] = [];
    for (let fullKey in l) {
        if (fullKey[0] !== '_' || fullKey.indexOf('__info_of__') !== 0) continue;
        let info: Info = l[fullKey];
        // infos[key] = info;
        let key: string = fullKey.substring(prefixLength);
        if (info.hidden || info.obsolete || info.todo) continue;
        if (!info.isEdge) continue;
        rows.push(<GenericInput rootClassName={'mx-3 mt-1 d-flex'} className={'d-flex'} data={view}
                                field={key as any} tooltip={true} info={info} disabled={readOnly} />);
    }

    return(<section className={'p-3'}>
        {rows}
    </section>);
}

export default EdgeData;
