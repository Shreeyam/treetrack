import { addEdge } from '@xyflow/react';

// Constants for Cascading
const CASCADE_OFFSET = 50;
const VIEWPORT_START_OFFSET = { x: 50, y: 50 };
const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

export const createNodeStyle = (color, completed, selected, draft) => {
    const backgroundColor = completed ? blendColors(color, '#e0e0e0', 0.5) : color;

    let style = {
        backgroundColor,
        color: completed ? '#888' : 'inherit',
        border: selected ? '2px solid blue' : '1px solid #ccc',
    };

    if (draft) {
        style = {
            ...style,
            backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.1),
                rgba(0, 0, 0, 0.1) 10px,
                transparent 10px,
                transparent 20px
            )`,
            backgroundSize: '57px 57px',
            animation: 'draftAnimation 3s linear infinite',
        };
    }

    return style;
};

export const addNewNode = (
    newTaskTitle,
    reactFlowInstance,
    reactFlowWrapper,
    lastNodePosition,
    cascadeCount,
    currentProject,
    setCascadeCount,
    setCascadeStartPoint,
    setNodes,
    setLastNodePosition,
    setNewTaskTitle
) => {
    if (!newTaskTitle.trim() || !reactFlowInstance || !reactFlowWrapper.current) return;

    const viewport = reactFlowInstance.getViewport();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    let newPosition;

    const flowStartX = (VIEWPORT_START_OFFSET.x - viewport.x) / viewport.zoom;
    const flowStartY = (VIEWPORT_START_OFFSET.y - viewport.y) / viewport.zoom;
    const initialCascadePoint = { x: flowStartX, y: flowStartY };

    let isLastPosVisible = false;
    if (lastNodePosition) {
        const screenX = lastNodePosition.x * viewport.zoom + viewport.x;
        const screenY = lastNodePosition.y * viewport.zoom + viewport.y;
        if (screenX + NODE_WIDTH > 0 && screenX < bounds.width &&
            screenY + NODE_HEIGHT > 0 && screenY < bounds.height) {
            isLastPosVisible = true;
        }
    }

    if (lastNodePosition && isLastPosVisible) {
        if (cascadeCount < 4) {
            newPosition = {
                x: lastNodePosition.x + CASCADE_OFFSET,
                y: lastNodePosition.y + CASCADE_OFFSET
            };
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

    const newTask = {
        title: newTaskTitle,
        posX: newPosition.x,
        posY: newPosition.y,
        completed: 0,
        project_id: parseInt(currentProject, 10),
        color: ''
    };

    fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
    })
        .then(res => res.json())
        .then(json => {
            const newNode = {
                id: json.id.toString(),
                data: { label: newTaskTitle, completed: false, color: '' },
                position: newPosition,
                style: createNodeStyle('#ffffff', false),
                sourcePosition: 'right',
                targetPosition: 'left'
            };
            setNodes(prev => [...prev, newNode]);
            setNewTaskTitle('');
            setLastNodePosition(newPosition);
        });
};

export const handleNodeClick = (
    event,
    node,
    contextMenu,
    selectedUnlinkSource,
    selectedSource,
    edges,
    setContextMenu,
    setSelectedUnlinkSource,
    setEdges,
    deleteDependency,
    setUnlinkHighlight,
    setSelectedSource,
    onConnect
) => {
    if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (!selectedUnlinkSource) {
            setSelectedUnlinkSource(node);
        } else if (selectedUnlinkSource.id !== node.id) {
            const edge = edges.find(e => e.source === selectedUnlinkSource.id && e.target === node.id);
            if (edge) {
                setEdges((eds) => eds.filter(e => e.id !== edge.id));
                deleteDependency(edge.id);
            }
            setUnlinkHighlight({ source: selectedUnlinkSource.id, target: node.id });
            setSelectedUnlinkSource(null);
            setTimeout(() => setUnlinkHighlight(null), 2000);
        }
        return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (!selectedSource) {
            setSelectedSource(node);
        } else if (selectedSource.id !== node.id) {
            onConnect({
                source: selectedSource.id,
                target: node.id
            });
            setSelectedSource(null);
        }
    }
};

export const handleToggleCompleted = (node, setNodes, updateTask, currentProject, createNodeStyle) => {
    const updatedCompleted = !node.data.completed;
    setNodes(prev =>
        prev.map(n =>
            n.id === node.id
                ? {
                    ...n,
                    data: { ...n.data, completed: updatedCompleted },
                    style: createNodeStyle(n.data.color, updatedCompleted),
                }
                : n
        )
    );

    updateTask(node.id, {
        title: node.data.label,
        posX: node.position.x,
        posY: node.position.y,
        completed: updatedCompleted ? 1 : 0,
        color: node.data.color,
        project_id: parseInt(currentProject)
    });
};

export const handleUpdateNodeColor = (node, color, setNodes, updateTask, currentProject, createNodeStyle) => {
    setNodes(prev =>
        prev.map(n =>
            n.id === node.id
                ? {
                    ...n,
                    data: { ...n.data, color },
                    style: createNodeStyle(color, n.data.completed)
                }
                : n
        )
    );

    updateTask(node.id, {
        title: node.data.label,
        posX: node.position.x,
        posY: node.position.y,
        completed: node.data.completed ? 1 : 0,
        color,
        project_id: parseInt(currentProject)
    });
};

export const handleEditNode = (node, setNodes, updateTask, currentProject) => {
    const newTitle = prompt('Edit task title', node.data.label);
    if (newTitle && newTitle.trim()) {
        setNodes(prev =>
            prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: newTitle } } : n)
        );

        updateTask(node.id, {
            title: newTitle,
            posX: node.position.x,
            posY: node.position.y,
            color: node.data.color,
            completed: node.data.completed ? 1 : 0,
            project_id: parseInt(currentProject)
        });
    }
};

export const handleDeleteNode = (node, setNodes, setEdges, deleteTask) => {
    deleteTask(node.id);
    setNodes(prev => prev.filter(n => n.id !== node.id));
    setEdges(prev => prev.filter(e => e.source !== node.id && e.target !== node.id));
};

export const handleDeleteSubtree = (node, edges, setNodes, setEdges, deleteTask) => {
    const toDelete = new Set();
    const dfs = (nodeId) => {
        if (toDelete.has(nodeId)) return;
        toDelete.add(nodeId);
        edges.filter(e => e.source === nodeId).forEach(e => dfs(e.target));
    };
    dfs(node.id);
    toDelete.forEach(nodeId => {
        deleteTask(nodeId);
    });
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    setEdges(prev => prev.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
};