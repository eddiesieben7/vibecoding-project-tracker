import React, { useRef, useEffect, useState, useCallback } from 'react';

// Color definitions based on due date/status
const COLOR_OVERDUE = '#DC2626';   // Red
const COLOR_SOON = '#F97316';      // Orange
const COLOR_ACTIVE = '#3B82F6';    // Blue
const COLOR_FUTURE = '#10B981';    // Green
const COLOR_COMPLETED = '#9CA3AF'; // Gray

function getTaskColor(task) {
  if (task.status === 'done') return COLOR_COMPLETED;
  if (!task.dueDate) return COLOR_FUTURE;
  
  const dateStr = task.dueTime ? `${task.dueDate}T${task.dueTime}` : task.dueDate;
  const diffHours = (new Date(dateStr) - new Date()) / 36e5;
  
  if (diffHours < 0) return COLOR_OVERDUE;
  if (diffHours < 24) return COLOR_SOON;
  if (diffHours < 168) return COLOR_ACTIVE; // Within a week is active
  return COLOR_FUTURE;
}

export default function GraphView({ tasks, topics, onEditTask }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Interaction State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'completed'

  // Expansion state (Set of node IDs that are manually expanded)
  const [expandedNodes, setExpandedNodes] = useState(new Set(['topic-1', 'topic-2', 'topic-3']));

  // Physics simulation data
  const simulationRef = useRef({
    nodes: [],
    links: [],
  });
  
  // Dragging state
  const dragRef = useRef({
    isDragging: false,
    draggedNode: null,
    startX: 0,
    startY: 0,
    lastPanX: 0,
    lastPanY: 0,
    hasMoved: false,
  });

  // Track positions across renders for stability
  const nodePositionsRef = useRef({});

  // Simulation cooling alpha (1.0 = warm/moving, decays to 0.0 = completely frozen/stationary)
  const alphaRef = useRef(1.0);

  // Trigger expansion/collapse
  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
    alphaRef.current = 1.0; // Reheat simulation to let it settle into its new positions
  };

  const isNodeVisible = useCallback((node) => {
    if (!node) return false;
    if (node.type === 'topic') return true;
    
    // Auto-expand everything at very high zoom, otherwise check expanded list
    const autoExpandTopics = zoom >= 0.8;
    const autoExpandSubs = zoom >= 1.3;

    if (node.type === 'subtopic') {
      return autoExpandTopics || expandedNodes.has(node.parentId);
    }

    if (node.type === 'task') {
      const task = node.data;
      if (!task.categories || task.categories.length === 0) return true; // Standalone tasks visible
      
      return task.categories.some(catId => {
        const cat = topics.find(t => t.id === catId);
        if (!cat) return false;
        if (cat.parentId === null) {
          return autoExpandTopics || expandedNodes.has(cat.id);
        } else {
          const parentTopExpanded = autoExpandTopics || expandedNodes.has(cat.parentId);
          return parentTopExpanded && (autoExpandSubs || expandedNodes.has(cat.id));
        }
      });
    }
    return true;
  }, [zoom, expandedNodes, topics]);

  const isFilteredOut = useCallback((node) => {
    if (!node) return false;
    if (node.type !== 'task') return false;
    const task = node.data;
    if (filterMode === 'active') return task.status === 'done';
    if (filterMode === 'completed') return task.status !== 'done';
    return false;
  }, [filterMode]);

  const isNodeDrawn = useCallback((node) => {
    return isNodeVisible(node) && !isFilteredOut(node);
  }, [isNodeVisible, isFilteredOut]);

  // Close details sidebar if the selected node becomes filtered out
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'task') {
      const stillExists = tasks.some(t => t.id === selectedNode.id);
      if (!stillExists || isFilteredOut(selectedNode)) {
        setSelectedNode(null);
      }
    }
  }, [tasks, filterMode, selectedNode, isFilteredOut]);

  // Keep selected task data in sync with tasks array edits
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'task') {
      const updatedTask = tasks.find(t => t.id === selectedNode.id);
      if (!updatedTask) {
        setSelectedNode(null);
      } else if (JSON.stringify(updatedTask) !== JSON.stringify(selectedNode.data)) {
        setSelectedNode(prev => ({
          ...prev,
          data: updatedTask,
          label: updatedTask.title,
          color: getTaskColor(updatedTask),
        }));
      }
    }
  }, [tasks, selectedNode]);

  // Build nodes and links from task data
  useEffect(() => {
    const activeTasks = tasks;

    const currentNodes = [];
    const currentLinks = [];
    const positions = nodePositionsRef.current;

    // 1. Create Topic Nodes
    topics.filter(t => t.parentId === null).forEach(topic => {
      currentNodes.push({
        id: topic.id,
        type: 'topic',
        label: topic.name,
        radius: 28,
        color: '#B5B392', // surfacecard
        textColor: '#0C0C08', // textprimary
        parentId: null,
      });
    });

    // Add virtual "Standalone" topic node if there are uncategorized tasks
    const hasStandalone = activeTasks.some(t => !t.categories || t.categories.length === 0);
    if (hasStandalone) {
      currentNodes.push({
        id: 'topic-standalone',
        type: 'topic',
        label: 'Standalone Tasks',
        radius: 28,
        color: '#D1D0BB', // brandprimary
        textColor: '#0C0C08',
        parentId: null,
      });
    }

    // 2. Create Sub-topic Nodes
    topics.filter(t => t.parentId !== null).forEach(sub => {
      currentNodes.push({
        id: sub.id,
        type: 'subtopic',
        label: sub.name,
        radius: 20,
        color: '#D1D0BB', // brandprimary
        textColor: '#313121', // textmuted
        parentId: sub.parentId,
      });
      // Link Sub-topic to parent Topic
      currentLinks.push({
        source: sub.parentId,
        target: sub.id,
        type: 'hierarchy',
        length: 80,
      });
    });

    // 3. Create Task Nodes
    activeTasks.forEach(task => {
      const taskColor = getTaskColor(task);
      currentNodes.push({
        id: task.id,
        type: 'task',
        label: task.title,
        radius: 12,
        color: taskColor,
        textColor: '#0C0C08',
        data: task,
      });

      // Link to parent categories
      if (task.categories && task.categories.length > 0) {
        task.categories.forEach(catId => {
          currentLinks.push({
            source: catId,
            target: task.id,
            type: 'relation',
            length: 50,
          });
        });
      } else if (hasStandalone) {
        // Link standalone tasks to the virtual standalone node
        currentLinks.push({
          source: 'topic-standalone',
          target: task.id,
          type: 'relation',
          length: 50,
        });
      }
    });

    // Initialize positions, velocities, and link references
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    currentNodes.forEach(node => {
      const cached = positions[node.id];
      if (cached) {
        node.x = cached.x;
        node.y = cached.y;
        node.vx = cached.vx || 0;
        node.vy = cached.vy || 0;
      } else {
        // Find parent position for starting point
        let parentX = width / 2;
        let parentY = height / 2;

        if (node.parentId && positions[node.parentId]) {
          parentX = positions[node.parentId].x;
          parentY = positions[node.parentId].y;
        }

        node.x = parentX + (Math.random() - 0.5) * 40;
        node.y = parentY + (Math.random() - 0.5) * 40;
        node.vx = 0;
        node.vy = 0;
      }
    });

    // Save back to ref
    simulationRef.current = {
      nodes: currentNodes,
      links: currentLinks,
    };
    alphaRef.current = 1.0; // Reheat simulation for new items
  }, [tasks, topics]);

  // Reheat simulation on layout-affecting state changes
  useEffect(() => {
    alphaRef.current = 1.0;
  }, [filterMode, zoom, expandedNodes]);

  // Physics Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const tick = () => {
      const { nodes, links } = simulationRef.current;
      const width = canvasRef.current?.clientWidth || 800;
      const height = canvasRef.current?.clientHeight || 600;
      const centerX = width / 2;
      const centerY = height / 2;

      // If simulation is cold, just draw and skip forces to prevent movement
      if (alphaRef.current < 0.005) {
        draw();
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const alpha = alphaRef.current;

      // Apply forces
      // 1. Gravity / Center pull (stronger for topics)
      nodes.forEach(node => {
        const kGrav = node.type === 'topic' ? 0.015 : 0.005;
        node.vx += (centerX - node.x) * kGrav * alpha;
        node.vy += (centerY - node.y) * kGrav * alpha;
      });

      // 2. Node Repulsion (Coulomb force)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const visibleA = isNodeVisible(nodeA);
        
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const visibleB = isNodeVisible(nodeB);

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;

          // Repulsion exists only if at least one is visible (collapsed nodes merge inside parents)
          if (visibleA || visibleB) {
            const repulsionStrength = nodeA.type === 'topic' && nodeB.type === 'topic' ? 1200 : 350;
            const force = repulsionStrength / (dist * dist);
            nodeA.vx -= force * (dx / dist) * alpha;
            nodeA.vy -= force * (dy / dist) * alpha;
            nodeB.vx += force * (dx / dist) * alpha;
            nodeB.vy += force * (dy / dist) * alpha;
          }
        }
      }

      // 3. Link Tension (Hooke's Law)
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const visibleSource = isNodeVisible(sourceNode);
        const visibleTarget = isNodeVisible(targetNode);

        // If target (subtopic/task) is collapsed, pull it directly inside its parent
        if (visibleSource && !visibleTarget) {
          const dx = sourceNode.x - targetNode.x;
          const dy = sourceNode.y - targetNode.y;
          targetNode.vx += dx * 0.15 * alpha;
          targetNode.vy += dy * 0.15 * alpha;
          return;
        }

        if (visibleSource && visibleTarget) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;

          const strength = link.type === 'hierarchy' ? 0.05 : 0.03;
          const force = (dist - link.length) * strength;
          sourceNode.vx += force * (dx / dist) * alpha;
          sourceNode.vy += force * (dy / dist) * alpha;
          targetNode.vx -= force * (dx / dist) * alpha;
          targetNode.vy -= force * (dy / dist) * alpha;
        }
      });

      // 4. Overlap Collision Prevention
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        if (!isNodeVisible(nodeA)) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          if (!isNodeVisible(nodeB)) continue;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;

          const minDist = nodeA.radius + nodeB.radius + 8;
          if (dist < minDist) {
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.5 * alpha;
            const pushY = (dy / dist) * overlap * 0.5 * alpha;
            nodeA.x -= pushX;
            nodeA.y -= pushY;
            nodeB.x += pushX;
            nodeB.y += pushY;
          }
        }
      }

      // Update positions with friction damping
      nodes.forEach(node => {
        if (node.id === dragRef.current.draggedNode?.id) {
          // Fixed position while dragging
          node.vx = 0;
          node.vy = 0;
        } else {
          node.vx *= 0.82;
          node.vy *= 0.82;
          node.x += node.vx;
          node.y += node.vy;
        }

        // Cache positions for re-renders
        nodePositionsRef.current[node.id] = {
          x: node.x,
          y: node.y,
          vx: node.vx,
          vy: node.vy,
        };
      });

      // Cool down the simulation
      alphaRef.current *= 0.95;

      draw();
      animationFrameId = requestAnimationFrame(tick);
    };

    // Canvas Draw Routine
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { nodes, links } = simulationRef.current;

      // Adjust resolution for high-DPI screens
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Save canvas state for pan & zoom transforms
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Draw Links
      ctx.beginPath();
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const visibleSource = isNodeDrawn(sourceNode);
        const visibleTarget = isNodeDrawn(targetNode);

        // Draw line only if both endpoints are visible
        if (visibleSource && visibleTarget) {
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
        }
      });
      ctx.strokeStyle = '#D1D0BB'; // brandprimary
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      // 2. Draw Nodes
      nodes.forEach(node => {
        if (!isNodeDrawn(node)) return;

        // Draw shadow/glow on hover
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;

        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isHovered ? 4 : 2), 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(241, 242, 145, 0.4)' : 'rgba(209, 208, 187, 0.3)';
          ctx.fill();
        }

        // Base Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#0C0C08'; // textprimary
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Node specific markings
        if (node.type === 'topic') {
          // Double circle for topics
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius - 4, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(12, 12, 8, 0.2)';
          ctx.stroke();
        }

        // Draw text labels based on zoom level (Progressive Reveal)
        ctx.fillStyle = node.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.type === 'topic') {
          ctx.font = `bold ${11}px Inter, sans-serif`;
          ctx.fillText(node.label, node.x, node.y);
        } else if (node.type === 'subtopic' && zoom >= 0.7) {
          ctx.font = `${9.5}px Inter, sans-serif`;
          ctx.fillText(node.label, node.x, node.y);
        } else if (node.type === 'task' && zoom >= 1.25) {
          // Show assignee initials inside task circle
          const initials = node.data.assignee
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          ctx.font = `bold ${8.5}px Inter, sans-serif`;
          ctx.fillStyle = node.data.status === 'done' ? '#6B7280' : '#0C0C08';
          ctx.fillText(initials, node.x, node.y);

          // Draw task title below
          ctx.font = `${8.5}px Inter, sans-serif`;
          ctx.fillStyle = '#313121'; // textmuted
          ctx.fillText(node.label, node.x, node.y + 20);
        }
      });

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [expandedNodes, zoom, pan, hoveredNode, selectedNode, topics]);

  // Touch and Mouse Interactions
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen mouse coords to transform space
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Detect click on node
    let clickedNode = null;
    const { nodes } = simulationRef.current;
    
    // Reverse search so top nodes get priority
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!isNodeDrawn(node)) continue;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= node.radius) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      dragRef.current = {
        isDragging: true,
        draggedNode: clickedNode,
        startX: worldX,
        startY: worldY,
        hasMoved: false,
      };
      // Lock position during drag
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
    } else {
      dragRef.current = {
        isDragging: true,
        draggedNode: null,
        startX: e.clientX,
        startY: e.clientY,
        lastPanX: pan.x,
        lastPanY: pan.y,
        hasMoved: false,
      };
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    const drag = dragRef.current;

    if (drag.isDragging) {
      drag.hasMoved = true;
      if (drag.draggedNode) {
        // Dragging a node
        drag.draggedNode.x = worldX;
        drag.draggedNode.y = worldY;
        drag.draggedNode.fx = worldX;
        drag.draggedNode.fy = worldY;
        alphaRef.current = 1.0; // Keep reheating during drag
      } else {
        // Panning the canvas
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setPan({
          x: drag.lastPanX + dx,
          y: drag.lastPanY + dy,
        });
      }
    } else {
      // Hover detection
      let hovered = null;
      const { nodes } = simulationRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (!isNodeDrawn(node)) continue;
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= node.radius) {
          hovered = node;
          break;
        }
      }
      setHoveredNode(hovered);
    }
  };

  const handleMouseUp = (e) => {
    const drag = dragRef.current;
    if (drag.isDragging) {
      if (drag.draggedNode) {
        // Release dragged node constraints
        delete drag.draggedNode.fx;
        delete drag.draggedNode.fy;
        alphaRef.current = 1.0; // Reheat so simulation settles into equilibrium
      }

      // If it was a click without dragging/moving the board, trigger navigation/expansion
      if (!drag.hasMoved) {
        if (drag.draggedNode) {
          const node = drag.draggedNode;
          if (node.type === 'topic' || node.type === 'subtopic') {
            toggleExpand(node.id);
          }
          setSelectedNode(node);
        } else {
          // Clicked empty space: collapse views or close panel
          setSelectedNode(null);
        }
      }
    }
    dragRef.current.isDragging = false;
  };

  // Zoom wheel handling
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.12;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);

    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 3.5);

    // Zoom centered around mouse pointer
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  };

  // Double click zooms in centered around double clicked point
  const handleDoubleClick = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newZoom = Math.min(zoom * 1.5, 3.5);

    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
    alphaRef.current = 1.0; // Reheat simulation
  };

  return (
    <div className="flex gap-4 w-full h-[620px] select-none relative font-sans text-textprimary">
      {/* Simulation Workspace Container */}
      <div 
        ref={containerRef}
        className="flex-1 rounded-2xl bg-brandprimary/20 border border-brandprimary/40 relative overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className="w-full h-full block cursor-move"
        />

        {/* View Controls & Filter Bar overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap items-center">
          <div className="flex bg-surfacepage border border-brandprimary/60 rounded-lg p-0.5 shadow-md">
            {[
              { id: 'all', label: 'Show All' },
              { id: 'active', label: 'Show Active Only' },
              { id: 'completed', label: 'Show Completed Only' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                  filterMode === f.id
                    ? 'bg-textprimary text-surfacepage shadow-sm'
                    : 'text-textmuted hover:text-textprimary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex bg-surfacepage border border-brandprimary/60 rounded-lg p-0.5 shadow-md items-center gap-1">
            <button
              onClick={() => {
                setZoom(z => Math.max(z - 0.15, 0.35));
                alphaRef.current = 1.0;
              }}
              title="Zoom Out"
              className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded hover:bg-brandprimary/40 text-textprimary transition-colors"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                alphaRef.current = 1.0;
              }}
              title="Reset View"
              className="px-2 py-0.5 text-[10px] font-semibold rounded hover:bg-brandprimary/40 text-textprimary transition-colors"
            >
              Reset ({Math.round(zoom * 100)}%)
            </button>
            <button
              onClick={() => {
                setZoom(z => Math.min(z + 0.15, 3.5));
                alphaRef.current = 1.0;
              }}
              title="Zoom In"
              className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded hover:bg-brandprimary/40 text-textprimary transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Dynamic Tooltip overlay on hover */}
        {hoveredNode && (
          <div 
            className="absolute z-20 pointer-events-none bg-surfacepage border border-brandprimary/60 px-3 py-2 rounded-xl shadow-lg text-xs max-w-xs flex flex-col gap-1"
            style={{
              left: `${hoveredNode.x * zoom + pan.x + 20}px`,
              top: `${hoveredNode.y * zoom + pan.y - 30}px`,
            }}
          >
            {hoveredNode.type === 'topic' && (
              <>
                <span className="font-bold text-textprimary">{hoveredNode.label}</span>
                <span className="text-[10px] text-textmuted">Root Topic</span>
                <span className="text-[10px] text-textmuted mt-1">
                  Sub-topics: {topics.filter(t => t.parentId === hoveredNode.id).length}
                </span>
              </>
            )}

            {hoveredNode.type === 'subtopic' && (
              <>
                <span className="font-bold text-textprimary">{hoveredNode.label}</span>
                <span className="text-[10px] text-textmuted">
                  Parent: {topics.find(t => t.id === hoveredNode.parentId)?.name || 'None'}
                </span>
                <span className="text-[10px] text-textmuted">
                  Tasks: {tasks.filter(t => t.categories?.includes(hoveredNode.id)).length}
                </span>
              </>
            )}

            {hoveredNode.type === 'task' && (
              <>
                <span className="font-bold text-textprimary">{hoveredNode.label}</span>
                <span className="text-[10px] text-textmuted flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: hoveredNode.color }} 
                  />
                  Status: {hoveredNode.data.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-textmuted">
                  Assignee: {hoveredNode.data.assignee}
                </span>
                {hoveredNode.data.dueDate && (
                  <span className="text-[10px] text-textmuted">
                    Due: {hoveredNode.data.dueDate} {hoveredNode.data.dueTime ? `@ ${hoveredNode.data.dueTime}` : ''}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Legend for task colors */}
        <div className="absolute bottom-4 left-4 z-10 bg-surfacepage/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-brandprimary/40 flex flex-col gap-1.5 text-[10px] font-medium text-textmuted select-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-[#DC2626]" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-[#F97316]" />
            <span>Due soon (&lt; 24h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-[#3B82F6]" />
            <span>Active (&lt; week)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-[#10B981]" />
            <span>Future / No due date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-[#9CA3AF]" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Sidebar Panel */}
      {selectedNode && (
        <div className="w-80 rounded-2xl bg-brandprimary/15 border border-brandprimary/40 p-5 shadow-lg flex flex-col gap-4 max-h-[620px] overflow-y-auto transition-all duration-300">
          <div className="flex items-center justify-between border-b border-brandprimary/40 pb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-textmuted">
              {selectedNode.type} Details
            </span>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-textmuted hover:text-textprimary text-sm font-bold"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold font-heading text-textprimary leading-tight">
              {selectedNode.label}
            </h3>
            {selectedNode.type === 'task' && (
              <p className="text-xs text-textmuted leading-relaxed">
                {selectedNode.data.context || 'No context provided.'}
              </p>
            )}
          </div>

          {/* Details metadata */}
          {selectedNode.type === 'task' && (
            <div className="flex flex-col gap-2 border-t border-brandprimary/40 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-textmuted">Status:</span>
                <span className="font-semibold text-textprimary uppercase">{selectedNode.data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textmuted">Type:</span>
                <span className="font-semibold text-textprimary uppercase">{selectedNode.data.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textmuted">Assignee:</span>
                <span className="font-semibold text-textprimary">{selectedNode.data.assignee}</span>
              </div>
              {selectedNode.data.dueDate && (
                <div className="flex justify-between">
                  <span className="text-textmuted">Due Date:</span>
                  <span className="font-semibold text-textprimary">
                    {selectedNode.data.dueDate} {selectedNode.data.dueTime ? `@ ${selectedNode.data.dueTime}` : ''}
                  </span>
                </div>
              )}
              {selectedNode.data.contextTool && (
                <div className="flex justify-between">
                  <span className="text-textmuted">AI Tool:</span>
                  <span className="font-semibold text-textprimary">{selectedNode.data.contextTool}</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => onEditTask(selectedNode.data)}
                className="mt-3 w-full bg-textprimary text-surfacepage py-2 rounded-lg text-xs font-semibold hover:shadow transition-shadow"
              >
                Edit Task
              </button>
            </div>
          )}

          {selectedNode.type !== 'task' && (
            <div className="flex flex-col gap-2 border-t border-brandprimary/40 pt-3 text-xs">
              <span className="font-bold text-textprimary">Associated tasks in this category:</span>
              <div className="flex flex-col gap-1.5 mt-1">
                {tasks
                  .filter(t => t.categories?.includes(selectedNode.id) || (selectedNode.id === 'topic-standalone' && (!t.categories || t.categories.length === 0)))
                  .map(t => (
                    <div 
                      key={t.id}
                      onClick={() => setSelectedNode({ id: t.id, type: 'task', label: t.title, color: getTaskColor(t), data: t, radius: 12 })}
                      className="flex items-center justify-between p-2 rounded-lg bg-surfacepage hover:bg-brandprimary/30 border border-brandprimary/40 cursor-pointer transition-colors duration-200"
                    >
                      <span className="text-xs truncate max-w-[180px] font-medium text-textprimary">{t.title}</span>
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: getTaskColor(t) }} 
                        title={`Status: ${t.status}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
