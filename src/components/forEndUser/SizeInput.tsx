import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import toast from "react-hot-toast";
import type {GObject, Pointer, Info} from "../../joiner";
import {DPointerTargetable, DState, GenericInput, Log, LPointerTargetable, Input, ISize} from "../../joiner";
export let useless=1;

// private
interface ThisState {
}

class SizeInputComponent extends PureComponent<AllProps, ThisState>{
    static cname: string;

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        let l: LPointerTargetable = this.props.data;
        let ll: GObject = l;
        let field: keyof LPointerTargetable = this.props.field as any;
        let otherProps: GObject = {...this.props};
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
        if (this.props.tooltip === true) { tooltip = (ll["__info_of__" + field])?.txt || ''; }
        else { tooltip = (this.props.tooltip || '') as any; }

        const notify = () => toast((t: GObject) => (
            <div onClick={() => toast.dismiss(t.id)}>
                <label className={'ms-1'}>{tooltip}</label>
            </div>
        ));

        let size: Partial<ISize> = (l[field] || {}) as GObject;
        return (<>
            <label className={this.props.rootClassName} style={this.props.rootStyle}>
                {(this.props.label) && <label className={'my-auto'} onClick={() => { if (tooltip) notify() }}>
                    {this.props.label}
                </label>}
                <label className={"d-flex my-auto ms-auto"}>
                    {"x" in size && <Input {...otherProps} className={""} data={l} jsxLabel={<span style={{marginRight:"5px"}}>x</span>} field={field}
                        getter={(ll)=>(l[field] as any as ISize).x+''}
                        setter={(val)=>{(l[field] as any as Partial<ISize>) = {x: +val}}}
                        style={{justifyContent: "right"}}
                />}
                {"y" in size && <Input {...otherProps} className={""} data={l} jsxLabel={<span style={{marginRight:"5px"}}>y</span>} field={field}
                       getter={(ll)=>(l[field] as any as ISize).y+''}
                       setter={(val)=>{(l[field] as any as Partial<ISize>) = {y: +val}}}
                       style={{justifyContent: "right"}}
                />}
                {"w" in size && <Input {...otherProps} className={""} data={l} jsxLabel={<span style={{marginRight:"5px"}}>w</span>} field={field}
                        getter={(ll)=>(l[field] as any as ISize).w+''}
                        setter={(val)=>{(l[field] as any as Partial<ISize>) = {w: +val}}}
                        style={{justifyContent: "right"}}
                />}
                {"h" in size && <Input {...otherProps} className={""} data={l} jsxLabel={<span style={{marginRight:"5px"}}>h</span>} field={field}
                       getter={(ll)=>(l[field] as any as ISize).h+''}
                       setter={(val)=>{(l[field] as any as Partial<ISize>) = {h: +val}}}
                       style={{justifyContent: "right"}}
                />}
                </label>
            </label>
        </>); }
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
    label?: JSX.Element | string;
    readonly?: boolean;
    tooltip?: JSX.Element | boolean; // if true picks it up from __info_of__
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
