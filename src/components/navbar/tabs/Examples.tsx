import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {LoadAction, TRANSACTION} from '../../../redux/action/action';
import stateExamples from '../../../examples';
import { statechartplus } from '../../../examples/statechartplus';
import { viewAsEdge } from '../../../examples/viewAsEdge';
import { sequence } from '../../../examples/sequence';
import { conflictsimulation } from '../../../examples/conflictsimulation';
import { shapes } from '../../../examples/shapes';
import {
    Defaults, Dictionary,
    DModel, DObject,
    DPackage,
    DProject,
    DUser, DViewElement, DViewPoint,
    GObject, Log,
    LPointerTargetable,
    LProject,
    LUser,
    store,
    U
} from '../../../joiner';

// only for states before User and Project management
function mergeState(oldState: GObject, injectToModel: boolean = true, deleteNodes: boolean = true, skipDefaultViews: boolean = false): GObject<DState>{
    let currState: GObject<DState> = {...store.getState()} as GObject<DState>;
    currState.idlookup = {...currState.idlookup};
    U.objectMergeInPlace(currState.idlookup, oldState.idlookup);
    U.objectMergeInPlace(currState, oldState);
    for (let k in currState){ // mix state ptr arrays like: viewpoints, models, attributes... there is 1 for each dclass.
        let v = currState[k]
        if (!Array.isArray(v)) continue;
        currState[k] = U.arrayMergeInPlace([...v], oldState[k]);
    }
    if (injectToModel) {
        let models: DModel[] = currState.models.map(mid => currState.idlookup[mid]).filter(m => !!m) as DModel[];
        let viewpoints: DViewPoint[] = currState.viewpoints.map(mid => currState.idlookup[mid]).filter(m => !!m)  as DViewPoint[];
        let m1: DModel | undefined;
        let m2: DModel = undefined as any;
        let modelids: Dictionary<string, DModel> = {}
        for (let m of models) {
            modelids[m.id] = m;
            if (!m2 && m.isMetamodel) m2 = {...m} as DModel;
            if (!m1 && !m.isMetamodel) m1 = {...m} as DModel;
        }
        let pkgs: DPackage[] = currState.packages.map(mid => currState.idlookup[mid]).filter(m => !!m) as DPackage[];
        let objs: DObject[] = currState.objects.map(mid => currState.idlookup[mid]).filter(m => !!m) as DObject[];
        for (let pkg of pkgs) { // all root-level packages, are re-assigned to first m2.
            if (!modelids[pkg.father]) continue;
            pkg.father = m2.id;
            m2.packages.push(pkg.id);
        }
        for (let vvv of objs) { // all root-level objects, are re-assigned to first m2.
            if (!modelids[vvv.father]) continue;
            vvv.father = (m1 || m2).id;
            (m1 || m2).objects.push(vvv.id);
        }
        m2.packages = [...new Set( [...m2.packages])];
        (m1 || m2).objects = [...new Set( [...(m1 || m2).objects])];
        let customVP: DViewPoint = undefined as any;
        for (let vp of viewpoints) {
            if (vp.name.toLowerCase().indexOf('default')) continue
            customVP = {...vp} as DViewPoint;
            break;
        }
        if (!customVP) customVP = {...viewpoints[viewpoints.length -1]} as DViewPoint;
        Log.ex(!customVP, "loading this save, requires to make a offline project with at least 1 custom viewpoint");
        if (!customVP.subViews) customVP.subViews = [];
        // viewpoints[0].subViews = [...new Set( [...viewpoints[0].subViews, ...currState.viewelements])];
        let tmp: DViewElement[] = currState.viewelements.map(mid => currState.idlookup[mid]).filter(m => !!m) as DViewElement[];
        let views: Dictionary<string, DViewElement> = {};
        let customViews: DViewElement[] = [];
        let defaultViews: DViewElement[] = []
        for (let v of tmp) {
            v = {...v} as DViewElement
            if (v.name.indexOf('Pointer_View') === 0) defaultViews.push(v);
            else customViews.push(v);
            views[v.id] = v;
        }
        for (let v of defaultViews) {// older version of existing views inserted with different name/id in curent state.
            if (!oldState.idlookup[v.id]) continue;
            delete views[v.id];
            if (skipDefaultViews) continue;
            v = {...oldState.idlookup[v.id]} as DViewElement;
            v.id = v.id+"_old";
            views[v.id] = v;
            v.name = v.name+"_old";
            v.viewpoint = customVP.id;
            customVP.subViews.push(v.id);
            currState.idlookup[v.id] = v;
        }


        for (let vvv of Object.values(views)) {
            currState.idlookup[vvv.id] = vvv;
            vvv.viewpoint = customVP.id;
            customVP.subViews.push(vvv.id);
            currState.idlookup[vvv.id] = vvv;
            if (!vvv.usageDeclarations) vvv.usageDeclarations = ''; // '()=>{return {}}';
            if (!vvv.preRenderFunc) vvv.preRenderFunc = ''; // '()=>{return {}}';
            if (!vvv.constants) vvv.constants = ''; // '()=>{return {}}';
            // @ts-ignore
            if (vvv.query) vvv.oclCondition = vvv.query;
        }
        customVP.subViews = [...new Set(customVP.subViews)];
        for (let pkg of pkgs) {
            pkg = {...pkg} as DPackage;
            pkg.father = models[0].id;
            currState[pkg.id] = pkg;
        }
    }
    if (deleteNodes && false){
        for (let k in currState.idlookup){
            const v = currState.idlookup[k];
            if (v && typeof v === 'object' && ('x' in v || 'zIndex' in v)) delete currState.idlookup[k]
        }
        currState.graphs = [];
    }
    return currState;
}

