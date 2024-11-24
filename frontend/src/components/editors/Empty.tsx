import React, {ReactNode} from "react";
type Props = {msg?: ReactNode}
export function Empty(props: Props){
    return <section className={'no-data-to-display'}>
        <label className={'d-block text-center'}>
            {props.msg || 'No Data to display!'}
        </label>
    </section>
}
