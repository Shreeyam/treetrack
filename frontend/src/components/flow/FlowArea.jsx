import React, { memo, useCallback, useRef, useState } from 'react';
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
                onNodeDragStop={onNodeDragStop}
                onSelectionChange={onSelectionChange}
                elementsSelectable={true}
                selectionOnDrag={true}
                selectNodesOnDrag={true}
                multiSelectionKeyCode="Shift"
                onPaneClick={handlePaneClick}
                onPaneContextMenu={handlePaneContextMenu}
                onInit={handleInit}
                snapToGrid={snapToGridOn}
                snapGrid={[10, 10]}
                fitView
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