function loadOldState(obj: GObject, name: string = "oldSave"): void {
    let project: LProject;
    let dproject: DProject;
    let user: LUser;
    const defvpid: string = Defaults.viewpoints[0];
    const oldvpid = 'Pointer_DefaultViewPoint';
    obj.idlookup[defvpid] = obj.idlookup[oldvpid];
    obj.viewpoint = defvpid;
    obj.viewpoints = (obj.viewpoints as string[] || [defvpid]).map(vpid => vpid === oldvpid ? defvpid : vpid)

    console.log('loading obj', {obj})

    TRANSACTION(()=>{
        LoadAction.new(obj);
        let duser = DUser.new('adminOffline', "Pointer_adminOffline");
        DUser.current = duser.id;
        // user = LPointerTargetable.fromPointer(DUser.current);
        user = LPointerTargetable.fromD(duser);
        dproject = DProject.new('private', name);
        project = LPointerTargetable.fromD(dproject);
        // user.projects = [...user.projects, project];
        user.project = project;
    })
    setTimeout(()=> TRANSACTION(()=>{
        if (!project) return // only if first transaction failed
        console.log("loadOldState", {g: obj.graphs, m: obj.models, v: obj.viewelements, project, dproject, user});
        project.graphs = obj.graphs;
        project.models = obj.models;
        let lastvp = obj.viewpoints[obj.viewpoints.length -1];
        lastvp.subViews = obj.viewelements;
        for (let v of obj.viewElements) v.viewpoint = lastvp;
        // project.views = obj.viewelements;
        project.viewpoints = obj.viewpoints;
        // project.activeViewpoint = obj.viewpoints[0];
        project.activeViewpoint = 'Pointer_DefaultViewPoint' as any;
    }), 1);
    // NB: might also be needed to add "context DModel inv: true" or DClass... to all default views got back from old state.
}
// for new saves
function loadState(obj: GObject, name: string = "oldSave"): void { LoadAction.new(obj); }

function ExamplesComponent(props: AllProps) {

    const load = (state: string) => {
        return LoadAction.new(JSON.parse(state));
    }
    const setExample = (example: number) => {
        switch(example) {
            case 1:
                return load(stateExamples.first);
            case 2:
                return load(stateExamples.second);
            default:
                return;
        }

    }

    return (
        <li tabIndex={-1} className={'dropdown-item'}>Examples
            <i className={'ms-auto bi bi-caret-right-fill'} />
            <ul className={'submenu dropdown-menu'}>
                <li tabIndex={-1} onClick={e => setExample(1)} className={'dropdown-item'}>Simplified Class Diagram</li>
                <li tabIndex={-1} onClick={e => setExample(2)} className={'dropdown-item'}>Nodes & Edges</li>
                <li tabIndex={-1} onClick={e => loadState(statechartplus, "Statechart+")} className={'dropdown-item'}>Student statechart++</li>
                <li tabIndex={-1} onClick={e => loadState(viewAsEdge, "View as edge")} className={'dropdown-item'}>View Object as Edge</li>
                <li tabIndex={-1} onClick={e => loadState(conflictsimulation, "Conflict simulation")} className={'dropdown-item'}>Conflict simulation</li>
                <li tabIndex={-1} onClick={e => loadState(shapes, "Shapes")} className={'dropdown-item'}>Shapes</li>
                {false && <li tabIndex={-1} onClick={e => loadOldState(sequence, "Sequence diagram")} className={'dropdown-item'}>Sequence</li>}
            </ul>
        </li>)
}

interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    return {};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ExamplesConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ExamplesComponent);

export const Examples = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ExamplesConnected {...{...props, children}} />;
}

export default Examples;
