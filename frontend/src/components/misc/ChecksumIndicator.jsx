import React, { useEffect, useState, useCallback } from 'react';
import { projectHash, canonicalizeProject, diffStates } from '../../utils/checksum';
import { fetchProjectState } from '../../api';

const COLORS = {
  unknown: '#A0A0A0',   // grey
  inSync:  '#28a745',   // green
  mismatch:'#dc3545',   // red
};

export default function ChecksumIndicator({ nodes, edges, currentProject }) {
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
    if (!currentProject) return;
    setStatus('unknown');            // flash grey while checking
    try {
      // --- 1. Fetch server state
      const { tasks, dependencies } = await fetchProjectState(currentProject);
      
      // --- 2. Hash both states using our improved canonicalizeProject function
      // Local hash is already computed in useEffect
      const remoteHash = await projectHash({ nodes: tasks, edges: dependencies });
      
      if (remoteHash === localHash) {
        setStatus('inSync');
      } else {
        setStatus('mismatch');
        // --- 3. Generate & dump diff using canonicalized versions
        const localNorm = canonicalizeProject({ nodes, edges });
        const remoteNorm = canonicalizeProject({ nodes: tasks, edges: dependencies });
        const delta = diffStates(localNorm, remoteNorm);
        
        /* eslint-disable no-console */
        console.groupCollapsed(
          `%c[Checksum] State mismatch (local ≠ server)`,
          'color:#dc3545;font-weight:bold;'
        );
        console.log('localHash :', localHash);
        console.log('remoteHash:', remoteHash);
        console.dir(delta);
        console.groupEnd();
        /* eslint-enable  no-console */
      }
    } catch (err) {
      console.error('[Checksum] verification failed', err);
      setStatus('mismatch');
    }
  }, [currentProject, nodes, edges, localHash]);

  // Optional: Enable auto-refresh
  // useEffect(() => {
  //   const id = setInterval(verify, 60000); // 60 s
  //   return () => clearInterval(id);
  // }, [verify]);

  return (
    <button
      onClick={verify}
      title="Validate project state with server"
      style={{
        position: 'fixed',
        bottom: '12px',
        left:  '12px',
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