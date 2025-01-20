import { TbHexagonLetterJ as Logo1} from "react-icons/tb";
import { IoLogoWebComponent as Logo2} from "react-icons/io5";
import { int } from "../../joiner/types";

type LogoProps = {
    style?: any;
    className?: any;
}

export const Logo = (props: LogoProps) => {
    return (<Logo1 style={props.style && props.style} className={`logo ${props.className && props.className}`} />);
}

