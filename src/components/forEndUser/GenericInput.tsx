import React, {Dispatch, InputHTMLAttributes, PureComponent, ReactNode} from 'react';
import {connect} from 'react-redux';
import './GenericInput.scss';
import {
    Dictionary,
    DocString,
    DPointerTargetable,
    DState,
    DViewElement,
    GObject,
    Info,
    Input,
    Log,
    LPointerTargetable,
    LViewElement,
    RuntimeAccessibleClass,
    Select,
    ShortAttribETypes,
    TextArea,
    U
} from '../../joiner';
import {SizeInput} from './SizeInput';
import {JavascriptEditor} from "../editors/languages";

// private
interface ThisState {
}
type Dic<K extends string|number, V> = Dictionary<K, V>;
type String<T> = DocString<T>;
class GenericInputComponent extends PureComponent<AllProps, ThisState/*undefined*/>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        let d: DViewElement = ((this.props.data as LPointerTargetable).__raw || this.props.data) as any;
        let l: LViewElement = LPointerTargetable.wrap(this.props.data) as LViewElement;
        let field: keyof LViewElement = this.props.field as any;
        let info: GObject<Info>;
        if (!this.props.info){
            let DConstructor: typeof DPointerTargetable = RuntimeAccessibleClass.get(d.className);
            let singleton: GObject<LPointerTargetable> = DConstructor.singleton;
            info = singleton['__info_of__' + this.props.field] ;
        } else info = this.props.info;
        if (!info) {
            Log.eDevv("<GenericInput/> could not find info of " + this.props.field, {props:this.props});
            return <></>;
        }

        let type: string;
        let enumOptions: Dic<String<'optgroup'>, Dic<String<'options'>, String<'values'>>> = {}; // 'Options' entry is a fallback for items without an optgroup
        let enumOptionsJSX: JSX.Element | undefined;
        if (info.enum) {
            type = 'EEnum';
            let prevoptgroup: string = 'Options';
            let group: string;
            let option: string;
            for (let key in info.enum) {
                let val: string = info.enum[key];
                if (key.indexOf('(') === 0) {
                    let end = key.indexOf(')');
                    group = key.substring(1, end).trim();
                    option = key.substring(end + 1).trim();
                    prevoptgroup = group;
                } else {
                    option = key;
                    group = prevoptgroup;
                }
                if (!enumOptions[group]) enumOptions[group] = {};
                enumOptions[group][option] = val;
            }
            let unsorted = enumOptions.Options;
            delete enumOptions.Options;
            enumOptionsJSX = <>
                {
                    //data-selected={l[field] === unsorted[optkey]}
                    unsorted && Object.keys(unsorted).map((optKey: string) => <option value={unsorted[optKey]}>{optKey}</option>)
                }
                {Object.keys(enumOptions).map((grpKey: string) => <optgroup label={grpKey}>{
                Object.keys(enumOptions[grpKey]).map( (optKey: string) => <option value={enumOptions[grpKey][optKey]}>{optKey}</option>)
            }</optgroup>)}</>;
        }
        else {
            if (typeof info.type === 'string') {
                if (info.type.toLowerCase().indexOf('function') === 0) type = 'Function';
                else type = info.type as any;
            }
            else {
                if (!info.type) { Log.exDevv('missing __info_of__ type for ' + d.className + '.' + this.props.field, {d, info, props: this.props}); return <></>}
                let infoType: GObject = info.type;
                type = infoType.cname || infoType.className || infoType.name;
                Log.exDev(!type, 'missing type:', {type, info});
            }
        }

        /*if (type.indexOf('|') !== -1) {
            type = 'EEnum';
            let options = type.split('|');
            if (!enumOptions.Option) enumOptions.Option = {};
            for (let o in options){
                o = o.trim();
                enumOptions.Option[o] = o;
            }
        }*/

        // const otherProps: {[inputattribute:HTMLInputTypeAttribute]: any} = {...this.props};
        const otherProps: InputHTMLAttributes<Event> = {...this.props} as any;
        function setMinMax(max: number): void {
            if (info.min !== undefined) otherProps.min = info.min;
            else otherProps.min = info.positive === true ? 0 : -max / 2; // assume false if non specified

            if (info.max !== undefined) otherProps.max = info.max;
            else otherProps.max = info.positive === false ? max/2 - 1 : max-1; // assume true if non specified
        }

        let label: ReactNode = info.label || this.props.field;
        if (typeof label === "string") label = U.uppercaseFirstLetter(info.label || this.props.field);

        if (type.toLowerCase().indexOf("function(") >=0 || type.indexOf("()=>") >=0) type = "Function";
        switch (type.toLowerCase()) {
            default:
                Log.ee('invalid type in GenericInput', {type, props:this.props, info, d});
                return <div {...otherProps as any} className={'danger'} style={{color: 'red', border: '1px solid red'}}>Invalid GInput type: '{type}'</div>;
            case 'point': case 'graphpoint': case 'size': case 'graphSsize':
                return <SizeInput {...otherProps} data={l} field={this.props.field} label={label} />;
            case 'text':
                return <TextArea inputClassName={'input my-auto ms-auto '} {...otherProps as any} className={(this.props.rootClassName||'')+' '+(this.props.className||'')}
                                 data={this.props.data} field={this.props.field}
                                 jsxLabel={label} tooltip={this.props.tooltip} />;
            case 'function':
                return <JavascriptEditor className={(this.props.rootClassName||'')+' '+(this.props.className||'')} placeHolder={this.props.placeholder}
                                         jsxLabel={this.props.label}
                                         data={this.props.data} field={this.props.field} tooltip={this.props.tooltip}
                                         hide={this.props.hide} style={this.props.style} title={this.props.title}
                                         getter={this.props.getter} setter={this.props.setter} key={this.props.key}
                                         readonly={this.props.readOnly}
                                         height={this.props.height}
                                         {...otherProps as any /*not working? i had to list them all*/}  />;
            case 'eenum':
                return <Select inputClassName={'my-auto ms-auto select'} {...otherProps as any} className={this.props.rootClassName}
                               data={this.props.data} field={this.props.field} options={enumOptionsJSX}
                               jsxLabel={label} tooltip={this.props.tooltip} />;
                // <input> natives
            case 'radio':
                // problem: this would need to return a <form> and multiple inputs generated by a single element.
                // it should be easy but unlikely it will be needed so i won't do it for now.
                Log.eDevv('radio input type is unsupported'); break;
            case 'datetime': type = 'datetime-local'; break;
            case 'color': break;
            case 'email': break;
            case 'image': break; // ?
            case 'password': break;
            case 'range': break;
            case 'month': break;
            case 'week': break;
            case 'datetime-local': break;
            case 'time': break;
            case 'url': break;
            // ecore
            case ShortAttribETypes.EChar.toLowerCase():
                type = 'text';
                if (undefined === otherProps.minLength) otherProps.minLength = 1;
                otherProps.maxLength = 1;
                // otherProps.pattern = '^.{1}$';
                break;
            case "string":
            case ShortAttribETypes.EString.toLowerCase(): type = 'text'; break;
            case ShortAttribETypes.EBoolean.toLowerCase(): type = 'checkbox'; break;
            case ShortAttribETypes.EByte.toLowerCase():
                type = 'number';
                setMinMax(2**8);
                break;
            case ShortAttribETypes.EShort.toLowerCase():
                type = 'number';
                setMinMax(2**16);
                break;
            case ShortAttribETypes.EInt.toLowerCase():
                type = 'number';
                setMinMax(2**32);
                break;
            case ShortAttribETypes.ELong.toLowerCase():
                type = 'number';
                setMinMax(2**64);
                break;
            case ShortAttribETypes.EFloat.toLowerCase():
            case ShortAttribETypes.EDouble.toLowerCase():
                type = 'number';
                if (!otherProps.step) otherProps.step = info.step || 0.1;
                if (!otherProps.pattern) otherProps.pattern = info.pattern || '^[0-9]+\.[0-9]{' + info.digits + '}$';
                break;
            case ShortAttribETypes.EDate.toLowerCase(): type = 'datetime-local'; break;
        }
        let className = (this.props.className || '') + ' ' + ( this.props.rootClassName||'');
        // delete otherProps.field; delete otherProps.data; delete otherProps.infoof;
        return <Input {...otherProps} className={className}
                      data={this.props.data} field={this.props.field}
                      jsxLabel={label} tooltip={this.props.tooltip} type={type as any}/>;
    }
}

