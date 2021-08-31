import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import type {IStore} from "../../redux/store";
import type {DModelElement} from "../../model/dataStructure";
import {LModel, LModelElement} from "../../model/logicWrapper/LModelElement";
import type {GObject, Pointer} from "../../joiner";
import {windoww} from "../../joiner/types";
import {U} from "../../joiner";
// import './bidirectionalinput.scss';

// private
interface ThisState {
    // listAllStateVariables: boolean,
}

class BidirectionalInput extends PureComponent<AllProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        console.log('BidirectionalInput rendering', {thiss: this, props:{...this.props}, field: this.props.field, data: this.props.data, otherprops});
        return (<>
            <input onChange={(e) => data && (data[this.props.field] = (this.props.setter ? this.props.setter(e.target.value) : e.target.value)) }
                   value={data ? (this.props.getter ? this.props.getter(data[this.props.field]) : data[this.props.field]) : 'undef'}
                   {...otherprops} />
        </>); }
}

class BidirectionalTextArea extends PureComponent<AllProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        return (<>
            <textarea onChange={(e) => data && (data[this.props.field] = (this.props.setter ? this.props.setter(e.target.value) : e.target.value)) }
                      {...otherprops} >
                {data && (this.props.getter ? this.props.getter(data[this.props.field]) : data[this.props.field])}
            </textarea>
        </>); }
}

// private
interface OwnProps {
        getter?: ((val: any) => string);
        setter?: ((val: string) => any);
        obj: LModelElement | (Pointer<DModelElement, 0, 'N', LModelElement> & string);
        field: string;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
        data: LModelElement & GObject;
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    console.log("ownProps.obj", ({state, ownProps:{...ownProps}}));
    if (!ownProps.obj) return ret;
    let objid: Pointer<DModelElement, 1, 1, LModelElement> = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = LModelElement.wrap(state.idlookup[objid] as DModelElement);
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret; }

export const InputRawComponent = BidirectionalInput;
export const TextAreaRawComponent = BidirectionalTextArea;
export const TextareaConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalTextArea);
export const InputConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalInput);
export const Input = (props: OwnProps, childrens: (string | React.Component)[] = []): any => {
    console.log('Input wrapper', {props, childrens});
    props = {...props};
    delete (props as any).children;
    return <InputConnected {...props} field={props.field} obj={props.obj} />
}
export const Textarea = (props: OwnProps, childrens: (string | React.Component)[] = []): any => {
    props = {...props};
    delete (props as any).children;
    return <TextareaConnected {...props} field={props.field} obj={props.obj} />
}


if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Textarea = BidirectionalTextArea;
windoww.mycomponents.Input = BidirectionalInput;
