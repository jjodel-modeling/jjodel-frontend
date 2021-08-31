import React, {CSSProperties, useState} from "react";
import ReactDOM from "react-dom";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DraggingStyle,
    NotDraggingStyle,
    DroppableStateSnapshot, DroppableProvided
} from "react-beautiful-dnd";
import {GObject} from "../../joiner";

// fake data generator
const getItems = (count: number, offset: number = 0) =>
    Array.from({length: count}, (v, k) => k).map(k => ({
        id: `item-${k + offset}-${new Date().getTime()}`,
        content: `item ${k + offset}`
    }));

const reorder = (list: Iterable<{ id: string; content: string; }> | ArrayLike<{ id: string; content: string; }>, startIndex: number, endIndex: number): { id: string; content: string; }[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source: Iterable<unknown> | ArrayLike<unknown>, destination: Iterable<unknown> | ArrayLike<unknown>,
              droppableSource: { index: number; droppableId: string | number; },
              droppableDestination: { index: number; droppableId: string | number; }): GObject => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result: GObject = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};
const grid = 8;

// as css style
const getItemStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | GObject | undefined): GObject => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? "lightgreen" : "grey",

    // styles we need to apply on draggables
    ...draggableStyle
});
const getListStyle = (isDraggingOver: boolean, snapshot: DroppableStateSnapshot, provided: DroppableProvided): CSSProperties => {
    console.log('dnd', {snapshot, provided});
    const a = snapshot.draggingOverWith ;
    const b = a;
    const iout = +provided.droppableProps["data-rbd-droppable-context-id"] + (snapshot.draggingOverWith ? +snapshot.draggingOverWith : 0);
    const iin = +provided.droppableProps["data-rbd-droppable-context-id"] + (snapshot.draggingFromThisWith ? +snapshot.draggingFromThisWith : 0);
    const allow = (!isDraggingOver ? (iout % 2) : (iin % 2)) === 0;
    let color;
    if (isDraggingOver) {
        color = allow ? 'blue' : 'red';
    }
    else {
        color = allow ? 'wheat' : 'black'; // black is never applied, white is when inactive
    }
    return {
        background: color,
        padding: grid,
        width: 250,
        position: "relative",
    }
};

function QuoteApp() {
    const [state, setState] = useState([getItems(10), getItems(5, 10)]);

    function onDragEnd(result: { source: any; destination: any; } & GObject) {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }
        const sInd: number = +source.droppableId;
        const dInd: number = +destination.droppableId;

        if (sInd === dInd) {
            const items = reorder(state[sInd], source.index, destination.index);
            const newState = [...state];
            newState[sInd] = items;
            setState(newState);
        } else {
            const result = move(state[sInd], state[dInd], source, destination);
            const newState = [...state];
            newState[sInd] = result[sInd];
            newState[dInd] = result[dInd];

            setState(newState.filter(group => group.length));
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setState([...state, []]);
                }}
            >
                Add new group
            </button>
            <button
                type="button"
                onClick={() => {
                    setState([...state, getItems(1)]);
                }}
            >
                Add new item
            </button>
            <div style={{ display: "flex" }}>
                <DragDropContext onDragEnd={onDragEnd as any}>
                    {state.map((el, ind) => (
                        <Droppable key={ind} droppableId={`${ind}`}>
                                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        style={getListStyle(snapshot.isDraggingOver, snapshot, provided)}
                                        {...provided.droppableProps}
                                    ><h1>test</h1>
                                        <div className={"dragcontainer"} style={{position: "absolute"}}>
                                        {el.map((item, index) => (
                                            <Draggable
                                                key={item.id}
                                                draggableId={item.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={getItemStyle(
                                                            snapshot.isDragging,
                                                            provided.draggableProps.style
                                                        )}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-around"
                                                            }}
                                                        >
                                                            {item.content}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newState = [...state];
                                                                    newState[ind].splice(index, 1);
                                                                    setState(
                                                                        newState.filter(group => group.length)
                                                                    );
                                                                }}
                                                            >
                                                                delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        </div>
                                        {provided.placeholder}
                                    </div>
                                )}
                        </Droppable>
                    ))}
                </DragDropContext>
            </div>
        </div>
    );
}
export const QA = QuoteApp;
