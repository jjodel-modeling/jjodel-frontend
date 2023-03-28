import React, {Dispatch, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {IStore} from '../../redux/store';
import {
    CreateElementAction,
    DGraph,
    DModel,
    DModelElement,
    LModel,
    LModelElement,
    Pointer,
    SetFieldAction,
    U
} from '../../joiner';
import './style.scss';
import {DockContext, DockLayout, PanelData} from "rc-dock";
import {LayoutData} from "rc-dock/lib/DockData";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import EdgeEditor from "../rightbar/edgeEditor/EdgeEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";
import Console from "../rightbar/console/Console";
import Swal from 'sweetalert2'
import MetamodelTab from "./tabs/MetamodelTab";
import ModelTab from "./tabs/ModelTab";


interface ThisState {}
class DockLayoutComponent extends PureComponent<AllProps, ThisState>{
    private dock: DockLayout | null;
    // private metamodel: AllProps["metamodel"];
    private groups = {
        'group1': {
            floatable: true,
            maximizable: true,
            panelExtra: (panelData: PanelData, context: DockContext) => {
                return (<div>
                    <button className={'btn btn-primary my-auto me-1'}
                                onClick={(evt) => this.open(evt, context, panelData)}>
                        open
                    </button>
                    <button className={'btn btn-primary my-auto me-1'}
                            onClick={(evt) => this.addMetamodel(evt, context, panelData)}>
                        add M2
                    </button>
                    <button className={'btn btn-primary my-auto me-1'}
                            onClick={(evt) => this.addModel(evt, context, panelData)}>
                        add M1
                    </button>
                </div>);
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

    private metamodels = this.props.metamodels;
    private models = this.props.models;


    constructor(props: AllProps, context: any) {
        super(props, context);
        this.dock = null;
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

    open(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        let html = `<div><label>OPEN AN EXISTING MODEL</label><br/>`;
        html += `<select class='mt-2 select' id='select-open-model'>`;
        html += `<optgroup label='Metamodels'>`;
        for(let metamodel of this.metamodels) {
            html += `<option value=${metamodel.id}>${metamodel.name}</option>`;
        }
        html += '</optgroup>';
        html += `<optgroup label='Models'>`;
        for(let model of this.models) {
            html += `<option value=${model.id}>${model.name}</option>`;
        }
        html += '</optgroup>';
        html += '</select></div>';
        const result = Swal.fire({
            html: html, showCloseButton: true, confirmButtonText: 'OPEN',
            preConfirm: () => {
                const model: HTMLElement|null = document.getElementById('select-open-model');
                return (model) ? (model as HTMLSelectElement).value : null;
            }
        });
        result.then((data) => {
            if(data.isConfirmed && data.value) {
                const model: LModel = LModel.fromPointer(data.value);
                if(model.isMetamodel) {
                    const tab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                            <MetamodelTab modelid={model.id} />
                    };
                    context.dockMove(tab, panelData, 'middle');
                } else {
                    const tab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                            <ModelTab modelid={model.id} metamodelid={model.father.id} />
                    };
                    context.dockMove(tab, panelData, 'middle');
                }

            }
        });
    }

    addMetamodel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        const model: DModel = DModel.new('test');
        model.isMetamodel = true;
        CreateElementAction.new(model);
        CreateElementAction.new(DGraph.new(model.id));
        const metaModelTab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                <MetamodelTab modelid={model.id} />
        };
        context.dockMove(metaModelTab, panelData, 'middle');

    }
    addModel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        let html = `<div><label>CREATE A MODEL</label><br/>`;
        html += `<select class='mt-2 select' id='select-add-model'>`;
        html += `<optgroup label='Metamodels'>`;
        for(let metamodel of this.metamodels) {
            html += `<option value=${metamodel.id}>${metamodel.name}</option>`;
        }
        html += '</optgroup>';
        html += '</select></div>';
        const result = Swal.fire({
            html: html, showCloseButton: true, confirmButtonText: 'CREATE',
            preConfirm: () => {
                const model: HTMLElement|null = document.getElementById('select-add-model');
                return (model) ? (model as HTMLSelectElement).value : null;
            }
        });
        result.then((data) => {
            if(data.isConfirmed && data.value) {
                const metamodel: LModel = LModel.fromPointer(data.value);
                let name = 'model_' + 0;
                let modelNames: (string)[] = metamodel.models.map( m => m.name);
                name = U.increaseEndingNumber(name, false, false, (newName) => modelNames.indexOf(newName) >= 0)
                const model: DModel = DModel.new(name);
                model.isMetamodel = false; model.father = metamodel.id;
                CreateElementAction.new(model);
                CreateElementAction.new(DGraph.new(model.id));
                SetFieldAction.new(metamodel.id, 'models', model.id, '+=', true);
                const modelTab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                        <ModelTab modelid={model.id} metamodelid={metamodel.id} />
                };
                context.dockMove(modelTab, panelData, 'middle');
            }
        });
    }

    /*
    addModel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        if(this.props.metamodel) {
            let name = 'model_' + 0;
            let modelNames: (string)[] = this.props.metamodel.models.map( m => m.name);
            name = U.increaseEndingNumber(name, false, false, (newName) => modelNames.indexOf(newName) >= 0)
            const model: DModel = DModel.new(name);
            model.isMetamodel = false;
            CreateElementAction.new(model);
            CreateElementAction.new(DGraph.new(model.id));
            SetFieldAction.new(this.props.metamodel.id, 'models', model.id, '+=', true);
            const modelTab = { id: model.id, title: 'M1', group: 'group1', closable: false, content:
                    <ModelTab modelid={model.id} metamodelid={this.props.metamodel.id} />
            };
            context.dockMove(modelTab, panelData, 'middle');
        }
    }
    */

    render(): ReactNode {
        const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
        /*
        const metamodelTab = { id: this.props.metamodel.id, title: 'M2', group: 'group1', closable: false, content:
                <MetamodelTab modelid={this.props.metamodel.id} key={this.props.metamodel.id} />
        };
        const tabs = [metamodelTab];
        for(let model of this.props.metamodel.models) {
            const modelTab = { id: model.id, title: 'M1', group: 'group1', closable: false, content:
                    <ModelTab modelid={model.id} metamodelid={this.props.metamodel.id} />
            };
            tabs.push(modelTab);
        }
        layout.dockbox.children.push({tabs});
        */
        const emptyTab = { id: 'info', title: 'Info', group: 'group1', closable: false, content:
                <div>
                    <h5>Metamodels ({this.metamodels.length})</h5>
                    {this.metamodels.map((model) => {
                        return(<div>{model.name}</div>);
                    })}
                    <h5>Models ({this.models.length})</h5>
                    {this.models.map((model) => {
                        return(<div>{model.name}</div>);
                    })}
                </div>
        };
        layout.dockbox.children.push({tabs: [emptyTab]});
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
    }
}

interface OwnProps { }
interface StateProps { metamodels: LModel[], models: LModel[], selected: Pointer<DModelElement, 0, 1, LModelElement>, views: number }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const models: LModel[] = LModel.fromPointer(state.models);
    ret.metamodels = models.filter((model) => { return model.isMetamodel });
    ret.models = models.filter((model) => { return !model.isMetamodel });
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
