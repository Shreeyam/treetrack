import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/globals.css';
import * as dagre from 'dagre';
import blendColors from './utils/colors';
import AuthForm from '@/components/auth/AuthForm';
import TopBar from '@/components/navigation/TopBar';
import FlowArea from '@/components/flow/FlowArea';
import { nodeStyles } from '@/components/flow/styles';

function App() {
    // --- Authentication States ---
    const [user, setUser] = useState(null);

    // --- Main App States ---
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(() => localStorage.getItem('currentProject') || '');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedUnlinkSource, setSelectedUnlinkSource] = useState(null);
    const [unlinkHighlight, setUnlinkHighlight] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [highlightNext, setHighlightNext] = useState(false);
    const [minimapOn, setMinimapOn] = useState(false);
    const [backgroundOn, setBackgroundOn] = useState(true);
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });

    // React Flow
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // --- Session Management ---
    useEffect(() => {
        fetch('/api/me', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    useEffect(() => {
        if (currentProject) {
            loadTasksAndEdges(currentProject);
            localStorage.setItem('currentProject', currentProject);
        }
    }, [currentProject]);

    // --- Project Management ---
    const loadProjects = async () => {
        try {
            const res = await fetch('/api/projects', { credentials: 'include' });
            const data = await res.json();
            setProjects(data.projects);
            if (data.projects.length > 0 && (!currentProject || !data.projects.some(p => p.id.toString() === currentProject))) {
                const firstProjectId = data.projects[0].id.toString();
                setCurrentProject(firstProjectId);
                localStorage.setItem('currentProject', firstProjectId);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadTasksAndEdges = async (projectId) => {
        try {
            const tasksRes = await fetch(`/api/tasks?project_id=${projectId}`, { credentials: 'include' });
            const tasksData = await tasksRes.json();
            const newNodes = tasksData.tasks.map(task => ({
                id: task.id.toString(),
                data: { label: task.title, completed: task.completed === 1, color: task.color || '#ffffff' },
                position: { x: task.posX, y: task.posY },
                style: createNodeStyle(task.color || '#ffffff', task.completed === 1),
                sourcePosition: 'right',
                targetPosition: 'left'
            }));

            const depRes = await fetch(`/api/dependencies?project_id=${projectId}`, { credentials: 'include' });
            const depData = await depRes.json();
            const newEdges = depData.dependencies.map(dep => ({
                id: dep.id.toString(),
                source: dep.from_task.toString(),
                target: dep.to_task.toString(),
                markerEnd: { type: 'arrowclosed' }
            }));

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateProject = useCallback(() => {
        const name = prompt('Enter new project name:');
        if (name) {
            fetch('/api/projects', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
                .then(res => res.json())
                .then(data => {
                    loadProjects();
                    setCurrentProject(data.id.toString());
                });
        }
    }, []);

    const handleDeleteProject = useCallback(() => {
        if (window.confirm("Are you sure you want to delete this project? All data will be lost.")) {
            fetch(`/api/projects/${currentProject}`, {
                method: 'DELETE',
                credentials: 'include'
            })
                .then(res => res.json())
                .then(() => {
                    loadProjects();
                    setCurrentProject('');
                });
        }
    }, [currentProject]);

    // --- Node Management ---
    const createNodeStyle = useCallback((color, completed, selected) => {
        const backgroundColor = completed ? blendColors(color, '#e0e0e0', 0.5) : color;
        return {
            ...nodeStyles,
            backgroundColor,
            color: completed ? '#888' : 'inherit',
            border: selected ? '2px solid blue' : '1px solid #ccc'
        };
    }, []);

    const onNodesChange = useCallback(
        (changes) =>
            setNodes((nds) =>
                applyNodeChanges(changes, nds).map(node => ({
                    ...node,
                    style: createNodeStyle(node.data.color, node.data.completed, node.selected)
                }))
            ),
        [createNodeStyle]
    );

    const onNodeDragStop = useCallback(
        (event, node) => {
            fetch(`/api/tasks/${node.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: node.data.label,
                    posX: node.position.x,
                    posY: node.position.y,
                    completed: node.data.completed ? 1 : 0,
                    color: node.data.color,
                    project_id: parseInt(currentProject)
                })
            });
        },
        [currentProject]
    );

    const addNewNode = useCallback(() => {
        if (!newTaskTitle.trim() || !reactFlowInstance || !reactFlowWrapper.current) return;

        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const randomScreenX = Math.random() * bounds.width;
        const randomScreenY = Math.random() * bounds.height;
        const viewport = reactFlowInstance.getViewport();
        const flowX = (randomScreenX - viewport.x) / viewport.zoom;
        const flowY = (randomScreenY - viewport.y) / viewport.zoom;

        const newTask = {
            title: newTaskTitle,
            posX: flowX,
            posY: flowY,
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
                    position: { x: newTask.posX, y: newTask.posY },
                    style: createNodeStyle('#ffffff', false),
                    sourcePosition: 'right',
                    targetPosition: 'left'
                };
                setNodes(prev => [...prev, newNode]);
                setNewTaskTitle('');
            });
    }, [newTaskTitle, currentProject, reactFlowInstance, createNodeStyle]);

    // --- Edge Management ---
    const onConnect = useCallback(
        (params) => {
            const tempEdgeId = `e${params.source}-${params.target}`;
            const newEdge = { ...params, id: tempEdgeId, markerEnd: { type: 'arrowclosed' } };
            setEdges((eds) => addEdge(newEdge, eds));

            fetch('/api/dependencies', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_task: parseInt(params.source),
                    to_task: parseInt(params.target),
                    project_id: parseInt(currentProject)
                })
            })
                .then(res => res.json())
                .then(data => {
                    setEdges((prevEdges) =>
                        prevEdges.map(e =>
                            e.id === tempEdgeId ? { ...e, id: data.id.toString() } : e
                        )
                    );
                });
        },
        [currentProject]
    );

    // --- Node Interaction Handlers ---
    const handleNodeClick = useCallback(
        (event, node) => {
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
                        fetch(`/api/dependencies/${edge.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
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
        },
        [contextMenu, selectedSource, selectedUnlinkSource, edges, onConnect]
    );

    const handleToggleCompleted = useCallback((node) => {
        const updatedCompleted = !node.data.completed;
        setNodes(prev =>
            prev.map(n =>
                n.id === node.id
                    ? {
                        ...n,
                        data: { ...n.data, completed: updatedCompleted },
                        style: createNodeStyle(n.data.color, updatedCompleted)
                    }
                    : n
            )
        );

        fetch(`/api/tasks/${node.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: node.data.label,
                posX: node.position.x,
                posY: node.position.y,
                completed: updatedCompleted ? 1 : 0,
                color: node.data.color,
                project_id: parseInt(currentProject)
            })
        });
    }, [currentProject, createNodeStyle]);

    const handleUpdateNodeColor = useCallback((node, color) => {
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

        fetch(`/api/tasks/${node.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: node.data.label,
                posX: node.position.x,
                posY: node.position.y,
                completed: node.data.completed ? 1 : 0,
                color,
                project_id: parseInt(currentProject)
            })
        });
    }, [currentProject, createNodeStyle]);

    const handleEditNode = useCallback((node) => {
        const newTitle = prompt('Edit task title', node.data.label);
        if (newTitle && newTitle.trim()) {
            setNodes(prev =>
                prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: newTitle } } : n)
            );

            fetch(`/api/tasks/${node.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    posX: node.position.x,
                    posY: node.position.y,
                    completed: node.data.completed ? 1 : 0,
                    project_id: parseInt(currentProject)
                })
            });
        }
    }, [currentProject]);

    const handleDeleteNode = useCallback((node) => {
        fetch(`/api/tasks/${node.id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        setNodes(prev => prev.filter(n => n.id !== node.id));
        setEdges(prev => prev.filter(e => e.source !== node.id && e.target !== node.id));
    }, []);

    const handleDeleteSubtree = useCallback((node) => {
        const toDelete = new Set();
        const dfs = (nodeId) => {
            if (toDelete.has(nodeId)) return;
            toDelete.add(nodeId);
            edges.filter(e => e.source === nodeId).forEach(e => dfs(e.target));
        };
        dfs(node.id);
        toDelete.forEach(nodeId => {
            fetch(`/api/tasks/${nodeId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        });
        setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
        setEdges(prev => prev.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
    }, [edges]);

    // --- Layout Management ---
    const handleAutoArrange = useCallback(() => {
        const dagreGraph = new dagre.graphlib.Graph({ directed: true });
        dagreGraph.setGraph({ rankdir: 'LR' });
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setDefaultNodeLabel(() => ({}));
        const nodeWidth = 150, nodeHeight = 50;
        const nodeIds = new Set(nodes.map(n => n.id));

        nodes.forEach(node => {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        });

        edges.forEach(edge => {
            if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                dagreGraph.setEdge(edge.source, edge.target);
            }
        });

        dagre.layout(dagreGraph);

        const newNodes = nodes.map(node => {
            const dagreNode = dagreGraph.node(node.id);
            if (dagreNode) {
                return {
                    ...node,
                    position: {
                        x: dagreNode.x - nodeWidth / 2,
                        y: dagreNode.y - nodeHeight / 2
                    }
                };
            }
            return node;
        });

        setNodes(newNodes);
        newNodes.forEach(node => {
            fetch(`/api/tasks/${node.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: node.data.label,
                    posX: node.position.x,
                    posY: node.position.y,
                    completed: node.data.completed ? 1 : 0,
                    project_id: parseInt(currentProject)
                })
            });
        });
    }, [nodes, edges, currentProject]);

    // --- Compute visible nodes and next tasks ---
    const nextTaskIds = new Set();
    nodes.forEach(node => {
        if (!node.data.completed) {
            const incomingEdges = edges.filter(edge => edge.target === node.id);
            if (
                incomingEdges.length === 0 ||
                incomingEdges.every(edge => {
                    const srcNode = nodes.find(n => n.id === edge.source);
                    return srcNode && srcNode.data.completed;
                })
            ) {
                nextTaskIds.add(node.id);
            }
        }
    });

    const visibleNodes = hideCompleted ? nodes.filter(n => !n.data.completed) : nodes;
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

    const renderedNodes = visibleNodes.map(node => {
        let styleOverrides = { ...node.style };
        if (unlinkHighlight && (node.id === unlinkHighlight.source || node.id === unlinkHighlight.target)) {
            styleOverrides = { ...styleOverrides, border: '2px solid red' };
        } else if (selectedSource && node.id === selectedSource.id) {
            styleOverrides = { ...styleOverrides, backgroundColor: node.data.color || '#ffffff', border: '2px solid green' };
        }
        if (highlightNext) {
            styleOverrides = nextTaskIds.has(node.id)
                ? { ...styleOverrides, opacity: 1 }
                : { ...styleOverrides, opacity: 0.3 };
        }
        return { ...node, style: styleOverrides };
    });

    if (!user) {
        return <AuthForm onLogin={setUser} />;
    }

    return (
        <div className="h-screen flex flex-col relative" ref={reactFlowWrapper}>
            <TopBar
                newTaskTitle={newTaskTitle}
                onNewTaskTitleChange={setNewTaskTitle}
                onAddNode={addNewNode}
                hideCompleted={hideCompleted}
                setHideCompleted={setHideCompleted}
                highlightNext={highlightNext}
                setHighlightNext={setHighlightNext}
                minimapOn={minimapOn}
                setMinimapOn={setMinimapOn}
                backgroundOn={backgroundOn}
                setBackgroundOn={setBackgroundOn}
                onAutoArrange={handleAutoArrange}
                currentProject={currentProject}
                projects={projects}
                onProjectChange={setCurrentProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                user={user}
                onLogout={() => {
                    fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(() => setUser(null));
                }}
            />

            <ReactFlowProvider>
                <FlowArea
                    nodes={renderedNodes}
                    edges={visibleEdges}
                    onNodesChange={onNodesChange}
                    onConnect={onConnect}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={(event, node) => {
                        event.preventDefault();
                        setContextMenu({ visible: true, x: event.clientX, y: event.clientY, node });
                    }}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={() => {
                        setSelectedSource(null);
                        setSelectedUnlinkSource(null);
                        setContextMenu({ visible: false, x: 0, y: 0, node: null });
                    }}
                    onSelectionChange={({ nodes }) => setSelectedNodes(nodes || [])}
                    contextMenu={contextMenu}
                    onToggleCompleted={handleToggleCompleted}
                    onEditNode={handleEditNode}
                    onDeleteNode={handleDeleteNode}
                    onDeleteSubtree={handleDeleteSubtree}
                    onUpdateNodeColor={handleUpdateNodeColor}
                    onCloseContextMenu={() => setContextMenu({ visible: false, x: 0, y: 0, node: null })}
                    minimapOn={minimapOn}
                    backgroundOn={backgroundOn}
                    onInit={setReactFlowInstance}
                />
            </ReactFlowProvider>
        </div>
    );
}

export default App;
