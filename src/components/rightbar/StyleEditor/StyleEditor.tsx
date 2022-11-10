import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import ViewsEditor from "../ViewsEditor/ViewsEditor";
import './style_editor.scss';
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
} from "../../../joiner";

// private
interface ThisState {
}

class StyleEditorComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }
    render(): ReactNode{
        if(this.props.selected?.modelElement){
            return( <>
                <Input obj={(this.props.selected?.view as LViewElement)} field={'name'} label={"Name View"} type={"text"} />
                <div className={"row"}>
                    <div className={"col"}><Input obj={(this.props.selected?.view as LViewElement)} field={'x'} label={"X position"} type={"number"} /></div>
                    <div className={"col"}><Input obj={(this.props.selected?.view as LViewElement)} field={'y'} label={"Y position"} type={"number"} /></div>
                </div>
            </> );
        }
        else{
            return <div>Empty selection.</div>
        }
    }
}

// private
interface OwnProps {
    // propsRequestedFromJSX_AsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
    selectedid?: { node: Pointer<DGraphElement, 1, 1>; view: Pointer<DViewElement, 1, 1>; modelElement: Pointer<DModelElement, 0, 1> };
    selected?: { node: LGraphElement; view: LViewElement; modelElement?: LModelElement };
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
    ret.selectedid = state._lastSelected;
    ret.selected = ret.selectedid && {
            node: DPointerTargetable.wrap(state.idlookup[ret.selectedid.node]) as LGraphElement,
            view: DPointerTargetable.wrap(state.idlookup[ret.selectedid.view]) as LViewElement,
            modelElement: ret.selectedid.modelElement ? DPointerTargetable.wrap<DPointerTargetable, LModelElement>(state.idlookup[ret.selectedid.modelElement]) : undefined };
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const StyleEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(StyleEditorComponent);

// nb: necessario per usarlo a runtime
export const StyleEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <StyleEditorConnected {...{...props, childrens}} />; }

if (!windoww.components) windoww.components = {};
console.error('see writing');
windoww.components.StyleEditor = StyleEditor;
windoww.components.ViewsEditor = ViewsEditor;
