import React, {Dispatch, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import './graph.scss';
import {IStore, GraphElement, Vertex, ViewElement, LModelElement, LModel, DModel} from "../../joiner";
import {QA} from "../droppable/droppable";
import Overlap from "../../components/forEndUser/Overlap";


// private
interface ThisState { }

class GraphsContainerComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    // todo: per ogni vista crea un set di opzioni {enableAutocorrect: "boolean(true)", displayEdges: "boolean(true)", maximumGraphWidth: "number(2000)"} specificate dall\'utente che deve specificare sia il tipo (Come se osse una funzione) che il valore predefinito
    // il grafo deve leggere l'oggetto di opzioni e creare un menù che consente di cambiarle (una checkbox al posto dell'enableAutocorrect (bool), uno spinner per maximumGraphWidth (number...)

    render(): ReactNode {
        // const editinput = "<input onChange={(e) => this.data.name = e.target.value } value={this.data.name} />";
        // const editinput = "";
        // todo: rendi opzionale obj = this.data.id se non è specificato.
        // const editinput = "<Input obj={this.data.id} field={'name'} getter={val => val.toUpperCase()} setter={(val) => val.toLowerCase()} />";
        // "<Input obj={this.data} field={'name'} getter={val => val.toUpperCase()} setter={(val) => val.toLowerCase()} />";
        return (<>
            {
                this.props.models.map( (m: LModel) => (
                    <>
                        {/*<svg style={{backgroundColor: 'red'}}>
                        <Overlap style={{width: '100px'}}>
                            success, now i can test resize handler overlayed to content and dragndrop dnd
                            <foreignObject className={"rectangle"} />
                            <foreignObject className={"ellipse"} />
                            <foreignObject className={"point"} />
                        </Overlap>
                        </svg><svg style={{backgroundColor: 'red'}}>
                            <Overlap>
                                <foreignObject className={"rectangle"} style={{width: '100px'}}/>
                                <foreignObject className={"ellipse"} style={{width: '300px'}}/>
                                <foreignObject className={"point"} />
                            </Overlap>
                        </svg>* /}
                        <GraphElement data={m} />*/}
                        <Vertex data={m} />

                        {/*<QA />*/}
                    </>)
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
