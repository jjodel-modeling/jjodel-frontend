import React, {ReactNode} from "react";
type Props = {msg?: ReactNode}
export function Empty(props: Props){
    return <section>
        <label className={'d-block text-center'}>
            {props.msg || 'No Data to display!'}
        </label>
    </section>
}
