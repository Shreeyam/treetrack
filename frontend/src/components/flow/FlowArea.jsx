import React, { memo, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    applyNodeChanges,
    addEdge
} from '@xyflow/react';
import TaskContextMenu from '../task/TaskContextMenu';
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
    onInit
}) => {
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
                onPaneClick={onPaneClick}
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
        </div>
    );
});

FlowArea.displayName = 'FlowArea';
export default FlowArea;