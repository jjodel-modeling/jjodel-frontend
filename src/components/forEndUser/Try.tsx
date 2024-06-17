import React, {Dispatch, ErrorInfo, KeyboardEvent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Defaults,
    DPointerTargetable,
    DV,
    GObject,
    Keystrokes,
    LPointerTargetable,
    Overlap,
    Pointer,
    U
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';

class TryComponent extends React.Component<AllProps, State> {
    static cname: string = "TryComponent";
    constructor(props: AllProps) {
        super(props);
        this.state = { error: undefined, info: undefined, stateUpdateTime: 0 };
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { error, info: undefined }; // this first set an error and stops error propagation
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        // this is called after error propagation and a full render cycle is complete, i use it to trigger a rerender with more accurate infos.
        this.setState({error, info, stateUpdateTime: this.props.stateUpdateTime});
    }

    render() {
        if (this.props.stateUpdateTime !== this.state.stateUpdateTime) {
            // after a redux state update try checking if error is gone
            return this.props.children;
        }
        if (this.state.error) {
            // You can render any custom fallback UI
            return this.catch(this.state.error, this.state.info);
        }
        return this.props.children;
    }

    catch(error: Error, info?: React.ErrorInfo): ReactNode{
        if (this.props.catch) {
            try{
                if (typeof this.props.catch === "function") return this.props.catch(error, info);
                if (React.isValidElement(this.props.catch)) return this.props.catch;
            }
            catch (e) {
                console.error("uncatched error WITH INVALID CATCHING FUNC", {catcherFuncError:e});
            }
        }
        console.error("uncatched error:", {state:{...this.state}});
        let mailbody: string = encodeURIComponent(
            "This mail is auto-generated, it might contain data of your views or model.\n" +
            "If your project have sensitive personal information please check the report below to omit them.\n" +
            "" + error?.message + "\n\n\n" +
            "_error_stack:\n" + (info ? info.componentStack : '')
        );
        let mailtitle: string =  encodeURIComponent("Jodel assisted error report");
        let mailrecipients = ["damiano.divincenzo@student.univaq.it", "giordano.tinella@student.univaq.it"];
        // "mailto:no-one@snai1mai1.com?subject=look at this website&body=Hi,I found this website and thought you might like it http://www.geocities.com/wowhtml"
        let mailto = "mailto:"+mailrecipients.join(',')+"?subject="+mailtitle+"&body="+mailbody;
        let gitissue = "https://github.com/MDEGroup/jjodel/issues/new?title="+mailtitle+"&body="+mailbody;
        let shortErrorBody = (error?.message || "\n").split("\n")[0];


        let visibleMessage: ReactNode = <>
            <div>ut:{this.state.stateUpdateTime}</div>
            <div>Unhandled Error:{ shortErrorBody }</div>
            <div>What you can do:</div>
            <ul>
                <li>Undo the last change</li>
                <li><a href={mailto}>Mail the developers</a> or <a href={gitissue}>open an issue</a></li>
            </ul>
        </>
        return DV.error_raw(visibleMessage, "unhandled");
    }
}
interface State{
    error?: Error;
    info?: React.ErrorInfo;
    stateUpdateTime: number;
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


export function Try(props: OwnProps, children: ReactNode[] = []): ReactElement {
    return <TryConnected {...{...props, children}} />;
}

TryComponent.cname = 'TryComponent';
TryConnected.cname = 'TryConnected';
Try.cname = 'Try';
