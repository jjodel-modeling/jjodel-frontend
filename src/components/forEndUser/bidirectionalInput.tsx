import React, {CSSProperties, Dispatch, LegacyRef, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import type {IStore, GObject, Pointer} from /*type*/ "../../joiner";
import {
    windoww,
    DModelElement,
    LModelElement,
    DPointerTargetable,
    LPointerTargetable,
    MyProxyHandler, Selectors, Constructor, RuntimeAccessibleClass, AbstractConstructor, OCL, DGraph
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
        if (!otherprops.style) otherprops.style = {};
        if (!otherprops.style.width) otherprops.style.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        delete otherprops.label;
        delete otherprops.key;
        delete otherprops.setter;
        delete otherprops.getter;

        // console.log('BidirectionalInput rendering', {thiss: this, props:{...this.props}, field: this.props.field, data: this.props.data, otherprops});
        // NB: se il setter, getter o qualsiasi props diversa da "data" e "obj" sono proxy, crasha. non puoi passare proxy come props.
        const className = this.props.className;
        return (<>
            <label key={otherprops.key} className={"input-root " + (className || "row mt-2 p-1")}>
                {this.props.label && <p className={"input-label " + (className || "col my-auto mx-auto")}>{this.props.label}</p>}
                <input
                    onChange={(e) => {
                        console.log('BidirectionalInput change', {props:this.props, e});
                        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                        return data && (data[this.props.field] = (this.props.setter ? this.props.setter(value) : value))
                    }}
                    value = { '' + (data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_')}
                    checked = { this.props.type === "checkbox" ? data[this.props.field] as boolean : undefined}
                    {...otherprops} className={(className || ' col pt-3 pb-3 form-check-input my-auto mx-auto')} style={this.props.style}/>
            </label>
        </>); }

}

class BidirectionalTextArea extends PureComponent<AllProps, ThisState> {
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.style) otherprops.style = {};
        if (!otherprops.style.width) otherprops.style.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        delete otherprops.label;
        delete otherprops.key;
        const className = this.props.className || '';
        return (<>
            <div key={otherprops.key} className={"row mt-2 p-1"}>
                <p className={"row my-auto mx-auto"}><b>{this.props.label}</b></p>
                <textarea onChange={(e) => data && (data[this.props.field] = (this.props.setter ? this.props.setter(e.target.value) : e.target.value)) }
                        {...otherprops} className={className + "row mx-3 mt-2 form-control"} style={this.props.style}
                        value={data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_'}>
                </textarea>
            </div>
        </>); }
}

class BidirectionalHTMLEditor extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        const data = this.props.data;
        const otherprops: GObject = {...this.props};
        if (!otherprops.style) otherprops.style = {};
        if (!otherprops.style.width) otherprops.style.width = '100%';
        delete otherprops.data; // tenta di settare l'attributo data con un proxy e fallisce perchè non è stringa
        delete otherprops.obj; // obj è stato wrappato come proxy in "data"
        let code: string | null = null;
        return (<>
            <div style={{marginTop: "5.5em", height: "7em"}} tabIndex={-1} onBlur={(e:any) => {
                if(code != null) {
                    data && (data[this.props.field] = (this.props.setter ? this.props.setter(code) : code));
                }}
            }>
                <p className={"row my-auto mx-auto"}><b>{this.props.label}</b></p>
                <Editor className={"row mt-2"} {...otherprops} defaultLanguage="html"
                        value={data ? (this.props.getter ? this.props.getter(data[this.props.field], data, this.props.field) : data[this.props.field]) : '_undefined_'}
                        onChange={(e:any) => code=e as string}/>
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
        getter?: ((val: any, baseobj: GObject, key: string) => string);
        setter?: ((val: string|boolean) => any);
        obj: GObject | (Pointer<DPointerTargetable, 0, 'N', LPointerTargetable> & string);
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
        style?: CSSProperties;
        wrap?: boolean;
    // propsRequestedFromHtmlAsAttributes: string;
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

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    console.log("ownProps.obj", ({state, ownProps:{...ownProps}}));
    if (!ownProps.obj) return ret;
    let objid: Pointer<DModelElement, 1, 1, LModelElement> = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = ownProps.wrap === false ? ownProps.obj as any : DPointerTargetable.wrap(state.idlookup[objid]) as LPointerTargetable || ownProps.obj;
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret; }

export const InputRawComponent = BidirectionalInput;
export const TextAreaRawComponent = BidirectionalTextArea;
export const HTMLEditorRawComponent = BidirectionalHTMLEditor;
export const OCLEditorRawComponent = BidirectionalOCLEditor;
export const TextareaConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalTextArea);
export const InputConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalInput);
export  const HTMLEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalHTMLEditor);
export  const OCLEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(mapStateToProps, mapDispatchToProps)(BidirectionalOCLEditor as any);

export const Textarea = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // props = {...props};
    // delete (props as any).children;
    return <TextareaConnected {...props} field={props.field} obj={props.obj} />
}

export const Input = (props: GObject & OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // props = {...props};
    // delete (props as any).children;
    return <InputConnected {...props} field={props.field} obj={props.obj} />
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
windoww.mycomponents.Textarea = BidirectionalTextArea;
windoww.mycomponents.Input = BidirectionalInput;
windoww.mycomponents.HTMLEditor = BidirectionalHTMLEditor;
windoww.mycomponents.OCLEditor = BidirectionalOCLEditor;
