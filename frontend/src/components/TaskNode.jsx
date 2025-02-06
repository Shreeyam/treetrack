// src/components/TaskNode.jsx
import React from 'react';
import { Card } from 'react-bootstrap';

const TaskNode = ({ task, position, onDrag, onCtrlClick, isSelected }) => {
  const handleMouseDown = (e) => {
    // If ctrl is held, signal that this node was ctrl‑clicked (for dependency creation)
    if (e.ctrlKey) {
      onCtrlClick(task.id);
    } else {
      // Otherwise, start dragging
      onDrag(task.id, e.clientX, e.clientY);
    }
  };

  return (
    <Card 
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '150px',
        cursor: 'pointer',
        border: isSelected ? '2px solid blue' : '1px solid #ccc',
      }}
      onMouseDown={handleMouseDown}
    >
      <Card.Body>
        <Card.Title style={{ fontSize: '1rem' }}>{task.title}</Card.Title>
        <Card.Text style={{ fontSize: '0.8rem' }}>
          {task.description}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default TaskNode;
