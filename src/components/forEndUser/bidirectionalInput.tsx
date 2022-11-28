import React, {CSSProperties, Dispatch, LegacyRef, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import type {IStore, GObject, Pointer} from /*type*/ "../../joiner";
import type {
    DModelElement,
    LModelElement,
    AbstractConstructor,
    DAttribute,
    DReference, DParameter, LClass, LEnumerator
} from "../../joiner";
import {
    windoww,
    Selectors,
    RuntimeAccessibleClass,
    Constructor,
    DPointerTargetable,
    OCL,
    DGraph,
    LPointerTargetable, U,
} from "../../joiner";

import Editor from "@monaco-editor/react";
import {types} from "util";

// import './bidirectionalinput.scss';

// private
interface ThisState {
    // listAllStateVariables: boolean,
}

class BidirectionalInput extends PureComponent<AllProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.labelstyle) otherprops.labelstyle = {};
        if (!otherprops.labelstyle.width) otherprops.labelstyle.width = '100%';
        if (!otherprops.inputstyle) otherprops.inputstyle = {};
        if (!otherprops.inputstyle.width) otherprops.inputstyle.width = '100%';
        if (!otherprops.rootstyle) otherprops.rootstyle = {};
        if (!otherprops.rootstyle.width) otherprops.rootstyle.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        delete otherprops.label;
        delete otherprops.key;
        delete otherprops.setter;
        delete otherprops.getter;

        // console.log('BidirectionalInput rendering', {thiss: this, props:{...this.props}, field: this.props.field, data: this.props.data, otherprops});
        // NB: se il setter, getter o qualsiasi props diversa da "data" e "obj" sono proxy, crasha. non puoi passare proxy come props.
        const className = this.props.className || "";
        return (<>
            <label key={otherprops.key} className={"input-root " + (className || "d-flex")} style={this.props.rootstyle}>
                {this.props.label && <p className={"input-label " + (className)} style={this.props.labelstyle}>{this.props.label}</p>}
                <input
                    onChange={(e) => {
                        console.log('BidirectionalInput change', {props:this.props, e});
                        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                        return data && (data[this.props.field] = (this.props.setter ? this.props.setter(value, data) : value))
                    }}
                    value = { '' + (data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_')}
                    checked = { this.props.type === "checkbox" ? data[this.props.field] as boolean : undefined}
                    {...otherprops} className={(className)} style={this.props.inputstyle}/>
            </label>
        </>); }

}

class BidirectionalSelect extends PureComponent<AllSelectProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.style) otherprops.style = {};
        if (!otherprops.style.width) otherprops.style.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        delete otherprops.label;
        delete otherprops.key;
        delete otherprops.setter;
        delete otherprops.getter;
        const primitives = Selectors.getAllPrimitiveTypes(); // damiano: questo va spostato in mapstate to props
        // todo: replace with this.props.data.package.classes? but maybe attrib types can be from other packages in same model & from m3 primitive type def. so model.classes & model.meta.classes ?
        const classes = this.props.data.model.classes;
        const enumerators = this.props.data.model.enums;

        //todo: define hasVoid, hasClasses, ... with data.classname (default=true)
        let hasVoid = true; let hasPrimitive = true; let hasClasses = true; let hasEnumerators = true;
        if(data.className === "DAttribute") { hasVoid = false; hasClasses = false; }
        if(data.className === "DReference") { hasVoid = false; hasPrimitive = false; hasEnumerators = false; }
        if(data.className === "DParameter") { hasVoid = false; }
        // damiano: questo andrebbe invertito. di default setti tutto a let hasClasses = false, e se è un package lo setti a true.
        // perchè altrimenti per d-class non previste (GraphElement, annotations...) risulta a true a meno che non le elenchi tutte.
        // e meglio fare uno switch invece di if-chain
        hasVoid = (this.props.hasVoid !== undefined) ? this.props.hasVoid : hasVoid;
        hasPrimitive = (this.props.hasPrimitive !== undefined) ? this.props.hasPrimitive : hasPrimitive;
        hasClasses = (this.props.hasClasses !== undefined) ? this.props.hasClasses : hasClasses;
        hasEnumerators = (this.props.hasEnumerators !== undefined) ? this.props.hasEnumerators : hasEnumerators; //damiano: queste pure in mapstate, e se non hasPrimitive si può evitare chiamare il selettore per i primitivi

        const className = this.props.className;
        const options = this.props.options ? this.props.options : [];
        return (<>
            <label key={otherprops.key} className={"input-root " + (className || "d-flex")}>
                {this.props.label && <p className={"input-label " + (className || "")}>{this.props.label}</p>}
                <select defaultValue={data.type.id} onChange={(e) => {
                    data[this.props.field] = (this.props.setter ? this.props.setter(e.target.value) : e.target.value)
                }} {...otherprops} className={(className || '')} style={this.props.style} >
                    {hasVoid ? <optgroup label={"Default"}>
                        <option value={undefined}>void</option>
                    </optgroup> : <></>}
                    {hasPrimitive && primitives.length > 0 ? <optgroup label={"Primitives"}>
                        {primitives.map((dPrimitive) => {
                            return <option value={dPrimitive.id}>{dPrimitive.name}</option>
                        })}
                    </optgroup> : <></>}
                    {hasClasses && classes.length > 0 ? <optgroup label={"Classes"}>
                        {classes.map((lClass: LClass) => {
                            return <option value={lClass.id}>{lClass.name}</option>
                        })}
                    </optgroup> : <></>}
                    {hasEnumerators && enumerators.length > 0 ? <optgroup label={"Enumerators"}>
                        {enumerators.map((lEnum: LEnumerator) => {
                            return <option value={lEnum.id}>{lEnum.name}</option>
                        })}
                    </optgroup> : <></>}
                    {options.map((optionGroup) => {
                        if(optionGroup.options.length > 0) {
                            return (<optgroup label={optionGroup.label}>
                                {optionGroup.options.map((model) => {
                                    let dModel: GObject | undefined;
                                    if ((model as GObject).id) {
                                        dModel = model as DModelElement;
                                    } else {
                                        if(model === "void") {
                                            dModel = {id: null, name: "void"}
                                        } else {
                                            dModel = DPointerTargetable.from(model as string);
                                        }
                                    }
                                    return dModel ? <option value={dModel.id}>{dModel.name}</option> : <></>;
                                })}
                            </optgroup>);
                        }
                    })}
                </select>
            </label>
        </>); }
}
interface OptionGroup {
    label: string,
    options: (GObject | string)[]
}

