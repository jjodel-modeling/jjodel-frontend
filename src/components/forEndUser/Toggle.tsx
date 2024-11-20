export let deleted = true;
// import { useState } from "react";
// import { SetRootFieldAction } from "../../joiner";

// import "./toggle.scss";

// type ToggleValues = {
//     true: string;
//     false: string;
// }

// type ToggleProps = {
//     name: string;
//     data: any;
//     values?: ToggleValues;
//     labels?: ToggleValues;
//     size?: "small" | "medium" | "large";
//     style?: React.CSSProperties;
// };

// const Toggle2 = (props: ToggleProps) => {
    
//     const labels = props.labels ? props.labels : {true: props.name+' on', false: props.name+' off'};
    
//     const toggleValue = () => {



//     };

//     return (
//         <div className={`toggle ${props.size ? props.size : 'medium'}`} onClick={() => {toggleValue()}} style={props.style}>
//             c<input id={props.name} type="checkbox" value="true" checked={props.data}  />
//             <div className={"labels"}>
//                 <span className={"on"}>{labels['true']}</span>
//                 <span className={"off"}>{labels['false']}</span>
//             </div>
//             <label></label>
//         </div>
//     );
// }

// export {Toggle2}