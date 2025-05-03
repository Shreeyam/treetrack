import React from 'react';
import { Trash } from 'lucide-react'; // Import the Trash icon

const ArrowContextMenu = ({ visible, x, y, edge, onDelete, onClose }) => {
    if (!visible || !edge) return null;

    const handleDelete = () => {
        onDelete(edge);
        onClose();
    };

    return (
        <div
            className="fixed bg-white shadow-md rounded border mt-1"
            style={{
                position: 'absolute',
                top: y,
                left: x,
                minWidth: '150px',
                zIndex: 1000,
            }}
        >
            <ul className="divide-y">
                <li
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 text-destructive"
                    onClick={handleDelete}
                >
                    <Trash size={16} />
                    <span>Delete</span>
                </li>
            </ul>
        </div>
    );
};

export default ArrowContextMenu;