// private
interface _OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
    data: DPointerTargetable | LPointerTargetable;
    field: string;
    key?: string;
    label?: ReactNode;
    title?: ReactNode;
    info?: Info | undefined;
    tooltip?: boolean|string;

    className?: string;
    rootClassName?: string;
    inputClassName?: string;
    rootStyle?: GObject;// this goes to root
    style?: GObject; // this goes at the root of <Input> or <Select> element(s)
    inputStyle?: GObject; // this goes to the actual native <input> or <select> element(s)
    hide?: undefined | boolean; // for autohiding Javascript editor
    getter?: <T extends LPointerTargetable>(data: T, field: DocString<"keyof T">) => string;
    setter?: <T extends LPointerTargetable>(value: string|boolean, data: T, field: DocString<"keyof T">) => void;

    /*
    they might be useful, but can just add them in without declaring all of them. i pass them like <input ...otherprops>
    multiple?: boolean;  // multi value for select! works on file, email (just changes default validation pattern), and maybe others
    size?: ??
    accept?: string // only for type = 'file'
    capture?: string // only for type = 'file'
    autocomplete?: string; // only for <input> types
    disabled?: boolean;
    height?: string; // for 'image'
    list?: string; // datalist
    maxLength?: string; // chars
    */
    // many more skipped mostly for forms

}
type OwnProps = _OwnProps & InputHTMLAttributes<Event>; // {[inputattribute:HTMLInputAttribute]: any};
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


export const GenericInput = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(GenericInputComponent);


/*

Supported __info_of__.type values:


- ShortAttribETypes     =   ecore type names
- text                  =   for textarea
- Function              =   for textarea
- richtext              =   for monaco editor
- native <input> types
- DPointerTargetable    = will make a select out of available elements of that kind
- GraphPoint            = will make a mini interactive square where you can select a point, output is in % [0, 1].
                          NEED A SETTER AND GETTER to get from % to coords and the other way
- GraphSize             = will make a mini interactive square where you can select a rectangle, output is in % [0, 1].
                          NEED A SETTER AND GETTER to get from % to coords and the other way


- typescript enumerators, with optgroups defined as following
        (optgroup1) option1
        option2 // assumed still in optgroup1
        option3 // assumed still in optgroup1
        (optgroup2) option4
        if first option(s) are without optgroup, they are grouped in optgroup 'Options'

NOT SUPPORT
- 'EEnum' string, it is only used internally. pass it the whole enum.
native <input> not supported
- radio
- tel
- search
- reset
- hidden
- image
- button
- submit








* */
