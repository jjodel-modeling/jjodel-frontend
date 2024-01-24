import React, {CSSProperties, Dispatch, LegacyRef, PureComponent, ReactElement, ReactNode} from "react";
import {
    AbstractConstructor,
    Constructor, DGraph,
    DModelElement, DPointerTargetable,
    GObject,
    DState,
    LModelElement, LPointerTargetable, OCL, Pointer,
    RuntimeAccessibleClass,
    Selectors,
    windoww,
    Log
} from "../../joiner";
import {connect} from "react-redux";


interface ThisState {
    // listAllStateVariables: boolean,
}

class BidirectionalOCLEditor extends PureComponent<AllProps, ThisState>{
    static cname: string = "BidirectionalOCLEditor";

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
        this.loadEditor()
    }

    loadEditor() {
        const xtext = (window as GObject).xtext;
        const url = (window as GObject).baseUrl;
        if(xtext && url) {
            this.editor = xtext.createEditor({ baseUrl: url,
                serviceUrl: "http://localhost:8085/xtext-service",
                syntaxDefinition: `xtext-resources/generated/mode-ocl.js`,
                enableCors: true, // @ts-ignore
                parent: this.oclContainer.current
            })
        }
    }

    getOclQuery() {
        this.ocltextchanged(this.editor.getValue())
    }

    private ocltextchanged(oclText0: string| boolean): string{
        let oclText = ''+oclText0;
        let state: DState = windoww.store.getState();
        let dmp: DModelElement[] = Selectors.getAllMP(state);
        let lmp: LModelElement[] = Selectors.wrap(dmp, state);

        console.log('all MP:', dmp, lmp);
        let constructors: Constructor[] = RuntimeAccessibleClass.getAllClasses() as (Constructor|AbstractConstructor)[] as Constructor[];
        let valids: DPointerTargetable[] = [];
        try { valids = OCL.filter(true, "src", lmp, oclText, constructors) as DPointerTargetable[]; }
        catch (e) { Log.ee('invalid ocl query:', {e, oclText, dmp, lmp});}
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
                    <button onClick={() => this.getOclQuery()} className={"col btn btn-success"} style={{maxWidth: '3em'}}>
                        <i className="bi bi-arrow-right"></i>
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
    getter?: ((val: any, baseobj: GObject, key: string) => string); // val is default value used without a getter = baseobj[key]
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
    tooltip?: string;
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
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    console.log("ownProps.obj", ({state, ownProps:{...ownProps}}));
    if (!ownProps.obj) return ret;
    let objid: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = ownProps.wrap === false ? ownProps.obj as any : LPointerTargetable.wrap(state.idlookup[objid]) || ownProps.obj;
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret; }
export const OCLEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, mapDispatchToProps)(BidirectionalOCLEditor as any);
OCLEditorConnected.cname = "OCLEditorConnected";
export const OCLEditorAce = (props: GObject & OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <OCLEditorConnected {...props} field={props.field} obj={props.obj} />
}

BidirectionalOCLEditor.cname = "BidirectionalOCLEditor";
OCLEditorConnected.cname = "OCLEditorConnected";
OCLEditorAce.cname = "OCLEditorAce";
