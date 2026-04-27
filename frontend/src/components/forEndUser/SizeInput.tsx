import React, {Dispatch, JSX, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import { toast } from "../Toast";
import {GObject, Pointer, Info, L, Overlap} from "../../joiner";
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
import {InputInjectProps} from "./Input";
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
        delete otherProps.xlabel;
        delete otherProps.ygetter;
        delete otherProps.ysetter;
        delete otherProps.ylabel;
        delete otherProps.wgetter;
        delete otherProps.wsetter;
        delete otherProps.wlabel;
        delete otherProps.hgetter;
        delete otherProps.hsetter;
        delete otherProps.hlabel;
        delete otherProps.rootClassName;
        delete otherProps.rootStyle;
        delete otherProps.data;
        delete otherProps.field;
        delete otherProps.label;
        delete otherProps.tooltip;
        delete otherProps.key;

        let tooltip: JSX.Element;
        if (props.tooltip === true && field) { tooltip = (ll["__info_of__" + field])?.txt || ''; }
        else { tooltip = (props.tooltip || '') as any; }

        const notify = () => toast({
            message: <label className={'ms-1'}>{tooltip}</label>,
            priority: 'info',
            duration: 4000,
            dismiss: 'auto',
        });


        let getter = (ll: LPointerTargetable, propkey: 'x'|'y'|'w'|'h', f: typeof props.xgetter)=> {
            if (!ll) ll = l;
            if (f) return f(ll, propkey)+'';
            else return (ll[field] as any as ISize)?.[propkey]+'';
        }
        let size: Partial<ISize> = {x: getter(l, 'x', props.xgetter), y: getter(l, 'y', props.ygetter)} as GObject;

        const inputStyle = {justifyContent: "right", width: "auto", marginRight:"5px"};
        let labelStyle = {height: '100%', display: 'inline-block', marginRight:"5px"}
        let allowx = ("x" in size || props.xgetter && props.xsetter);
        let allowy = ("y" in size || props.ygetter && props.ysetter);
        let alloww = ("w" in size || props.wgetter && props.wsetter);
        let allowh = ("h" in size || props.hgetter && props.hsetter);
        let setter = (val: string|boolean, ll: any, propkey: 'x'|'y'|'w'|'h', f: typeof props.xsetter)=> {
            if (!ll) ll = l;
            if (f) return f(val, ll, propkey);
            else return (ll[field] as any as Partial<ISize>) = {[propkey]: +val};
        }
        return (<>
            <label {...otherProps} className={props.rootClassName} style={{fontFamily:'Inter Variable', ...(props.rootStyle||{})}} onClick={(e) => { if (tooltip) notify(); (props as any).onClick?.(e); }}>
                {/*(!!props.label) && <label className={'my-auto'} style={{fontFamily:'-webkit-body'}} >
                    {props.label}
                </label>*/
                props.label}
                <label className={"d-flex my-auto ms-auto"} style={{flexWrap: "wrap"}}>
                    {allowx && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>{props.xlabel||'x'}</span>} field={field} type={"number"}
                        getter={(ll)=>getter(ll, 'x', props.xgetter)}
                        setter={(val, ll: any)=>setter(val, ll, 'x', props.xsetter)}
                        inputStyle={inputStyle}
                    />}
                    {allowy && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>{props.ylabel||'y'}</span>} field={field} type={"number"}
                        getter={(ll)=>getter(ll, 'y', props.ygetter)}
                        setter={(val, ll: any)=>setter(val, ll, 'y', props.ysetter)}
                        inputStyle={inputStyle}
                    />}
                    {alloww && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>{props.wlabel||'w'}</span>} field={field} type={"number"}
                        getter={(ll)=>getter(ll, 'w', props.wgetter)}
                        setter={(val, ll: any)=>setter(val, ll, 'w', props.wsetter)}
                        inputStyle={inputStyle}
                    />}
                    {allowh && <Input {...otherProps} className={""} data={l} label={<span style={labelStyle}>{props.hlabel||'h'}</span>} field={field} type={"number"}
                        getter={(ll)=>getter(ll, 'h', props.hgetter)}
                        setter={(val, ll: any)=>setter(val, ll, 'h', props.hsetter)}
                        inputStyle={inputStyle}
                    />}
                </label>
            </label>
        </>);
}

// private
interface OwnProps<T extends LPointerTargetable = LPointerTargetable>{
    data: T;
    field?: string;
    xgetter?: (data: T, field: string) => string;
    xsetter?: (value: string|boolean, l: any, field: string) => void;
    ygetter?: (data: T, field: string) => string;
    ysetter?: (value: string|boolean, l: any, field: string) => void;
    wgetter?: (data: T, field: string) => string;
    wsetter?: (value: string|boolean, l: any, field: string) => void;
    hgetter?: (data: T, field: string) => string;
    hsetter?: (value: string|boolean, l: any, field: string) => void;
    xlabel?: ReactNode;
    ylabel?: ReactNode;
    wlabel?: ReactNode;
    hlabel?: ReactNode;
    label?: ReactNode;
    tooltip?: ReactNode | true; // if true picks it up from __info_of__
    readOnly?: boolean;
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
    data: LPointerTargetable & GObject;
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}

interface InjectProps{
    dataid?: Pointer<LPointerTargetable>;
}

// private
type AllProps = Overlap<StateProps, Overlap<OwnProps, Overlap<InjectProps, DispatchProps>>>;

////// mapper func

function mapStateToProps(s: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    (ret).data = L.from(ownProps.data as any, s) || L.from((ownProps as  any as InputInjectProps).dataid, s);
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
