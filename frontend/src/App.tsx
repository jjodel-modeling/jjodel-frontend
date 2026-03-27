import React, {Dispatch, JSX, useState, useEffect} from 'react';
import './App.scss';
import './styles/view.scss'; //
import './styles/style.scss';
import './styles/forms.scss';
import './styles/tokens.css';
import {DState, DUser, Log, LUser, Pointer, R, SetRootFieldAction, statehistory, stateInitializer, Try, U} from "./joiner";
import {connect} from "react-redux";
import Loader from "./components/loader/Loader";
import {FakeStateProps} from "./joiner/types";
import {HashRouter, Route, Routes} from 'react-router-dom';
import PathChecker from "./components/pathChecker/PathChecker";

import {
    AccountPage,
    AllProjectsPage,
    ArchivePage,
    AuthPage,
    CommunityPage, NewsPage,
    NotesPage,
    ProfilePage,
    ProjectPage,
    ProjectsInfoPage_Obsolete,
    RecentPage_Obsolete,
    SettingsPage,
    TemplatePage,
    TokenPreviewPage,
    UpdatesPage,
    UsersInfoPage,
    ConfirmAccount
} from "./pages";
import { TestLayout } from "./components/TestLayout";
import EditorV2 from "./components/editor-v2/EditorV2";

import {ExternalLibraries} from "./components/forEndUser/ExternalLibraries";
import {TooltipVisualizer} from "./components/forEndUser/Tooltip";
import AlertVisualizer from "./components/alert/Alert";
import DialogVisualizer from './components/alert/Dialog';
import { NotificationWidget } from './components/NotificationWidget/NotificationWidget';
import { Jodie } from './components/Jodie';
import { DevModeProvider } from './contexts/DevModeContext';
import { GlobalDrawerProvider } from './contexts/GlobalDrawerContext';
import { FeaturesPanelProvider } from './contexts/FeaturesPanelContext';
import { TreeViewPanelProvider } from './contexts/TreeViewPanelContext';
import { GlobalDrawer } from './components/GlobalDrawer';
import { JjtlDialogManager } from './jjtl/components';
import { SettingsModalProvider } from './contexts/SettingsModalContext';
import { ToastProvider } from './components/Toast';
import { DonationBanner } from './components/DonationBanner/DonationBanner';
import HelpDrawer from './components/HelpDrawer';
import ExplainModal from './components/ExplainModal';

let firstLoading = true;
let browserData = U.getOSBrowserData();
Log.filterMessages();


