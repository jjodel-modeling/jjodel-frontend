import { TbHexagonLetterJ as Logo1} from "react-icons/tb";

import {
    TbSquareRoundedLetterM,
    TbSquareRoundedLetterMFilled
} from "react-icons/tb";


type LogoProps = {
    style?: any;
    className?: any;
}

export const Logo = (props: LogoProps) => {
    return (<Logo1 style={props.style && props.style} className={`logo ${props.className && props.className}`} />);
}

export const MetamodelIcon = (props: LogoProps) => {
    return (<TbSquareRoundedLetterMFilled style={props.style && props.style} className={`logo ${props.className && props.className}`} />);
}

export const ModelIcon = (props: LogoProps) => {
    return (<TbSquareRoundedLetterM style={props.style && props.style} className={`logo ${props.className && props.className}`} />);
}

