// src/components/Graph.jsx
import React, { useState, useEffect, useRef } from 'react';
import TaskNode from './TaskNode';
import { createDependency } from '../api';

const Graph = ({ tasks, dependencies }) => {
  // Positions for each task (id → {x,y})
  const [positions, setPositions] = useState({});
  // For creating a dependency: first ctrl‑clicked node’s id
  const [selectedNode, setSelectedNode] = useState(null);
  // Which node is currently being dragged
  const [dragging, setDragging] = useState(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Initialize positions (if not yet set) when tasks change.
  useEffect(() => {
    const newPositions = { ...positions };
    tasks.forEach(task => {
      if (!newPositions[task.id]) {
        // Place new nodes at a random spot
        newPositions[task.id] = { x: Math.random() * 400, y: Math.random() * 400 };
      }
    });
    setPositions(newPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Start dragging a node
  const handleMouseDown = (id, clientX, clientY) => {
    setDragging(id);
    const pos = positions[id];
    offsetRef.current = {
      x: clientX - pos.x,
      y: clientY - pos.y,
    };
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e) => {
    if (dragging !== null) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - offsetRef.current.x;
      const newY = e.clientY - containerRect.top - offsetRef.current.y;
      setPositions(prev => ({
        ...prev,
        [dragging]: { x: newX, y: newY }
      }));
    }
  };

  // Handle ctrl‑click events: first click selects a node; second creates a dependency.
  const handleCtrlClick = (id) => {
    if (selectedNode === null) {
      setSelectedNode(id);
    } else if (selectedNode === id) {
      // Deselect if the same node is clicked twice
      setSelectedNode(null);
    } else {
      // Create a dependency: make the first selected node depend on the second.
      // (i.e. task (selectedNode) depends on task (id))
      createDependency(selectedNode, id)
        .then(response => {
          console.log("Dependency created:", response);
          // In a complete app you would trigger a refresh of the dependencies here.
        })
        .catch(err => console.error(err));
      setSelectedNode(null);
    }
  };

  // Attach global mousemove/mouseup handlers for dragging
  useEffect(() => {
    const handleWindowMouseUp = () => handleMouseUp();
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  });

  // Render SVG lines for all dependency connections
  const renderConnections = () => {
    return dependencies.map((dep, index) => {
      // dep has { child, parent }
      const childPos = positions[dep.child];
      const parentPos = positions[dep.parent];
      if (!childPos || !parentPos) return null;
      // Compute “center” positions of cards (assuming a 150px width and about 50px height for the header)
      const parentCenter = { x: parentPos.x + 75, y: parentPos.y + 25 };
      const childCenter  = { x: childPos.x + 75, y: childPos.y + 25 };
      return (
        <line 
          key={index}
          x1={parentCenter.x} 
          y1={parentCenter.y} 
          x2={childCenter.x} 
          y2={childCenter.y} 
          stroke="black" 
          strokeWidth="2" 
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '600px', border: '1px solid #ccc' }}
    >
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
        </defs>
        {renderConnections()}
      </svg>
      {tasks.map(task => (
        <TaskNode 
          key={task.id} 
          task={task} 
          position={positions[task.id] || {x: 0, y: 0}} 
          onDrag={handleMouseDown} 
          onCtrlClick={handleCtrlClick}
          isSelected={selectedNode === task.id}
        />
      ))}
    </div>
  );
};

export default Graph;
