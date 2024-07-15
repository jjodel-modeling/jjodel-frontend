import {
    DState, DUser,
    DViewElement,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    SetFieldAction,
    TRANSACTION
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, useState} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {ViewEvents, ViewInfo, ViewOptions, ViewStyle, ViewSubViews, ViewTemplate} from './viewTabs';


function ViewsComponent(props: AllProps) {
    const {user, views, viewpoints} = props;
    const [clicked, setClicked] = useState({viewID: '', x: 0, y: 0});
    const [view, setView] = useState<null|LViewElement>(null);
    const [tab, setTab] = useState(0);

    const create = () => {
        DViewElement.newDefault();
    }
    const duplicate = (pointer: Pointer<LViewElement>) => {
        setClicked({viewID: '', x: 0, y: 0})
        const view: LViewElement = LViewElement.fromPointer(pointer);
        TRANSACTION(() => {
            view.duplicate(false);
        });
    }
    const remove = (pointer: Pointer<LViewElement>) => {
        setClicked({viewID: '', x: 0, y: 0})
        const view: LViewElement = LViewElement.fromPointer(pointer);
        TRANSACTION(() => {
            SetFieldAction.new(view.viewpoint.id, 'subViews', view.id as any, '-=', false);
            view.delete();
        })
    }


    if(!view) return(<section className={'p-2'}>
        <div className={'v-container'}>
            <label className={'text-primary'} onClick={e => create()}>
                Create new...
            </label>
        </div>
        {views.map(v => <div className={'v-container'}>
            <label style={{fontWeight: (v.id === clicked.viewID ? 'bold' : 'lighter')}} onClick={e => setClicked({viewID: v.id, x: e.clientX, y: e.clientY})}>
                {v.name}
            </label>
        </div>)}
        {clicked.viewID && <div className={'v-panel rounded border p-2'} style={{top: clicked.y - 53}}>
            <label className={'v-link'} onClick={e => setView(LViewElement.fromPointer(clicked.viewID))}>Open</label>
            <label className={'v-link'} onClick={e => duplicate(clicked.viewID)}>Duplicate</label>
            <label className={'v-link'} onClick={e => remove(clicked.viewID)}>Delete</label>
            <label className={'v-link text-danger'} onClick={e => setClicked({viewID: '', x: 0, y: 0})}>Close</label>
        </div>}
    </section>);
    else {
        const tabs = [
            {name: 'info', component: <ViewInfo view={view} viewpoints={viewpoints}  />},
            {name: 'template', component: <ViewTemplate view={view} />},
            {name: 'style', component: <ViewStyle view={view} />},
            {name: 'events', component: <ViewEvents view={view} />},
            {name: 'options', component: <ViewOptions view={view} />},
            {name: 'subviews', component: <ViewSubViews view={view} views={user.project?.views || []} />}
        ];
        return(<section className={'p-2'}>
            <nav className={'w-100 p-1 bg-white border rounded text-center mb-2'}>
                {tabs.map((t, i) => <label style={{color: (tab === i) ? '#5F0F40' : 'black'}} onClick={e => setTab(i)} key={i} className={'v-item'}>
                    {t.name}
                </label>)}
            </nav>
            {tabs[tab].component}
        </section>)
    }


}

interface OwnProps {}
interface StateProps {
    views: LViewElement[]
    viewpoints: LViewPoint[]
    user: LUser
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.viewpoints = LViewPoint.fromArr(state.viewpoints);
    ret.user = LUser.fromPointer(DUser.current);
    const views: LViewElement[] = LViewElement.fromArr(state.viewelements);
    ret.views = views.filter(v => v.viewpoint.id === ret.user.project?.activeViewpoint.id)
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const ViewsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsComponent);

export const Views = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <ViewsConnected {...{...props, children}} />;
}
export default Views;
