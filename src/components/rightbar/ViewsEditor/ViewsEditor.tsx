import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import type {Constructor, AbstractConstructor} from "../../../joiner";
import {
    Selectors,
    U,
    IStore,
    Input,
    Pointer,
    DGraphElement,
    DViewElement,
    DModelElement,
    LGraphElement,
    LViewElement,
    LModelElement,
    DPointerTargetable,
    DNamedElement,
    LNamedElement,
    windoww,
    Textarea,
    DModel,
    LModel,
    HTMLEditor,
    GObject,
    LGraph,
    Graph,
    Vertex,
    CreateElementAction,
    GraphSize,
    DeleteElementAction,
    SetRootFieldAction,
    LPointerTargetable,
    MyProxyHandler,
    DGraph,
    RuntimeAccessibleClass,
    OCL,
    OCLEditor,
    DReference,
    LReference, LClass,
} from "../../../joiner";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// private
interface ThisState {
}

const MySwal = withReactContent(Swal);

class ViewsEditorComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
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

    render(): ReactNode{
        const views = this.props.views;
        const viewsStack = this.props.stackViews;
        let ocltemp = {ocltmp:''};

        if(viewsStack.length > 0){
            const view = viewsStack[viewsStack.length - 1]
            const data = this.props.data as LViewElement;
            var inputstyle  = {marginTop:'25px'};
            return (<div className={"bg-light mx-3"}>
                <div className={"row mb-4"}>
                    <button style={{maxWidth: "3em"}} className={"col btn btn-danger"}
                            onClick={(e) => {
                                //POP: GO BACK
                                SetRootFieldAction.new('stackViews', undefined, '-=', true);
                            }}>
                        <i className={"fas fa-long-arrow-alt-left"} />
                    </button>
                    <h4 className={"col"}>GRAPHICAL SYNTAX LAYER</h4>
                    <button style={{maxWidth: "3em"}} className={"col btn btn-danger"}
                            onClick={async(e) => {
                                const confirm = await MySwal.fire({
                                    title: <span>Are you sure you want to delete this view?</span>,
                                    showCancelButton: true,
                                    confirmButtonText: 'Confirm',
                                    showLoaderOnConfirm: true,
                                })
                                if(confirm.value === true){
                                    //POP: DELETE VIEW
                                    SetRootFieldAction.new('stackViews', undefined, '-=', true);
                                    new DeleteElementAction(view.__raw);
                                }
                            }}>
                        <i className="fas fa-trash-alt" />
                    </button>

                </div>
                <div>
                    <Input obj={view} field={"name"} label={"Name"}/>
                    <div className={"row"}>
                        <div className={"col"}><Input obj={view} field={'width'} label={"Width"} type={"number"} /></div>
                        <div className={"col"}><Input obj={view} field={'height'} label={"Height"} type={"number"} /></div>
                    </div>
                    <div className={"row"}>
                        <div className={"col"}><Input obj={view} field={'adaptWidth'} label={"Adapt width to content"} type={"checkbox"} /></div>
                        <div className={"col"}><Input obj={view} field={'adaptHeight'} label={"Adapt height to content"} type={"checkbox"} /></div>
                    </div>

                    <OCLEditor obj={view} field={'ocl'} label={"Editor OCL"}/>
                    <HTMLEditor obj={view} field={'jsxString'} label={"Editor HTML"} />
                    <input
                        defaultValue ={"context DClass inv: self.attrib_3.editCount>-1"} // context DClass inv: self.className.length >20
                        onChange={(e) => this.ocltextchanged(e.target.value)} style={inputstyle} />
                </div>
                <div className={"row mt-5"}>
                    <h5 className={"my-auto col"}>SUB VIEWS</h5>
                    <button style={{maxWidth: "3em"}} className={"btn btn-success col"} onClick={async(e) => {
                        // INSERT SUBVIEW
                        let inputOptions = {};
                        for(let subView of Selectors.getAllViewElements()){
                            // @ts-ignore
                            inputOptions[subView.id] = subView.name;
                        }
                        const viewPointer = await MySwal.fire({
                            title: <span>Add subview</span>,
                            input: 'select',
                            inputOptions: inputOptions,
                            inputAttributes: {required: 'true', autocapitalize: 'off', placeholder: "New view", list: 'model-datalist'},
                            showCancelButton: true,
                            confirmButtonText: 'Add',
                            showLoaderOnConfirm: true,
                        })
                        if(viewPointer.value !== undefined) {
                            let pointers: string[] = []
                            for(let subView of view.subViews){
                                pointers.push(subView.id)
                            }
                            pointers.push(viewPointer.value);
                            (data as any)['subViews'] = pointers;
                        }
                    }}>
                        <i className={"fas fa-plus"} />
                    </button>
                </div>

                {
                    view.subViews.map( (subView: LViewElement, index: number) => (
                        <>
                            <div className={"mt-2 p-1 border border-dark row"}>
                                <div className={"col my-auto"}>{subView.name}</div>
                                <button style={{maxWidth: '3em'}} className={"me-1 col btn btn-primary"}
                                        onClick={async(e) => {
                                            //PUSH: CLICK SUBVIEW
                                            SetRootFieldAction.new('stackViews', subView.id, '+=', true);
                                        }}>
                                    <i className={"fas fa-info"} />
                                </button>
                                <button style={{maxWidth: "3em"}} className={"ms-1 col btn btn-danger"} onClick={async(e) => {
                                    // DELETE SUBVIEW
                                    const confirm = await MySwal.fire({
                                        title: <span>Are you sure you want to remove this subview?</span>,
                                        showCancelButton: true,
                                        confirmButtonText: 'Confirm',
                                        showLoaderOnConfirm: true,
                                    })
                                    if(confirm.value === true) {
                                        let pointers: string[] = []
                                        for(let subView of view.subViews){
                                            pointers.push(subView.id)
                                        }
                                        pointers.splice(index, 1);
                                        (data as any)['subViews'] = pointers;
                                    }
                                }}>
                                    <i className="fas fa-times" />
                                </button>
                            </div>
                        </>
                    ))
                }
            </div>);
        }
        else{
            return (<div className={"bg-light  mx-3"}>
                <div className={"row"}>
                    <h4 className={"col"}>GRAPHICAL SYNTAX LAYER</h4>
                    <button style={{maxWidth: "3em"}} className={"col btn btn-success"}
                            onClick={async(e) => {
                                const viewName = await MySwal.fire({
                                    title: <span>Add a view with which name?</span>,
                                    input: 'text',
                                    inputLabel: 'View name',
                                    inputAttributes: {required: 'true', autocapitalize: 'off', placeholder: "New view", list: 'model-datalist'},
                                    showCancelButton: true,
                                    confirmButtonText: 'Add',
                                    showLoaderOnConfirm: true,
                                })
                                if(viewName.value !== undefined) {
                                    const newView = DViewElement.new(viewName.value, '');
                                    CreateElementAction.new(newView);
                                    //PUSH: ADD VIEW
                                    SetRootFieldAction.new('stackViews', newView.id, '+=', true);
                                }
                            }}>
                        <i className={"fas fa-plus"} />
                    </button>
                </div>
                {
                    views.map( (view: LViewElement) => (
                        <>
                            {
                                <div className={"row mt-2 p-1 border border-dark"}>
                                    <div className={"col my-auto"}>{view.name}</div>
                                    <button style={{maxWidth: '3em'}} className={"me-1 col btn btn-primary"}
                                            onClick={(e) => {
                                                //PUSH: CLICK VIEW
                                                SetRootFieldAction.new('stackViews', view.id, '+=', true);
                                            }}>
                                        <i className={"fas fa-info"} />
                                    </button>
                                    <button style={{maxWidth: "3em"}} className={"col btn btn-danger"}
                                            onClick={async(e) => {
                                                const confirm = await MySwal.fire({
                                                    title: <span>Are you sure you want to delete this view?</span>,
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Confirm',
                                                    showLoaderOnConfirm: true,
                                                })
                                                if(confirm.value === true){
                                                    //POP: DELETE VIEW
                                                    SetRootFieldAction.new('stackViews', undefined, '-=', true);
                                                    new DeleteElementAction(view.__raw);
                                                }
                                            }}>
                                        <i className={"fas fa-trash-alt"} />
                                    </button>
                                </div>
                            }
                        </>)
                    )
                }
            </div>);
        }
    }
}

