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
import {BoxData, LayoutData} from "rc-dock/lib/DockData";
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
    private groups = {
        'group1': {
            floatable: true,
            maximizable: true,
            panelExtra: (panelData: PanelData, context: DockContext) => {
                return (<button className={'btn btn-primary  my-auto me-1'}
                                onClick={(evt) => this.addModel(evt, context, panelData)}>
                    <i className={'p-1 bi bi-plus'}></i>
                </button>);
            }
        },
        'group2': {
            floatable: true,
            maximizable: true,
        }
    };
    private structureEditor = { id: '1', title: 'Structure', group: 'group2', closable: false, content: <StructureEditor /> };
    private treeEditor = { id: '2', title: 'Tree View', group: 'group2', closable: false, content: <TreeEditor /> };
    private viewsEditor = { id: '3', title: 'Views', group: 'group2', closable: false, content: <ViewsEditor /> };
    private styleEditor = { id: '4', title: 'Node', group: 'group2', closable: false, content: <StyleEditor /> };
    private edgeEditor = { id: '5', title: 'Edges', group: 'group2', closable: false, content: <EdgeEditor /> };
    private viewpointEditor = { id: '6', title: 'Viewpoints', group: 'group2', closable: false, content: <ViewpointEditor /> };
    private console = { id: '7', title: 'Console', group: 'group2', closable: false, content: <Console /> };

    private selected = this.props.selected;
    private views = this.props.views;
    private moveOnStructure = false;
    private moveOnViews = false;


    constructor(props: AllProps, context: any) {
        super(props, context);
        this.dock = null;
    }

    shouldComponentUpdate(newProps: Readonly<AllProps>, newState: Readonly<ThisState>, newContext: any): boolean {
        const oldProps = this.props;
        if(oldProps.selected !== newProps.selected) { this.moveOnStructure = true; return true; }
        if(oldProps.views !== newProps.views) { this.moveOnViews = true; return true; }
        return false;
    }

    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<ThisState>, snapshot?: any) {
        if(this.dock) {
            if(this.moveOnViews) {
                this.dock.dockMove(this.viewsEditor, this.dock.find('3'), 'middle');
                this.moveOnViews = false;
            }
            if(this.moveOnStructure) {
                this.dock.dockMove(this.structureEditor, this.dock.find('1'), 'middle');
                this.moveOnStructure = false;
            }
        }
    }

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
            const modelTab = { id: model.id, title: 'M1', group: 'group1', closable: false, content:
                    <ModelTab modelid={model.id} metamodelid={this.metamodel.id} />
            };
            context.dockMove(modelTab, panelData, 'middle');
        }
    }

    render(): ReactNode {
        if(this.metamodel) {
            const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
            const metamodelTab = { id: this.metamodel.id, title: 'M2', group: 'group1', closable: false, content:
                    <MetamodelTab modelid={this.metamodel.id} />
            };
            const tabs = [metamodelTab];
            for(let model of this.metamodel.models) {
                const modelTab = { id: model.id, title: 'M1', group: 'group1', closable: false, content:
                        <ModelTab modelid={model.id} metamodelid={this.metamodel.id} />
                };
                tabs.push(modelTab);
            }
            layout.dockbox.children.push({tabs});

            layout.dockbox.children.push({
                tabs: [
                    this.structureEditor,
                    this.treeEditor,
                    this.viewsEditor,
                    this.viewpointEditor,
                    this.styleEditor,
                    this.edgeEditor,
                    this.console
                ]
            });

            return (<DockLayout ref={(dockRef) => { this.dock = dockRef }} defaultLayout={layout}
                                groups={this.groups} />);
        } else { return(<></>); }
    }
}

interface OwnProps { }
interface StateProps { metamodel?: LModel, selected: Pointer<DModelElement, 0, 1, LModelElement>, views: number }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state.metamodel;
    if(pointer) ret.metamodel = LModel.fromPointer(pointer);
    const selected = state._lastSelected?.modelElement;
    if(selected) ret.selected = selected;
    ret.views = state.viewelements.length;
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
