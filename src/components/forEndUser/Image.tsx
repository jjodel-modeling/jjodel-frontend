import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState} from "../../redux/store";


function ImageComponent(props: AllProps) {
    let link;
    if (props.code && props.name){
        link = 'https://www.svgrepo.com/show/';
        link += props.code + '/';
        link += props.name + '.svg';
    } else {
        link = (props as any).src;
    }
    return <img className={'h-100 w-100'} src={link} />; // damiano: what's this? added to read src if provided
}
interface OwnProps { code: string; name: string; }
interface StateProps { }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ImageConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ImageComponent);

export const Image = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ImageConnected {...{...props, children}} />;
}
export default Image;
