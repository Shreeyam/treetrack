import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Pencil,
    Trash,
    Network,
    DropletOff,
    X,
    Check
} from 'lucide-react';

const TaskContextMenu = memo(({
    visible,
    x,
    y,
    node,
    onToggleComplete,
    onEdit,
    onDelete,
    onDeleteSubtree,
    onUpdateColor,
    onClose
}) => {
    if (!visible) return null;

    return (
        <div
            className="absolute bg-white shadow-md rounded border mt-1"
            style={{
                top: y,
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
                        onToggleComplete(node);
                        onClose();
                    }}
                >
                    {node.data.completed ? <X className="text-destructive" size={24} /> : <Check className="text-green-600" size={16} />}
                    <span>{node.data.completed ? 'Mark Incomplete' : 'Mark Completed'}</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        onEdit(node);
                        onClose();
                    }}
                >
                    <Pencil size={16} />
                    <span>Edit</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 text-destructive"
                    onClick={() => {
                        onDelete(node);
                        onClose();
                    }}
                >
                    <Trash size={16} />
                    <span>Delete</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 text-destructive"
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete the subtree?")) {
                            onDeleteSubtree(node);
                        }
                        onClose();
                    }}
                >
                    <Network size={16} />
                    <span>Delete Subtree</span>
                </li>
                <li className="p-2">
                    <div className="flex space-x-1 mb-2">
                        {['#ffcccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d2e1f3'].map((color) => (
                            <div
                                key={color}
                                onClick={() => {
                                    onUpdateColor(node, color);
                                    onClose();
                                }}
                                className="w-full aspect-square rounded cursor-pointer border"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                    <Button size="sm" className="w-full" variant="outline" onClick={() => {
                        onUpdateColor(node, '');
                        onClose();
                    }}>
                        <DropletOff /> Reset Color
                    </Button>
                </li>
            </ul>
        </div>
    );
});

TaskContextMenu.displayName = 'TaskContextMenu';
export default TaskContextMenu;