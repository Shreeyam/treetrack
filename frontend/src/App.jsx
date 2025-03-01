// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import "./App.css"

const nodeStyles = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
};

// Helper function to blend two hex colors
// weight: a value between 0 and 1 (e.g. 0.5 means a 50/50 mix)
function blendColors(color1, color2, weight) {
    let c1 = parseInt(color1.slice(1), 16);
    let c2 = parseInt(color2.slice(1), 16);
    let r1 = c1 >> 16;
    let g1 = (c1 >> 8) & 0xff;
    let b1 = c1 & 0xff;
    let r2 = c2 >> 16;
    let g2 = (c2 >> 8) & 0xff;
    let b2 = c2 & 0xff;
    let r = Math.round(r1 * (1 - weight) + r2 * weight);
    let g = Math.round(g1 * (1 - weight) + g2 * weight);
    let b = Math.round(b1 * (1 - weight) + b2 * weight);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

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
    const [currentProject, setCurrentProject] = useState(() => {
        return localStorage.getItem('currentProject') || '';
    });
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

    // React Flow
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

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
            localStorage.setItem('currentProject', currentProject);
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
            const newNodes = tasksData.tasks.map(task => {
                const baseColor = task.color || '#ffffff';
                const backgroundColor = task.completed === 1 ? blendColors(baseColor, '#e0e0e0', 0.5) : baseColor;
                return {
                    id: task.id.toString(),
                    data: { label: task.title, completed: task.completed === 1, color: baseColor },
                    position: { x: task.posX, y: task.posY },
                    style: {
                        ...nodeStyles,
                        backgroundColor,
                        color: task.completed === 1 ? '#888' : 'inherit',
                        border: '1px solid #ccc'
                    },
                    sourcePosition: 'right',
                    targetPosition: 'left'
                };
            });
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
                applyNodeChanges(changes, nds).map(node => {
                    const baseColor = node.data.color || '#ffffff';
                    const backgroundColor = node.data.completed ? blendColors(baseColor, '#e0e0e0', 0.5) : baseColor;
                    return {
                        ...node,
                        style: {
                            ...nodeStyles,
                            backgroundColor,
                            color: node.data.completed ? '#888' : 'inherit',
                            border: node.selected ? '2px solid blue' : '1px solid #ccc'
                        }
                    };
                })
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
                    color: node.data.color,
                    project_id: parseInt(currentProject)
                })
            });
        },
        [currentProject]
    );

    const addNewNode = useCallback(async () => {
        // Check if the new task title is empty
        if (!newTaskTitle.trim()) return;
        // Check if the React Flow instance is ready
        if (!reactFlowInstance || !reactFlowWrapper.current) return;

        // Get the visible area of the React Flow container
        const bounds = reactFlowWrapper.current.getBoundingClientRect();

        const randomScreenX = Math.random() * bounds.width;
        const randomScreenY = Math.random() * bounds.height;

        // Project to react-flow coordinates
        const { x: flowX, y: flowY } = reactFlowInstance.project({
            x: randomScreenX,
            y: randomScreenY,
        });

        const newTask = {
            title: newTaskTitle,
            posX: flowX, // updated to flowX for correct positioning
            posY: flowY, // updated to flowY for correct positioning
            completed: 0,
            project_id: parseInt(currentProject),
            color: ''
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
            data: { label: newTaskTitle, completed: false, color: '' },
            position: { x: newTask.posX, y: newTask.posY },
            style: {
                ...nodeStyles,
                backgroundColor: '#ffffff',
                border: '1px solid #ccc'
            },
            sourcePosition: 'right',
            targetPosition: 'left'
        };
        setNodes(prev => [...prev, newNode]);
        setNewTaskTitle('');
    }, [newTaskTitle, currentProject, reactFlowInstance]);

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
        const baseColor = node.data.color || '#ffffff';
        const backgroundColor = updatedCompleted ? blendColors(baseColor, '#e0e0e0', 0.5) : baseColor;
        setNodes(prev =>
            prev.map(n =>
                n.id === node.id
                    ? {
                        ...n,
                        data: { ...n.data, completed: updatedCompleted },
                        style: {
                            ...nodeStyles,
                            backgroundColor,
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
                color: baseColor,
                project_id: parseInt(currentProject)
            })
        });
    }, [currentProject]);

    const updateNodeColor = useCallback((node, color) => {
        const baseColor = color || '#ffffff';
        const backgroundColor = node.data.completed ? blendColors(baseColor, '#e0e0e0', 0.5) : baseColor;
        setNodes(prev =>
            prev.map(n =>
                n.id === node.id
                    ? {
                        ...n,
                        data: { ...n.data, color },
                        style: {
                            ...n.style,
                            backgroundColor
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
                completed: node.data.completed ? 1 : 0,
                color,
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

    // Compute "next tasks"
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
            styleOverrides = { ...styleOverrides, backgroundColor: node.data.color || '#ffffff', border: '2px solid green' };
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

    return (
        <div className="d-flex flex-column" style={{ height: '100vh', position: 'relative' }}>
            {/* Top Bar */}
            <div className="p-2 bg-light d-flex align-items-center flex-wrap">
                <div className="form-group me-2">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="New task title..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addNewNode(); }}
                            style={{ maxWidth: '200px' }}
                        />
                        <button className="btn btn-primary btn-add" onClick={addNewNode}>
                            <i className="fas fa-plus" ></i>
                        </button>
                    </div>
                </div>
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
                        Highlight Next
                    </label>
                </div>
                <button className="btn btn-outline-secondary me-2" onClick={autoArrange}>
                    <i className="fas fa-wand-magic-sparkles"></i> Auto Arrange
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
                        <i className="fas fa-folder-plus"></i>New
                    </button>
                    <button
                        className="btn btn-outline-danger ms-2"
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
                        <i className="fas fa-trash force-parent-lh"></i>
                    </button>
                    <Dropdown align="end" className="ms-2">
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
                            <i className="fas fa-user-circle" />{user.username}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item href="https://github.com/Shreeyam/treetrack/issues" target="_blank">
                                <i className="fas fa-comment-alt" /> Feature Request
                            </Dropdown.Item>
                            <Dropdown.Item href="https://ko-fi.com/shreeyam" target="_blank">
                                <i className="fas fa-mug-hot" />Tip Jar
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="text-danger">
                                <i className="fas fa-sign-out-alt" /> Logout
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item disabled>
                                Treetrack v0.0.4 <br />
                                (2025-02-28)
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {/* React Flow Container */}
            <div ref={reactFlowWrapper} style={{ flexGrow: 1 }}>
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
                        onInit={setReactFlowInstance}
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
                    <ul className="list-group list-group-flush flex-item-gap">
                        <li
                            className="list-group-item context-menu-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                toggleCompleted(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            <i className={`fas ${contextMenu.node && contextMenu.node.data.completed ? 'fa-times' : 'fa-check'}`} style={{color: contextMenu.node && contextMenu.node.data.completed ? 'var(--bs-red)' : 'var(--bs-green)'}} />
                            {contextMenu.node && contextMenu.node.data.completed
                                ? 'Mark Incomplete'
                                : 'Mark Completed'}
                        </li>
                        <li
                            className="list-group-item context-menu-item list-group-item-action"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                editNodeTitle(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            <i className="fas fa-edit" /> Edit
                        </li>
                        <li
                            className="list-group-item context-menu-item list-group-item-action text-danger"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                deleteNode(contextMenu.node);
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            <i className="fas fa-trash" />Delete
                        </li>
                        <li
                            className="list-group-item context-menu-item list-group-item-action text-danger"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete the subtree?")) {
                                    deleteSubtree(contextMenu.node);
                                }
                                setContextMenu({ visible: false, x: 0, y: 0, node: null });
                            }}
                        >
                            <i className="fas fa-trash" />Delete Subtree
                        </li>
                        <li className="list-group-item context-menu-item colors">
                            <div className="color-options">
                                {['#ffcccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d2e1f3'].map((color) => (
                                    <div
                                        key={color}
                                        onClick={() => {
                                            updateNodeColor(contextMenu.node, color);
                                            setContextMenu({ visible: false, x: 0, y: 0, node: null });
                                        }}
                                        className="color-option"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button
                                className="btn btn-sm btn-outline-secondary w-100"
                                onClick={() => {
                                    updateNodeColor(contextMenu.node, '');
                                    setContextMenu({ visible: false, x: 0, y: 0, node: null });
                                }}
                            >
                                <i className="fas fa-undo"></i> Reset Color
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
