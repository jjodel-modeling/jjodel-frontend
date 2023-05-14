import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {GObject, SetRootFieldAction} from "../../../joiner";


function EdgeEditorComponent(props: AllProps) {
    const strokeWidth = props.strokeWidth;
    const zIndex = props.zIndex;
    const color = props.color;
    const path = props.path;
    const extend = props.extend;
    const referenceM2 = props.referenceM2;
    const referenceM1 = props.referenceM1;

    const changeOptions = (evt: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>, field: string) => {
        const value = evt.target.value;
        if(value) {
            const options: GObject = {strokeWidth, zIndex, color, path};
            options[field] = value;
            SetRootFieldAction.new('_edgeSettings', options, '', false);
        }
    }

    const changeDisplayed = (evt: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const value = evt.target.checked;
        const options: GObject = {extend, referenceM2, referenceM1};
        options[field] = value;
        SetRootFieldAction.new('_edgesDisplayed', options, '', false);
    }

    return(<div className={"mt-3"}>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Stroke Width</label>
            <input value={strokeWidth} className={"input ms-auto"} type={'number'} step={0.1} min={0}
                   onChange={(evt) => changeOptions(evt, 'strokeWidth')} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Z Index</label>
            <input value={zIndex} className={"input ms-auto"} type={'number'} step={1}
                   onChange={(evt) => changeOptions(evt, 'zIndex')} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Color</label>
            <input value={color} className={"input ms-auto"} type={'color'}
                   onChange={(evt) => changeOptions(evt, 'color')} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Path</label>
            <select value={path} className={"select ms-auto"} onChange={(evt) => changeOptions(evt, 'path')}>
                <option value={'grid'}>Grid</option>
                <option value={'smooth'}>Smooth</option>
                <option value={'straight'}>Straight</option>
            </select>

        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Display Extends</label>
            <input checked={extend} className={"input ms-auto"} type={'checkbox'}
                   onChange={(evt) => changeDisplayed(evt, 'extend')} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Display References on M2</label>
            <input checked={referenceM2} className={"input ms-auto"} type={'checkbox'}
                   onChange={(evt) => changeDisplayed(evt, 'referenceM2')} />
        </div>
        <div className={"d-flex mx-3 mt-1"}>
            <label>Display References on M1</label>
            <input checked={referenceM1} className={"input ms-auto"} type={'checkbox'}
                   onChange={(evt) => changeDisplayed(evt, 'referenceM1')} />
        </div>
    </div>);
}
interface OwnProps { }
interface StateProps {
    strokeWidth: number, zIndex: number, color: string, path: string,
    extend: boolean, referenceM2: boolean, referenceM1: boolean
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const edgeSettings = state._edgeSettings;
    ret.strokeWidth = edgeSettings.strokeWidth;
    ret.zIndex = edgeSettings.zIndex;
    ret.color = edgeSettings.color;
    ret.path = edgeSettings.path;
    const edgesDisplayed = state._edgesDisplayed;
    ret.extend = edgesDisplayed.extend;
    ret.referenceM2 = edgesDisplayed.referenceM2;
    ret.referenceM1 = edgesDisplayed.referenceM1;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EdgeEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeEditorComponent);

export const EdgeEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EdgeEditorConnected {...{...props, children}} />;
}
export default EdgeEditor;
