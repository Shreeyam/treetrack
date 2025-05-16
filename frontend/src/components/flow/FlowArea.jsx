import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useReactFlow
} from '@xyflow/react';
import TaskContextMenu from '../task/TaskContextMenu';
import CanvasContextMenu from './CanvasContextMenu';
import ArrowContextMenu from './ArrowContextMenu';
import { v4 as uuidv4 } from 'uuid';

const FlowArea = memo(({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange, // Accept onEdgesChange as a prop, but clarify in comments that it should only be used for UI changes (selection, style), not add/remove.
    onConnect,
    onNodeClick,
    onNodeContextMenu,
    onNodeDragStop,
    onNodeDrag,        // ← add
    onPaneClick,
    onSelectionChange,
    contextMenu,
    onToggleCompleted,
    onSetCompleted,
    onEditNode,
    onDeleteNode,
    onDeleteSubtree,
    onDeleteSubtrees,
    onUpdateNodeColor,
    onCloseContextMenu,
    minimapOn,
    backgroundOn,
    snapToGridOn,
    onInit,
    onAddNode,
    onAutoArrange,
    createNodeStyle,
    yjsHandler,
    setNodes, // <-- add as prop
    setEdges  // <-- add as prop
}) => {
    const [canvasMenu, setCanvasMenu] = useState({ visible: false, x: 0, y: 0 });
    const [arrowMenu, setArrowMenu] = useState({ visible: false, x: 0, y: 0, edge: null });
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const flowRef = useRef(null);

    const handleInit = useCallback((instance) => {
        setReactFlowInstance(instance);
        if (onInit) {
            onInit(instance);
        }
    }, [onInit]);

    // --- COPY / PASTE state -----------------------------------------
    // persists between re-renders but is local to this FlowArea instance
    const clipboardRef = useRef({ nodes: [], edges: [] });
    // last mouse position inside the flow (in flow coords)
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleCloseArrowMenu = useCallback(() => {
        setArrowMenu({ visible: false, x: 0, y: 0, edge: null });
    }, []);

    const handlePaneContextMenu = useCallback((event) => {
        event.preventDefault();
        onCloseContextMenu();
        handleCloseArrowMenu();
        const bounds = flowRef.current.getBoundingClientRect();
        setCanvasMenu({
            visible: true,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
        });
    }, [onCloseContextMenu, handleCloseArrowMenu]);

    const handleCloseCanvasMenu = useCallback(() => {
        setCanvasMenu({ visible: false, x: 0, y: 0 });
    }, []);

    const handleAddNode = useCallback(() => {
        if (!reactFlowInstance) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: canvasMenu.x, y: canvasMenu.y });
        onAddNode(position);
        handleCloseCanvasMenu();
    }, [canvasMenu, onAddNode, reactFlowInstance]);

    const handlePaneClick = useCallback((event) => {
        onPaneClick(event);
        handleCloseCanvasMenu();
        handleCloseArrowMenu();
    }, [onPaneClick, handleCloseCanvasMenu, handleCloseArrowMenu]);

    const handleNodeContextMenu = useCallback((event, node) => {
        handleCloseCanvasMenu();
        handleCloseArrowMenu();
        onNodeContextMenu(event, node);
    }, [handleCloseCanvasMenu, handleCloseArrowMenu, onNodeContextMenu]);

    const handleEdgeContextMenu = useCallback((event, edge) => {
        event.preventDefault();
        onCloseContextMenu();
        handleCloseCanvasMenu();
        const bounds = flowRef.current.getBoundingClientRect();
        setArrowMenu({
            visible: true,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            edge: edge,
        });
    }, [onCloseContextMenu, handleCloseCanvasMenu]);

    const handleDeleteEdge = useCallback((edgeToDelete) => {
        if (onEdgesChange) {
            onEdgesChange([{ type: 'remove', id: edgeToDelete.id }]); // When calling onEdgesChange for remove, this will now go through the custom handler in App.jsx, which calls Yjs and does not setEdges directly.
        }
        handleCloseArrowMenu();
    }, [onEdgesChange, handleCloseArrowMenu]);

    const handleNodeDragStop = useCallback((event, draggedNode) => {
        // Find all selected nodes including the dragged one
        const selectedNodes = nodes.filter(node => node.selected || node.id === draggedNode.id);

        // Call onNodeDragStop for each selected node
        selectedNodes.forEach(node => {
            if (onNodeDragStop) {
                onNodeDragStop(event, node);
            }
        });
    }, [nodes, onNodeDragStop]);

    const handleNodeDrag = useCallback((event, draggedNode) => {
        const selected = nodes.filter(n => n.selected || n.id === draggedNode.id);
        selected.forEach(n => onNodeDrag?.(event, n));
    }, [nodes, onNodeDrag]);

    const handleKeyDown = useCallback((event) => {

        // Only process if an input field isn't currently focused
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            // Prevent default behavior (e.g., browser navigation on backspace)
            event.preventDefault();

            // Get selected nodes and edges
            const selectedEdges = edges.filter(edge => edge.selected);
            const selectedNodes = nodes.filter(node => node.selected);

            // First delete edges to avoid reference errors
            if (selectedEdges.length > 0 && onEdgesChange) {
                selectedEdges.forEach(edge => {
                    handleDeleteEdge(edge);
                });
            }

            // Delete nodes using the existing node deletion mechanism
            if (selectedNodes.length > 0) {
                // Process node deletions one by one to properly handle cleanup
                selectedNodes.forEach(node => {
                    if (onDeleteNode) {
                        onDeleteNode(node);
                    }
                });
            }
        }

        // ----- CUT --------------------------------------------------
        if (["Meta", "Control"].some(k => event.getModifierState(k)) && event.key.toLowerCase() === 'x') {
            event.preventDefault();
            // gather selected nodes & internal edges
            const selNodes = nodes.filter(n => n.selected && !n.draft);
            if (selNodes.length) {
                const selIds = new Set(selNodes.map(n => n.id));
                const selEdges = edges.filter(e => selIds.has(e.source) && selIds.has(e.target));
                // copy to clipboard
                clipboardRef.current = {
                    nodes: selNodes.map(n => ({ ...n })),
                    edges: selEdges.map(e => ({ ...e }))
                };
                // delete edges first
                selEdges.forEach(edge => handleDeleteEdge(edge));
                // then delete nodes
                selNodes.forEach(node => onDeleteNode?.(node));
            }
            return;
        }

        // ----- COPY -------------------------------------------------
        if (["Meta", "Control"].some(k => event.getModifierState(k)) && event.key.toLowerCase() === 'c') {
            const selNodes = nodes.filter((n) => n.selected && !n.draft);
            if (!selNodes.length) return;

            // collect internal edges (both ends selected)
            const selIds = new Set(selNodes.map((n) => n.id));
            const selEdges = edges.filter(
                (e) => selIds.has(e.source) && selIds.has(e.target)
            );

            // store a shallow clone so we can mutate positions later
            clipboardRef.current = {
                nodes: selNodes.map((n) => ({ ...n })),
                edges: selEdges.map((e) => ({ ...e })),
            };
            return;
        }

        // ----- PASTE ------------------------------------------------
        if (["Meta", "Control"].some(k => event.getModifierState(k)) && event.key.toLowerCase() === 'v') {
            const { nodes: cpNodes, edges: cpEdges } = clipboardRef.current;
            if (!cpNodes.length) return;

            // 1️⃣ work out the offset so the *centroid* sits under the cursor
            const minX = Math.min(...cpNodes.map((n) => n.position.x));
            const minY = Math.min(...cpNodes.map((n) => n.position.y));
            const centroid = {
                x: minX + (Math.max(...cpNodes.map((n) => n.position.x)) - minX) / 2,
                y: minY + (Math.max(...cpNodes.map((n) => n.position.y)) - minY) / 2,
            };
            const dx = lastMousePos.current.x - centroid.x;
            const dy = lastMousePos.current.y - centroid.y;

            // 2️⃣ duplicate nodes – new ids, shifted positions, fresh style
            const idMap = new Map();
            const newNodes = cpNodes.map((old) => {
                const id = uuidv4();
                idMap.set(old.id, id);
                return {
                    ...old,
                    id,
                    position: {
                        x: old.position.x + dx,
                        y: old.position.y + dy,
                    },
                    selected: false,
                    draft: false,
                    style: createNodeStyle(
                        old.data.color,
                        old.data.completed,
                        false,
                        false
                    ),
                };
            });

            // 3️⃣ duplicate internal edges with the remapped ids
            const newEdges = cpEdges.map((old) => ({
                ...old,
                id: uuidv4(),
                source: idMap.get(old.source),
                target: idMap.get(old.target),
                selected: false,
            }));

            // 4️⃣ push to React-Flow state  ⟹ immediate visual feedback
            setNodes((prev) => [...prev, ...newNodes]);
            setEdges((prev) => [...prev, ...newEdges]);

            // 5️⃣ persist inside the Yjs doc in ONE transaction
            if (yjsHandler?.current) {
                const { addTask, addDependency, provider } = yjsHandler.current;
                provider.document.transact(() => {
                    newNodes.forEach((n) =>
                        addTask({
                            id: n.id,
                            title: n.data.label,
                            posX: n.position.x,
                            posY: n.position.y,
                            completed: n.data.completed,
                            color: n.data.color,
                        })
                    );
                    newEdges.forEach((e) => addDependency(e.source, e.target));
                });
            }
            return;
        }
    }, [edges, nodes, handleDeleteEdge, onDeleteNode, createNodeStyle, yjsHandler, setNodes, setEdges]);


    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className="flex-grow relative"
            ref={flowRef}
            onMouseMove={(e) => {
                if (!reactFlowInstance) return;
                const bounds = flowRef.current.getBoundingClientRect();
                lastMousePos.current = reactFlowInstance.screenToFlowPosition({
                    x: e.clientX - bounds.left,
                    y: e.clientY - bounds.top,
                });
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                onSelectionContextMenu={handleNodeContextMenu}
                onEdgeContextMenu={handleEdgeContextMenu}
                onNodeDrag={handleNodeDrag}          // ← live moves
                onNodeDragStop={handleNodeDragStop}  // ← final commit
                //onSelectionChange={onSelectionChange}
                elementsSelectable={true}
                selectionOnDrag={true}
                selectNodesOnDrag={true}
                selectionKeyCode={["Meta", "Control"]}
                multiSelectionKeyCode={["Meta", "Control"]}
                deleteKeyCode="null"
                onPaneClick={handlePaneClick}
                onPaneContextMenu={handlePaneContextMenu}
                onInit={handleInit}
                snapToGrid={snapToGridOn}
                snapGrid={[10, 10]}
                fitView
                minZoom={0.15}
            >
                {minimapOn && (
                    <MiniMap
                        pannable
                        zoomable
                        position="top-right"
                        nodeColor={'#ddd'}
                        className="border-gray-200 border-1"
                        height={120}
                        width={150}
                    />
                )}
                {backgroundOn && <Background />}
                <Controls />
            </ReactFlow>

            <TaskContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                node={contextMenu.node}
                selectedNodes={Array.isArray(contextMenu.selectedNodes) && Array.isArray(contextMenu.selectedNodes[0])
                    ? contextMenu.selectedNodes.flat()
                    : contextMenu.selectedNodes}
                onToggleComplete={onToggleCompleted}
                onSetCompleted={onSetCompleted}
                onEdit={onEditNode}
                onDelete={onDeleteNode}
                onDeleteSubtree={onDeleteSubtree}
                onDeleteSubtrees={onDeleteSubtrees}
                onUpdateColor={onUpdateNodeColor}
                onClose={onCloseContextMenu}
            />

            <CanvasContextMenu
                visible={canvasMenu.visible}
                x={canvasMenu.x}
                y={canvasMenu.y}
                onAddNode={handleAddNode}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFitView={fitView}
                onAutoArrange={onAutoArrange}
                onClose={handleCloseCanvasMenu}
            />

            <ArrowContextMenu
                visible={arrowMenu.visible}
                x={arrowMenu.x}
                y={arrowMenu.y}
                edge={arrowMenu.edge}
                onDelete={handleDeleteEdge}
                onClose={handleCloseArrowMenu}
            />
        </div>
    );
});

FlowArea.displayName = 'FlowArea';
export default FlowArea;