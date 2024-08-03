// import './style.scss';
// import React, {useEffect, useRef, useState} from 'react';
// import {Info, Skeleton, Viewpoints, Views, Settings, Console} from "../../components/editors";
// import {GObject} from "../../joiner";
// import $ from 'jquery';
// import {useEffectOnce} from "usehooks-ts";
//
// type Props = {};
// function Editors(props: Props): JSX.Element {
//     const [selected, setSelected] = useState(-1);
//     const [background, setBackground] = useState('#5F0F40');
//     const [color, setColor] = useState('#FFFFFF');
//     const editors = [
//         {icon: 'bi bi-info-lg', name: 'Info', component: <Info />},
//         {icon: 'bi bi-stack', name: 'Skeleton', component: <Skeleton />},
//         {icon: 'bi bi-stars', name: 'Views', component: <Views />},
//         {icon: 'bi bi-box', name: 'Viewpoints', component: <Viewpoints />},
//         {icon: 'bi bi-terminal', name: 'Console', component: <Console />},
//         {icon: 'bi bi-gear', name: 'Options', component: <Settings {...{background, setBackground, color, setColor}} />}
//     ];
//
//     const htmlReference: React.MutableRefObject<null | HTMLDivElement>= useRef(null);
//     useEffect(() => {
//         if (!htmlReference.current) return;
//         const resizeOptions = {handles: 'w'};
//         ($(htmlReference.current) as GObject<'JQuery + ui plugin'>).resizable(resizeOptions);
//     }, [htmlReference.current]);
//     useEffect(() => {
//         if (!htmlReference.current) return;
//         if(selected !== 5) ($(htmlReference.current) as GObject<'JQuery + ui plugin'>).resizable('disable');
//         else ($(htmlReference.current) as GObject<'JQuery + ui plugin'>).resizable('enable');
//     }, [selected]);
//
//     return(<div className={'editors'} ref={htmlReference} style={{borderLeft: (selected === 5) ? `1px dashed ${background}` : 'none'}}>
//         <div className={'d-flex h-100'}>
//             <section className={'mt-2'} style={{position: (selected >= 0) ? 'relative' : 'fixed', right: (selected >= 0) ? 'inherit' : '0'}}>
//                 {editors.map((e, i) => <div style={{background: background}} key={i} className={'editor-button'} tabIndex={-1} onClick={() => {
//                     if(selected !== i) setSelected(i);
//                     else setSelected(-1);
//                 }}>
//                         <i style={{color}} className={`${e.icon} d-block m-auto`} />
//                 </div>)}
//                 {(selected >= 0) && <div className={'editor-button bg-danger'} tabIndex={-1} onClick={() => setSelected(-1)}>
//                     <i className={'bi bi-x d-block text-white m-auto'} />
//                 </div>}
//             </section>
//
//             <section className={'editor-container border'} hidden={selected < 0}>
//                 {selected >= 0 && <>
//                     <b className={'d-block text-center'}>{editors[selected].name.toUpperCase()}</b>
//                     <hr className={'my-2'} />
//                     {editors[selected].component}
//                 </>}
//             </section>
//
//         </div>
//     </div>);
// }
//
// export {Editors};
export const removed = true;
