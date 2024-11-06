import {DState, DViewElement, Input, LPointerTargetable, LViewElement, Overlap, Pointer} from "../../../../joiner";
import {FakeStateProps} from "../../../../joiner/types";
import {Dispatch} from "react";
import {connect} from "react-redux";
import './permissions.scss';
import {JsEditor} from "../../languages";


export function PermissionViewTabComponent(props: AllProps): JSX.Element{
    let groups={'Metamodelers':{}, 'Modelers':{}, 'Language designer':{}, 'Concrete Syntax designer':{}};
    let groupsarr = Object.keys(groups);

    return <section className={'permission-tab'}>
        <section className={'group-permission'}>
            <label className={'single-permission'}>
                <JsEditor title={'Replace Structure Editor'} initialExpand={()=>false} data={props.view} field={'example1'}/>
            </label>
            <label className={'single-permission'}>
                <JsEditor title={'Replace Node Editor'} initialExpand={()=>false}  data={props.view} field={'example2'}/>
            </label>
        </section>
        {groupsarr.map(group => <section className={'group-permission'}>
            <h2>{group} can:</h2>
            <label className={'single-permission'}>
                <Input type={'checkbox3'} data={props.view} field={'example1' + group}/>
                <span>Edit View</span>
            </label>
            {/*
            readmode should alwasy be on. write mode i can take it from model permissions, and allow it if query string does not contain =
            or if it does not match a user regexp
            <label className={'single-permission'}>
                <Input type={'checkbox'} data={props.view} field={'example'}/>
                <span>Use Console</span>
            </label>*/}
        </section>)}
    </section>;
}


interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly: boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {
}

type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps { const ret: DispatchProps = {}; return ret; }

export const PermissionViewTab = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PermissionViewTabComponent);

(PermissionViewTab as any).cname = 'PermissionViewTab';
PermissionViewTabComponent.cname = 'PermissionViewTabComponent';
