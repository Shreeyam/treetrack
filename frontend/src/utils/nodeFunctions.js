// src/utils/nodeFunctions.js

import { v4 as uuidv4 } from 'uuid'

// Helper to optimistically add a new node, then patch its ID when the server responds
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
    position = null // Add optional position parameter
}) {
    // Constants for cascading logic
    const CASCADE_OFFSET = 50;
    const VIEWPORT_START_OFFSET = { x: 50, y: 50 };
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const DEFAULT_COLOR = '#ffffff';  // Define default color constant

    return () => {
        // Only validate title when not providing a position (i.e., when using the top bar add button)
        if (!position && !newTaskTitle.trim()) {
            return;
        }
        if (!reactFlowInstance || !reactFlowWrapper.current) {
            return;
        }

        let newPosition;
        
        // If a specific position is provided (e.g. from context menu), use that
        if (position) {
            const viewport = reactFlowInstance.getViewport();
            newPosition = reactFlowInstance.screenToFlowPosition({
                x: position.x,
                y: position.y
            });
        } else {
            // Otherwise use the cascading logic for the top bar "+" button
            const viewport = reactFlowInstance.getViewport();
            const bounds = reactFlowWrapper.current.getBoundingClientRect();

            const flowStartX = (VIEWPORT_START_OFFSET.x - viewport.x) / viewport.zoom;
            const flowStartY = (VIEWPORT_START_OFFSET.y - viewport.y) / viewport.zoom;
            const initialCascadePoint = { x: flowStartX, y: flowStartY };

            let isLastPosVisible = false;
            if (lastNodePosition) {
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

        // --- optimistic insertion ---
        const taskTitle = newTaskTitle.trim() || 'New Task';
        const tempId = `temp-${Date.now()}`;
        const optimisticNode = {
            id: tempId,
            data: { label: taskTitle, completed: false, color: DEFAULT_COLOR },  // Use default color constant
            position: newPosition,
            style: createNodeStyle(DEFAULT_COLOR, false),
            sourcePosition: 'right',
            targetPosition: 'left'
        };

        setNodes(nodes => [...nodes, optimisticNode]);
        setNewTaskTitle('');
        if (!position) { // Only update last position for cascading
            setLastNodePosition(newPosition);
        }

        // --- send to server ---
        const newTask = {
            title: taskTitle,
            posX: newPosition.x,
            posY: newPosition.y,
            completed: 0,
            project_id: parseInt(currentProject, 10),
            color: DEFAULT_COLOR  // Use default color constant
        };

        fetch('/api/tasks', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        })
            .then(res => res.json())
            .then(json => {
                // replace tempId with real id
                setNodes(nodes =>
                    nodes.map(n =>
                        n.id === tempId
                            ? { ...n, id: json.id.toString() }
                            : n
                    )
                );
            })
            .catch(err => {
                console.error('Failed to create task:', err);
                // roll back optimistic node
                setNodes(nodes => nodes.filter(n => n.id !== tempId));
            });
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
