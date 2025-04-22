import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ReactFlowProvider, applyNodeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/globals.css';
import "@/App.css";
import * as dagre from 'dagre';
import blendColors from './utils/colors';
import AuthForm from '@/components/auth/AuthForm';
import TopBar from '@/components/navigation/TopBar';
import FlowArea from '@/components/flow/FlowArea';
import { nodeStyles } from '@/components/flow/styles';
import { fetchUser, fetchProjects, createProject, deleteProject, fetchTasksAndEdges, updateTask, deleteTask, deleteDependency } from './api';
import ChatBot from './components/misc/chatbot';
import { createAddNewNode, mapWithChangeDetection } from './utils/nodeFunctions';
import { useNavigate } from 'react-router';
import { PromptDialog } from '@/components/ui/prompt-dialog';

// Memoize imported components
const MemoAuthForm = React.memo(AuthForm);
const MemoTopBar = React.memo(TopBar);
const MemoFlowArea = React.memo(FlowArea);

// --- Constants for Cascading ---
const CASCADE_OFFSET = 50;
const VIEWPORT_START_OFFSET = { x: 50, y: 50 }; // Offset from viewport top-left
const NODE_WIDTH = 150; // Approximate node width for bounds checking
const NODE_HEIGHT = 50; // Approximate node height for bounds checking

