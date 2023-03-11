import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {GObject, LModelElement} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


function ConsoleComponent(props: AllProps) {
    const data = props.data;
    const [expression, setExpression] = useStateIfMounted('data');
    const [output, setOutput] = useStateIfMounted('');

    const change = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setExpression(evt.target.value);
    }

    useEffect(() => {
        try {
            setOutput(eval(expression));
        } catch (e) {setOutput('Invalid Syntax!')}

    }, [expression])

    if(data) {
        return(<div className={'p-2 w-100 h-100'}>
            <textarea spellCheck={false} className={'p-0 input mb-2 w-100'} onChange={change} />
            <label>On {(data as GObject).name}</label>
            <hr className={'mt-1 mb-1'} />
            {JSON.stringify(output)}
        </div>)
    } else { return(<div></div>) }
}
interface OwnProps {}
interface StateProps { data: LModelElement|undefined }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const me = state._lastSelected?.modelElement;
    ret.data = (me) ? LModelElement.fromPointer(me) : undefined;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ConsoleConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ConsoleComponent);

export const Console = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ConsoleConnected {...{...props, childrens}} />;
}
export default Console;
