import React, { memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Pencil,
    Trash,
    Network,
    DropletOff,
    X,
    Check,
    Palette // Import Palette icon
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
    const colorInputRef = useRef(null); // Add ref for color input

    if (!visible) return null;

    // Handler to trigger click on hidden color input
    const handleColorPickerClick = () => {
        colorInputRef.current?.click();
    };

    // Handler for when a color is selected from the picker
    const handleColorChange = (event) => {
        onUpdateColor(node, event.target.value);
        onClose();
    };

    return (
        <div
            className="fixed bg-white shadow-md rounded border mt-1"
            style={{
                top: y,
                left: x,
                minWidth: '150px',
                zIndex: 90
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
                    {node.data.completed ? <X className="text-destructive" size={20} /> : <Check className="text-green-600" size={20} />}
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
                        onDeleteSubtree(node);
                        onClose();
                    }}
                >
                    <Network size={16} />
                    <span>Delete Subtree</span>
                </li>
                {/* Modified color selection list item with evenly spaced elements */}
                <li className="p-2">
                    <div className="flex justify-between items-center mb-2"> {/* Changed space-x-1 to justify-between */}
                        {/* Removed orange (#fce5cd), kept red, yellow, green, blue */}
                        {['#ffcccc', '#fff2cc', '#d9ead3', '#d2e1f3'].map((color) => (
                            <div
                                key={color}
                                onClick={() => {
                                    onUpdateColor(node, color);
                                    onClose();
                                }}
                                className="w-6 h-6 rounded cursor-pointer border"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        {/* Color Picker Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-6 h-6 rounded cursor-pointer border flex items-center justify-center p-0" /* Added p-0 to remove padding */
                            onClick={handleColorPickerClick}
                            title="Choose color"
                        >
                            <Palette size={16} />
                        </Button>
                        {/* Hidden Color Input - Ensure self-closing */}
                        <input
                            type="color"
                            ref={colorInputRef}
                            onChange={handleColorChange}
                            style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
                        />
                    </div>
                    {/* Reset Color Button */}
                    <Button size="sm" className="w-full" variant="outline" onClick={() => {
                        onUpdateColor(node, '#FFFFFF');
                        onClose();
                    }}>
                        <DropletOff size={16} className="mr-1" />
                         Reset Color
                    </Button>
                </li>
            </ul>
        </div>
    );
});

TaskContextMenu.displayName = 'TaskContextMenu';
export default TaskContextMenu;