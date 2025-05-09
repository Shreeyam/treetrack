// migrationUtils.js - Helpers for migrating from SQL to Yjs

import { fetchTasksAndEdges } from '../api';

/**
 * Migrates data from SQL to Yjs document
 * 
 * @param {string} projectId - The project ID to migrate
 * @param {object} hocusProvider - The initialized hocus provider with Yjs data structures
 * @returns {Promise<boolean>} - True if migration was completed
 */
export const migrateToYjs = async (projectId, hocusProvider) => {
  try {
    // Check if the Yjs document already has data
    if (hocusProvider.tasks.size > 0) {
      console.log('Yjs document already has data, skipping migration');
      return true;
    }

    console.log(`Migrating project ${projectId} data from SQL to Yjs...`);
    
    // Fetch existing data from SQL via the API
    const { tasks, dependencies } = await fetchTasksAndEdges(projectId);
    
    // Map to track SQL IDs to new UUIDs
    const idMapping = {};
    
    // Migrate tasks
    for (const task of tasks) {
      // Create a new task with a UUID and add it to the Yjs document
      const newTaskId = hocusProvider.addTask({
        title: task.title,
        posX: task.posX,
        posY: task.posY,
        completed: task.completed === 1,
        color: task.color || '#ffffff',
        locked: task.locked === 1
      });
      
      // Store the ID mapping for dependencies
      idMapping[task.id.toString()] = newTaskId;
    }
    
    // Migrate dependencies after all tasks are created
    for (const dep of dependencies) {
      const fromTaskId = idMapping[dep.from_task.toString()];
      const toTaskId = idMapping[dep.to_task.toString()];
      
      // Skip if either task doesn't exist anymore
      if (!fromTaskId || !toTaskId) continue;
      
      // Create the dependency in Yjs
      hocusProvider.addDependency(fromTaskId, toTaskId);
    }
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

/**
 * Checks if migration is needed by comparing SQL and Yjs data
 * 
 * @param {string} projectId - The project ID to check
 * @param {object} hocusProvider - The hocus provider with Yjs data
 * @returns {Promise<boolean>} - True if migration is needed
 */
export const isMigrationNeeded = async (projectId, hocusProvider) => {
  // If there's already data in Yjs, no migration needed
  if (hocusProvider.tasks.size > 0) {
    return false;
  }
  
  try {
    // Check if there's data in SQL
    const { tasks } = await fetchTasksAndEdges(projectId);
    return tasks.length > 0;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};