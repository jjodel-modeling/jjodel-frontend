import {DState, Input, LPointerTargetable, Overlap, Pointer} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import {Dispatch, JSX} from "react";
import {connect} from "react-redux";
import {DModelElement, LModelElement} from "../../model/logicWrapper";
import './views/data/permissions.scss';

export function PermissionModelTabComponent(props: AllProps): JSX.Element{
    let groups={'Metamodelers':{}, 'Modelers':{}, 'Language designer':{}, 'Concrete Syntax designer':{}};
    let groupsarr = Object.keys(groups);

    return <section className={'permission-tab'}>
        {groupsarr.map(group=> <section className={'group-permission'}>
            <h2>{group} can:</h2>
            <label className={'single-permission'}>
                <Input type={'checkbox'} data={props.data} field={'example1'+group}/>
                <span>Read</span>
            </label>
            <label className={'single-permission'}>
                <Input type={'checkbox'} data={props.data} field={'example2'+group}/>
                <span>Write</span>
            </label>
            <label className={'single-permission'}>
                <Input type={'checkbox'} data={props.data} field={'example3'+group}/>
                <span>Layout</span>
            </label>
        </section>)}
    </section>;
}


interface OwnProps {
}

interface StateProps {
    data?: LModelElement;
}

interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as StateProps;
    const dataid = state._lastSelected?.modelElement;
    if (dataid) ret.data = LModelElement.fromPointer(dataid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps { const ret: DispatchProps = {}; return ret; }

export const PermissionModelTab = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PermissionModelTabComponent);

(PermissionModelTab as any).cname = 'PermissionModelTab';
PermissionModelTabComponent.cname = 'PermissionModelTabComponent';
