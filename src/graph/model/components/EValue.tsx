import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect, useState} from "react";
import {connect} from "react-redux";
import {LStructuralFeature, LValue} from "../../../model/logicWrapper";
import {SetRootFieldAction} from "../../../redux/action/action";
import {Input} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


function EValueComponent(props: AllProps) {

    const value = props.value;
    const feature: LStructuralFeature = LStructuralFeature.from(value.instanceof[0]);
    const [type, setType] = useStateIfMounted('text');
    const [css, setCss] = useStateIfMounted('');

    useEffect(() => {
        switch(value.instanceof[0].type.name) {
            case 'EString': setType('text'); break;
            case 'EInt': setType('number'); break;
            case 'EBoolean': setType('checkbox'); break;
        }
        if(type !== "checkbox") {
            setCss('w-75')
        } else {
            setCss('my-auto');
        }
    })



    const click = (e: React.MouseEvent<HTMLDivElement>) => {
        SetRootFieldAction.new('_lastSelected', {
            modelElement: value.id
        });
        e.stopPropagation();
    }

    return <div className={value.className + " default-EValue"} id={value.id} onClick={click}>
        <div className={"default-EValue-name ms-1"}>
            {feature.name}
        </div>
        <div className={"default-EValue-value"}>
            <Input className={css + " transparent-input text-end"} field={"value"} obj={value} type={type as any}
                   pattern={"[a-zA-Z_\u0024][0-9a-zA-Zd_\u0024]*"} />
        </div>
    </div>
}
interface OwnProps { value: LValue }
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EValueConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EValueComponent);

export const EValue = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <EValueConnected {...{...props, childrens}} />;
}
export default EValue;

