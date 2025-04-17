// src/utils/nodeFunctions.js

import { v4 as uuidv4 } from 'uuid'

// Helper to optimistically add a new node, then patch its ID when the server responds
export function createAddNewNode({
  newTaskTitle,
  currentProject,
  reactFlowInstance,
  reactFlowWrapper,
  lastNodePosition,
  cascadeCount,
  cascadeStartPoint,
  createNodeStyle,
  setCascadeCount,
  setCascadeStartPoint,
  setLastNodePosition,
  setNewTaskTitle,
  setNodes
}) {
  // Constants for cascading logic
  const CASCADE_OFFSET = 50
  const VIEWPORT_START_OFFSET = { x: 50, y: 50 }
  const NODE_WIDTH = 150
  const NODE_HEIGHT = 50

  return () => {
    if (!newTaskTitle.trim() || !reactFlowInstance || !reactFlowWrapper.current) {
      return
    }

    // --- compute newPosition just like before ---
    const viewport = reactFlowInstance.getViewport()
    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    let newPosition

    const flowStartX = (VIEWPORT_START_OFFSET.x - viewport.x) / viewport.zoom
    const flowStartY = (VIEWPORT_START_OFFSET.y - viewport.y) / viewport.zoom
    const initialCascadePoint = { x: flowStartX, y: flowStartY }

    let isLastPosVisible = false
    if (lastNodePosition) {
      const screenX = lastNodePosition.x * viewport.zoom + viewport.x
      const screenY = lastNodePosition.y * viewport.zoom + viewport.y
      if (
        screenX + NODE_WIDTH > 0 &&
        screenX < bounds.width &&
        screenY + NODE_HEIGHT > 0 &&
        screenY < bounds.height
      ) {
        isLastPosVisible = true
      }
    }

    if (lastNodePosition && isLastPosVisible) {
      const candidatePos = {
        x: lastNodePosition.x + CASCADE_OFFSET,
        y: lastNodePosition.y + CASCADE_OFFSET
      }
      const candScreenX = candidatePos.x * viewport.zoom + viewport.x
      const candScreenY = candidatePos.y * viewport.zoom + viewport.y
      const isCandidateVisible =
        candScreenX + NODE_WIDTH > 0 &&
        candScreenX < bounds.width &&
        candScreenY + NODE_HEIGHT > 0 &&
        candScreenY < bounds.height

      if (isCandidateVisible) {
        newPosition = candidatePos
        setCascadeCount(prev => prev + 1)
      } else {
        const startPoint = cascadeStartPoint || initialCascadePoint
        newPosition = {
          x: startPoint.x,
          y: startPoint.y + CASCADE_OFFSET
        }
        setCascadeStartPoint(newPosition)
        setCascadeCount(1)
      }
    } else {
      newPosition = initialCascadePoint
      setCascadeStartPoint(initialCascadePoint)
      setCascadeCount(1)
    }

    // --- optimistic insertion ---
    const tempId = `temp-${uuidv4()}`
    const optimisticNode = {
      id: tempId,
      data: { label: newTaskTitle, completed: false, color: '' },
      position: newPosition,
      style: createNodeStyle('#ffffff', false),
      sourcePosition: 'right',
      targetPosition: 'left'
    }

    setNodes(nodes => [...nodes, optimisticNode])
    setNewTaskTitle('')
    setLastNodePosition(newPosition)

    // --- send to server ---
    const newTask = {
      title: newTaskTitle,
      posX: newPosition.x,
      posY: newPosition.y,
      completed: 0,
      project_id: parseInt(currentProject, 10),
      color: ''
    }

    fetch('/api/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
      .then(res => res.json())
      .then(json => {
        // replace tempId with real id
        setNodes(nodes =>
          nodes.map(n =>
            n.id === tempId
              ? { ...n, id: json.id.toString() }
              : n
          )
        )
      })
      .catch(err => {
        console.error('Failed to create task:', err)
        // roll back optimistic node
        setNodes(nodes => nodes.filter(n => n.id !== tempId))
        // optionally: notify the user of the failure
      })
  }
}

// Utility to only return a new array if something actually changed
export function mapWithChangeDetection(prevArray, mapper) {
  let mutated = false
  const next = prevArray.map(item => {
    const updated = mapper(item)
    if (updated !== item) mutated = true
    return updated
  })
  return mutated ? next : prevArray
}
