import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { v4 as uuidv4 } from 'uuid';

// Function to create and initialize a Hocuspocus provider
export const initializeHocusProvider = (projectId, user) => {
  console.log(`Initializing Hocuspocus provider for project: ${projectId}`);

  // Determine the WebSocket URL based on the current domain
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;

    // If we're in development mode (localhost), use the specific port
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}:3001/collaboration/${projectId}`;
    }

    // For production, use the same host with WebSocket protocol
    return `${protocol}//${host}/collaboration/${projectId}`;
  };
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: getWebSocketUrl(),
    name: `projectdocument.${projectId}`,
    onMessage: ({ event, message }) => {
      // Handle incoming messages from the server
    },
  });

  // --- Awareness helpers --------------------------------------------------
  const awareness = provider.awareness;

  /** Batch update multiple node drag positions in a single awareness update */
  const setBatchDragState = (dragNodes) => {
    if (!dragNodes || dragNodes.length === 0) {
      // Clear drag state when no nodes are provided
      awareness.setLocalStateField("batchDrag", null);
      return;
    }

    const dragStates = dragNodes.map(node => ({
      nodeId: node.id,
      posX: node.position.x,
      posY: node.position.y
    }));

    awareness.setLocalStateField("batchDrag", dragStates);
  };

  // Define our Yjs data structures
  const tasks = provider.document.getMap("tasks");
  const dependencies = provider.document.getMap("dependencies");
  const undoManager = new Y.UndoManager(
    [tasks, dependencies],                       // the shared types
    {
      trackedOrigins: new Set([LOCAL_ORIGIN]),   // 👈 per-user history
      captureTimeout: 500                       // (optional) group keystrokes
    }
  );


  // Helper functions for working with the Yjs data

  // Tasks
  const addTask = (taskData) => {
    const taskId = taskData.id || uuidv4();

    // wrap creation and insertion in one Yjs transaction
    provider.document.transact(() => {
      const taskMap = new Y.Map();

      // Set task properties
      taskMap.set('title', taskData.title);
      taskMap.set('posX', taskData.posX || 0);
      taskMap.set('posY', taskData.posY || 0);
      taskMap.set('completed', taskData.completed || false);
      taskMap.set('color', taskData.color || '#ffffff');
      taskMap.set('locked', taskData.locked || false);
      taskMap.set('draft', !!taskData.draft);

      // Add task to tasks map
      tasks.set(taskId, taskMap);
    }, LOCAL_ORIGIN);

    return taskId;
  };

  // Update multiple tasks in one transaction for better performance
  const updateMultipleTasks = (taskUpdates) => {
    provider.document.transact(() => {
      taskUpdates.forEach(({ id, data }) => {
        const taskMap = tasks.get(id);
        if (taskMap) {
          // Update only the provided properties
          Object.entries(data).forEach(([key, value]) => {
            taskMap.set(key, value);
          });
        }
      });
    }, LOCAL_ORIGIN);

    return true;
  };

  const updateTask = (taskId, taskData) => {
    const taskMap = tasks.get(taskId);
    if (!taskMap) return false;

    provider.document.transact(() => {
      // Update only the provided properties
      Object.entries(taskData).forEach(([key, value]) => {
        taskMap.set(key, value);
      });
    }, LOCAL_ORIGIN);

    return true;
  };

  const deleteTask = (taskId) => {
    provider.document.transact(() => {
      // Remove task from the tasks map
      tasks.delete(taskId);

      // Clean up any dependencies involving this task
      const depsToDelete = [];
      dependencies.forEach((depMap, depId) => {
        if (depMap.get('from_task') === taskId || depMap.get('to_task') === taskId) {
          depsToDelete.push(depId);
        }
      });

      // Delete found dependencies
      depsToDelete.forEach(depId => {
        dependencies.delete(depId);
      });
    }, LOCAL_ORIGIN);

    return true;
  };

  // Dependencies
  const addDependency = (fromTaskId, toTaskId) => {
    const depId = uuidv4();
    provider.document.transact(() => {
      const depMap = new Y.Map();
      depMap.set('from_task', fromTaskId);
      depMap.set('to_task', toTaskId);
      dependencies.set(depId, depMap);
    }, LOCAL_ORIGIN);

    return depId;
  };

  const deleteDependency = (depId) => {
    provider.document.transact(() => {
      dependencies.delete(depId);
    }, LOCAL_ORIGIN);

    return true;
  };


  // Convert tasks and dependencies to React Flow format
  const getReactFlowData = () => {
    const flowNodes = [];
    const flowEdges = [];

    // Create nodes from tasks
    tasks.forEach((taskMap, taskId) => {
      flowNodes.push({
        id: taskId,
        draft: taskMap.get('draft') || false,
        data: {
          label: taskMap.get('title'),
          completed: taskMap.get('completed'),
          color: taskMap.get('color')
        },
        position: {
          x: taskMap.get('posX'),
          y: taskMap.get('posY')
        },
        sourcePosition: 'right',
        targetPosition: 'left'
        // Style will be handled by the application
      });
    });

    // Create edges from dependencies
    dependencies.forEach((depMap, depId) => {
      flowEdges.push({
        id: depId,
        source: depMap.get('from_task'),
        target: depMap.get('to_task'),
        markerEnd: { type: 'arrowclosed' }
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  };

  // Return provider and helper functions
  return {
    provider,
    awareness,
    undoManager,
    setBatchDragState,
    tasks,
    dependencies,
    addTask,
    updateTask,
    updateMultipleTasks,
    deleteTask,
    addDependency,
    deleteDependency,
    getReactFlowData
  };
};

export const LOCAL_ORIGIN = Symbol('local-user'); // Used to identify local changes in the undo manager
