// src/utils/nodeFunctions.js

import { v4 as uuidv4 } from 'uuid'

// Helper to add a new node using Yjs
export function createAddNewNode({
    newTaskTitle,
    currentProject,
    reactFlowInstance,
    reactFlowWrapper,
    lastNodePosition,
    cascadeCount,
    cascadeStartPoint,
    createNodeStyle,
    setCascadeCount,
    setCascadeStartPoint,
    setLastNodePosition,
    setNewTaskTitle,
    setNodes,
    position = null, // Add optional position parameter
    yjs = null // Add Yjs handler parameter
}) {
    // Constants for cascading logic
    const CASCADE_OFFSET = 50;
    const VIEWPORT_START_OFFSET = { x: 50, y: 50 };
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const DEFAULT_COLOR = '#ffffff';

    return () => {
        if (!reactFlowInstance || !reactFlowWrapper.current) {
            return;
        }

        let newPosition;
        const viewport = reactFlowInstance.getViewport();
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const flowStartX = (VIEWPORT_START_OFFSET.x - viewport.x) / viewport.zoom;
        const flowStartY = (VIEWPORT_START_OFFSET.y - viewport.y) / viewport.zoom;
        const initialCascadePoint = { x: flowStartX, y: flowStartY };
        
        // If a specific position is provided (e.g. from context menu), use that
        if (position) {
            newPosition = {
                x: position.x,
                y: position.y
            };
        } else {
            let isLastPosVisible = false;
            if (lastNodePosition && typeof lastNodePosition.x === 'number' && typeof lastNodePosition.y === 'number') {
                const screenX = lastNodePosition.x * viewport.zoom + viewport.x;
                const screenY = lastNodePosition.y * viewport.zoom + viewport.y;
                if (
                    screenX > 0 &&
                    screenX + NODE_WIDTH + CASCADE_OFFSET < bounds.width &&
                    screenY > 0 &&
                    screenY + NODE_HEIGHT + CASCADE_OFFSET < bounds.height
                ) {
                    isLastPosVisible = true;
                }
            }

            if (lastNodePosition && isLastPosVisible) {
                const candidatePos = {
                    x: lastNodePosition.x + CASCADE_OFFSET,
                    y: lastNodePosition.y + CASCADE_OFFSET
                };
                const candScreenX = candidatePos.x * viewport.zoom + viewport.x;
                const candScreenY = candidatePos.y * viewport.zoom + viewport.y;
                const isCandidateVisible =
                    candScreenX + NODE_WIDTH + CASCADE_OFFSET > 0 &&
                    candScreenX + NODE_WIDTH + CASCADE_OFFSET < bounds.width &&
                    candScreenY + NODE_HEIGHT + CASCADE_OFFSET > 0 &&
                    candScreenY + NODE_HEIGHT + CASCADE_OFFSET < bounds.height;

                if (isCandidateVisible) {
                    newPosition = candidatePos;
                    setCascadeCount(prev => prev + 1);
                } else {
                    const startPoint = cascadeStartPoint || initialCascadePoint;
                    newPosition = {
                        x: startPoint.x,
                        y: startPoint.y + CASCADE_OFFSET
                    };
                    setCascadeStartPoint(newPosition);
                    setCascadeCount(1);
                }
            } else {
                newPosition = initialCascadePoint;
                setCascadeStartPoint(initialCascadePoint);
                setCascadeCount(1);
            }
        }

        // Ensure position values are valid numbers
        if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
            newPosition = initialCascadePoint;
        }

        const taskTitle = newTaskTitle.trim() || 'New Task';
        
        if (!yjs || !yjs.addTask) {
            console.error('Yjs handler not available or missing addTask method');
            return;
        }

        // Add task to Yjs document
        const newTaskData = {
            title: taskTitle,
            posX: newPosition.x,
            posY: newPosition.y, 
            completed: false,
            color: DEFAULT_COLOR
        };
          // Add to Yjs document - this will trigger the YJS observer in App.jsx
        // which will update the React state with all nodes including this new one
        const newTaskId = yjs.addTask(newTaskData);
        
        // Don't directly update React state - let the YJS observer handle it
        // The observer will get triggered by the YJS document change and add the node to state
        
        setNewTaskTitle('');
        setLastNodePosition(newPosition);
    };
}

// Utility to only return a new array if something actually changed
export function mapWithChangeDetection(prevArray, mapper) {
    let mutated = false
    const next = prevArray.map(item => {
        const updated = mapper(item)
        if (updated !== item) mutated = true
        return updated
    })
    return mutated ? next : prevArray
}
