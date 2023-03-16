import React, {Dispatch, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {IStore} from '../../redux/store';
import {
    CreateElementAction,
    DGraph,
    DModel,
    DModelElement,
    LModel,
    LModelElement, Pointer,
    SetFieldAction,
    U
} from '../../joiner';
import './style.scss';
import {DockContext, DockLayout, PanelData} from "rc-dock";
import {LayoutData} from "rc-dock/lib/DockData";
import MetamodelTab from "./tabs/MetamodelTab";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import EdgeEditor from "../rightbar/edgeEditor/EdgeEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";
import Console from "../rightbar/console/Console";
import ModelTab from "./tabs/ModelTab";


interface ThisState {}
class DockLayoutComponent extends PureComponent<AllProps, ThisState>{
    private dock: DockLayout | null;
    private metamodel = this.props.metamodel;


    constructor(props: AllProps, context: any) {
        super(props, context);
        this.dock = null;
    }

    groups = {
        '1': {
            floatable: true,
            maximizable: true,
            panelExtra: (panelData: PanelData, context: DockContext) => {
                return (<button className={'btn btn-primary  my-auto me-1'}
                                onClick={(evt) => this.addModel(evt, context, panelData)}>
                    <i className={'p-1 bi bi-plus'}></i>
                </button>);
            }
        },
        '2': {
            floatable: true,
            maximizable: true,
        }
    };

    addModel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        if(this.metamodel) {
            let name = 'model_' + 0;
            let modelNames: (string)[] = this.metamodel.models.map( m => m.name);
            name = U.increaseEndingNumber(name, false, false, (newName) => modelNames.indexOf(newName) >= 0)
            const model: DModel = DModel.new(name);
            model.isMetamodel = false;
            CreateElementAction.new(model);
            CreateElementAction.new(DGraph.new(model.id));
            SetFieldAction.new(this.metamodel.id, 'models', model.id, '+=', true);
            const modelTab = { id: model.id, title: 'M1', group: '1', closable: false, content:
                    <ModelTab modelid={model.id} metamodelid={this.metamodel.id} />
            };
            context.dockMove(modelTab, panelData, 'middle');
        }
    }

    render(): ReactNode {
        if(this.metamodel) {
            const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
            const metamodelTab = { id: this.metamodel.id, title: 'M2', group: '1', closable: false, content:
                    <MetamodelTab modelid={this.metamodel.id} />
            };
            const tabs = [metamodelTab];
            for(let model of this.metamodel.models) {
                const modelTab = { id: model.id, title: 'M1', group: '1', closable: false, content:
                        <ModelTab modelid={model.id} metamodelid={this.metamodel.id} />
                };
                tabs.push(modelTab);
            }
            layout.dockbox.children.push({tabs});

            const structureEditor = { title: 'Structure', group: '2', closable: false, content: <StructureEditor /> };
            const treeEditor = { title: 'Tree View', group: '2', closable: false, content: <TreeEditor /> };
            const viewsEditor = { title: 'Views', group: '2', closable: false, content: <ViewsEditor /> };
            const styleEditor = { title: 'Node', group: '2', closable: false, content: <StyleEditor /> };
            const edgeEditor = { title: 'Edges', group: '2', closable: false, content: <EdgeEditor /> };
            const viewpointEditor = { title: 'Viewpoints', group: '2', closable: false, content: <ViewpointEditor /> };
            const console = { title: 'Console', group: '2', closable: false, content: <Console /> };
            layout.dockbox.children.push({
                tabs: [
                    { ...structureEditor, id: '1' },
                    { ...treeEditor, id: '2' },
                    { ...viewsEditor, id: '3' },
                    { ...viewpointEditor, id: '4' },
                    { ...styleEditor, id: '5' },
                    { ...edgeEditor, id: '6' },
                    { ...console, id: '7' },
                ]
            });


            return (<DockLayout ref={(dockRef) => { this.dock = dockRef }} defaultLayout={layout}
                                groups={this.groups} />);
        } else { return(<></>); }
    }
}

interface OwnProps { }
interface StateProps { metamodel?: LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state.metamodel;
    if(pointer) ret.metamodel = LModel.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const DockLayoutConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(DockLayoutComponent);

export const Dock = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <DockLayoutConnected {...{...props, childrens}} />;
}
export default Dock;
