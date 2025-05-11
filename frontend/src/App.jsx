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
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedUnlinkSource, setSelectedUnlinkSource] = useState(null);
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
                { leading: false }   // (optional) skip the immediate first call
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
        (event, node) => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }

            if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                if (!selectedUnlinkSource) {
                    setSelectedUnlinkSource(node);
                } else if (selectedUnlinkSource.id !== node.id) {
                    const edge = edges.find(e => e.source === selectedUnlinkSource.id && e.target === node.id);
                    if (edge && yjsHandlerRef.current) {
                        // Only call Yjs, do not setEdges directly
                        yjsHandlerRef.current.deleteDependency(edge.id);
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
    )

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

            // --- Handle no_change --- 
            if (task.no_change) {
                const existingNode = prevNodeMap.get(origId);
                if (existingNode) {
                    // Return the existing node as is, ensuring draft is false
                    return { ...existingNode, draft: false };
                } else {
                    // Should not happen if AI follows instructions, but handle defensively
                    console.warn(`Task ${origId} marked no_change but not found in previous state.`);
                    return null; // Or handle as an error
                }
            }
            // --- End handle no_change ---

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
        }).filter(node => node !== null); // Filter out any nulls from no_change warning

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

        const createdTasks = [];
        const updatedTasks = [];
        const deletedTaskIds = [];

        const createdDeps = [];
        const updatedDeps = [];
        const deletedDepIds = [];

        // 1) Classify nodes
        for (let node of currentNodes) {
            // --- Skip nodes that weren't part of the draft changes --- 
            if (!node.draft && !prevNodesMap.has(node.id)) {
                // This node existed before and wasn't marked as draft (i.e., wasn't no_change or modified)
                continue;
            }
            // --- If it *was* a draft, process it --- 
            if (node.draft) {
                const taskBody = {
                    title: node.data.label,
                    posX: node.position.x,
                    posY: node.position.y,
                    completed: node.data.completed ? 1 : 0,
                    color: node.data.color,
                    project_id: projectId,
                };
                if (prevNodesMap.has(node.id)) {
                    // It existed before and was modified (draft=true)
                    updatedTasks.push({ id: parseInt(node.id, 10), ...taskBody });
                } else {
                    // It's a new node (draft=true)
                    createdTasks.push({ tempId: node.id, ...taskBody });
                }
            }
        }

        // Deletions: anything in prevNodes that doesn't survive in currentNodes
        for (let prev of prevNodes) {
            if (!currentNodes.some((n) => n.id === prev.id)) {
                deletedTaskIds.push(parseInt(prev.id, 10));
            }
        }

        // 2) Classify edges (similar logic, skip non-drafts unless deleted)
        for (let edge of currentEdges) {
            if (!edge.draft && !prevEdgesMap.has(edge.id)) {
                continue;
            }
            if (edge.draft) {
                const depBody = {
                    // Ensure source/target IDs are integers for the backend
                    from_task: parseInt(edge.source, 10),
                    to_task: parseInt(edge.target, 10),
                    project_id: projectId,
                };

                if (prevEdgesMap.has(edge.id)) {
                    updatedDeps.push({ id: parseInt(edge.id, 10), ...depBody });
                } else {
                    // Need to map temp task IDs if source/target were new tasks
                    // Note: This assumes the backend handles mapping temp *edge* IDs implicitly
                    // If backend needs temp edge IDs mapped, more logic is needed here.
                    createdDeps.push(depBody);
                }
            }
        }

        for (let prev of prevEdges) {
            if (!currentEdges.some((e) => e.id === prev.id)) {
                deletedDepIds.push(parseInt(prev.id, 10));
            }
        }

        // 3) Send bulk request (only if there are changes)
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

        // Only send if there's something to change
        if (createdTasks.length === 0 && updatedTasks.length === 0 && deletedTaskIds.length === 0 &&
            createdDeps.length === 0 && updatedDeps.length === 0 && deletedDepIds.length === 0) {
            console.log("No changes to accept.");
            // Reset history even if no changes were sent
            setPrevNodes([]);
            setPrevEdges([]);
            // Clear any potential lingering draft states just in case (though should be handled by no_change)
            setNodes((nodes) => nodes.map((n) => n.draft ? { ...n, draft: false, style: createNodeStyle(n.data.color, n.data.completed, n.selected, false) } : n));
            setEdges((edges) => edges.map((e) => e.draft ? { ...e, draft: false } : e));
            return;
        }

        try {
            // Optimistically clear the drafts in UI             // Update React state first - remove draft markers
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

            // After React state updates, synchronize all previously draft nodes with YJS
            requestAnimationFrame(() => {
                nodesRef.current.forEach(node => {
                    // Find nodes that were drafts before accepting
                    if (prevNodes.some(prevNode => prevNode.id === node.id && prevNode.draft)) {
                        syncNodeWithYJS(node.id);
                    }
                });
            });

            const res = await fetch('/api/bulk-change', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Bulk change failed with status: ${res.status}`);
            }

            const result = await res.json();

            // 4) Replace temp IDs with real IDs
            const idMap = new Map();
            (result.tasksCreated || []).forEach(({ tempId, newId }) => {
                idMap.set(String(tempId), String(newId));
            });
            // Map dependency IDs if backend provides them (assuming it might)
            // Example: (result.dependenciesCreated || []).forEach(({ tempId, newId }) => { idMap.set(String(tempId), String(newId)); });

            // Patch nodes
            let patchedNodes = nodesRef.current.map((n) => {
                const mapped = idMap.get(n.id);
                return mapped
                    ? { ...n, id: mapped }
                    : n;
            });

            // Patch edges (source, target, and potentially edge ID itself)
            let patchedEdges = edgesRef.current.map((e) => {
                let src = idMap.get(e.source) || e.source;
                let tgt = idMap.get(e.target) || e.target;
                // let edgeId = idMap.get(e.id) || e.id; // If backend maps edge IDs
                // return { ...e, id: edgeId, source: src, target: tgt };
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
            // Optionally: Show an error message to the user
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
            } else if (selectedSource && selectedSource.id === node.id) {
                nextStyle = {
                    ...nextStyle,
                    backgroundColor: node.data.color || '#ffffff',
                    outline: '2px solid green',
                };
            } else if (showUpDownstream && isDownstream) {
                nextStyle = { ...nextStyle, outline: '2px solid #FFD700', boxShadow: '0 0 10px 1px #FFD700' }; // Yellow for downstream + glow
            } else if (showUpDownstream && isUpstream) {
                nextStyle = { ...nextStyle, outline: '2px solid #9370DB', boxShadow: '0 0 10px 1px #9370DB' }; // Purple for upstream + glow
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
        selectedSource,
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
        setSelectedSource(null);
        setSelectedUnlinkSource(null);
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
                    onNodeMouseDown={handleNodeClick}
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
