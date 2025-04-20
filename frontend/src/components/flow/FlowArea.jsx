import React, { memo, useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    applyNodeChanges,
    addEdge,
    useReactFlow
} from '@xyflow/react';
import TaskContextMenu from '../task/TaskContextMenu';
import CanvasContextMenu from './CanvasContextMenu';
import { nodeStyles } from './styles';

const FlowArea = memo(({
    nodes,
    edges,
    onNodesChange,
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
    onInit,
    onAddNode,
    onAutoArrange
}) => {
    const [canvasMenu, setCanvasMenu] = React.useState({ visible: false, x: 0, y: 0 });
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const handlePaneContextMenu = useCallback((event) => {
        event.preventDefault();
        const bounds = event.target.getBoundingClientRect();
        setCanvasMenu({ 
            visible: true, 
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
        });
    }, []);

    const handleCloseCanvasMenu = useCallback(() => {
        setCanvasMenu({ visible: false, x: 0, y: 0 });
    }, []);

    const handleAddNode = useCallback(() => {
        onAddNode({ x: canvasMenu.x, y: canvasMenu.y });
        handleCloseCanvasMenu();
    }, [canvasMenu, onAddNode]);

    const handlePaneClick = useCallback((event) => {
        onPaneClick(event);
        handleCloseCanvasMenu();
    }, [onPaneClick]);

    return (
        <div className="flex-grow relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onNodeDragStop={onNodeDragStop}
                onSelectionChange={onSelectionChange}
                onPaneClick={handlePaneClick}
                onContextMenu={handlePaneContextMenu}
                onInit={onInit}
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
        </div>
    );
});

FlowArea.displayName = 'FlowArea';
export default FlowArea;