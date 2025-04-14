import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ReactFlowProvider, applyNodeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/globals.css';
import * as dagre from 'dagre';
import blendColors from './utils/colors';
import AuthForm from '@/components/auth/AuthForm';
import TopBar from '@/components/navigation/TopBar';
import FlowArea from '@/components/flow/FlowArea';
import { nodeStyles } from '@/components/flow/styles';
import { fetchUser, fetchProjects, createProject, deleteProject, fetchTasksAndEdges, updateTask, deleteTask, deleteDependency } from './api';

// Memoize imported components
const MemoAuthForm = React.memo(AuthForm);
const MemoTopBar = React.memo(TopBar);
const MemoFlowArea = React.memo(FlowArea);

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

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const currentProjectRef = useRef(currentProject);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    useEffect(() => {
        currentProjectRef.current = currentProject;
    }, [currentProject]);

    // --- Session Management ---
    useEffect(() => {
        fetchUser()
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (user) {
            fetchProjects()
                .then(data => {
                    setProjects(data.projects);
                    if (data.projects.length > 0 && (!currentProject || !data.projects.some(p => p.id.toString() === currentProject))) {
                        const firstProjectId = data.projects[0].id.toString();
                        setCurrentProject(firstProjectId);
                        localStorage.setItem('currentProject', firstProjectId);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    useEffect(() => {
        if (currentProject) {
            fetchTasksAndEdges(currentProject)
                .then(({ tasks, dependencies }) => {
                    const newNodes = tasks.map(task => ({
                        id: task.id.toString(),
                        data: { label: task.title, completed: task.completed === 1, color: task.color || '#ffffff' },
                        position: { x: task.posX, y: task.posY },
                        style: createNodeStyle(task.color || '#ffffff', task.completed === 1),
                        sourcePosition: 'right',
                        targetPosition: 'left'
                    }));

                    const newEdges = dependencies.map(dep => ({
                        id: dep.id.toString(),
                        source: dep.from_task.toString(),
                        target: dep.to_task.toString(),
                        markerEnd: { type: 'arrowclosed' }
                    }));

                    setNodes(newNodes);
                    setEdges(newEdges);
                })
                .catch(err => console.error(err));

            localStorage.setItem('currentProject', currentProject);
        }
    }, [currentProject]);

    const handleLogout = useCallback(() => {
        fetch('/api/logout', { method: 'POST', credentials: 'include' })
            .then(() => setUser(null));
    }, []);

    // --- Project Management ---
    const handleCreateProject = useCallback(() => {
        const name = prompt('Enter new project name:');
        if (name) {
            createProject(name)
                .then(data => {
                    fetchProjects()
                        .then(projectsData => setProjects(projectsData.projects));
                    setCurrentProject(data.id.toString());
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleDeleteProject = useCallback(() => {
        if (window.confirm("Are you sure you want to delete this project? All data will be lost.")) {
            deleteProject(currentProject)
                .then(() => {
                    fetchProjects()
                        .then(projectsData => setProjects(projectsData.projects));
                    setCurrentProject('');
                })
                .catch(err => console.error(err));
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
            updateTask(node.id, {
                title: node.data.label,
                posX: node.position.x,
                posY: node.position.y,
                completed: node.data.completed ? 1 : 0,
                color: node.data.color,
                project_id: parseInt(currentProject)
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

        updateTask(node.id, {
            title: node.data.label,
            posX: node.position.x,
            posY: node.position.y,
            completed: updatedCompleted ? 1 : 0,
            color: node.data.color,
            project_id: parseInt(currentProject)
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

        updateTask(node.id, {
            title: node.data.label,
            posX: node.position.x,
            posY: node.position.y,
            completed: node.data.completed ? 1 : 0,
            color,
            project_id: parseInt(currentProject)
        });
    }, [currentProject, createNodeStyle]);

    const handleEditNode = useCallback((node) => {
        const newTitle = prompt('Edit task title', node.data.label);
        if (newTitle && newTitle.trim()) {
            setNodes(prev =>
                prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: newTitle } } : n)
            );

            updateTask(node.id, {
                title: newTitle,
                posX: node.position.x,
                posY: node.position.y,
                completed: node.data.completed ? 1 : 0,
                project_id: parseInt(currentProject)
            });
        }
    }, [currentProject]);

    const handleDeleteNode = useCallback((node) => {
        deleteTask(node.id);
        console.log(node.id);
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
            deleteTask(nodeId);
        });
        setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
        setEdges(prev => prev.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
    }, [edges]);

    // --- Layout Management ---
    const handleAutoArrange = useCallback(() => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const currentProject = currentProjectRef.current;

        console.log(currentProject);

        const dagreGraph = new dagre.graphlib.Graph({ directed: true });
        dagreGraph.setGraph({ rankdir: 'LR' });
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setDefaultNodeLabel(() => ({}));
        const nodeWidth = 150, nodeHeight = 50;
        const nodeIds = new Set(currentNodes.map(n => n.id));

        currentNodes.forEach(node => {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        });

        currentEdges.forEach(edge => {
            if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                dagreGraph.setEdge(edge.source, edge.target);
            }
        });

        dagre.layout(dagreGraph);

        const newNodes = currentNodes.map(node => {
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
            updateTask(node.id, {
                title: node.data.label,
                posX: node.position.x,
                posY: node.position.y,
                completed: node.data.completed ? 1 : 0,
                project_id: parseInt(currentProject)
            });
        });
    }, []);

    // --- Memoized Computation of Visible and Rendered Nodes/Edges ---
    const nextTaskIds = useMemo(() => {
        const ids = new Set();
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
                    ids.add(node.id);
                }
            }
        });
        return ids;
    }, [nodes, edges]);

    const visibleNodes = useMemo(() => {
        return hideCompleted ? nodes.filter(n => !n.data.completed) : nodes;
    }, [nodes, hideCompleted]);

    const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

    const visibleEdges = useMemo(() => {
        return edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }, [edges, visibleNodeIds]);

    const renderedNodes = useMemo(() => {
        return visibleNodes.map(node => {
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
    }, [visibleNodes, unlinkHighlight, selectedSource, highlightNext, nextTaskIds]);

    if (!user) {
        return <MemoAuthForm onLogin={setUser} />;
    }

    return (
        <div className="h-screen flex flex-col relative" ref={reactFlowWrapper}>
            <MemoTopBar
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
                onLogout={handleLogout}
            />

            <ReactFlowProvider>
                <MemoFlowArea
                    nodes={renderedNodes}
                    edges={visibleEdges}
                    onNodesChange={onNodesChange}
                    onConnect={onConnect}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={(event, node) => {
                        event.preventDefault();
                        // Get the bounding rect of the container
                        const bounds = reactFlowWrapper.current.getBoundingClientRect();
                        // Adjust the coordinates to be relative to the container
                        const x = event.clientX - bounds.left;
                        const y = event.clientY - bounds.top;
                        setContextMenu({ visible: true, x, y, node });
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
