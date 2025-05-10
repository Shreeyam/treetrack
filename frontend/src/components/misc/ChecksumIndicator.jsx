import React, { useEffect, useState, useCallback, useContext } from 'react';
import { projectHash, canonicalizeProject, diffStates } from '../../utils/checksum';
import { HocuspocusProvider } from "@hocuspocus/provider";

const COLORS = {
  unknown: '#A0A0A0',   // grey
  inSync:  '#28a745',   // green
  mismatch:'#dc3545',   // red
};

export default function ChecksumIndicator({ nodes, edges, currentProject, yjsHandler }) {
  const [status, setStatus] = useState('unknown'); // 'unknown' | 'inSync' | 'mismatch'
  const [localHash, setLocalHash] = useState(null);

  // Re‑compute local hash whenever nodes/edges change (debounced 300 ms)
  useEffect(() => {
    if (!nodes || !edges) return;
    
    const id = setTimeout(async () => {
      setLocalHash(await projectHash({ nodes, edges }));
      setStatus('unknown');          // hash changed, need fresh comparison
    }, 300);
    return () => clearTimeout(id);
  }, [nodes, edges]);
  const verify = useCallback(async () => {
    if (!currentProject || !yjsHandler) return;
    setStatus('unknown');            // flash grey while checking
    try {
      // --- 1. Get the raw YJS data directly from the shared document
      // This gives us the "true" server state as it is in the YJS document
      console.log("Starting checksum verification...");
      const rawTasks = yjsHandler.tasks;
      const rawDependencies = yjsHandler.dependencies;
      
      // --- 2. Convert YJS data to the format expected by our checksum functions
      const tasks = [];
      const dependencies = [];
        // Process tasks from YJS Map
      rawTasks.forEach((taskMap, taskId) => {
        tasks.push({
          id: taskId,
          // Match React Flow's data structure expectations
          data: { 
            label: taskMap.get('title'),
            completed: taskMap.get('completed'),
            color: taskMap.get('color')
          },
          position: { 
            x: taskMap.get('posX'), 
            y: taskMap.get('posY') 
          }
        });
      });
      
      // Process dependencies from YJS Map
      rawDependencies.forEach((depMap, depId) => {
        dependencies.push({
          id: depId,
          // Match React Flow's edge structure
          source: depMap.get('from_task'),
          target: depMap.get('to_task'),
        });
      });
        // --- 3. Hash both states using our improved canonicalizeProject function
      // Local hash is already computed in useEffect
      const remoteHash = await projectHash({ nodes: tasks, edges: dependencies });
        console.log('Raw local nodes:', nodes);
      console.log('Raw YJS nodes:', tasks);
      
      // Check for duplicate nodes in local state before comparison
      const localNodeIds = new Map();
      let hasDuplicates = false;
      
      nodes.forEach(node => {
        if (localNodeIds.has(node.id)) {
          console.error(`DUPLICATE NODE DETECTED: ID ${node.id} appears multiple times in local state!`);
          hasDuplicates = true;
        }
        localNodeIds.set(node.id, (localNodeIds.get(node.id) || 0) + 1);
      });
      
      // Log duplicate detection results
      if (hasDuplicates) {
        console.warn('Node ID counts:', Object.fromEntries([...localNodeIds.entries()].filter(([_, count]) => count > 1)));
      } else {
        console.log('No duplicate nodes detected in local state');
      }
      
      if (remoteHash === localHash) {
        setStatus('inSync');
      } else {
        setStatus('mismatch');
        // --- 4. Generate & dump diff using canonicalized versions
        const localNorm = canonicalizeProject({ nodes, edges });
        const remoteNorm = canonicalizeProject({ nodes: tasks, edges: dependencies });
        const delta = diffStates(localNorm, remoteNorm);
          /* eslint-disable no-console */
        console.group(
          `%c[Checksum] State mismatch (local ≠ YJS document)`,
          'color:#dc3545;font-weight:bold;'
        );
        console.log('localHash :', localHash);
        console.log('remoteHash:', remoteHash);
        console.log('Local nodes count:', nodes.length);
        console.log('YJS nodes count:', tasks.length);
        console.log('Local edges count:', edges.length);
        console.log('YJS edges count:', dependencies.length);
        console.dir(delta);
        console.groupEnd();
        /* eslint-enable  no-console */
      }
    } catch (err) {
      console.error('[Checksum] verification failed', err);
      setStatus('mismatch');
    }
  }, [currentProject, yjsHandler, nodes, edges, localHash]);

  // Optional: Enable auto-refresh
  // useEffect(() => {
  //   const id = setInterval(verify, 60000); // 60 s
  //   return () => clearInterval(id);
  // }, [verify]);
  return (
    <button
      onClick={verify}
      title="Validate project state with YJS document"
      style={{
        position: 'fixed',
        bottom: '20px',
        left:  '52px',
        width:  '14px',
        height: '14px',
        borderRadius: '50%',
        border: '1px solid #666',
        background: COLORS[status],
        cursor: 'pointer',
        zIndex: 1000,
      }}
    />
  );
}