class BidirectionalTextArea extends PureComponent<AllProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.inputstyle) otherprops.inputstyle = {};
        if (!otherprops.inputstyle.width) otherprops.inputstyle.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        delete otherprops.label;
        delete otherprops.key;
        const className = this.props.className || '';
        return (<>
            <div key={otherprops.key} className={"row mt-2 p-1"}>
                <p className={"row my-auto mx-auto"}><b>{this.props.label}</b></p>
                <textarea onChange={(e) => data && (data[this.props.field] = (this.props.setter ? this.props.setter(e.target.value, data) : e.target.value)) }
                        {...otherprops} className={className + "row mx-3 mt-2 form-control"} style={this.props.inputstyle}
                        value={data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_'}>
                </textarea>
            </div>
        </>); }
}

class BidirectionalHTMLEditor extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.inputstyle) otherprops.inputstyle = {};
        if (!otherprops.inputstyle.width) otherprops.inputstyle.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        let code: string | null = null;
        return (<>
            <div style={{marginTop: "5.5em", height: "10em"}} tabIndex={-1} onBlur={(e:any) => {
                if(code != null) {
                    data && (data[this.props.field] = (this.props.setter ? this.props.setter(code, data) : code));
                }}
            }>
                <p className={"row my-auto mx-auto"}><b>{this.props.label}</b></p>
                <Editor className={"row mt-2"} {...otherprops} defaultLanguage="html"
                        value={data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_'}
                        onChange={(e:any) => code=e as string}
                />
            </div>

        </>);
    }
}


class BidirectionalOCLEditor extends PureComponent<AllProps, ThisState>{

    oclContainer? : LegacyRef<HTMLDivElement>
    editor? : any

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.oclContainer = React.createRef();
    }

    componentDidMount() {
        this.loadEditor()
    }

    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<ThisState>, snapshot?: any) {
        //this.loadEditor()
    }

    loadEditor() {
        // @ts-ignore
        this.editor = window.xtext.createEditor({ baseUrl: window.baseUrl,
            serviceUrl: "http://localhost:8085/xtext-service",
            syntaxDefinition: `xtext-resources/generated/mode-ocl.js`,
            enableCors: true, // @ts-ignore
            parent: this.oclContainer.current
        })
    }

    getOclQuery() {
        this.ocltextchanged(this.editor.getValue())
    }

    private ocltextchanged(oclText0: string| boolean): string{
        let oclText = ''+oclText0;
        let state: IStore = windoww.store.getState();
        let dmp: DModelElement[] = Selectors.getAllMP(state);
        let lmp: LModelElement[] = Selectors.wrap(dmp, state);



        console.log('all MP:', dmp, lmp);
        let constructors: Constructor[] = RuntimeAccessibleClass.getAllClasses() as (Constructor|AbstractConstructor)[] as Constructor[];
        let valids: DPointerTargetable[] = [];
        try { valids = OCL.filter(true, "src", lmp, oclText, constructors) as DPointerTargetable[]; }
        catch (e) { console.error('invalid ocl query:', {e, oclText, dmp, lmp});}
        let out: { $matched: JQuery<HTMLElement>, $notMatched: JQuery<HTMLElement>} = {} as any;
        console.log('filtered MP', {dmp, lmp, valids, validfilled:valids.filter(b=>!!b)});
        let $htmlmatch: JQuery<HTMLElement> = DGraph.getNodes(valids.filter(b=>!!b) as DModelElement[], out);
        console.log('filtered MP', {dmp, lmp, valids, $htmlmatch});
        out.$notMatched.removeClass('ocl_match');

        $htmlmatch.addClass('ocl_match');
        return oclText;
    }

    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.style) otherprops.style = {};
        if (!otherprops.style.width) otherprops.style.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"

        return (<>
            <div className={"mt-2"} style={{height: "7em"}}>
                <div className={"row"}>
                    <p className={"col my-auto mx-auto mb-2"}><b>{this.props.label}</b></p>
                    <button onClick={() => this.getOclQuery()} style={{borderRadius: "100px", maxWidth: "2.5em"}}
                            className={"col btn btn-success"}><i className="fa fa-arrow-right"></i>
                    </button>
                </div>
                <div style={{marginTop: ".5em", height: "12em"}} data-editor-xtext-lang={"ocl"} ref={this.oclContainer}>
                </div>
            </div>
        </>);
    }
}

