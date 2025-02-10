import { TbHexagonLetterJ as Logo1} from "react-icons/tb";
import { IoLogoWebComponent as Logo2} from "react-icons/io5";
import {
    TbSquareRoundedLetterM,
    TbSquareRoundedLetterMFilled,
    TbSquareRoundedLetterV,
    TbSquareRoundedLetterVFilled,
    TbSquareRoundedLetterE
} from "react-icons/tb";

import { int } from "../../joiner/types";

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



