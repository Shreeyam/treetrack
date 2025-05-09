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
import { nodeStyles } from './styles';

const FlowArea = memo(({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onNodeContextMenu,
    onNodeDragStop,
    onPaneClick,
    onSelectionChange,
    contextMenu,
    onToggleCompleted,
    onEditNode,
    onDeleteNode,
    onDeleteSubtree,
    onUpdateNodeColor,
    onCloseContextMenu,
    minimapOn,
    backgroundOn,
    snapToGridOn,
    onInit,
    onAddNode,
    onAutoArrange
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
            onEdgesChange([{ type: 'remove', id: edgeToDelete.id }]);
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
    }, [edges, nodes, handleDeleteEdge, onDeleteNode]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className="flex-grow relative" ref={flowRef}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                onEdgeContextMenu={handleEdgeContextMenu}
                onNodeDragStop={handleNodeDragStop}
                onSelectionChange={onSelectionChange}
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
                onToggleComplete={onToggleCompleted}
                onEdit={onEditNode}
                onDelete={onDeleteNode}
                onDeleteSubtree={onDeleteSubtree}
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