// private
interface OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
}
// private
interface StateProps {
    views: LViewElement[];
    stackViews : LViewElement[];
    data: LPointerTargetable;
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

    let lViews: LViewElement[] = [];
    console.log('DVE', {DPointerTargetable, dpt:windoww.DPointerTargetable});

    //Giordano: use state.views instaed Selectors ?
    for(let dView of Selectors.getAllViewElements()){
        let item: LViewElement = MyProxyHandler.wrap(dView)
        if (item) lViews.push(item)
    }
    ret.views = lViews;

    let lStackViews: LViewElement[] = [];
    for(let dStackView of state.stackViews){
        let item: LViewElement = MyProxyHandler.wrap(dStackView)
        if (item) lStackViews.push(item)
    }
    ret.stackViews = lStackViews;

    if(state.stackViews.length > 0){
        let dView = state.stackViews[state.stackViews.length - 1]
        let lView: LViewElement = MyProxyHandler.wrap(dView)
        if(lView !== undefined){
            let objId: Pointer<DViewElement, 1, 1, LViewElement> = lView.id;
            ret.data = MyProxyHandler.wrap(state.idlookup[objId]);
        }
    }

    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const ViewsEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsEditorComponent);


// nb: necessario per usarlo a runtime
export const ViewsEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    // @ts-ignore
    return <ViewsEditorConnected {...{...props, childrens}} />; }

export default ViewsEditor;
