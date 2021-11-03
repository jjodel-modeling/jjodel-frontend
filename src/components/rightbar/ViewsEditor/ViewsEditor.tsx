import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
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
    GraphDragHandler,
    GObject,
    LGraph,
    Graph,
    Vertex,
    CreateElementAction,
    GraphSize,
    DeleteElementAction,
    SetRootFieldAction, LPointerTargetable,
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

    render(): ReactNode{
        const views = this.props.views;
        const viewsStack = this.props.stackViews;

        console.clear();
        console.log(viewsStack);

        if(viewsStack.length > 0){
            const view = viewsStack[viewsStack.length - 1]
            const data = this.props.data as LViewElement
            return (<>
                <div className={"row mb-4"}>
                    <button style={{maxWidth: "3em"}} className={"col btn btn-danger"}
                            onClick={(e) => {
                                //POP: GO BACK
                                new SetRootFieldAction ('stackViews-=', undefined)
                            }}>
                        <i className="fas fa-long-arrow-alt-left"></i>
                    </button>
                    <h4 className={"col"}>VIEWS EDITOR</h4>
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
                                    new SetRootFieldAction ('stackViews-=', undefined)
                                    new DeleteElementAction(view as DViewElement);
                                }
                            }}>
                        <i className="fas fa-trash-alt"></i>
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
                    <HTMLEditor obj={view} field={'jsxString'} label={"Editor HTML"} />
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
                            pointers.push(viewPointer.value)
                            data['subViews'] = pointers
                        }
                    }}>
                        <i className="fas fa-plus"></i>
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
                                            new SetRootFieldAction ('stackViews+=', subView.id)
                                        }}>
                                    <i className="fas fa-info"></i>
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
                                        pointers.splice(index, 1)
                                        data['subViews'] = pointers
                                    }
                                }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </>
                    ))
                }
            </>);
        }
        else{
            return (<>
                <div className={"row"}>
                    <h4 className={"col"}>VIEWS EDITOR</h4>
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
                                    const newView = new DViewElement(viewName.value, '');
                                    new CreateElementAction(newView);
                                    //PUSH: ADD VIEW
                                    new SetRootFieldAction ('stackViews+=', newView.id)
                                }
                            }}>
                        <i className="fas fa-plus"></i>
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
                                                new SetRootFieldAction ('stackViews+=', view.id)
                                            }}>
                                        <i className="fas fa-info"></i>
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
                                                    new SetRootFieldAction ('stackViews-=', undefined)
                                                    new DeleteElementAction(view as DViewElement);
                                                }
                                            }}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            }
                        </>)
                    )
                }
            </>);
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
    for(let dView of Selectors.getAllViewElements()){
        lViews.push(DViewElement.wrap(dView) as LViewElement)
    }
    ret.views = lViews;

    let lStackViews: LViewElement[] = [];
    for(let dStackView of state.stackViews){
        lStackViews.push(DViewElement.wrap(dStackView) as LViewElement)
    }
    ret.stackViews = lStackViews;

    if(state.stackViews.length > 0){
        let dView = state.stackViews[state.stackViews.length - 1]
        let lView = DViewElement.wrap(dView) as LViewElement
        let objId: Pointer<DViewElement, 1, 1, LViewElement> = lView.id;
        ret.data = DPointerTargetable.wrap(state.idlookup[objId]) as LPointerTargetable;
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
    return <ViewsEditorConnected {...{...props, childrens}} />; }

export default ViewsEditor;