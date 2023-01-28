import {IStore} from "../../../redux/store";
import React, {Dispatch, ReactElement, useEffect, useState} from "react";
import {connect} from "react-redux";
import {LEnumerator, LObject, LStructuralFeature, LValue} from "../../../model/logicWrapper";
import {SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import {Input, Selectors} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


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

    return <div className={value.className + " default-EValue"} id={value.id} onClick={click} onContextMenu={onContextMenu}>
        <div className={"default-EValue-name ms-1"}>
            {feature.name}:&nbsp;<b>{feature.type.name}</b>
        </div>
        {feature.className === "DAttribute" &&  feature.type.className === "DClass" &&
            <div className={"default-EValue-value"}>
                <Input className={css + " transparent-input text-end"} field={"value"} obj={value} type={type}
                       pattern={"[a-zA-Z_\u0024][0-9a-zA-Zd_\u0024]*"}/>
            </div>
        }
        {feature.className === "DAttribute" &&  feature.type.className === "DEnumerator" &&
            <div className={"default-EValue-value"}>
                <select onChange={(event) => {
                    const val = event.target.value;
                    SetFieldAction.new(value.__raw, 'value', val, '', false);
                }}>
                    <option value={0}>-----</option>
                    {(feature.type as LEnumerator).literals.map((literal, index) => {
                        return <option key={index} value={index + 1}>{literal.name}</option>
                    })}
                </select>
            </div>
        }
        {feature.className === "DReference" &&
            <div className={"ms-auto default-EValue-value"}>
                <select className={"transparent-input"} onChange={(event) => {
                    const val = event.target.value;
                    SetFieldAction.new(value.__raw, 'value', val, '', false);
                }}>
                    <option value={'NULL'}>NULL</option>
                    {Selectors.getObjects().filter((obj) => {return obj.instanceof[0].id === value.instanceof[0].type.id}).map((obj) => {
                        return <option value={obj.id}>{obj.name}</option>
                    })}
                </select>
            </div>
        }
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

