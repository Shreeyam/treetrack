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
                        onDeleteSubtree(node);
                        onClose();
                    }}
                >
                    <Network size={16} />
                    <span>Delete Subtree</span>
                </li>
                {/* Modified color selection list item */}
                <li className="p-2">
                    <div className="flex space-x-1 mb-2 items-center"> {/* Added items-center for vertical alignment */}
                        {/* Removed orange (#fce5cd), kept red, yellow, green, blue */}
                        {['#ffcccc', '#fff2cc', '#d9ead3', '#d2e1f3'].map((color) => (
                            <div
                                key={color}
                                onClick={() => {
                                    onUpdateColor(node, color);
                                    onClose();
                                }}
                                // Removed w-full, added fixed size w-6 h-6
                                className="w-6 h-6 rounded cursor-pointer border"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        {/* Color Picker Button */}
                        <Button
                            variant="outline"
                            size="icon" // Use icon size for square button
                            // Removed w-full, added fixed size w-6 h-6 to match color squares
                            className="w-6 h-6 rounded cursor-pointer border flex items-center justify-center"
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
                            style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} // Keep it hidden
                        />
                    </div>
                    {/* Reset Color Button */}
                    <Button size="sm" className="w-full" variant="outline" onClick={() => {
                        onUpdateColor(node, '#FFFFFF'); // Assuming #FFFFFF is the reset/default color
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