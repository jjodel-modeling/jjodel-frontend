import React, {Dispatch, JSX, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import toast from "react-hot-toast";
import type {GObject, Pointer, Info} from "../../joiner";
import {
    DPointerTargetable,
    DState,
    GenericInput,
    Log,
    LPointerTargetable,
    Input,
    ISize,
    SetFieldAction
} from "../../joiner";
export let useless=1;

// private
interface ThisState {
}

function SizeInputComponent(props: AllProps): ReactNode {
        let l: LPointerTargetable = props.data;
        let ll: GObject = l;
        let field: keyof LPointerTargetable = props.field as any;
        let otherProps: GObject = {...props};
        delete otherProps.xgetter;
        delete otherProps.xsetter;
        delete otherProps.ygetter;
        delete otherProps.ysetter;
        delete otherProps.wgetter;
        delete otherProps.wsetter;
        delete otherProps.hgetter;
        delete otherProps.hsetter;
        delete otherProps.data;
        delete otherProps.field;
        delete otherProps.label;
        delete otherProps.tooltip;
        delete otherProps.key;

        let tooltip: JSX.Element;
        if (props.tooltip === true) { tooltip = (ll["__info_of__" + field])?.txt || ''; }
        else { tooltip = (props.tooltip || '') as any; }

        const notify = () => toast((t: GObject) => (
            <div onClick={() => toast.dismiss(t.id)}>
                <label className={'ms-1'}>{tooltip}</label>
            </div>
        ));


        let size: Partial<ISize> = (l[field] || {}) as GObject;

        const inputStyle = {justifyContent: "right", width: "auto", marginRight:"5px"};
        let labelStyle = {height: '100%', display: 'inline-block', marginRight:"5px"}
        return (<>
            <label className={props.rootClassName} style={{fontFamily:'Inter Tight', ...(props.rootStyle||{})}}>
                {(props.label) && <label className={'my-auto'} style={{fontFamily:'-webkit-body'}} onClick={() => { if (tooltip) notify() }}>
                    {props.label}
                </label>}
                <label className={"d-flex my-auto ms-auto"} style={{flexWrap: "wrap"}}>
                    {"x" in size && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>x</span>} field={field} type={"number"}
                        getter={(ll)=>(l[field] as any as ISize).x+''}
                        setter={(val)=>{
                            // SetFieldAction.new(l.id, field as string, {x: +val}, '+=', false)
                            (l[field] as any as Partial<ISize>) = {x: +val}; // {y:? x: +val, w:?, h:?}}
                    }}
                        inputStyle={inputStyle}
                    />}
                    {"y" in size && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>y</span>} field={field} type={"number"}
                       getter={(ll)=>(l[field] as any as ISize).y+''}
                       setter={(val)=>{(l[field] as any as Partial<ISize>) = {y: +val}}}
                       inputStyle={inputStyle}
                    />}
                    {"w" in size && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>w</span>} field={field} type={"number"}
                        getter={(ll)=>(l[field] as any as ISize).w+''}
                        setter={(val)=>{(l[field] as any as Partial<ISize>) = {w: +val}}}
                        inputStyle={inputStyle}
                    />}
                    {"h" in size && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>h</span>} field={field} type={"number"}
                       getter={(ll)=>(l[field] as any as ISize).h+''}
                       setter={(val)=>{(l[field] as any as Partial<ISize>) = {h: +val}}}
                       inputStyle={inputStyle}
                    />}
                </label>
            </label>
        </>);
}

// private
interface OwnProps {
    data: LPointerTargetable;
    field: string;
    xgetter?: (data: LPointerTargetable) => string;
    xsetter?: (value: string|boolean) => void;
    ygetter?: (data: LPointerTargetable) => string;
    ysetter?: (value: string|boolean) => void;
    wgetter?: (data: LPointerTargetable) => string;
    wsetter?: (value: string|boolean) => void;
    hgetter?: (data: LPointerTargetable) => string;
    hsetter?: (value: string|boolean) => void;
    label?: ReactNode;
    tooltip?: ReactNode | true; // if true picks it up from __info_of__
    readonly?: boolean;
    key?: React.Key | null;
    className?: string;
    rootClassName?: string;
    inputClassName?: string;
    rootStyle?: GObject;// this goes to root
    style?: GObject; // this goes at the root of <Input> or <Select> element(s)
    inputStyle?: GObject; // this goes to the actual native <input> or <select> element(s)
}

// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const SizeInput = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SizeInputComponent);


SizeInputComponent.cname = "SizeInputComponent";
SizeInput.cname = "SizeInput";