function App({user, setUser}) {
    // --- Main App States ---
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(() => localStorage.getItem('currentProject') || '');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [prevNodes, setPrevNodes] = useState([]);
    const [prevEdges, setPrevEdges] = useState([]);
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
    const [generativeMode, setGenerativeMode] = useState(false);
    const [lastNodePosition, setLastNodePosition] = useState(null); // Initialize to null
    const [cascadeCount, setCascadeCount] = useState(0); // Track cascade steps
    const [cascadeStartPoint, setCascadeStartPoint] = useState(null); // Track start of current cascade sequence
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [nodeToEdit, setNodeToEdit] = useState(null);
    const [deleteProjectDialog, setDeleteProjectDialog] = useState(false);
    const [deleteSubtreeDialog, setDeleteSubtreeDialog] = useState(false);
    const [nodeToDeleteSubtree, setNodeToDeleteSubtree] = useState(null);
    const [createProjectDialog, setCreateProjectDialog] = useState(false);

    // React Flow
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const currentProjectRef = useRef(currentProject);

    const navigate = useNavigate(); // Use useNavigate from react-router

    // Memos
    const memoBlendColors = useCallback((c1, c2, ratio) => blendColors(c1, c2, ratio), []);
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
            .catch(err => {
                if(err.status === 401) {
                    setUser(null);
                    navigate('/login'); // Redirect to login if not authenticated
                }
                console.error(err);
            }
            );
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
        setCreateProjectDialog(true);
    }, []);

    const handleConfirmCreateProject = useCallback((name) => {
        if (name && name.trim()) {
            createProject(name)
                .then(data => {
                    fetchProjects()
                        .then(projectsData => setProjects(projectsData.projects));
                    setCurrentProject(data.id.toString());
                })
                .catch(err => console.error(err));
        }
        setCreateProjectDialog(false);
    }, []);

    const handleDeleteProject = useCallback(() => {
        setDeleteProjectDialog(true);
    }, []);

    const handleConfirmDeleteProject = useCallback(() => {
        deleteProject(currentProject)
            .then(() => {
                fetchProjects()
                    .then(projectsData => setProjects(projectsData.projects));
                setCurrentProject('');
            })
            .catch(err => console.error(err));
        setDeleteProjectDialog(false);
    }, [currentProject]);

    // --- Node Management ---
    const createNodeStyle = useCallback((color, completed, selected, draft) => {
        const backgroundColor = completed ? memoBlendColors(color, '#e0e0e0', 0.5) : color;

        // Base style for the node
        let style = {
            ...nodeStyles,
            backgroundColor,
            color: completed ? '#888' : 'inherit',
            border: selected ? '2px solid blue' : '1px solid #ccc',
        };

        // If the node is a draft, overlay animated diagonal stripes
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
    }, [blendColors, memoBlendColors]);

    const onNodesChange = useCallback(
        (changes) =>
            setNodes((prev) => {
                if (!changes.length) return prev;

                /** Build a quick lookup table for the changed nodes */
                const changed = new Map();
                changes.forEach((c) => changed.set(c.id, c));

                let mutated = false;

                const next = prev.map((node) => {
                    const change = changed.get(node.id);
                    if (!change) return node; // untouched → keep original reference

                    mutated = true;

                    /** Let React‑Flow merge the positional / selection changes */
                    const updated = applyNodeChanges([change], [node])[0];

                    /** Re‑compute style *only* if something visual actually changed */
                    const needsNewStyle =
                        "selected" in change ||
                        (change.type === "dimensions" && node.data.completed !== updated.data.completed);

                    return needsNewStyle
                        ? {
                            ...updated,
                            style: createNodeStyle(
                                updated.data.color,
                                updated.data.completed,
                                updated.selected,
                                updated.draft
                            ),
                        }
                        : updated;
                });

                return mutated ? next : prev;
            }),
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

    const addNewNode = useCallback(
        (position) => createAddNewNode({ 
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
            position
        })(),
        [newTaskTitle, currentProject, reactFlowInstance, reactFlowWrapper, lastNodePosition, cascadeCount, cascadeStartPoint, createNodeStyle]
    );

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
        setNodeToEdit(node);
        setEditDialogOpen(true);
    }, []);

    const handleEditSubmit = useCallback((newTitle) => {
        if (newTitle && newTitle.trim() && nodeToEdit) {
            setNodes(prev =>
                prev.map(n => n.id === nodeToEdit.id ? { ...n, data: { ...n.data, label: newTitle } } : n)
            );

            updateTask(nodeToEdit.id, {
                title: newTitle,
                posX: nodeToEdit.position.x,
                posY: nodeToEdit.position.y,
                color: nodeToEdit.data.color,
                completed: nodeToEdit.data.completed ? 1 : 0,
                project_id: parseInt(currentProject)
            });
        }
        setEditDialogOpen(false);
        setNodeToEdit(null);
    }, [nodeToEdit, currentProject]);

    const handleDeleteNode = useCallback((node) => {
        deleteTask(node.id);
        setNodes(prev => prev.filter(n => n.id !== node.id));
        setEdges(prev => prev.filter(e => e.source !== node.id && e.target !== node.id));
    }, []);

    const handleDeleteSubtree = useCallback((node) => {
        setNodeToDeleteSubtree(node);
        setDeleteSubtreeDialog(true);
    }, []);

    const handleConfirmDeleteSubtree = useCallback(() => {
        if (!nodeToDeleteSubtree) return;
        
        const toDelete = new Set();
        const dfs = (nodeId) => {
            if (toDelete.has(nodeId)) return;
            toDelete.add(nodeId);
            edges.filter(e => e.source === nodeId).forEach(e => dfs(e.target));
        };
        dfs(nodeToDeleteSubtree.id);
        toDelete.forEach(nodeId => {
            deleteTask(nodeId);
        });
        setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
        setEdges(prev => prev.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
        
        setDeleteSubtreeDialog(false);
        setNodeToDeleteSubtree(null);
    }, [nodeToDeleteSubtree, edges]);

    const handleGenerativeEdit = useCallback((data) => {
        // --- Capture previous state BEFORE applying changes ---
        setPrevNodes(nodesRef.current); // Use refs for the most current state
        setPrevEdges(edgesRef.current);

        // Create maps for efficient lookup of existing items
        const prevNodeMap = new Map(nodesRef.current.map(node => [node.id, node]));
        const prevEdgeMap = new Map(edgesRef.current.map(edge => [edge.id, edge]));

        // Compute the current maximum IDs for nodes and edges (assuming numeric IDs in string format)
        const maxNodeId = nodesRef.current.length > 0
            ? Math.max(...nodesRef.current.map(node => parseInt(node.id, 10)))
            : 0;
        const maxEdgeId = edgesRef.current.length > 0
            ? Math.max(...edgesRef.current.map(edge => parseInt(edge.id, 10)))
            : 0;

        let nextNodeId = maxNodeId;
        let nextEdgeId = maxEdgeId;

        // Create a mapping from the incoming task IDs to the assigned IDs.
        // This is needed so that dependencies referencing new tasks can be updated accordingly.
        const taskIdMapping = {};

        // Process tasks to create the updated nodes. For new tasks (i.e. not found in prevNodeMap),
        // assign a new auto-incremented ID.
        const updatedNodes = data.tasks.map(task => {
            const origId = task.id.toString();
            // If the task has a delete flag set to true, mark it for deletion.
            if (task.delete) {
                return { id: origId, delete: true };
            }

            // Determine if this task is new. If it's not in the previous state, assign a new ID.
            let assignedId;
            if (prevNodeMap.has(origId)) {
                assignedId = origId;
            } else {
                // Avoid reassigning a new ID if we've already done so in this update
                if (taskIdMapping[origId]) {
                    assignedId = taskIdMapping[origId];
                } else {
                    nextNodeId += 1;
                    assignedId = nextNodeId.toString();
                    taskIdMapping[origId] = assignedId;
                }
            }

            // Also map existing tasks for dependency lookups
            if (!taskIdMapping[origId]) {
                taskIdMapping[origId] = assignedId;
            }

            const existingNode = prevNodeMap.get(origId);
            const isDraft = true; // Mark all AI suggestions as draft initially
            // Preserve the original position if the node exists; otherwise, use the incoming position.
            const position = { x: task.posX, y: task.posY };
            const color = (task.color && task.color.trim() !== "")
                ? task.color
                : (existingNode ? existingNode.data.color : '#ffffff');
            const completed = task.completed === 1;

            return {
                id: assignedId,
                data: { label: task.title, completed, color },
                position: position,
                style: createNodeStyle(color, completed, false, isDraft),
                sourcePosition: 'right',
                targetPosition: 'left',
                draft: isDraft
            };
        });

        // Process dependencies to create the updated edges.
        // For each dependency, if it does not exist in the current state, assign a new, auto-incremented ID.
        // Also update the source and target IDs using the taskIdMapping.
        const updatedEdges = data.dependencies.map(dep => {
            const origEdgeId = dep.id.toString();
            // If the dependency has a delete flag set to true, mark it for deletion.
            if (dep.delete) {
                return { id: origEdgeId, delete: true };
            }

            let assignedEdgeId;
            if (prevEdgeMap.has(origEdgeId)) {
                assignedEdgeId = origEdgeId;
            } else {
                nextEdgeId += 1;
                assignedEdgeId = nextEdgeId.toString();
            }
            // Update source and target based on task mapping (if the task was new).
            const source = taskIdMapping[dep.from_task.toString()] || dep.from_task.toString();
            const target = taskIdMapping[dep.to_task.toString()] || dep.to_task.toString();

            // Ensure the source and target nodes for this edge actually exist in the final node list
            const sourceNodeExists = updatedNodes.some(n => n.id === source && !n.delete) || prevNodeMap.has(source);
            const targetNodeExists = updatedNodes.some(n => n.id === target && !n.delete) || prevNodeMap.has(target);

            // If either the source or target node is being deleted or doesn't exist, mark the edge for deletion too.
            if (!sourceNodeExists || !targetNodeExists) {
                return { id: assignedEdgeId, delete: true };
            }

            return {
                id: assignedEdgeId,
                source,
                target,
                markerEnd: { type: 'arrowclosed' },
                draft: true
            };
        });

        // ---- Merge updated nodes ----
        setNodes((prevNodes) => {
            const nodeMap = new Map(prevNodes.map((n) => [n.id, n]));
            updatedNodes.forEach((node) => {
                if (node.delete) nodeMap.delete(node.id);
                else nodeMap.set(node.id, node);
            });
            return [...nodeMap.values()];
        });

        // ---- Merge updated edges ----
        setEdges((prevEdges) => {
            const edgeMap = new Map(prevEdges.map((e) => [e.id, e]));
            updatedEdges.forEach((edge) => {
                if (edge.delete) edgeMap.delete(edge.id);
                else edgeMap.set(edge.id, edge);
            });

            // 🔧 FIX starts here
            const survivingNodeIds = new Set(
                [...edgeMap.values()]  // use any collection of nodes you already have
                    .reduce((ids, e) => ids.add(e.source).add(e.target), new Set())
            );
            return [...edgeMap.values()].filter(
                (edge) =>
                    survivingNodeIds.has(edge.source) && survivingNodeIds.has(edge.target)
            );
        });
    }, [createNodeStyle]);

    const handleAcceptChanges = useCallback(async () => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const projectId = parseInt(currentProjectRef.current, 10);
        // Build maps of the previous state for quick lookups
        const prevNodesMap = new Map(prevNodes.map((n) => [n.id, n]));
        const prevEdgesMap = new Map(prevEdges.map((e) => [e.id, e]));

        // Buckets for the bulk payload
        const createdTasks = [];
        const updatedTasks = [];
        const deletedTaskIds = [];

        const createdDeps = [];
        const updatedDeps = [];
        const deletedDepIds = [];

        // 1) Classify nodes
        for (let node of currentNodes) {
            const taskBody = {
                title: node.data.label,
                posX: node.position.x,
                posY: node.position.y,
                completed: node.data.completed ? 1 : 0,
                color: node.data.color,
                project_id: projectId,
            };

            if (node.draft) {
                // did this exist before?
                if (prevNodesMap.has(node.id)) {
                    updatedTasks.push({ id: parseInt(node.id, 10), ...taskBody });
                } else {
                    createdTasks.push({ tempId: node.id, ...taskBody });
                }
            }
        }

        // Deletions: anything in prevNodes that doesn't survive
        for (let prev of prevNodes) {
            if (!currentNodes.some((n) => n.id === prev.id)) {
                deletedTaskIds.push(parseInt(prev.id, 10));
            }
        }

        // 2) Classify edges
        for (let edge of currentEdges) {
            if (edge.draft) {
                const depBody = {
                    from_task: parseInt(edge.source, 10),
                    to_task: parseInt(edge.target, 10),
                    project_id: projectId,
                };

                if (prevEdgesMap.has(edge.id)) {
                    updatedDeps.push({ id: parseInt(edge.id, 10), ...depBody });
                } else {
                    createdDeps.push(depBody);
                }
            }
        }

        for (let prev of prevEdges) {
            if (!currentEdges.some((e) => e.id === prev.id)) {
                deletedDepIds.push(parseInt(prev.id, 10));
            }
        }

        // 3) Send one bulk request
        const payload = {
            project_id: projectId,
            tasks: {
                created: createdTasks,
                updated: updatedTasks,
                deleted: deletedTaskIds,
            },
            dependencies: {
                created: createdDeps,
                updated: updatedDeps,
                deleted: deletedDepIds,
            },
        };

        try {
            // Optimistically clear the drafts in UI
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.draft
                        ? {
                            ...n,
                            draft: false,
                            style: createNodeStyle(n.data.color, n.data.completed, n.selected, false),
                        }
                        : n
                )
            );
            setEdges((edges) =>
                edges.map((e) => (e.draft ? { ...e, draft: false } : e))
            );

            const res = await fetch('/api/bulk-change', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            // result should contain something like:
            // { tasksCreated: [ { tempId: "-3", newId: 42 }, … ], … }

            // 4) Replace temp IDs with real IDs
            const idMap = new Map();
            (result.tasksCreated || []).forEach(({ tempId, newId }) => {
                idMap.set(String(tempId), String(newId));
            });

            // Patch nodes
            let patchedNodes = nodesRef.current.map((n) => {
                const mapped = idMap.get(n.id);
                return mapped
                    ? { ...n, id: mapped }
                    : n;
            });

            // Patch edges
            let patchedEdges = edgesRef.current.map((e) => {
                let src = idMap.get(e.source) || e.source;
                let tgt = idMap.get(e.target) || e.target;
                return { ...e, source: src, target: tgt };
            });

            // Commit the patched graph
            setNodes(patchedNodes);
            setEdges(patchedEdges);

            // Reset history
            setPrevNodes([]);
            setPrevEdges([]);
        } catch (err) {
            // Roll back on error
            setNodes(prevNodes);
            setEdges(prevEdges);
            console.error('Bulk change failed', err);
        }
    }, [
        prevNodes,
        prevEdges,
        createNodeStyle,
        currentProjectRef,
        nodesRef,
        edgesRef
    ]);

    const handleRejectChanges = useCallback(() => {
        setNodes(prevNodes);
        setEdges(prevEdges);

        setPrevNodes([]);
        setPrevEdges([]);
    }, [prevNodes, prevEdges]);

    // --- Layout Management ---
    const handleAutoArrange = useCallback(() => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const currentProject = currentProjectRef.current;

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
            !node.data.draft &&
                updateTask(node.id, {
                    title: node.data.label,
                    posX: node.position.x,
                    posY: node.position.y,
                    color: node.data.color,
                    completed: node.data.completed ? 1 : 0,
                    project_id: parseInt(currentProject)
                });
        });
    }, []);

    const handleCloseChatbot = useCallback(() => {
        setGenerativeMode(false);
    }
    , []);

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
        if (!hideCompleted) return edges;

        const filtered = edges.filter(
            e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
        );
        // same trick: return original if nothing was dropped
        return filtered.length === edges.length ? edges : filtered;
    }, [edges, hideCompleted, visibleNodeIds]);

    const renderedNodes = useMemo(() => {
        return mapWithChangeDetection(visibleNodes, node => {
            // compute the one‑off style override
            let nextStyle = node.style;
            if (
                unlinkHighlight &&
                (node.id === unlinkHighlight.source || node.id === unlinkHighlight.target)
            ) {
                nextStyle = { ...nextStyle, border: '2px solid red' };
            } else if (selectedSource && selectedSource.id === node.id) {
                nextStyle = {
                    ...nextStyle,
                    backgroundColor: node.data.color || '#ffffff',
                    border: '2px solid green',
                };
            } else if (highlightNext) {
                nextStyle = nextTaskIds.has(node.id)
                    ? { ...nextStyle, opacity: 1 }
                    : { ...nextStyle, opacity: 0.3 };
            }

            // only return a new object if style really changed
            return nextStyle === node.style
                ? node
                : { ...node, style: nextStyle };
        });
    }, [
        visibleNodes,
        unlinkHighlight,
        selectedSource,
        highlightNext,
        nextTaskIds,
    ]);

    const handleNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        event.stopPropagation();  // Prevent the event from bubbling up to the pane
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        setContextMenu({ visible: true, x, y, node });
    }, []);

    const handlePaneClick = useCallback(() => {
        setSelectedSource(null);
        setSelectedUnlinkSource(null);
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }, []);

    const handleSelectionChange = useCallback(({ nodes }) => {
        setSelectedNodes(nodes || []);
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }, []);

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
                onFitView={() => reactFlowInstance?.fitView()}
                currentProject={currentProject}
                projects={projects}
                onProjectChange={setCurrentProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                user={user}
                onLogout={handleLogout}
                generativeMode={generativeMode}
                setGenerativeMode={setGenerativeMode}
            />
            <ChatBot isOpen={generativeMode} nodes={nodes} dependencies={edges} currentProject={currentProject} handleGenerativeEdit={handleGenerativeEdit} handleAcceptNodeChanges={handleAcceptChanges} handleRejectNodeChanges={handleRejectChanges} onClose={handleCloseChatbot} />
            <ReactFlowProvider>
                <MemoFlowArea
                    nodes={renderedNodes}
                    edges={visibleEdges}
                    onNodesChange={onNodesChange}
                    onConnect={onConnect}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={handlePaneClick}
                    onSelectionChange={handleSelectionChange}
                    contextMenu={contextMenu}
                    onToggleCompleted={handleToggleCompleted}
                    onEditNode={handleEditNode}
                    onDeleteNode={handleDeleteNode}
                    onDeleteSubtree={handleDeleteSubtree}
                    onUpdateNodeColor={handleUpdateNodeColor}
                    onCloseContextMenu={handleCloseContextMenu}
                    minimapOn={minimapOn}
                    backgroundOn={backgroundOn}
                    onInit={setReactFlowInstance}
                    onAddNode={addNewNode}
                    onAutoArrange={handleAutoArrange}
                />
            </ReactFlowProvider>
            <PromptDialog
                open={editDialogOpen}
                title="Edit Task Title"
                defaultValue={nodeToEdit?.data.label || ""}
                placeholder="Enter task title"
                onSubmit={handleEditSubmit}
                onCancel={() => {
                    setEditDialogOpen(false);
                    setNodeToEdit(null);
                }}
            />
            <PromptDialog
                open={deleteProjectDialog}
                title="Delete Project"
                description="Are you sure you want to delete this project? All data will be lost."
                mode="confirm"
                onSubmit={handleConfirmDeleteProject}
                onCancel={() => setDeleteProjectDialog(false)}
            />
            <PromptDialog
                open={deleteSubtreeDialog}
                title="Delete Subtree"
                description="Are you sure you want to delete this task and all its dependencies? This action cannot be undone."
                mode="confirm"
                onSubmit={handleConfirmDeleteSubtree}
                onCancel={() => {
                    setDeleteSubtreeDialog(false);
                    setNodeToDeleteSubtree(null);
                }}
            />
            <PromptDialog
                open={createProjectDialog}
                title="Create New Project"
                placeholder="Enter project name"
                onSubmit={handleConfirmCreateProject}
                onCancel={() => setCreateProjectDialog(false)}
            />
        </div>
    );
}

export default App;
