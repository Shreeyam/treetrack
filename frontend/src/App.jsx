// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    Background,
    Controls,
    applyNodeChanges
} from 'react-flow-renderer';
import Dropdown from 'react-bootstrap/Dropdown';
import * as dagre from 'dagre';
import 'bootstrap/dist/css/bootstrap.min.css';

const nodeStyles = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
};

function App() {
    // --- Authentication States ---
    const [user, setUser] = useState(null);
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    // --- Main App States ---
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState('');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedUnlinkSource, setSelectedUnlinkSource] = useState(null);
    const [unlinkHighlight, setUnlinkHighlight] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [highlightNext, setHighlightNext] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });

    // --- Check for an existing session on mount ---
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

    // --- Load Projects when the user is logged in ---
    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    // --- Load tasks and edges when a project is selected ---
    useEffect(() => {
        if (currentProject) {
            loadTasksAndEdges(currentProject);
        }
    }, [currentProject]);

    // --- Authentication Functions ---

    const handleLogin = async () => {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password: loginPassword })
            });
            const data = await res.json();
            if (data.username) {
                setUser(data);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRegister = async () => {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: registerUsername, password: registerPassword })
            });
            const data = await res.json();
            if (data.username) {
                setUser(data);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        setUser(null);
    };

    // --- Project Functions ---

    const loadProjects = async () => {
        try {
            const res = await fetch('/api/projects', { credentials: 'include' });
            const data = await res.json();
            setProjects(data.projects);
            if (data.projects.length > 0 && !currentProject) {
                // set it to the last one probably...
                setCurrentProject(data.projects[0].id.toString());
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
                data: { label: task.title, completed: task.completed === 1 },
                position: { x: task.posX, y: task.posY },
                style: {
                    ...nodeStyles,
                    backgroundColor: task.completed === 1 ? '#e0e0e0' : '#ffffff',
                    color: task.completed === 1 ? '#888' : 'inherit',
                    border: '1px solid #ccc'
                },
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

    // --- Node & Edge Functions (using useCallback) ---

    const onNodesChange = useCallback(
        (changes) =>
            setNodes((nds) =>
                applyNodeChanges(changes, nds).map(node => ({
                    ...node,
                    style: {
                        ...nodeStyles,
                        backgroundColor: node.data.completed ? '#e0e0e0' : '#ffffff',
                        color: node.data.completed ? '#888' : 'inherit',
                        border: node.selected ? '2px solid blue' : '1px solid #ccc'
                    }
                }))
            ),
        []
    );

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

    const onNodeClick = useCallback(
        (event, node) => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }
            // Unlink mode: Ctrl+Shift+Click
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
            // Linking mode: Ctrl+Click without Shift
            if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
                if (!selectedSource) {
                    setSelectedSource(node);
                } else if (selectedSource.id !== node.id) {
                    const tempEdgeId = `e${selectedSource.id}-${node.id}`;
                    const newEdge = {
                        id: tempEdgeId,
                        source: selectedSource.id,
                        target: node.id,
                        markerEnd: { type: 'arrowclosed' }
                    };
                    setEdges((eds) => [...eds, newEdge]);
                    fetch('/api/dependencies', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from_task: parseInt(selectedSource.id),
                            to_task: parseInt(node.id),
                            project_id: parseInt(currentProject)
                        })
                    })
                        .then(res => res.json())
                        .then(data => {
                            setEdges(prevEdges =>
                                prevEdges.map(e =>
                                    e.id === tempEdgeId ? { ...e, id: data.id.toString() } : e
                                )
                            );
                        });
                    setSelectedSource(null);
                }
            }
        },
        [contextMenu, selectedSource, selectedUnlinkSource, edges, currentProject]
    );

    const onNodeContextMenu = useCallback(
        (event, node) => {
            event.preventDefault();
            setContextMenu({ visible: true, x: event.clientX, y: event.clientY, node });
        },
        []
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
                    project_id: parseInt(currentProject)
                })
            });
        },
        [currentProject]
    );

    const addNewNode = useCallback(async () => {
        if (!newTaskTitle.trim()) return;
        const newTask = {
            title: newTaskTitle,
            posX: Math.random() * 400,
            posY: Math.random() * 400,
            completed: 0,
            project_id: parseInt(currentProject)
        };
        const res = await fetch('/api/tasks', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        const json = await res.json();
        const newNode = {
            id: json.id.toString(),
            data: { label: newTaskTitle, completed: false },
            position: { x: newTask.posX, y: newTask.posY },
            style: { ...nodeStyles, backgroundColor: '#ffffff', border: '1px solid #ccc' },
            sourcePosition: 'right',
            targetPosition: 'left'
        };
        setNodes(prev => [...prev, newNode]);
        setNewTaskTitle('');
    }, [newTaskTitle, currentProject]);

    const onSelectionChange = useCallback(({ nodes: selected }) => {
        setSelectedNodes(selected || []);
    }, []);

    const deleteSelected = useCallback(() => {
        if (selectedNodes.length === 0) return;
        const selectedIds = new Set(selectedNodes.map(n => n.id));
        selectedNodes.forEach(node => {
            fetch(`/api/tasks/${node.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        });
        setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
        setEdges(prev => prev.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
        setSelectedNodes([]);
    }, [selectedNodes]);

    const deleteNode = useCallback((node) => {
        fetch(`/api/tasks/${node.id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        setNodes(prev => prev.filter(n => n.id !== node.id));
        setEdges(prev => prev.filter(e => e.source !== node.id && e.target !== node.id));
    }, []);

    const deleteSubtree = useCallback((node) => {
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

    const toggleCompleted = useCallback((node) => {
        const updatedCompleted = !node.data.completed;
        setNodes(prev =>
            prev.map(n =>
                n.id === node.id
                    ? {
                        ...n,
                        data: { ...n.data, completed: updatedCompleted },
                        style: {
                            ...nodeStyles,
                            backgroundColor: updatedCompleted ? '#e0e0e0' : '#ffffff',
                            color: updatedCompleted ? '#888' : 'inherit',
                            border: n.selected ? '2px solid blue' : '1px solid #ccc'
                        }
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
                project_id: parseInt(currentProject)
            })
        });
    }, [currentProject]);

    const editNodeTitle = useCallback((node) => {
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

    const autoArrange = useCallback(() => {
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

    // Compute "next tasks": tasks that are not completed and whose all prerequisites (incoming edges) are complete.
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
        if (
            unlinkHighlight &&
            (node.id === unlinkHighlight.source || node.id === unlinkHighlight.target)
        ) {
            styleOverrides = { ...styleOverrides, border: '2px solid red' };
        } else if (selectedSource && node.id === selectedSource.id) {
            styleOverrides = { ...styleOverrides, backgroundColor: '#ffffff', border: '2px solid green' };
        }
        if (highlightNext) {
            styleOverrides = nextTaskIds.has(node.id)
                ? { ...styleOverrides, opacity: 1 }
                : { ...styleOverrides, opacity: 0.3 };
        }
        return { ...node, style: styleOverrides };
    });

    // --- Render ---
    if (!user) {
        // Show login/registration form if not logged in.
        return (
            <div className="container mt-5">
                {isRegister ? (
                    <div>
                        <h2>Register</h2>
                        <input
                            className="form-control my-2"
                            type="text"
                            placeholder="Username"
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value)}
                        />
                        <input
                            className="form-control my-2"
                            type="password"
                            placeholder="Password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleRegister}>Register</button>
                        <p className="mt-2">
                            Already have an account?{' '}
                            <button className="btn btn-link" onClick={() => setIsRegister(false)}>
                                Login here
                            </button>
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2>Login</h2>
                        <input
                            className="form-control my-2"
                            type="text"
                            placeholder="Username"
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                        />
                        <input
                            className="form-control my-2"
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleLogin}>Login</button>
                        <p className="mt-2">
                            Don't have an account?{' '}
                            <button className="btn btn-link" onClick={() => setIsRegister(true)}>
                                Register here
                            </button>
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Main application UI.
    return (
        <div className="d-flex flex-column" style={{ height: '100vh', position: 'relative' }}>
            {/* Top Bar */}
            <div className="p-2 bg-light d-flex align-items-center flex-wrap">
                <input
                    type="text"
                    className="form-control me-2"
                    placeholder="New task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addNewNode(); }}
                    style={{ maxWidth: '200px' }}
                />
                <button className="btn btn-primary me-2" onClick={addNewNode}>
                    Add Task
                </button>
                <div className="form-check me-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="hideCompleted"
                        checked={hideCompleted}
                        onChange={(e) => setHideCompleted(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="hideCompleted">
                        Hide Completed
                    </label>
                </div>
                <div className="form-check me-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="highlightNext"
                        checked={highlightNext}
                        onChange={(e) => setHighlightNext(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="highlightNext">
                        Highlight Next Tasks
                    </label>
                </div>
                <button
                    className="btn btn-danger me-2"
                    onClick={deleteSelected}
                    disabled={selectedNodes.length === 0}
                >
                    Delete Selected
                </button>
                <button className="btn btn-secondary me-2" onClick={autoArrange}>
                    Auto Arrange
                </button>
                {/* Projects Dropdown and Buttons on the top right */}
                <div className="ms-auto d-flex align-items-center">
                    <select
                        className="form-select"
                        style={{ width: '200px' }}
                        value={currentProject || ''}
                        onChange={(e) => setCurrentProject(e.target.value)}
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                    <button
                        className="btn btn-outline-primary ms-2"
                        onClick={() => {
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
                        }}
                    >
                        New Project
                    </button>
                    <button
                        className="btn btn-danger ms-2"
                        onClick={() => {
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
                        }}
                    >
                        Delete Project
                    </button>
                    <Dropdown align="end" className="ms-2">
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
                            {user.username}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item href="https://github.com/Shreeyam/treetrack/issues" target="_blank">
                                Feature Request
                            </Dropdown.Item>
                            <Dropdown.Item href="https://ko-fi.com/shreeyam" target="_blank">
                                Tip Jar
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="text-danger">
                                Logout
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item disabled>
                                Treetrack v0.0.2
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {/* React Flow Container */}
            <div style={{ flexGrow: 1 }}>
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={renderedNodes}
                        edges={visibleEdges}
                        onNodesChange={onNodesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onNodeContextMenu={onNodeContextMenu}
                        onNodeDragStop={onNodeDragStop}
                        onSelectionChange={onSelectionChange}
                        onPaneClick={() => {
                            setSelectedSource(null);
                            setSelectedUnlinkSource(null);
                            setContextMenu({ visible: false, x: 0, y: 0, node: null });
                        }}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="card"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000,
                        minWidth: '150px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ul className="list-group list-group-flush">
                        <li
                            className="list-group-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                toggleCompleted(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            {contextMenu.node && contextMenu.node.data.completed
                                ? 'Mark Incomplete'
                                : 'Mark Completed'}
                        </li>
                        <li
                            className="list-group-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                editNodeTitle(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            Edit
                        </li>
                        <li
                            className="list-group-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                deleteNode(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            Delete
                        </li>
                        <li
                            className="list-group-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                deleteSubtree(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            Delete Subtree
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