// private
interface OwnProps {
    getter?: ((val: any, baseobj: GObject, key: string) => string); // why there is value here?
    setter?: ((val: string|boolean, data?: LPointerTargetable) => any);
    obj: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
        //LPointerTargetable | (Pointer<DPointerTargetable, 0, 'N', LPointerTargetable> & string);
    field: string;
    label?: string;
    type? : 'button'|'checkbox'|'color'|'date'|'datetime-local'|'email' |'file' |'hidden' |'image' |'month' |
            'number' |'password' |'radio' |'range' |'reset' |'search' |'submit' |'tel' |'text' |'time' |'url' |'week';
    className?: string;
    id?: string;
    key?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number|'any';
    disabled?: boolean;
    readonly?: boolean;
    rootstyle?: CSSProperties;
    labelstyle?: CSSProperties;
    inputstyle?: CSSProperties;
    wrap?: boolean;
    // propsRequestedFromHtmlAsAttributes: string;
}
interface OwnSelectProps extends OwnProps{
    type?: never;
    placeholder?: never;
    min?: never;
    max?: never;
    step?: never;
    disabled?: boolean;
    readonly?: boolean;
    style?: CSSProperties;
    wrap?: boolean;
    options?: OptionGroup[];
    hasVoid?: boolean;
    hasPrimitive?: boolean;
    hasClasses?: boolean;
    hasEnumerators?: boolean;
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


// private
type AllProps = OwnProps & StateProps & DispatchProps;
type AllSelectProps = OwnSelectProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    console.log("ownProps.obj", ({state, ownProps:{...ownProps}}));
    if (!ownProps.obj) return ret;
    let objid: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = ownProps.wrap === false ? ownProps.obj as any : LPointerTargetable.wrap(state.idlookup[objid]) || ownProps.obj;
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret; }

export const InputRawComponent = BidirectionalInput;
export const SelectRawComponent = BidirectionalSelect;
export const TextAreaRawComponent = BidirectionalTextArea;
export const HTMLEditorRawComponent = BidirectionalHTMLEditor;
export const OCLEditorRawComponent = BidirectionalOCLEditor;
export const InputConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalInput);
export const SelectConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalSelect);
export const TextareaConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalTextArea);
export const HTMLEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalHTMLEditor);
export const OCLEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalOCLEditor as any);

export const Input = (props: GObject & OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // props = {...props};
    // delete (props as any).children;
    return <InputConnected {...props} field={props.field} obj={props.obj} />
}

export const Select = (props: OwnSelectProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <SelectConnected {...props} field={props.field} obj={props.obj} /> // todo: might let directly accept childrens instead of OptionGroups
}

export const Textarea = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // props = {...props};
    // delete (props as any).children;
    return <TextareaConnected {...props} field={props.field} obj={props.obj} />
}


export const HTMLEditor = (props: GObject & OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // props = {...props};
    // delete (props as any).children;
    return <HTMLEditorConnected {...props} field={props.field} obj={props.obj} />
}

export const OCLEditor = (props: GObject & OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <OCLEditorConnected {...props} field={props.field} obj={props.obj} />
}

if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Input = BidirectionalInput;
windoww.mycomponents.Select = BidirectionalSelect;
windoww.mycomponents.Textarea = BidirectionalTextArea;
windoww.mycomponents.OCLEditor = BidirectionalOCLEditor;
windoww.mycomponents.HTMLEditor = BidirectionalHTMLEditor;
