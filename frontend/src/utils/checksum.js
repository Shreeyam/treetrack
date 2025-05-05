/**
 * Stable JSON stringify (order‑invariant).  No external dep needed.
 */
export const stableStringify = (obj) => {
  const allSeen = new WeakSet();
  const sorter = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object') {
      if (allSeen.has(value)) return;           // Drop circular ref
      allSeen.add(value);
      if (!Array.isArray(value)) {
        return Object.keys(value)
          .sort(sorter)
          .reduce((acc, k) => {
            acc[k] = value[k];
            return acc;
          }, {});
      }
    }
    return value;
  });
};

/**
 * Hash helper using built‑in Web Crypto (no new NPM deps).
 * Returns a hex string.
 */
export const sha256 = async (str) => {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Produce a *canonical* representation of project state that both
 * front‑end and back‑end can hash reliably.
 *
 * - Nodes are sorted by numeric id
 * - Edges are sorted by numeric id
 * - Only persisted fields are included
 */
export const canonicalizeProject = ({ nodes, edges }) => {
  const normNodes = [...nodes]
    .filter((n) => !n.draft)             // ignore unsaved AI drafts
    .map((n) => {
      // Extract the properties in a way that works with both frontend and backend formats
      // (Frontend has n.data.label, backend has n.title or n.data.label)
      const label = n.data?.label || n.title || '';
      const completed = n.data?.completed !== undefined ? !!n.data.completed : !!n.completed;
      const color = (n.data?.color || n.color || '');
      const x = n.position?.x || n.posX || 0;
      const y = n.position?.y || n.posY || 0;
      
      return {
        id: Number(n.id),
        title: label,
        completed,
        color,
        x,
        y,
      };
    })
    .sort((a, b) => a.id - b.id);

  const normEdges = [...edges]
    .filter((e) => !e.draft)
    .map((e) => ({
      id: Number(e.id),
      source: Number(e.source || e.from_task),
      target: Number(e.target || e.to_task),
    }))
    .sort((a, b) => a.id - b.id);

  return { nodes: normNodes, edges: normEdges };
};

/**
 * Given raw nodes/edges → async hex hash
 */
export const projectHash = async ({ nodes, edges }) =>
  sha256(stableStringify(canonicalizeProject({ nodes, edges })));

/**
 * Deep diff helper – returns an object describing deltas.
 * Only asymmetric (local ≠ remote) entries are kept.
 */
export const diffStates = (local, remote) => {
  const out = { nodes: [], edges: [] };

  const lNodes = new Map(local.nodes.map((n) => [n.id, n]));
  const rNodes = new Map(remote.nodes.map((n) => [n.id, n]));

  // Added / changed / removed nodes
  lNodes.forEach((n, id) => {
    if (!rNodes.has(id)) {
      out.nodes.push({ id, type: 'missing_on_server', n });
    } else if (JSON.stringify(n) !== JSON.stringify(rNodes.get(id))) {
      out.nodes.push({ id, type: 'delta', local: n, remote: rNodes.get(id) });
    }
  });
  rNodes.forEach((n, id) => {
    if (!lNodes.has(id)) {
      out.nodes.push({ id, type: 'missing_locally', n });
    }
  });

  // Same for edges
  const lEdges = new Map(local.edges.map((e) => [e.id, e]));
  const rEdges = new Map(remote.edges.map((e) => [e.id, e]));

  lEdges.forEach((e, id) => {
    if (!rEdges.has(id)) {
      out.edges.push({ id, type: 'missing_on_server', e });
    } else if (JSON.stringify(e) !== JSON.stringify(rEdges.get(id))) {
      out.edges.push({ id, type: 'delta', local: e, remote: rEdges.get(id) });
    }
  });
  rEdges.forEach((e, id) => {
    if (!lEdges.has(id)) {
      out.edges.push({ id, type: 'missing_locally', e });
    }
  });

  return out;
};