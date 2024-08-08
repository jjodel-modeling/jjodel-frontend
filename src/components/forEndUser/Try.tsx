import React, {Dispatch, ErrorInfo, KeyboardEvent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {compressToBase64, compressToUTF16, decompressFromBase64, decompressFromUTF16} from "async-lz-string";
import {
    Defaults,
    DPointerTargetable,
    DV,
    GObject,
    Keystrokes,
    Log,
    LPointerTargetable,
    Overlap,
    Pointer, store,
    U, LoggerCategoryState
} from '../../joiner';
/*
*   What's uncatched:
*   - reducer
*   - mapstatetoprops, if reducer doesn't do his job
*
*
*
*
*
* */

// todo: after we have a server, instead of this, make an automatic error report with POST requests to the server without having the uri char limit
class TryComponent extends React.Component<AllProps, State> {
    static cname: string = "TryComponent";
    static mailRecipients = ["damiano.divincenzo@student.univaq.it", "giordano.tinella@student.univaq.it"];

    constructor(props: AllProps) {
        super(props);
        this.state = { error: undefined, info: undefined, stateUpdateTime: 0, canUseClipboard: true};
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { error, info: undefined }; // this first set an error and stops error propagation
    }

    private postGitIssue(content: string){
        let owner = 'MDEGroup';
        let repo = 'jjodel';
        let obj = {
            owner,
            repo,
            title: 'Automatic bug report',
            body: content,
            labels: [
                'bug', 'auto-bug'
            ],
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        }
        this.postBugReport(`https://api.github.com/repos/${owner}/${repo}/issues`, JSON.stringify(obj));

    }
    private postBugReport(url: string, content: string){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(content);
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error("uncatched error didcatch:", {info});
        // this is called after error propagation and a full render cycle is complete, i use it to trigger a rerender with more accurate infos.
        this.setState({error, info, stateUpdateTime: this.props.stateUpdateTime});
    }

    render() {
        /*
        if (this.props.stateUpdateTime !== this.state.stateUpdateTime) {
            // after a redux state update try checking if error is gone
            return this.props.children;
        }*/
        if (this.state.error) {
            // You can render any custom fallback UI
            return this.catch(this.state.error, this.state.info);
        }
        if (Array.isArray(this.props.children)) {
            console.error("<Try /> can have only 1 subcomponent", this.props.children, this);
            return this.catch({message: "<Try /> can have only 1 subcomponent. If you need more wrap them inside a <>React.fragment</>"} as any, undefined);
        }
        if (!React.isValidElement(this.props.children)) {
            // You can render any custom fallback UI
            console.error("Children is not a valid React Element", this.props.children, this);
            return this.catch({message: "Children is not a valid React Element"} as any, undefined);
        }
        return this.props.children;
    }
    reset(){
        this.setState({error:undefined, info: undefined, lz: undefined});
    }

    catch(error: Error, info?: React.ErrorInfo): ReactNode{
        console.error("uncatched error:", {state:{...this.state}});
        let debug = false;
        if (debug) return<div>error</div>;
        if (this.props.catch) {
            try {
                if (typeof this.props.catch === "function") return this.props.catch(error, info);
                if (React.isValidElement(this.props.catch)) return this.props.catch;
            }
            catch (e) {
                console.error("uncatched error WITH INVALID CATCHING FUNC", {catcherFuncError:e});
            }
        }


        let state: DState = store.getState();
        let title = "Jodel assisted error report V"+state?.version?.n;
        (window as any).tryerror = error;
        let reportstr = this.state.lz || this.stringreport(Log.getByError(error));
        let mongoreport = {state: state, when: new Date()+'', e:{'stack':error.stack, 'msg':error.message}, compostack: info?.componentStack};
        // todo giordano: salva mongoreport su mongodb

        const msgbody_notencoded: string = "This mail is auto-generated, it might contain data of your views or model.\n" +
            "If your project have sensitive personal information please do a manual report instead."+// check the report below to omit them.\n\n" +
            "" + error?.message + "\n\n" +
            (reportstr ? 'logger report'+(this.state.lz ? ' (lz-base64)' : '')+':\n' + encodeURIComponent(reportstr) +'\n\n' : '') +
            "_stack:\n" + U.cropStr(error.stack || '', 30, 0, 35, 15) + '\n\n'+
            "_component_stack:\n" + (info ? U.cropStr(info.componentStack, 10, 0, 35, 5) : '');

        let {mailto, gitissue} = U.mailerror(TryComponent.mailRecipients, title, msgbody_notencoded, this.state.canUseClipboard,
            undefined, ()=>{this.setState({canUseClipboard: false})});

        let shortErrorBody = (error?.message || "\n").split("\n")[0];
        let visibleMessage: ReactNode = <div onClick={()=> this.reset()}>
            <div>{info ? "has info": "###########"}</div>
            <div>ut:{this.state.stateUpdateTime}, { shortErrorBody }</div>
            <div>What you can try:</div>
            <ul>
                <li>- Undo the last change</li>
                <li>- {mailto && [<a href={mailto}>Mail the developers</a>, " or"]} <a href={gitissue} target="_blank">open an issue</a></li>
            </ul>
            {state.debug ? this.decompress() : undefined}
        </div>
        return DV.error_raw(visibleMessage, "unhandled");
    }

    decompress(){
        function dec(e:any){
            e.stopPropagation();
            let s: any=undefined, s1: any=undefined, s2:Promise<string>=undefined as any, o: any=undefined;
            try { s = e.target.value; } catch (e) {
                console.error("crashed decompress", e);
            }
            try { s1 = decodeURIComponent(s); } catch (e) {
                console.error("crashed decompress uri", e);
            }
            try { s2 = decompressFromBase64(s1); } catch (e) {
                console.error("crashed decompress lz", e);
            }
            if (s2) {s2.then(v=> {
                try { o = JSON.parse(s2=v as any) } catch (e) { console.error("crashed decompress p", e, v); }
            }).finally(()=>{
                let out = {s, uri:s1, lz:s2, o};
                console.log('decompress final', out);
                $('#decompress')[0].innerText = JSON.stringify(o ||  out, null, 4);

            })} else {
                let out = {s, uri:s1, lz:s2, o};
                console.log('decompress else', out);
                $('#decompress')[0].innerText = JSON.stringify(o ||  out, null, 4);
            }
        }
        return (<><span>Debug mode: paste error report to decompress it.</span><textarea className={"w-100"} onChange={dec}></textarea><textarea id={"decompress"} className={"w-100"} /></>);
    }


    private stringreport(loggerReport0?: GObject): string | undefined{
        if (!loggerReport0) return undefined;
        let loggerReport = {...loggerReport0};
        (window as any).loggerReport = loggerReport;
        delete loggerReport.exception;
        loggerReport = U.cropDeepObject(loggerReport);
        loggerReport.time = loggerReport0.time; // do not "crop" timestamp
        delete loggerReport.short_string
        let s = JSON.stringify(U.cropDeepObject(loggerReport));
        /*(window as any).compressToUTF16 = compressToUTF16;
        (window as any).decompressFromUTF16 = decompressFromUTF16;
        (window as any).compressToBase64 = compressToBase64;
        (window as any).decompressFromBase64 = decompressFromBase64;
        (window as any).ss = s;*/
        // or: LZString.compressToBase64()
        if (s.length > 100) compressToBase64(s).then((v)=> this.setState({lz:v}));
        return s;
    }
}
interface State{
    error?: Error;
    info?: React.ErrorInfo;
    stateUpdateTime: number;
    canUseClipboard: boolean;
    lz?: string;
}
interface OwnProps {
    key?: React.Key | null;
    catch?: ReactNode | ((error: Error, info?: React.ErrorInfo) => ReactNode);
    children: ReactNode;
}
interface StateProps {
    stateUpdateTime: number;
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;

let rendercount: number = 0;
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.stateUpdateTime = rendercount++; // new Date().getTime();
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const TryConnected =
    connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, mapDispatchToProps)(TryComponent);


export function Try(props: OwnProps): ReactElement {
    return <TryConnected {...{...props}}>{props.children}</TryConnected>;
}

TryComponent.cname = 'TryComponent';
TryConnected.cname = 'TryConnected';
Try.cname = 'Try';
