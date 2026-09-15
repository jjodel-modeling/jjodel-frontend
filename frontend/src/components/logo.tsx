import { TbHexagonLetterJ as Logo1} from "react-icons/tb";
import { ElementBadge } from "./common/ElementBadge";


type LogoProps = {
    style?: any;
    className?: any;
}

export const Logo = (props: LogoProps) => {
    return (<Logo1 style={props.style && props.style} className={`logo ${props.className && props.className}`} />);
}

export const MetamodelIcon = (props: LogoProps) => {
    return (<ElementBadge type="metamodel" className={`logo ${props.className || ''}`} />);
}

export const ModelIcon = (props: LogoProps) => {
    return (<ElementBadge type="model" className={`logo ${props.className || ''}`} />);
}

