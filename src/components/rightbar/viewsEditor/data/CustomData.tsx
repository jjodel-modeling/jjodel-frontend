import React, {Dispatch, ReactElement} from 'react';
import {DState, DViewElement, LViewElement, Pointer} from '../../../../joiner';
import {connect} from "react-redux";
import {Function} from "../../../forEndUser/FunctionComponent";

function CustomDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let constants = (view.constants && view.constants !== '{}') ? view.constants?.replaceAll(' ', '').slice(1, -1).split(',') : [];
    let variables = (view.preRenderFunc && view.preRenderFunc !== '() => {return{}}') ? view.preRenderFunc?.replaceAll(' ', '').slice(12, -2).split(',') : [];


    const addConst = () => {
        if(constants.length) view.constants = `${view.constants?.slice(0, -1)}, myConst: 'dummy'}`;
        else view.constants = `{myConst: 'dummy'}`;
    }

    const removeConst = (index: number) => {
        delete constants[index];
        view.constants = (`{${constants.filter(c => c).toString()}}`);
    }

    const blurNameConst = (index: number, name: string) => {
        if(readOnly) return;
        if(!name) name = 'myConst';
        const value = constants[index].split(':')[1];
        constants[index] = `${name.replaceAll(' ', '')}: ${value}`;
        view.constants = (`{${constants.toString()}}`);
    }

    const blurValueConst = (index: number, value: string) => {
        if(readOnly) return;
        if(!value) value = 'dummy';
        const name = constants[index].split(':')[0];
        constants[index] = `${name}: ${value}`;
        view.constants = (`{${constants.toString()}}`);
    }

    const addVar = () => {
        if(variables.length) view.preRenderFunc = `${view.preRenderFunc?.slice(0, -2)}, myVar: 'dummy'}}`;
        else view.preRenderFunc = `() => {return{myVar: 'dummy'}}`;
    }

    const removeVar = (index: number) => {
        delete variables[index];
        view.preRenderFunc = (`() => {return{${variables.filter(c => c).toString()}}}`);
    }

    const blurNameVar = (index: number, name: string) => {
        if(readOnly) return;
        if(!name) name = 'myVar';
        const value = variables[index].split(':')[1];
        variables[index] = `${name.replaceAll(' ', '')}: ${value}`;
        view.preRenderFunc = (`() => {return{${variables.toString()}}}`);
    }

    const blurValueVar = (index: number, value: string) => {
        if(readOnly) return;
        if(!value) value = 'dummy';
        const name = variables[index].split(':')[0];
        variables[index] = `${name}: ${value}`;
        view.preRenderFunc = (`() => {return{${variables.toString()}}}`);
    }


    return(<section className={'p-3'}>
        <Function data={view} field={"constants"} jsxLabel={<label>Constants (<i>Evaluated Once</i>)</label>} readonly={readOnly} />
        {false && <div className={'d-flex w-100 mb-2'}>
            <label>Constants (<i>Evaluated Once</i>) </label>
            <button className={'btn btn-primary ms-auto'} onClick={addConst} disabled={readOnly}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>}
        {false && constants.map((constant, index) => {
            const c = constant.split(':');
            const name = c[0].replaceAll(' ', ''); const value = c[1];
            return(<div className={'d-flex p-1'} key={index}>
            <input key={index + 'name' + name} className={'input w-25'} tabIndex={-1} onBlur={e => blurNameConst(index, e.target.value)}
            defaultValue={name} readOnly={readOnly} />
            <b className={'mx-1 my-auto'}>=</b>
            <input key={index + 'value' + value} className={'input w-25'} tabIndex={-1} onBlur={e => blurValueConst(index, e.target.value)}
            defaultValue={value} readOnly={readOnly} />
            <button className={'btn btn-danger ms-2'} disabled={readOnly} onClick={e => removeConst(index)}>
            <i className={'p-1 bi bi-trash3-fill'}></i>
            </button>
            </div>)
        })}

        {false && <div className={'d-flex w-100 mt-4 mb-2'}>
            <label>Variables (<i>Evaluated Foreach Render</i>)</label>
            <button className={'btn btn-primary ms-auto'} onClick={addVar} disabled={readOnly}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>}
        {false && variables.map((variable, index) => {
            const v = variable.split(':');
            const name = v[0].replaceAll(' ', ''); const value = v[1];
            return(<div className={'d-flex p-1'} key={index}>
                <input key={index + 'name' + name} className={'input w-25'} tabIndex={-1} onBlur={e => blurNameVar(index, e.target.value)}
                       defaultValue={name} readOnly={readOnly}  />
                <b className={'mx-1 my-auto'}>=</b>
                <input key={index + 'value' + value} className={'input w-25'} tabIndex={-1} onBlur={e => blurValueVar(index, e.target.value)}
                       defaultValue={value} readOnly={readOnly} />
                <button className={'btn btn-danger ms-2'} disabled={readOnly} onClick={e => removeVar(index)}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>)
        })}
        <Function data={view} field={"usageDeclarations"} jsxLabel={<label>Listed dependencies</label>} readonly={readOnly} />
    </section>);
}

interface OwnProps {viewID: Pointer<DViewElement, 1, 1, LViewElement>, readonly: boolean}
interface StateProps {view: LViewElement}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const view = LViewElement.fromPointer(ownProps.viewID);
    return {view};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const CustomDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(CustomDataComponent);

export const CustomData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <CustomDataConnected {...{...props, children}} />;
}
export default CustomData;
