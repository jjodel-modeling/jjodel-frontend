import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect, useState} from "react";
import {connect} from "react-redux";
import {
    DEnumerator,
    LClass,
    LClassifier,
    LEnumerator,
    LObject,
    LStructuralFeature,
    LValue
} from "../../../model/logicWrapper";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import {Input, Selectors} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {isNullOrUndefined} from "util";


function EValueComponent(props: AllProps) {

    const value = props.value;
    const feature: LStructuralFeature = LStructuralFeature.from(value.instanceof[0]);
    const [type, setType] = useStateIfMounted<'text'|'checkbox'|'number'>('text');
    const [css, setCss] = useStateIfMounted('');

    useEffect(() => {
        switch(value.instanceof[0].type.name) {
            case 'EString': setType('text'); break;
            case 'EInt': setType('number'); break;
            case 'EBoolean': setType('checkbox'); break;
        }
        if(type !== "checkbox") {
            setCss('w-85')
        } else {
            setCss('my-auto');
        }
    })

    const select = () => {
        SetRootFieldAction.new('_lastSelected', {
            modelElement: value.id
        });
    }

    const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        select();
        SetRootFieldAction.new("contextMenu", {
            display: true,
            x: e.clientX,
            y: e.clientY
        });
        e.preventDefault();
        e.stopPropagation();
    }

    const click = (e: React.MouseEvent<HTMLDivElement>) => {
        select();
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        e.stopPropagation();
    }

    const typeValue: LClassifier|LClass|LEnumerator = value.instanceof[0].type;

    /*
    return <div className={value.className + " default-EValue"} id={value.id} onClick={click} onContextMenu={onContextMenu}>
        <div className={"default-EValue-name ms-1"}>
            {feature.name}:&nbsp;<b>{feature.type.name}</b>
        </div>

        <div className={"ms-auto d-block"}>
            {(value.value.length > 1) && <select style={{fontSize: '.9rem'}} className={"my-auto transparent-input"} defaultValue={0}>
                {value.value.map((raw, index) => {
                    if(typeValue.className === 'DEnumerator') {
                        return <option>{String((typeValue as LEnumerator).literals[parseInt(raw as any) - 1])}</option>
                    } else {
                        return <option>{String(raw)}</option>
                    }
                })}
            </select>}
            {(value.value.length === 1 && typeValue.className === 'DEnumerator') && <label>
                {String((typeValue as LEnumerator).literals[value.value[0] as number - 1])}
            </label>}
            {(value.value.length === 1 && value.instanceof[0].className === 'DReference') && <label>
                {(value.value[0] as LObject).name || 'NULL'}
            </label>}
            {(value.value.length === 1 && typeValue.className !== 'DEnumerator' && value.instanceof[0].className !== 'DReference') && <label className={"me-1"}>
                {String(value.value[0])}
            </label>}
            {(value.value.length === 0) && <label></label>}
        </div>
    </div>
    */
    return <></>;
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

