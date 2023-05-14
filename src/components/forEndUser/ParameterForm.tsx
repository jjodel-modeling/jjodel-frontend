// import type {
//     Overlap,
//     GObject,
//     Pointer,
//     IStore,
//     DPointerTargetable,
//     LOperation,
//     Dictionary,
//     DocString
// } from "../../joiner";
// import React, {Dispatch, ReactElement, ReactNode} from "react";
// import {connect} from "react-redux";
// import toast, {Toaster} from 'react-hot-toast';
// import {DObject, DOperation, LObject, LParameter, LPointerTargetable} from "../../joiner";
// import Input from "./Input";
//
//
// function ParameterFormComponent(props: AllProps) {
//     if (!props.object) return(<b>missing object</b>);
//     if (!props.operation) return(<b>missing operation</b>);
//     let operation: LOperation = props.operation;
//     let object: LObject = props.object;
//     let parameters: LParameter[] = props.operation.parameters;
//     const initialState: Dictionary<DocString<"Parameter name">, any /*"Parameter value"*/> = operation.defaultValues;
//     const [state, setState0] = React.useState(initialState);
//     // const setState = (obj:GObject) => setState0({...state, ...obj});
//     const setState = (key: string, value: any) => { let o = {...state}; o[key] = value; setState0(o); }
//     function submit(evt: React.MouseEvent) {
//         console.log("submit clicked", {state, evt, operation, object});
//         const paramValues = state;
//         operation.execute(object, ...parameters.map(p => paramValues[p.name])); // ...args must be array in the same position as they are in ".parameters"
//     }
//
//     // damiano: servono getter e setter sul nuovo Input, per questo caso, per visualizzare una cosa e settare un'altra (visualizzo e scrivo @object_1 ma setto Pointer_47_5449489...) per settare N valori in un colpo( "["val1", "val2", "val3", ...]" ) e altri casi simili
//     return <div className={"parameter-form-root hover-root"}>
//         <div className={"hover-preview"}>Execute →</div>
//         <div className={"hover-content"}>
//             { parameters.map(p => <Input label={p.name} obj={p.id} setter={(val: any)=> { setState(p.name, val) } } getter={(val: any, data: LParameter, key: string) => state[p.name] }/>) }
//             <button onClick={submit} />
//         </div>
//     </div>
//
//
// }
// interface OwnProps {
//     operation: LOperation | DOperation | Pointer<DOperation, 1, 1, LOperation>;
//     object: LObject | DObject | Pointer<DObject, 1, 1, LObject>;
//     field: string;
//     label?: string;
//     jsxLabel?: ReactNode;
//     type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
//         'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
//     readonly?: boolean;
//     tooltip?: string;
//     hidden?: boolean;
//     autosize?: boolean;
//     inputClassName?: string;
//     asLabel?: boolean
// }
// interface StateProps {
//     operation: LOperation;
//     object: LObject;
// }
// type ThisState = Dictionary<"name of parameters", GObject<"value of param">>;
// interface DispatchProps { }
// type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;
//
//
// function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
//     const ret: StateProps = {} as any;
//     const objectptr: Pointer = typeof ownProps.object === 'string' ? ownProps.object : ownProps.object.id;
//     ret.object = LPointerTargetable.fromPointer(objectptr);
//     const opptr: Pointer = typeof ownProps.operation === 'string' ? ownProps.operation : ownProps.operation.id;
//     ret.operation = LPointerTargetable.fromPointer(opptr);
//     return ret;
// }
//
// function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
//     const ret: DispatchProps = {};
//     return ret;
// }
//
//
// export const FormConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
//     mapStateToProps,
//     mapDispatchToProps
// )(ParameterFormComponent);
//
// export const ParameterForm = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
//     return <FormConnected {...{...props, children}} />;
// }
// (window as any).ParameterForm = ParameterForm;
//
//
//
//
//
export const fakeexport = 1;
