import React, {PureComponent, ReactNode} from "react";
import './myInput.scss';


class MyInputComponent extends PureComponent<AllProps, ThisState>{
    render(): ReactNode {
        return (<>
            <label className={"myinput-root "} data-type={this.props.type || "text"}>
                {this.props.childrenAlignment === "pre" ? this.props.children : null}
                <span className="myinput-label">{this.props.label}</span>
                {this.props.childrenAlignment === "middle" ? this.props.children : null}
                <input {...this.props} className={ (this.props.className || "") + "myinput-input"} />
                {this.props.childrenAlignment === "post" || !this.props.childrenAlignment ? this.props.children : null}
            </label>
        </>); }
}

// private
interface ThisState {}
// private
interface OwnProps {
    label: string | ReactNode;
    childrenAlignment?: "pre" | "middle" | "post";
}

// private
type AllProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & OwnProps;


export default MyInputComponent;
