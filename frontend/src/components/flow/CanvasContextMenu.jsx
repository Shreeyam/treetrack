import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
    ZoomIn,
    ZoomOut,
    Maximize,
    Plus,
    LayoutGrid
} from 'lucide-react';

const CanvasContextMenu = memo(({
    visible,
    x,
    y,
    onAddNode,
    onZoomIn,
    onZoomOut,
    onFitView,
    onAutoArrange,
    onClose
}) => {
    if (!visible) return null;

    return (
        <div
            className="fixed bg-white shadow-md rounded border mt-1"
            style={{
                top: y+50,
                left: x,
                minWidth: '150px',
                zIndex: 1000
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <ul className="divide-y">
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onAddNode();
                        onClose();
                    }}
                >
                    <Plus size={16} />
                    <span>Add New Task</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onZoomIn();
                        onClose();
                    }}
                >
                    <ZoomIn size={16} />
                    <span>Zoom In</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onZoomOut();
                        onClose();
                    }}
                >
                    <ZoomOut size={16} />
                    <span>Zoom Out</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onFitView();
                        onClose();
                    }}
                >
                    <Maximize size={16} />
                    <span>Fit View</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onAutoArrange();
                        onClose();
                    }}
                >
                    <LayoutGrid size={16} />
                    <span>Auto Arrange</span>
                </li>
            </ul>
        </div>
    );
});

CanvasContextMenu.displayName = 'CanvasContextMenu';
export default CanvasContextMenu;