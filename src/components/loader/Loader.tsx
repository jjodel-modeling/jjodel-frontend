import React, {Dispatch, ReactElement} from 'react';
import './style.scss';
import {Oval} from 'react-loader-spinner';
import {DState} from "../../redux/store";
import {connect} from "react-redux";

function LoaderComponent(props: AllProps) {
    if(!props.isLoading) return(<></>);

    const prevent = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
    }

    return(<div className={'loader'} onContextMenu={prevent} onClick={prevent}>
        <Oval height={50} width={50} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
              color={'rgba(0, 0, 0, 0.9)'} secondaryColor={'rgba(0, 0, 0, 0.6)'} />
    </div>);
}

interface OwnProps {}
interface StateProps {isLoading: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const isLoading = state.isLoading;
    return {isLoading};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const LoaderConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(LoaderComponent);

export const Loader = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <LoaderConnected {...{...props, children}} />;
}
export default Loader;

