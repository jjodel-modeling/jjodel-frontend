import {DPointerTargetable, LClass, LModel, Defaults, U, Input} from '../../joiner';
import {DState, GObject, LEnumerator, LPointerTargetable, Overlap, Pointer} from '../../joiner';
import React, {Dispatch, JSX, LegacyRef, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';


function CountryPickerComponent(props: AllProps) {
    const data = props.data;
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    if (!data) return(<></>);
    let d: DPointerTargetable = data.__raw || data;
    let l: LPointerTargetable = LPointerTargetable.fromD(data); /* ** */
    let gdata: GObject<LPointerTargetable> = data;
    const field: (keyof LPointerTargetable & keyof DPointerTargetable) = props.field as any;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugmode && Defaults.check(data.id);
    const value: string | Pointer = d[field] as string;
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: string|undefined = (props.tooltip === true) ? ((gdata['__info_of__' + field]) ? gdata['__info_of__' + field].txt: '') : props.tooltip;
    tooltip = tooltip || '';
    let css = '';//'my-auto select ';
   // css += (jsxLabel) ? 'ms-1' : 'ms-auto';
    css += (props.hidden) ? ' hidden-input' : '';

    
    /* @ts-ignore */
    const setter = (id) => {l[field].value=id} 
    
    /* @ts-ignore */

    const getter = () => l[field].value;
    

    function CountryPickerChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if (readOnly) return;
        const newValue = evt.target.value; 
        const oldValue = getter(); 

        setter(newValue);
    }

    function getOptions(): any {
        const options = [
            { value: "- Select Country" },
            { value: "Afghanistan" },
            { value: "Aland Islands" },
            { value: "Albania" },
            { value: "Algeria" },
            { value: "American Samoa" },
            { value: "Andorra" },
            { value: "Angola" },
            { value: "Anguilla" },
            { value: "Antarctica" },
            { value: "Antigua and Barbuda" },
            { value: "Argentine Republic" },
            { value: "Armenia" },
            { value: "Aruba" },
            { value: "Australia" },
            { value: "Austria" },
            { value: "Azerbaijan" },
            { value: "Azores" },
            { value: "Bahrain" },
            { value: "Bangladesh" },
            { value: "Barbados" },
            { value: "Belarus" },
            { value: "Belgium" },
            { value: "Belize" },
            { value: "Benin" },
            { value: "Bermuda" },
            { value: "Bhutan" },
            { value: "Bolivia" },
            { value: "Bosnia and Herzegovina" },
            { value: "Botswana" },
            { value: "Bouvet Island" },
            { value: "Brazil" },
            { value: "British Virgin Islands" },
            { value: "Brunei" },
            { value: "Bulgaria" },
            { value: "Burkina Faso" },
            { value: "Burundi" },
            { value: "Cambodia" },
            { value: "Cameroon" },
            { value: "Canada" },
            { value: "Cape Verde" },
            { value: "Cayman Islands" },
            { value: "Central African Republic" },
            { value: "Chad" },
            { value: "Chile" },
            { value: "China" },
            { value: "Christmas Island" },
            { value: "Cocos" },
            { value: "Colombia" },
            { value: "Comoros" },
            { value: "Congo" },
            { value: "Cook Islands" },
            { value: "Costa Rica" },
            { value: "Cote D'Ivoire" },
            { value: "Croatia" },
            { value: "Cuba" },
            { value: "Cyprus" },
            { value: "Czech Republic" },
            { value: "Denmark" },
            { value: "Djibouti" },
            { value: "Dominica" },
            { value: "Dominican Republic" },
            { value: "East Timor" },
            { value: "Ecuador" },
            { value: "Egypt" },
            { value: "El Salvador" },
            { value: "Equatorial Guinea" },
            { value: "Eritrea" },
            { value: "Estonia" },
            { value: "Ethiopia" },
            { value: "Falkland Islands" },
            { value: "Faroe Islands" },
            { value: "Fiji Islands" },
            { value: "Finland" },
            { value: "France" },
            { value: "French Polynesia" },
            { value: "Gabon" },
            { value: "Gambia" },
            { value: "Georgia" },
            { value: "Germany" },
            { value: "Ghana" },
            { value: "Gibraltar" },
            { value: "Greece" },
            { value: "Greenland" },
            { value: "Grenada" },
            { value: "Guadeloupe" },
            { value: "Guam" },
            { value: "Guatemala" },
            { value: "Guernsey" },
            { value: "Guinea" },
            { value: "Guinea-Bissau" },
            { value: "Guyana" },
            { value: "Haiti" },
            { value: "Honduras" },
            { value: "Hong Kong" },
            { value: "Hungary" },
            { value: "Iceland" },
            { value: "India" },
            { value: "Indonesia" },
            { value: "Iran" },
            { value: "Iraq" },
            { value: "Ireland" },
            { value: "Isle of Man" },
            { value: "Israel" },
            { value: "Italy" },
            { value: "Jamaica" },
            { value: "Japan" },
            { value: "Jersey" },
            { value: "Jordan" },
            { value: "Kazakhstan" },
            { value: "Kenya" },
            { value: "Kiribati" },
            { value: "Kuwait" },
            { value: "Kyrgyzstan" },
            { value: "Laos" },
            { value: "Latvia" },
            { value: "Lebanon" },
            { value: "Lesotho" },
            { value: "Liberia" },
            { value: "Libya" },
            { value: "Liechtenstein" },
            { value: "Lithuania" },
            { value: "Luxembourg" },
            { value: "Macau" },
            { value: "Macedonia" },
            { value: "Madagascar" },
            { value: "Malawi" },
            { value: "Malaysia" },
            { value: "Maldives" },
            { value: "Mali" },
            { value: "Malta" },
            { value: "Marshall Islands" },
            { value: "Martinique" },
            { value: "Mauritania" },
            { value: "Mauritius" },
            { value: "Mayotte" },
            { value: "Mexico" },
            { value: "Micronesia" },
            { value: "Moldova Republic of" },
            { value: "Monaco" },
            { value: "Mongolia" },
            { value: "Montenegro" },
            { value: "Montserrat" },
            { value: "Morocco" },
            { value: "Mozambique" },
            { value: "Myanmar" },
            { value: "Namibia" },
            { value: "Nauru" },
            { value: "Nepal" },
            { value: "Netherlands" },
            { value: "Netherlands Antilles" },
            { value: "New Caledonia" },
            { value: "New Zealand" },
            { value: "Nicaragua" },
            { value: "Niger" },
            { value: "Nigeria" },
            { value: "Niue" },
            { value: "Norfolk Island" },
            { value: "Northern Mariana Islands" },
            { value: "North Korea" },
            { value: "Norway" },
            { value: "Oman" },
            { value: "Pakistan" },
            { value: "Palau" },
            { value: "Palestinian" },
            { value: "Panama" },
            { value: "Papua New Guinea" },
            { value: "Paraguay" },
            { value: "Peru" },
            { value: "Philippines" },
            { value: "Pitcairn Island" },
            { value: "Poland" },
            { value: "Puerto Rico" },
            { value: "Qatar" },
            { value: "Reunion" },
            { value: "Romania" },
            { value: "Russia" },
            { value: "Rwanda" },
            { value: "Saint Helena" },
            { value: "Saint Kitts and Nevis" },
            { value: "Saint Lucia" },
            { value: "Saint Pierre and Miquelon" },
            { value: "Saint Vincent The Grenadines" },
            { value: "San Marino" },
            { value: "Sao Tome and Principe" },
            { value: "Saudi Arabia" },
            { value: "Senegal" },
            { value: "Serbia" },
            { value: "Seychelles" },
            { value: "S Georgia Sandwich Islands" },
            { value: "Sierra Leone" },
            { value: "Singapore" },
            { value: "Slovak Republic" },
            { value: "Slovenia" },
            { value: "Solomon Islands" },
            { value: "Somalia" },
            { value: "South Africa" },
            { value: "South Korea" },
            { value: "Spain" },
            { value: "Sri Lanka" },
            { value: "Sudan" },
            { value: "Suriname" },
            { value: "Svalbard" },
            { value: "Swaziland" },
            { value: "Sweden" },
            { value: "Switzerland" },
            { value: "Syria" },
            { value: "Taiwan, Rc" },
            { value: "Tajikistan" },
            { value: "Tanzania" },
            { value: "Thailand" },
            { value: "The Bahamas" },
            { value: "The Congo" },
            { value: "Togolese Republic" },
            { value: "Tokelau" },
            { value: "Tonga" },
            { value: "Trinidad and Tobago" },
            { value: "Tunisia" },
            { value: "Turkey" },
            { value: "Turkmenistan" },
            { value: "Turks and Caicos Islands" },
            { value: "Tuvalu" },
            { value: "Uganda" },
            { value: "Ukraine" },
            { value: "United Arab Emirates" },
            { value: "United Kingdom" },
            { value: "United States of America" },
            { value: "Uruguay" },
            { value: "Uzbekistan" },
            { value: "Vanuatu" },
            { value: "Vatican City" },
            { value: "Venezuela" },
            { value: "Vietnam" },
            { value: "Virgin Islands (US)" },
            { value: "Wallis and Futuna" },
            { value: "Western Sahara" },
            { value: "Western Samoa" },
            { value: "Yemen" },
            { value: "Zambia" },
            { value: "Zimbabwe" }
            ];

        
        return (<>
            <option value="" disabled selected>Select a country</option>
            {options.map(option => (
                data[field].value === option.value ? <option selected>{option.value}</option> : <option>{option.value}</option>
            ))}
            
        </>);
    }

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.primitives;
    delete otherprops.returns;
    delete otherprops.hidden;
    let cursor: string;
    if (tooltip) cursor = 'help';
    else if (readOnly) cursor = 'not-allowed';
    else cursor = 'pointer';
    let inputStyle = props.inputStyle || {};
    if (!inputStyle.cursor && cursor === 'not-allowed') { inputStyle.cursor = cursor; }
    U.objectMergeInPlace(inputStyle, props.inputStyle || {}, props.style || {});
    let className = [props.className, props.inputClassName, css].join(' ');

    let get_options = getOptions();

    let select = (<select {...otherprops} className={className + ' model-select'}  disabled={readOnly}
            style={props.inputStyle}
            value={value}
            onChange={CountryPickerChange}>
                {get_options ? get_options : U.alert('e', 'Error in Selector component', 'Something went wrong ...')}
    </select>);

    


    return select;
}

