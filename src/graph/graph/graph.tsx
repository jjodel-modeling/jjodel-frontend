import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import {IStore} from "../../redux/store";
import './graph.scss';
import GraphElement from "../graphElement/graphElement";
import {ViewElement} from "../../view/viewElement/view";
import {LModel, LModelElement} from "../../model/logicWrapper/LModelElement";
import {DModel, DModelElement} from "../../model/dataStructure";

// private
interface ThisState { }

class GraphsContainerComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        // const editinput = "<input onChange={(e) => this.data.name = e.target.value } value={this.data.name} />";
        // const editinput = "";
        const editinput = "<Input obj={this.data.id} field={'name'} getter={val => val.toUpperCase()} setter={(val) => val.toLowerCase()} />";
        // "<Input obj={this.data} field={'name'} getter={val => val.toUpperCase()} setter={(val) => val.toLowerCase()} />";
        return (<>
            {
                this.props.models.map( (m: LModel) => (<>
                    <GraphElement
                        data={m}
                        view={new ViewElement('<p><h1>hello1 {this.data.name + (this.data.id)}</h1><i>{JSON.stringify(Object.keys(this))}</i>'+editinput + '</p>')} />
                    <GraphElement
                        data={m}
                        view={new ViewElement('<p><h1>hello2 {this.data.name + (this.model.id)}</h1><i>{JSON.stringify(Object.keys(this))}</i>'+editinput + '</p>')} />
                </>
                    )
                )
            }
        </>); }
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    models: LModel[];
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
    console.log('mapStateToProps', {ret, state, ownProps, models: state.models})
    ret.models = state.models.length ? state.models.map( (mid) => mid && LModelElement.wrap(state.idlookup[mid] as DModel)) as LModel[] : [];
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export default connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(GraphsContainerComponent);
