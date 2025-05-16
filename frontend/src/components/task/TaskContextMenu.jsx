import React, { memo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Pencil,
    Trash,
    Network,
    DropletOff,
    X,
    Check,
    Palette, // Import Palette icon
    Layers // Import Layers icon for multi-selection indicator
} from 'lucide-react';

const TaskContextMenu = memo(({
    visible,
    x,
    y,
    node,
    selectedNodes, // Add selectedNodes prop
    onToggleComplete,
    onEdit,
    onDelete,
    onDeleteSubtree,
    onDeleteSubtrees, // Add onDeleteSubtrees prop
    onUpdateColor,
    onSetCompleted,
    onClose
}) => {
    const colorInputRef = useRef(null); // Add ref for color input
    
    // Calculate number of selected nodes (including clicked node)
    const selectedNodesCount = selectedNodes?.length || 0;
    const isMultiSelection = selectedNodesCount > 1;

    if (!visible) return null;

    // Determine completion toggle behavior: use single node state if available, otherwise decide based on multi-selection
    const anyIncomplete = selectedNodes?.some(n => n.data?.completed !== true);
    const allComplete   = selectedNodes?.every(n => n.data?.completed === true);
    const completedSingle = node?.data?.completed;
    const useSingle = typeof completedSingle === 'boolean';
    const toggleLabel = useSingle
        ? (completedSingle ? 'Mark Incomplete' : 'Mark Complete')
        : (anyIncomplete ? 'Mark Complete' : 'Mark Incomplete');
    const ToggleIcon = useSingle
        ? (completedSingle ? <X className="text-destructive" size={16} /> : <Check className="text-green-600" size={16} />)
        : (anyIncomplete ? <Check className="text-green-600" size={16} /> : <X className="text-destructive" size={16} />);

    // Handler to trigger click on hidden color input
    const handleColorPickerClick = () => {
        colorInputRef.current?.click();
    };

    // Handler for when a color is selected from the picker
    const handleColorChange = (event) => {
        const newColor = event.target.value;
        if (isMultiSelection) {
            // Only update if color is different
            selectedNodes.forEach(n => {
                if (n.data?.color !== newColor) {
                    onUpdateColor(n, newColor);
                }
            });
        } else {
            if (node.data?.color !== newColor) {
                onUpdateColor(node, newColor);
            }
        }
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
                {isMultiSelection && (
                    <li className="px-3 py-0.5 text-sm font-medium italic flex items-center justify-center text-gray-400">
                        <span>{selectedNodesCount} tasks selected</span>
                    </li>
                )}
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => {
                        const targetCompleted = useSingle
                            ? !completedSingle
                            : anyIncomplete;
                        if (isMultiSelection) {
                            onSetCompleted(selectedNodes, targetCompleted);
                        } else {
                            onToggleComplete(node);
                        }
                        onClose();
                    }}
                >
                    {ToggleIcon}
                    <span>{toggleLabel}</span>
                </li>
                {!isMultiSelection && (
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
                )}
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 text-destructive"
                    onClick={() => {
                        if (isMultiSelection) {
                            // Apply to all selected nodes
                            selectedNodes.forEach(n => {
                                onDelete(n);
                            });
                        } else {
                            // Single node case
                            onDelete(node);
                        }
                        onClose();
                    }}
                >
                    <Trash size={16} />
                    <span>Delete{isMultiSelection ? ' Selected' : ''}</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 text-destructive"
                    onClick={() => {
                        if (isMultiSelection) {
                            // Delete subtrees for all selected nodes
                            onDeleteSubtrees(selectedNodes);
                        } else {
                            // Single node case
                            onDeleteSubtree(node);
                        }
                        onClose();
                    }}
                >
                    <Network size={16} />
                    <span>Delete Subtree{isMultiSelection ? 's' : ''}</span>
                </li>
                {/* Modified color selection list item with evenly spaced elements */}
                <li className="p-2">
                    <div className="flex justify-between items-center mb-2"> {/* Changed space-x-1 to justify-between */}
                        {/* Removed orange (#fce5cd), kept red, yellow, green, blue */}
                        {['#ffcccc', '#fff2cc', '#d9ead3', '#d2e1f3'].map((color) => (
                            <div
                                key={color}
                                onClick={() => {
                                    if (isMultiSelection) {
                                        // Only update if color is different
                                        selectedNodes.forEach(n => {
                                            if (n.data?.color !== color) {
                                                onUpdateColor(n, color);
                                            }
                                        });
                                    } else {
                                        if (node.data?.color !== color) {
                                            onUpdateColor(node, color);
                                        }
                                    }
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
                        if (isMultiSelection) {
                            // Only update if color is different
                            selectedNodes.forEach(n => {
                                if (n.data?.color !== '#FFFFFF') {
                                    onUpdateColor(n, '#FFFFFF');
                                }
                            });
                        } else {
                            if (node.data?.color !== '#FFFFFF') {
                                onUpdateColor(node, '#FFFFFF');
                            }
                        }
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