CountryPickerComponent.cname = 'CountryPickerComponent';
export interface SelectorOwnProps {
    data?: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    tooltip?: boolean|string;
    hidden?: boolean;
    options?: JSX.Element;
    key?: React.Key | null;
    className?: string;
    style?: GObject;
    ref?: React.RefObject<HTMLElement> | LegacyRef<HTMLElement>;
    readonly?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    my_getter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T) => string;
    // setter?: <T extends DPointerTargetable = any>(data: T | Pointer<T>, field: keyof T, selectedValue: string) => void;
    // setter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T, selectedValue: string) => void;
    my_setter?: (data: any, field: string, selectedValue: string) => void;

}
interface StateProps {
    debugmode: boolean,
    data: LPointerTargetable;
    primitives: LClass[];
    returns: LClass[]; }
interface DispatchProps { }

type AllProps = Overlap<SelectorOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: SelectorOwnProps): StateProps {
    const ret: StateProps = {} as any;
    if (!ownProps.data) return ret;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmode = state.debug;
    ret.data = LPointerTargetable.fromPointer(pointer);
    ret.primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    ret.returns = LPointerTargetable.fromPointer(state.returnTypes);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const CountryPickerConnected = connect<StateProps, DispatchProps, SelectorOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(CountryPickerComponent);

export const CountryPicker = (props: SelectorOwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <CountryPickerConnected {...{...props, children}} />;
}


CountryPickerComponent.cname = 'CountryPickerComponent';
CountryPickerConnected.cname = 'CountryPickerConnected';
CountryPicker.cname = 'CountryPicker';
export default CountryPicker;
