import type {DState, LProject} from '../../../joiner';
import {U, Input, DUser, LUser, LModel} from '../../../joiner';
import React, {Dispatch, ReactElement, useState, ReactNode} from 'react';
import {connect} from 'react-redux';
import type {Dictionary, FakeStateProps} from '../../../joiner/types';
import DockManager from "../DockManager";
import jj from '../../../static/img/jj.png';

type Props = {
    key: string;
    name: string;
    data: any;
    metamodels: any;
    models: any;
};




const Project = (props: Props) => {

    const [edit, setEdit] = useState<boolean|undefined>(false);

    const editToggle = () => {
        setEdit(!edit);
    }

    return (
        <React.Fragment>
            {!edit ? 
                <h2 onClick={editToggle} className={'p-3'}>{props.name}<img style={{float: 'right'}}height={50} src={jj} /></h2> :
                <h2 onBlur={editToggle} className={'p-3'}><Input key={props.key} field={'name'} data={props.data}/></h2>
            }
            <p className='p-3'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            </p>
            <div className='row p-3'>
                <div className={'col-sm'}>
                    <p>
                    {props.data.type == "public" && <React.Fragment><i className="bi bi-unlock"></i> public project</React.Fragment>}
                    {props.data.type == "private" && <React.Fragment><i className="bi bi-lock"></i> private project</React.Fragment>}
                    {props.data.type == "collaborative" && <React.Fragment><i className="bi bi-diagram-3"></i> collaborative project</React.Fragment>}
                    </p>
                </div>
                <div className={'col-sm'}>
                    <p>
                    {(props.data.type === 'collaborative') ?
                        <div><i className="bi bi-diagram-3"></i> online users: <strong>{props.data.onlineUsers}</strong></div> :
                        <div><i className="bi bi-diagram-3"></i> online users: <strong>only you.</strong></div>
                    }
                    </p>
                </div>
                <div className='row p-3'>
                    
                        <h4>Metamodels ({props.metamodels.length})</h4>
                        <section>
                            {props.metamodels.map(m2Row)}
                        </section>
                </div>
                <div className={'row p-3'}>
                        <h4>Models ({props.models.length})</h4>
                        <section>
                            {props.models.map(m1Row)}
                        </section>

                </div>
            </div>
        </React.Fragment>
    );
}

function m2Row(model: LModel) { return mRow(model, false) }
function m1Row(model: LModel) { return mRow(model, true) }
// too small to justify a separate file

function mRow(model: LModel, showInstanceOf: boolean = false) {
    if(!model) return(<></>);
    return (
        <p className={'d-block'} key={model.id} onClick={()=>DockManager.open2(model)} style={{cursor: 'pointer'}}>
            <i className="bi bi-folder"></i> {model.name}{
                showInstanceOf && <><span className={'text-success'}> {model.instanceof ? 'conforming to' : 'is shapeless'}</span> {model.instanceof?.name}</>
            }
            <i className="bi bi-chevron-down hoverable">
                <div className="content context-menu">
                    <div className={'col item'}>Open</div>
                    <div className={'col item'}>Duplicate</div>
                    <div className={'col item'}>Close</div>
                    <hr className={'my-1'} />
                    <div className={'col item'}>Delete</div>
                </div>
            </i>
        </p>)
}

function InfoTabComponent(props: AllProps) {
    const project = props.project;
    const metamodels = project.metamodels;
    let models = project.models;
    let modelmap: Dictionary<string, LModel[]> = {}
    for (let m of models) {
        let m2 = m.instanceof;
        let m2name = m2?.name as string;
        if (!modelmap[m2name]) modelmap[m2name] = [];
        modelmap[m2name].push(m);
    }
    models = Object.values(modelmap).flat();  // this way they are sorted by metamodel

    return(<div className={'p-3 summary w-75'}>
        <div>
            <Project key={project.id} name={project.name} data={project} metamodels={metamodels} models={models}/>
        </div>
    </div>);
}

interface OwnProps {}
interface StateProps {project: LProject}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const luser = LUser.fromPointer(DUser.current, state);
    ret.project = luser.project as LProject;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const InfoTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InfoTabComponent);

export const InfoTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <InfoTabConnected {...{...props, children}} />;
}
export default InfoTab;
