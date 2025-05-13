import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { ReactFlowProvider, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { useNodesState, useEdgesState } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import '@/globals.css';
import "@/App.css";
import { initializeHocusProvider } from "@/hocus.js";
import * as dagre from 'dagre';
import blendColors from './utils/colors';
import AuthForm from '@/components/auth/AuthForm';
import TopBar from '@/components/navigation/TopBar';
import FlowArea from '@/components/flow/FlowArea';
import { nodeStyles } from '@/components/flow/styles';
import { fetchUser, fetchProjects, createProject, deleteProject } from './api';
import ChatBot from './components/misc/chatbot';
import ChecksumIndicator from './components/misc/ChecksumIndicator';
import { createAddNewNode, mapWithChangeDetection } from './utils/nodeFunctions';
import { useNavigate } from 'react-router';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import throttle from 'lodash.throttle';
import { v4 as uuidv4 } from 'uuid';

// Memoize imported components
const MemoAuthForm = React.memo(AuthForm);
const MemoTopBar = React.memo(TopBar);
const MemoFlowArea = React.memo(FlowArea);

function App({ user, setUser }) {
    // --- Main App States ---
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(''); // Don't load from localStorage until user is authenticated
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [prevNodes, setPrevNodes] = useState([]);
    const [prevEdges, setPrevEdges] = useState([]);
    const [linkHighlight, setLinkHighlight] = useState(null);
    const [unlinkHighlight, setUnlinkHighlight] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [hideCompleted, setHideCompleted] = useState(() => localStorage.getItem('hideCompleted') === 'true');
    const [highlightNext, setHighlightNext] = useState(() => localStorage.getItem('highlightNext') === 'true');
    const [minimapOn, setMinimapOn] = useState(() => localStorage.getItem('minimapOn') === 'true');
    const [backgroundOn, setBackgroundOn] = useState(() => localStorage.getItem('backgroundOn') !== 'false');
    const [snapToGridOn, setSnapToGridOn] = useState(() => localStorage.getItem('snapToGridOn') !== 'false');
    const [showUpDownstream, setShowUpDownstream] = useState(() => localStorage.getItem('showUpDownstream') !== 'false');
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
    const [yjsHandler, setYjsHandler] = useState(null);
    const [draftTaskIds, setDraftTaskIds] = useState([]);   // NEW
    const [draftEdgeIds, setDraftEdgeIds] = useState([]);   // NEW
    // React Flow
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const currentProjectRef = useRef(currentProject);
    const yjsHandlerRef = useRef(null);


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

    useEffect(() => {
        yjsHandlerRef.current = yjsHandler;
    }, [yjsHandler]);

    // --- Node Management ---
    const createNodeStyle = useCallback((color, completed, selected, draft) => {
        const backgroundColor = completed ? memoBlendColors(color, '#e0e0e0', 0.5) : color;

        // Base style for the node
        let style = {
            ...nodeStyles,
            backgroundColor,
            color: completed ? '#888' : 'inherit',
            outline: selected ? '2px solid blue' : '1px solid #ccc',
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

    // --- Session Management ---
    useEffect(() => {
        fetchUser()
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
                else { navigate('/login'); } // Redirect to login if no user data
            })
            .catch(err => {
                if (err.status === 401) {
                    setUser(null);
                    alert('Session expired. Please log in again.');
                    navigate('/login'); // Redirect to login if not authenticated
                }
                console.error(err);
            }
            );
    }, []);

    useEffect(() => {
        if (user && user.id) { // Only fetch projects if we have a valid user object
            fetchProjects()
                .then(data => {
                    setProjects(data.projects);
                    // After fetching projects, get the saved project from localStorage
                    const savedProject = localStorage.getItem('currentProject');
                    if (data.projects.length > 0 && (!savedProject || !data.projects.some(p => p.id.toString() === savedProject))) {
                        const firstProjectId = data.projects[0].id.toString();
                        setCurrentProject(firstProjectId);
                        localStorage.setItem('currentProject', firstProjectId);
                    } else if (savedProject && data.projects.some(p => p.id.toString() === savedProject)) {
                        // Only set the current project if it exists in the fetched projects
                        setCurrentProject(savedProject);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    // Modified to initialize Yjs provider when project changes
    const fetchTasksAndEdges = useCallback(async (projectId) => {
        if (!projectId || !user) return;

        console.log(`Initializing Yjs for project: ${projectId}`);

        // Clean up previous provider if exists
        if (yjsHandlerRef.current && yjsHandlerRef.current.provider) {
            console.log("Destroying previous Yjs provider");
            yjsHandlerRef.current.provider.destroy();
        }

        // Initialize new provider for this project
        const handler = initializeHocusProvider(projectId, user);
        setYjsHandler(handler);

        // Get initial data from the Yjs document
        const { nodes: flowNodes, edges: flowEdges } = handler.getReactFlowData();

        // Convert to React Flow format with proper styling
        const formattedNodes = flowNodes.map(node => ({
            ...node,
            style: createNodeStyle(node.data.color || '#ffffff', node.data.completed),
            sourcePosition: 'right',
            targetPosition: 'left'
        }));

        // Set nodes and edges in React Flow
        setNodes(formattedNodes);
        setEdges(flowEdges);
        // Set up document-level observer for real-time updates
        // This will catch ALL Yjs document changes, including nested property updates
        handler.provider.document.on('update', () => {
            const { nodes: updatedNodes, edges: updatedEdges } = handler.getReactFlowData();
            // Update nodes with more granularity to preserve local states
            setNodes((currentNodes) => {
                // Create maps for efficient lookups
                const currentNodesMap = new Map(currentNodes.map(node => [node.id, node]));
                const updatedNodesMap = new Map(updatedNodes.map(node => [node.id, node]));

                // Track which nodes have changed to avoid unnecessary updates
                let hasChanges = false;

                // Process all current and updated nodes
                const mergedNodes = currentNodes.map(currentNode => {
                    const updatedNode = updatedNodesMap.get(currentNode.id);

                    // Node doesn't exist in YJS anymore (deleted by another user)
                    if (!updatedNode) {
                        hasChanges = true;
                        return null;
                    }

                    // Check if any YJS-synced properties have changed
                    const positionChanged =
                        currentNode.position.x !== updatedNode.position.x ||
                        currentNode.position.y !== updatedNode.position.y;

                    const dataChanged =
                        currentNode.data.label !== updatedNode.data.label ||
                        currentNode.data.completed !== updatedNode.data.completed ||
                        currentNode.data.color !== updatedNode.data.color;

                    // If nothing changed, keep current node reference
                    if (!positionChanged && !dataChanged) {
                        return currentNode;
                    }

                    // Some property changed - merge updated values with current state
                    hasChanges = true;
                    return {
                        ...currentNode, // Keep all current properties
                        position: updatedNode.position, // Update position from YJS
                        data: {
                            ...currentNode.data, // Keep other data properties
                            label: updatedNode.data.label, // Update synced properties
                            completed: updatedNode.data.completed,
                            color: updatedNode.data.color,
                        },
                        style: createNodeStyle(
                            updatedNode.data.color,
                            updatedNode.data.completed,
                            currentNode.selected,
                            currentNode.draft
                        ),
                    };
                }).filter(Boolean); // Remove null entries (deleted nodes)

                // Add new nodes from YJS that don't exist in current state
                updatedNodes.forEach(updatedNode => {
                    if (!currentNodesMap.has(updatedNode.id)) {
                        hasChanges = true;
                        // Format new node with proper styles
                        mergedNodes.push({
                            ...updatedNode,
                            style: createNodeStyle(
                                updatedNode.data.color || '#ffffff',
                                updatedNode.data.completed,
                                false, // not selected
                                false  // not draft
                            ),
                            sourcePosition: 'right',
                            targetPosition: 'left'
                        });
                    }
                });

                // Only return new array if there were changes
                return hasChanges ? mergedNodes : currentNodes;
            });

            // Handle edges - similar approach
            setEdges((currentEdges) => {
                const currentEdgesMap = new Map(currentEdges.map(edge => [edge.id, edge]));
                const updatedEdgesMap = new Map(updatedEdges.map(edge => [edge.id, edge]));

                let hasEdgeChanges = false;

                // Keep existing edges that are still in YJS data, remove deleted ones
                const mergedEdges = currentEdges
                    .map(edge => {
                        // Edge was deleted in YJS
                        if (!updatedEdgesMap.has(edge.id)) {
                            hasEdgeChanges = true;
                            return null;
                        }

                        // No changes to the edge
                        return edge;
                    })
                    .filter(Boolean);

                // Add new edges from YJS
                updatedEdges.forEach(updatedEdge => {
                    if (!currentEdgesMap.has(updatedEdge.id)) {
                        hasEdgeChanges = true;
                        mergedEdges.push(updatedEdge);
                    }
                });

                return hasEdgeChanges ? mergedEdges : currentEdges;
            });
        });        // Awareness: live dragging from all users with enhanced batch support
        handler.awareness.on("change", () => {
            const states = Array.from(handler.awareness.getStates().values());

            // Initialize drag position map
            let dragMap = {};

            // First collect individual drag updates (backward compatibility)
            states.forEach(state => {
                if (state.drag) {
                    dragMap[state.drag.nodeId] = {
                        x: state.drag.posX,
                        y: state.drag.posY
                    };
                }
            });

            // Then merge in batch updates (new optimized format)
            states.forEach(state => {
                if (state.batchDrag && Array.isArray(state.batchDrag)) {
                    state.batchDrag.forEach(dragItem => {
                        dragMap[dragItem.nodeId] = {
                            x: dragItem.posX,
                            y: dragItem.posY
                        };
                    });
                }
            });

            // If nothing is being dragged, no work:
            if (!Object.keys(dragMap).length) return;

            // Performance optimization: Use updater function that only creates new array if needed
            setNodes(nodes => {
                let hasChanges = false;
                const updatedNodes = nodes.map(n => {
                    // Skip nodes that the local user is currently dragging to avoid jitter
                    if (locallyDraggedNodes.current && locallyDraggedNodes.current.has(n.id)) {
                        return n;
                    }

                    // Apply remote drag updates
                    if (dragMap[n.id]) {
                        hasChanges = true;
                        return {
                            ...n,
                            position: dragMap[n.id]  // <- live update!
                        };
                    }

                    return n;
                });

                // Only create new array if there were actual changes
                return hasChanges ? updatedNodes : nodes;
            });
        });
    }, [user, createNodeStyle]);

    useEffect(() => {
        if (currentProject && user && user.id) {
            fetchTasksAndEdges(currentProject);
            localStorage.setItem('currentProject', currentProject);
        }
    }, [currentProject, user, fetchTasksAndEdges]);

    const handleLogout = useCallback(() => {
        // Clean up Yjs provider before logout
        if (yjsHandlerRef.current && yjsHandlerRef.current.provider) {
            yjsHandlerRef.current.provider.destroy();
        }

        fetch('/api/logout', { method: 'POST', credentials: 'include' })
            .then(() => {
                setUser(null);
                navigate('/'); // Navigate to homepage after logout
            });
    }, [navigate]);

    // --- View Options Persistence ---
    useEffect(() => {
        localStorage.setItem('hideCompleted', hideCompleted);
    }, [hideCompleted]);

    useEffect(() => {
        localStorage.setItem('highlightNext', highlightNext);
    }, [highlightNext]);

    useEffect(() => {
        localStorage.setItem('minimapOn', minimapOn);
    }, [minimapOn]);

    useEffect(() => {
        localStorage.setItem('backgroundOn', backgroundOn);
    }, [backgroundOn]);

    useEffect(() => {
        localStorage.setItem('snapToGridOn', snapToGridOn);
    }, [snapToGridOn]);

    useEffect(() => {
        localStorage.setItem('showUpDownstream', showUpDownstream);
    }, [showUpDownstream]);

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

    const handleCancelCreateProject = useCallback(() => {
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
    }, [currentProject]); const handleCancelDeleteProject = useCallback(() => {
        setDeleteProjectDialog(false);
    }, []);    // Helper function to synchronize node changes with YJS
    const syncNodeWithYJS = useCallback((nodeId) => {
        if (!yjsHandlerRef.current) return;

        // Find the current node data in React state
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (!node || node.draft) return; // Skip missing or draft nodes

        // Update all properties in YJS
        yjsHandlerRef.current.updateTask(nodeId, {
            title: node.data.label,
            posX: node.position.x,
            posY: node.position.y,
            completed: node.data.completed,
            color: node.data.color
        });
    }, []);

    // --- Node dragging --------------------------------------------------------
    // Track which nodes the local user is currently dragging
    const locallyDraggedNodes = useRef(new Set());

    // Store currently selected nodes for batch operations
    const selectedNodesRef = useRef([]);

    // Throttled batch update function - more aggressive for multi-node operations
    const throttledBatchUpdate = useMemo(
        () =>
            throttle(
                (draggedNodes) => {
                    if (!yjsHandlerRef.current) return;

                    yjsHandlerRef.current.setBatchDragState(
                        draggedNodes.length ? draggedNodes : null
                    );
                },
                30,                 // wait
                { leading: true }   // (optional) skip the immediate first call
            ),
        []                       // ← create only once
    );

    // 1. every tiny move → awareness with improved batching
    const onNodeDrag = useCallback((_, node) => {
        // Add this node to our locally dragged set
        locallyDraggedNodes.current.add(node.id);

        // Find all selected nodes to batch update together
        const nodesToUpdate = [];

        // Always include the current node being dragged
        nodesToUpdate.push(node);

        // If the node being dragged is selected, also include other selected nodes
        if (node.selected) {
            const selectedNodes = nodesRef.current.filter(n =>
                n.selected && n.id !== node.id // Include other selected nodes
            );
            nodesToUpdate.push(...selectedNodes);
        }

        // Store current selection for use in drag stop
        selectedNodesRef.current = nodesToUpdate;

        // Use the throttled batch update with adaptive timing

        throttledBatchUpdate(nodesToUpdate);
    }, []);

    // 2. drop → clear awareness + persist final position with batch updates
    const onNodeDragStop = useCallback(
        (event, node) => {
            if (node.draft) return;

            // Get all affected nodes (the dragged node and any selected nodes if this was part of a multi-select)
            const affectedNodes = selectedNodesRef.current.length > 0 && node.selected
                ? selectedNodesRef.current
                : [node];

            // Clear all from locally dragged set
            affectedNodes.forEach(n => {
                locallyDraggedNodes.current.delete(n.id);
            });

            // Clear awareness state
            yjsHandlerRef.current?.setBatchDragState(null);

            // Wait one frame so React-Flow finishes updating the node state
            requestAnimationFrame(() => {
                // Batch sync the final positions with YJS
                const taskUpdates = affectedNodes.map(n => {
                    // Find the current node data in React state (to get the most up-to-date position)
                    const currentNode = nodesRef.current.find(current => current.id === n.id);
                    if (!currentNode || currentNode.draft) return null;

                    return {
                        id: currentNode.id,
                        data: {
                            posX: currentNode.position.x,
                            posY: currentNode.position.y
                        }
                    };
                }).filter(Boolean); // Remove any null entries

                // Use batch update if available and we have multiple nodes
                if (yjsHandlerRef.current?.updateMultipleTasks && taskUpdates.length > 1) {
                    yjsHandlerRef.current.updateMultipleTasks(taskUpdates);
                } else {
                    // Fall back to individual updates
                    taskUpdates.forEach(update => {
                        syncNodeWithYJS(update.id);
                    });
                }

                // Clear selection cache
                selectedNodesRef.current = [];
            });
        },
        [syncNodeWithYJS]
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
            position,
            yjs: yjsHandlerRef.current // Pass Yjs handler to node creation function
        })(),
        [newTaskTitle, currentProject, reactFlowInstance, reactFlowWrapper, lastNodePosition, cascadeCount, cascadeStartPoint, createNodeStyle]
    );

    // --- Edge Management ---
    const customOnEdgesChange = useCallback(
        (changes) => {
            changes.forEach(change => {
                if (change.type === 'remove' && yjsHandlerRef.current) {
                    yjsHandlerRef.current.deleteDependency(change.id);
                }
            });
            // For non-remove changes (e.g., selection), let useEdgesState handle it
            const filtered = changes.filter(c => c.type !== 'remove');
            if (filtered.length > 0) {
                setEdges((prevEdges) => applyEdgeChanges(filtered, prevEdges));
            }
        },
        [] // No dependencies needed as we're using refs
    );

    const onConnect = useCallback( //on connect is called when a new edge is created
        (params) => {
            if (!yjsHandlerRef.current) {
                console.error("Yjs handler not available");
                return;
            }
            // Use Yjs to add dependency; Yjs observer will update edges
            console.log("Adding dependency:", params.source, params.target);
            yjsHandlerRef.current.addDependency(params.source, params.target);
        },
        []
    );

    const handleNodeClick = useCallback(
        (e, node) => {
            // 1) Close any open context menu
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }

            if (!e.shiftKey) return;       // normal click – do nothing extra

            // First shift-click: store the anchor and quit
            if (!linkHighlight || linkHighlight.target) {
                setLinkHighlight({ source: node.id, target: null });
                return;
            }

            // Second shift-click: link/unlink with the stored anchor
            const sourceId = linkHighlight.source;
            if (sourceId === node.id) return;   // same node – ignore

            const existing = edgesRef.current.find(
                e => e.source === sourceId && e.target === node.id
            );

            if (existing) {
                yjsHandlerRef.current?.deleteDependency(existing.id);
                setUnlinkHighlight({ source: sourceId, target: node.id });
            } else {
                onConnect({ source: sourceId, target: node.id });
                setLinkHighlight({ source: sourceId, target: node.id });
            }

            
            setTimeout(() => setUnlinkHighlight(null) || setLinkHighlight(null), 400);
        },
        // note: we include the things we actually read from outer scope
        [contextMenu, linkHighlight, onConnect, yjsHandlerRef]
    );


    const handleToggleCompleted = useCallback((node) => {
        if (node.draft) return;

        const updatedCompleted = !node.data.completed;

        // Update React state
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

        // Schedule YJS update after React state update
        requestAnimationFrame(() => {
            syncNodeWithYJS(node.id);
        });
    }, [createNodeStyle, syncNodeWithYJS])

    const handleUpdateNodeColor = useCallback((node, color) => {
        if (node.draft) return;

        // Update React state
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

        // Schedule YJS update after React state update
        requestAnimationFrame(() => {
            syncNodeWithYJS(node.id);
        });
    }, [createNodeStyle, syncNodeWithYJS]);

    const handleEditNode = useCallback((node) => {
        setNodeToEdit(node);
        setEditDialogOpen(true);
    }, []); const handleEditSubmit = useCallback((newTitle) => {
        if (newTitle && newTitle.trim() && nodeToEdit && !nodeToEdit.draft) {
            // Update React state
            setNodes(prev =>
                prev.map(n => n.id === nodeToEdit.id ? { ...n, data: { ...n.data, label: newTitle } } : n)
            );

            // Schedule YJS update after React state update
            requestAnimationFrame(() => {
                syncNodeWithYJS(nodeToEdit.id);
            });
        }
        setEditDialogOpen(false);
        setNodeToEdit(null);
    }, [nodeToEdit, syncNodeWithYJS]);

    const handleCancelEdit = useCallback(() => {
        setEditDialogOpen(false);
        setNodeToEdit(null);
    }, []); const handleDeleteNode = useCallback((node) => {
        if (node.draft) return;
        if (!yjsHandlerRef.current) return;

        // Delete from Yjs document - this will trigger the YJS observer
        // which will update the React state automatically
        yjsHandlerRef.current.deleteTask(node.id);
    }, []);

    const handleDeleteSubtree = useCallback((node) => {
        setNodeToDeleteSubtree(node);
        setDeleteSubtreeDialog(true);
    }, []); const handleConfirmDeleteSubtree = useCallback(() => {
        if (!nodeToDeleteSubtree || !yjsHandlerRef.current) return;

        const toDelete = new Set();
        const dfs = (nodeId) => {
            if (toDelete.has(nodeId)) return;
            toDelete.add(nodeId);
            edges.filter(e => e.source === nodeId).forEach(e => dfs(e.target));
        };
        dfs(nodeToDeleteSubtree.id);

        // Delete tasks from Yjs document - this will trigger the YJS observer
        // which will update the React state automatically
        toDelete.forEach(nodeId => {
            yjsHandlerRef.current.deleteTask(nodeId);
        });

        setDeleteSubtreeDialog(false);
        setNodeToDeleteSubtree(null);
    }, [nodeToDeleteSubtree, edges]);

    const handleCancelDeleteSubtree = useCallback(() => {
        setDeleteSubtreeDialog(false);
        setNodeToDeleteSubtree(null);
    }, []);


    const handleGenerativeEdit = useCallback(async (projectData) => {
        const { tasks: aiTasks, dependencies: aiDeps } = projectData;
        const { addTask, updateTask, deleteTask, addDependency, deleteDependency, provider, undoManager } = yjsHandlerRef.current;

        // Keep track of the real IDs we end up using for each AI task
        const idMap = new Map();
        const newDraftNodeIds = [];
        const newDraftEdgeIds = [];

        provider.document.transact(() => {
            aiTasks.forEach(t => {
                const exists = yjsHandlerRef.current.tasks.has(t.id);

                if (t.delete) {
                    deleteTask(t.id);
                    return;
                }

                if (!exists) {
                    // brand-new: *we* generate the UUID
                    const realId = uuidv4();
                    addTask({
                        id: realId,
                        title: t.title,
                        posX: t.posX,
                        posY: t.posY,
                        completed: t.completed,
                        color: t.color,
                    });
                    idMap.set(t.id, realId);
                    newDraftNodeIds.push(realId);
                } else if (!t.no_change) {
                    updateTask(t.id, {
                        title: t.title,
                        posX: t.posX,
                        posY: t.posY,
                        completed: t.completed,
                        color: t.color
                    });
                    newDraftNodeIds.push(t.id);
                }
            });

            aiDeps.forEach(d => {
                if (d.delete) {
                    deleteDependency(d.id);
                } else {
                    // remap any AI task-IDs to our real IDs
                    const from = idMap.get(d.from_task) || d.from_task;
                    const to = idMap.get(d.to_task) || d.to_task;
                    addDependency(from, to);
                    newDraftEdgeIds.push(d.id);
                }
            });
        }, "generative");

        // then mark them as drafts
        setDraftTaskIds(newDraftNodeIds);
        setDraftEdgeIds(newDraftEdgeIds);

        setNodes(prev =>
            prev.map(n =>
                newDraftNodeIds.includes(n.id)
                    ? { ...n, draft: true, style: createNodeStyle(n.data.color, n.data.completed, n.selected, true) }
                    : n
            )
        );
    }, [prevNodes, prevEdges]);
    const handleAcceptChanges = useCallback(() => {
        // simply clear the undo‐stack so you can no longer undo
        yjsHandlerRef.current.undoManager.clear();
        setDraftTaskIds([]);
        setDraftEdgeIds([]);
        setNodes(prev =>
            prev.map(n =>
                n.draft
                    ? {
                        ...n,
                        draft: false,
                        style: createNodeStyle(
                            n.data.color,
                            n.data.completed,
                            n.selected,
                            false           // stripes off
                        ),
                    }
                    : n
            )
        );
        setPrevNodes([]);    // if you still used these
        setPrevEdges([]);
    }, []);

    // Reject: roll everything back
    const handleRejectChanges = useCallback(() => {
        // this will undo *all* the ops in that “generative” transaction
        yjsHandlerRef.current.undoManager.undo();
        // now clear the stack so it’s fresh next time
        yjsHandlerRef.current.undoManager.clear();
        setDraftTaskIds([]);
        setDraftEdgeIds([]);
        setNodes(prev =>
            prev.map(n =>
                n.draft
                    ? {
                        ...n,
                        draft: false,
                        style: createNodeStyle(
                            n.data.color,
                            n.data.completed,
                            n.selected,
                            false
                        ),
                    }
                    : n
            )
        );
    }, []);

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
        }); setNodes(newNodes);

        // Schedule synchronization after React state update
        requestAnimationFrame(() => {
            // Synchronize all nodes with YJS
            newNodes.forEach(node => {
                if (!node.draft) {
                    syncNodeWithYJS(node.id);
                }
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
        // Derive selected nodes directly from the nodes state
        const currentSelectedNodes = nodes.filter(n => n.selected);

        return mapWithChangeDetection(visibleNodes, node => {
            // compute the one‑off style override
            let nextStyle = node.style;

            // Track downstream and upstream nodes of the selected node
            // Use the derived currentSelectedNodes list
            const isDownstream = currentSelectedNodes.length === 1 && edges.some(e =>
                e.source === currentSelectedNodes[0].id && e.target === node.id
            );
            const isUpstream = currentSelectedNodes.length === 1 && edges.some(e =>
                e.target === currentSelectedNodes[0].id && e.source === node.id
            );


            if (
                unlinkHighlight &&
                (node.id === unlinkHighlight.source || node.id === unlinkHighlight.target)
            ) {
                nextStyle = { ...nextStyle, outline: '2px solid red' };
            } else if (linkHighlight && (linkHighlight.source == node.id || linkHighlight.target == node.id)) {
                nextStyle = {
                    ...nextStyle,
                    backgroundColor: node.data.color || '#ffffff',
                    outline: '2px solid green',
                };
            } else if (showUpDownstream && isDownstream) {
                nextStyle = { ...nextStyle, outline: '2px solid #FF6A1A', boxShadow: '0 0 10px 1px #FF6A1A' }; // Yellow for downstream + glow
            } else if (showUpDownstream && isUpstream) {
                nextStyle = { ...nextStyle, outline: '2px solid #00B8E6', boxShadow: '0 0 10px 1px #00B8E6' }; // Purple for upstream + glow

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
        visibleNodes, // depends on nodes
        unlinkHighlight,
        linkHighlight,
        highlightNext,
        nextTaskIds, // depends on nodes
        edges,
        showUpDownstream,
        nodes // Add dependency as we derive selected nodes from it
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
        setLinkHighlight(null);
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }, []);

    const onFitView = useCallback(() => {
        if (reactFlowInstance) {
            reactFlowInstance.fitView();
        }
    }
        , [reactFlowInstance]);

    // --- Node Management ---
    // Custom onNodesChange to update style for selection changes (UI only)
    const customOnNodesChange = useCallback(
        (changes) => {
            setNodes((prevNodes) => {
                let changed = false;
                const nextNodes = prevNodes.map((node) => {
                    const change = changes.find((c) => c.id === node.id);
                    if (!change) return node;
                    // Only update style if selection changed
                    if (typeof change.selected === 'boolean' && change.selected !== node.selected) {
                        changed = true;
                        return {
                            ...node,
                            selected: change.selected,
                            style: createNodeStyle(
                                node.data.color,
                                node.data.completed,
                                change.selected,
                                node.draft
                            ),
                        };
                    }
                    return node;
                });
                // Let useNodesState handle other changes (position, etc)
                return changed ? nextNodes : applyNodeChanges(changes, prevNodes);
            });
        },
        [createNodeStyle, setNodes]
    );


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
                snapToGridOn={snapToGridOn}
                setSnapToGridOn={setSnapToGridOn}
                showUpDownstream={showUpDownstream}
                setShowUpDownstream={setShowUpDownstream}
                onAutoArrange={handleAutoArrange}
                onFitView={onFitView}
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
                    onNodesChange={customOnNodesChange}
                    onEdgesChange={customOnEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                    onNodeDrag={onNodeDrag}
                    onNodeDragStop={onNodeDragStop}
                    onPaneClick={handlePaneClick}
                    contextMenu={contextMenu}
                    onToggleCompleted={handleToggleCompleted}
                    onEditNode={handleEditNode}
                    onDeleteNode={handleDeleteNode}
                    onDeleteSubtree={handleDeleteSubtree}
                    onUpdateNodeColor={handleUpdateNodeColor}
                    onCloseContextMenu={handleCloseContextMenu}
                    minimapOn={minimapOn}
                    backgroundOn={backgroundOn}
                    snapToGridOn={snapToGridOn}
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
                onCancel={handleCancelEdit}
            />
            <PromptDialog
                open={deleteProjectDialog}
                title="Delete Project"
                description="Are you sure you want to delete this project? All data will be lost."
                mode="confirm"
                onSubmit={handleConfirmDeleteProject}
                onCancel={handleCancelDeleteProject}
            />
            <PromptDialog
                open={deleteSubtreeDialog}
                title="Delete Subtree"
                description="Are you sure you want to delete this task and all its dependencies? This action cannot be undone."
                mode="confirm"
                onSubmit={handleConfirmDeleteSubtree}
                onCancel={handleCancelDeleteSubtree}
            />
            <PromptDialog
                open={createProjectDialog}
                title="Create New Project"
                placeholder="Enter project name"
                onSubmit={handleConfirmCreateProject}
                onCancel={handleCancelCreateProject}
            />
            {/* Checksum indicator - appears at the bottom left of the screen */}
            <ChecksumIndicator
                nodes={nodes}
                edges={edges}
                currentProject={currentProject}
                yjsHandler={yjsHandler}
            />
        </div>
    );
}

export default App;