function App(props: AllProps): JSX.Element {
    //const debug = props.debug;
    const isLoading = props.isLoading;
    let [user, updateUser] = useState(DUser.current);
    let [useless, forceUpdate] = useState(0);

    // DEBUG: Track mousedown events to diagnose context menu issue
    useEffect(() => {
        const debugMouseDown = (e: MouseEvent) => {
            if (e.button === 2) { // Right-click only
                console.log('[DEBUG-GLOBAL] Right-click mousedown', {
                    target: (e.target as HTMLElement)?.className,
                    targetTag: (e.target as HTMLElement)?.tagName,
                    propagationStopped: e.defaultPrevented,
                    eventPhase: e.eventPhase, // 1=capture, 2=target, 3=bubble
                });
            }
        };
        document.addEventListener('mousedown', debugMouseDown, true); // capture phase
        return () => document.removeEventListener('mousedown', debugMouseDown, true);
    }, []);

    /*
    const tooltip = props.tooltip;
    let user: LUser = LPointerTargetable.wrap(user);
    useEffect(() => {
    */
    //let user = LUser.fromPointer(DUser.current);
    //console.log('app render 0', {firstLoading, navigating:U.navigating, isLoading, useless, user});
    if (firstLoading) {
        firstLoading = false;
        stateInitializer().then(()=> {
            (window as any).appcompo2 = {updateUser, forceUpdate};
            // @ts-ignore
            (window as any).appcompo = {thiss: this, updateUser, forceUpdate};
            updateUser(DUser.current);
            forceUpdate(1);
        });
        return <Loader/>;
    }
    //console.log('app render 1', {firstLoading, navigating:U.navigating, isLoading, useless, user});

    if (U.navigating) return <Loader/>;

    if (DUser.current !== user) updateUser(DUser.current);
    if (/*window.location.hash === '' && */browserData.browser === 'Firefox') U.alert('e', 'Unsupported browser',
        'Firefox is not supported yet and have known issues.\nplease open this website on another browser.');
    //console.log('app render 2', {firstLoading, navigating:U.navigating, isLoading, useless, user});

    return (<>
        <SettingsModalProvider>
        <ToastProvider>
        <DevModeProvider>
        <GlobalDrawerProvider>
        <FeaturesPanelProvider>
        <TreeViewPanelProvider>
            <div className={"router-wrapper"}>
                {isLoading && <Loader/>}
                <ExternalLibraries/>
                <Try><TooltipVisualizer/></Try>

                {/*<MessageVisualizer />*/}
                <Try><AlertVisualizer/></Try>
                <Try><DialogVisualizer/></Try>
                <Try><JjtlDialogManager/></Try>
                <HashRouter>
                    <Try><PathChecker/></Try>
                    <Try><Routes>
                        {user ? <>
                            <Route path={'allProjects'} element={<AllProjectsPage/>}/>
                            <Route path={'project'} element={<ProjectPage/>}/>
                            <Route path={'updates'} element={<UpdatesPage/>}/>
                            <Route path={'account'} element={<AccountPage/>}/>
                            <Route path={'auth'} element={<AuthPage/>}/>
                            {/* Design System - Token Preview */}
                            <Route path={'test-tokens'} element={<TokenPreviewPage/>}/>
                            {/* Resize Handle Test */}
                            <Route path={'test-resize'} element={<TestLayout/>}/>
                            {/* Editor V2 - React Flow PoC */}
                            <Route path={'editor-v2'} element={<EditorV2/>}/>
                            {/* non functioning stuff */}
                            <Route path={'settings'} element={<SettingsPage/>}/>
                            <Route path={'projectsInfo'} element={<ProjectsInfoPage_Obsolete/>}/>
                            <Route path={'news'} element={<NewsPage/>}/>
                            <Route path={'usersInfo'} element={<UsersInfoPage/>}/>
                            <Route path={'profile'} element={<ProfilePage/>}/>
                            <Route path={'archive'} element={<ArchivePage/>}/>
                            <Route path={'notes'} element={<NotesPage/>}/>
                            <Route path={'templates'} element={<TemplatePage/>}/>
                            <Route path={'recent'} element={<RecentPage_Obsolete/>}/>
                            <Route path={'community'} element={<CommunityPage/>}/>
                            { /* working fallback, keep it last */}
                            <Route path={'*'} element={<AllProjectsPage/>}/>
                        </> :
                        <>
                            <Route path={'confirm/:id/:token'} element={<ConfirmAccount/>}/>
                            <Route path={'*'} element={<AuthPage/>}/>
                        </>
                        }
                    </Routes></Try>
                    {user && <Try><NotificationWidget/></Try>}
                    {user && <Try><Jodie/></Try>}
                </HashRouter>
                {user && <Try><GlobalDrawer/></Try>}
                {user && <Try><HelpDrawer/></Try>}
                {user && <Try><ExplainModal/></Try>}
                {user && <Try><DonationBanner/></Try>}

            </div>
        </TreeViewPanelProvider>
        </FeaturesPanelProvider>
        </GlobalDrawerProvider>
        </DevModeProvider>
        </ToastProvider>
        </SettingsModalProvider>
    </>);

    /*
    if (user) {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? ' debug' : '')}
                    onClick={e => statehistory.globalcanundostate = true}>
            {isLoading && <Loader />}
            {tooltip && <ToolTip />}
            <Navbar />
            <Helper />
            {(project) ? (project.type === 'collaborative' && !DUser.offlineMode) ? <CollaborativeAttacher project={project} /> : <Editor /> : <Dashboard />}
        </div>);
    } else {
        return(<>
            {isLoading && <Loader />}
            <Auth />
        </>);
    }
    */
}

interface OwnProps {
    room?: string
}

interface StateProps {
    //offlineMode: boolean,
    debug: boolean,
    isLoading: boolean
    tooltip: string
    user: Pointer<DUser>; // do not use, just for triggering rerender. use state.user instead
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    //ret.debug = state.debug;
    ret.isLoading = state.isLoading;
    ret.user = DUser.current;
    // ret.user = LUser.fromPointer(DUser.current);
    // needed here as props, because apparently functional components are memoized by default.
    //ret.offlineMode = DUser.offlineMode;
    // ret.tooltip = state.tooltip;
    // console.log("app re mapstate", {u:DUser.current, o:DUser.offlineMode});
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const AppConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(App);

export default AppConnected;
