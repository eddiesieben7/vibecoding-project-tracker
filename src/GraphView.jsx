import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-network/standalone';

const ZOOM_SUBCATS = 0.45;
const ZOOM_TASKS   = 0.72;

const STATUS_STYLE = {
  'todo':        { bg: '#4E9AF1', border: '#7DB8FF', glow: 'rgba(78,154,241,0.55)' },
  'in-progress': { bg: '#E8B84B', border: '#FFD966', glow: 'rgba(232,184,75,0.55)' },
  'review':      { bg: '#A87FE0', border: '#C4A8F0', glow: 'rgba(168,127,224,0.55)' },
  'done':        { bg: '#5BB870', border: '#88D494', glow: 'rgba(91,184,112,0.55)' },
};

export default function GraphView({ tasks, categories = [], onTaskClick }) {
  const containerRef = useRef(null);
  const [showDone, setShowDone] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const filtered = showDone ? tasks : tasks.filter(t => t.status !== 'done');

    const taskCatIds = new Set(filtered.flatMap(t => t.categories || []));
    const relevantIds = new Set(taskCatIds);
    taskCatIds.forEach(id => {
      const cat = categories.find(c => c.id === id);
      if (cat?.parentId) relevantIds.add(cat.parentId);
    });

    const getCat     = id => categories.find(c => c.id === id);
    const getCatName = id => getCat(id)?.name ?? id;
    const isSubcat   = id => !!getCat(id)?.parentId;

    const connCount = {};
    filtered.forEach(task =>
      (task.categories || []).forEach(id => { connCount[id] = (connCount[id] || 0) + 1; })
    );

    // ── Category nodes ─────────────────────────────────────────────
    const catNodes = [...relevantIds].map(id => {
      const parent = !isSubcat(id);
      const count  = connCount[id] || 0;
      return {
        id: `cat::${id}`,
        label: getCatName(id),
        shape: 'dot',
        size: parent ? Math.max(38, 38 + count * 2) : Math.max(13, 13 + count * 1.5),
        // Subcats start visible so physics can position them during initial stabilization
        hidden: false,
        color: {
          background: parent ? '#F1F291' : '#C8C852',
          border:     parent ? '#CCCB00' : '#A0A030',
          highlight:  { background: '#FFFF70', border: '#CCCB00' },
          hover:      { background: '#FAFA50', border: '#CCCB00' },
        },
        font: {
          size: parent ? 16 : 11,
          face: 'Syne, sans-serif',
          color: '#E8E8D0',
          bold: parent,
          strokeWidth: 4,
          strokeColor: '#13141a',
          vadjust: -2,
        },
        shadow: {
          enabled: true,
          color: parent ? 'rgba(241,242,145,0.65)' : 'rgba(200,200,80,0.4)',
          size:   parent ? 22 : 10,
          x: 0, y: 0,
        },
        mass: parent ? 3 : 1.5,
        borderWidth: 0,
      };
    });

    // ── Task nodes ─────────────────────────────────────────────────
    // Tasks start hidden so the initial graph shows only categories.
    // Positions are set before reveal (see updateVisibility).
    const taskNodes = filtered.map(task => {
      const sc = STATUS_STYLE[task.status] ?? STATUS_STYLE['todo'];
      const label = task.title.length > 18 ? task.title.slice(0, 18) + '...' : task.title;
      const catNames = (task.categories || []).map(id => getCatName(id)).join(', ');
      return {
        id: task.id,
        label,
        title: `${task.title}\n${task.assignee} · ${task.status}${catNames ? '\n' + catNames : ''}`,
        shape: task.type === 'bug' ? 'diamond' : 'dot',
        size: 9,
        hidden: true,
        color: {
          background: sc.bg,
          border:     sc.border,
          highlight:  { background: sc.border, border: sc.border },
          hover:      { background: sc.border, border: sc.border },
        },
        font: {
          size: 10,
          face: 'Inter, sans-serif',
          color: '#C8C8B8',
          strokeWidth: 3,
          strokeColor: '#13141a',
          vadjust: -2,
        },
        shadow: { enabled: true, color: sc.glow, size: 8, x: 0, y: 0 },
        mass: 1,
        borderWidth: 0,
      };
    });

    const nodes = new DataSet([...catNodes, ...taskNodes]);

    // ── Edges ──────────────────────────────────────────────────────
    const hierarchyEdges = [...relevantIds]
      .filter(id => isSubcat(id) && relevantIds.has(getCat(id).parentId))
      .map(id => ({
        id:   `h::${id}`,
        from: `cat::${id}`,
        to:   `cat::${getCat(id).parentId}`,
        color: { color: '#F1F29148', highlight: '#F1F291AA', hover: '#F1F29178' },
        width: 1.5,
        dashes: [5, 5],
        smooth: { type: 'continuous' },
      }));

    const taskEdges = filtered.flatMap(task =>
      (task.categories || []).map((catId, i) => ({
        id:   `t::${task.id}::${i}`,
        from: task.id,
        to:   `cat::${catId}`,
        color: { color: '#FFFFFF18', highlight: '#FFFFFF70', hover: '#FFFFFF45' },
        width: 1,
        smooth: { type: 'continuous' },
      }))
    );

    const edges = new DataSet([...hierarchyEdges, ...taskEdges]);

    // ── Physics ────────────────────────────────────────────────────
    const options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -120,
          centralGravity: 0.012,
          springLength: 120,
          springConstant: 0.035,
          damping: 0.38,
          avoidOverlap: 1.0,
        },
        // fit:false here — we call fit() manually once after stabilization
        stabilization: { iterations: 500, updateInterval: 10, fit: false },
        minVelocity: 0.4,
        maxVelocity: 60,
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        zoomView: true,
        dragView: true,
        keyboard: false,
        multiselect: false,
      },
      edges: {
        arrows: { to: { enabled: false } },
        hoverWidth: 2,
        selectionWidth: 2,
      },
      nodes: {
        borderWidth: 0,
        borderWidthSelected: 2,
      },
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);

    // ── Zoom-based reveal ──────────────────────────────────────────
    let visState      = { showTasks: false, showSubcats: true }; // initial: subcats visible
    let tasksRevealed = false;

    function updateVisibility(scale) {
      const showTasks   = scale >= ZOOM_TASKS;
      const showSubcats = scale >= ZOOM_SUBCATS;
      if (visState.showTasks === showTasks && visState.showSubcats === showSubcats) return;

      const updates = [];

      // On first task reveal: pre-position tasks near their connected category
      if (showTasks && !tasksRevealed) {
        tasksRevealed = true;
        filtered.forEach(task => {
          const firstCatId = (task.categories || [])[0];
          let placed = false;
          if (firstCatId) {
            try {
              const pos = network.getPosition(`cat::${firstCatId}`);
              if (pos) {
                const angle = Math.random() * 2 * Math.PI;
                const dist  = 55 + Math.random() * 55;
                updates.push({
                  id: task.id,
                  x: pos.x + Math.cos(angle) * dist,
                  y: pos.y + Math.sin(angle) * dist,
                  hidden: false,
                });
                placed = true;
              }
            } catch (_) { /* no position yet */ }
          }
          if (!placed) updates.push({ id: task.id, hidden: false });
        });
      } else {
        filtered.forEach(task => updates.push({ id: task.id, hidden: !showTasks }));
      }

      [...relevantIds].filter(isSubcat).forEach(id =>
        updates.push({ id: `cat::${id}`, hidden: !showSubcats })
      );

      visState = { showTasks, showSubcats };
      nodes.update(updates);
    }

    // Use afterDrawing for reliable scale detection on every render frame.
    // Only triggers when scale actually crosses a threshold (cheap check).
    let lastCheckedScale = -1;
    network.on('afterDrawing', () => {
      const scale = network.getScale();
      if (Math.abs(scale - lastCheckedScale) < 0.015) return;
      lastCheckedScale = scale;
      updateVisibility(scale);
    });

    // Fit once after initial stabilization, then freeze physics so the graph
    // stops drifting. Physics briefly resumes when the user drags a node.
    network.once('stabilized', () => {
      network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      setTimeout(() => network.setOptions({ physics: { enabled: false } }), 700);
    });

    let physicsTimer = null;
    network.on('dragStart', () => {
      clearTimeout(physicsTimer);
      network.setOptions({ physics: { enabled: true } });
    });
    network.on('dragEnd', () => {
      physicsTimer = setTimeout(
        () => network.setOptions({ physics: { enabled: false } }),
        1500
      );
    });

    // Click on a task node → open the task modal
    network.on('click', params => {
      if (params.nodes.length !== 1) return;
      const nodeId = params.nodes[0];
      if (String(nodeId).startsWith('cat::')) return;
      const task = filtered.find(t => t.id === nodeId);
      if (task && onTaskClick) onTaskClick(task);
    });

    return () => network.destroy();
  }, [tasks, showDone, categories]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-textmuted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!showDone}
            onChange={e => setShowDone(!e.target.checked)}
            className="accent-textprimary w-3.5 h-3.5"
          />
          Erledigte ausblenden
        </label>
        <span className="text-xs opacity-50" style={{ color: '#888' }}>
          Rauszoomen = Überkategorien &nbsp;·&nbsp; Reinzoomen = Unterkategorien + Aufgaben
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: '620px', background: '#13141a' }}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs px-1" style={{ color: '#777' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
            style={{ background: '#F1F291', boxShadow: '0 0 9px rgba(241,242,145,0.8)' }} />
          Überkategorie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ background: '#C8C852', boxShadow: '0 0 5px rgba(200,200,80,0.5)' }} />
          Unterkategorie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ background: '#4E9AF1', boxShadow: '0 0 6px rgba(78,154,241,0.6)' }} />
          To Do
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ background: '#E8B84B', boxShadow: '0 0 6px rgba(232,184,75,0.6)' }} />
          In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ background: '#A87FE0', boxShadow: '0 0 6px rgba(168,127,224,0.6)' }} />
          Review
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ background: '#5BB870', boxShadow: '0 0 6px rgba(91,184,112,0.6)' }} />
          Done
        </span>
        <span style={{ color: '#555' }}>&#9670; = Bug</span>
      </div>
    </div>
  );
}
