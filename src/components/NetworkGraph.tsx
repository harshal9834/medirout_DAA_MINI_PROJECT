import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Navigation,
  Shield,
  Truck,
  Layers,
  Info,
  Edit2,
  Trash2,
} from 'lucide-react';
import { GraphNode, GraphRoad, DijkstraStep } from '../types/graph';

interface NetworkGraphProps {
  nodes: GraphNode[];
  roads: GraphRoad[];
  sourceId: string;
  destinationId: string;
  shortestPath: string[];
  activeStep?: DijkstraStep | null;
  animatingVehicle?: boolean;
  onNodeClick?: (node: GraphNode) => void;
  onRoadClick?: (road: GraphRoad) => void;
  onUpdateNodeCoordinates?: (id: string, x: number, y: number) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  roads,
  sourceId,
  destinationId,
  shortestPath,
  activeStep,
  animatingVehicle = false,
  onNodeClick,
  onRoadClick,
  onUpdateNodeCoordinates,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state: pan & zoom
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging individual node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Vehicle animation state
  const [vehiclePos, setVehiclePos] = useState<{ x: number; y: number } | null>(null);
  const [vehicleAngle, setVehicleAngle] = useState<number>(0);

  // Map for fast node lookup
  const nodeMap = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Set of edges on the shortest path
  const shortestPathEdges = React.useMemo(() => {
    const set = new Set<string>();
    if (shortestPath.length < 2) return set;
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const u = shortestPath[i];
      const v = shortestPath[i + 1];
      set.add(`${u}->${v}`);
      set.add(`${v}->${u}`);
    }
    return set;
  }, [shortestPath]);

  // Handle zoom controls
  const handleZoom = (factor: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * factor, 0.4), 3.0),
    }));
  };

  const handleResetZoom = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.coordinates.x);
      maxX = Math.max(maxX, n.coordinates.x);
      minY = Math.min(minY, n.coordinates.y);
      maxY = Math.max(maxY, n.coordinates.y);
    });

    const padding = 100;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 550;

    const scale = Math.min(containerWidth / width, containerHeight / height, 1.2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setTransform({
      scale,
      x: containerWidth / 2 - centerX * scale,
      y: containerHeight / 2 - centerY * scale,
    });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node')) return;
    if ((e.target as HTMLElement).closest('.interactive-road-badge')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      }));
    } else if (draggingNodeId && onUpdateNodeCoordinates) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const clientX = e.clientX - containerRect.left;
      const clientY = e.clientY - containerRect.top;

      const newX = (clientX - transform.x) / transform.scale - dragOffset.x;
      const newY = (clientY - transform.y) / transform.scale - dragOffset.y;

      onUpdateNodeCoordinates(draggingNodeId, Math.round(newX), Math.round(newY));
    }
  }, [isPanning, startPan, draggingNodeId, dragOffset, transform, onUpdateNodeCoordinates]);

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    handleZoom(zoomFactor);
  };

  // Node drag start
  const handleNodeDragStart = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = (e.clientX - containerRect.left - transform.x) / transform.scale;
    const mouseY = (e.clientY - containerRect.top - transform.y) / transform.scale;

    setDraggingNodeId(node.id);
    setDragOffset({
      x: mouseX - node.coordinates.x,
      y: mouseY - node.coordinates.y,
    });
  };

  // Vehicle Dispatch animation along shortest path
  useEffect(() => {
    if (!animatingVehicle || shortestPath.length < 2) {
      setVehiclePos(null);
      return;
    }

    let isCancelled = false;
    let currentSegmentIndex = 0;
    let progress = 0; // 0 to 1 along current segment

    const interval = setInterval(() => {
      if (isCancelled) return;

      if (currentSegmentIndex >= shortestPath.length - 1) {
        currentSegmentIndex = 0;
        progress = 0;
      }

      const uId = shortestPath[currentSegmentIndex];
      const vId = shortestPath[currentSegmentIndex + 1];
      const u = nodeMap.get(uId);
      const v = nodeMap.get(vId);

      if (!u || !v) return;

      const curX = u.coordinates.x + (v.coordinates.x - u.coordinates.x) * progress;
      const curY = u.coordinates.y + (v.coordinates.y - u.coordinates.y) * progress;

      const angleRad = Math.atan2(v.coordinates.y - u.coordinates.y, v.coordinates.x - u.coordinates.x);
      const angleDeg = (angleRad * 180) / Math.PI;

      setVehiclePos({ x: curX, y: curY });
      setVehicleAngle(angleDeg);

      progress += 0.035;
      if (progress >= 1) {
        progress = 0;
        currentSegmentIndex++;
      }
    }, 28);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [animatingVehicle, shortestPath, nodeMap]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-[540px] sm:h-[620px] bg-slate-900 rounded-xl overflow-hidden shadow-inner select-none cursor-grab active:cursor-grabbing border border-slate-800"
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.4) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-md">
        <button
          onClick={() => handleZoom(1.15)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
          title="Fit Graph to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend & Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-3 bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[11px] text-slate-300 shadow-md">
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 border border-white"></span>
          <span>Warehouse</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500 border border-white"></span>
          <span>Hospital</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span>Junction</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-4 h-0.5 bg-emerald-400 rounded"></span>
          <span className="text-emerald-400 font-semibold">Shortest Route</span>
        </span>
        <span className="text-slate-500">| Drag nodes to reposition</span>
      </div>

      {/* SVG Canvas */}
      <svg className="w-full h-full">
        <defs>
          {/* Arrow marker for one-way roads */}
          <marker
            id="road-arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker
            id="road-arrow-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
          </marker>

          {/* Glow filter for shortest route */}
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          style={{ transition: isPanning ? 'none' : 'transform 0.05s ease-out' }}
        >
          {/* 1. Roads (Edges) */}
          {roads.map(road => {
            const fromNode = nodeMap.get(road.from);
            const toNode = nodeMap.get(road.to);
            if (!fromNode || !toNode) return null;

            const isShortestEdge =
              shortestPathEdges.has(`${road.from}->${road.to}`) ||
              shortestPathEdges.has(`${road.to}->${road.from}`);

            // Dijkstra Step Animation Check
            const isRelaxingEdge =
              activeStep &&
              activeStep.currentNode === road.from &&
              activeStep.neighborNode === road.to;
            const isReverseRelaxingEdge =
              activeStep &&
              road.bidirectional &&
              activeStep.currentNode === road.to &&
              activeStep.neighborNode === road.from;
            const isCurrentEdgeInspected = isRelaxingEdge || isReverseRelaxingEdge;

            const midX = (fromNode.coordinates.x + toNode.coordinates.x) / 2;
            const midY = (fromNode.coordinates.y + toNode.coordinates.y) / 2;

            let strokeColor = '#334155'; // default slate-700
            let strokeWidth = 3;
            let filter = undefined;

            if (isShortestEdge) {
              strokeColor = '#10b981'; // emerald-500
              strokeWidth = 5;
              filter = 'url(#route-glow)';
            } else if (isCurrentEdgeInspected) {
              strokeColor = '#a855f7'; // purple-500 pulse
              strokeWidth = 4.5;
            }

            return (
              <g key={road.id} className="road-group">
                {/* Background thicker hit-area */}
                <line
                  x1={fromNode.coordinates.x}
                  y1={fromNode.coordinates.y}
                  x2={toNode.coordinates.x}
                  y2={toNode.coordinates.y}
                  stroke="transparent"
                  strokeWidth={18}
                  className="cursor-pointer"
                  onClick={() => onRoadClick && onRoadClick(road)}
                />

                {/* Visible road line */}
                <line
                  x1={fromNode.coordinates.x}
                  y1={fromNode.coordinates.y}
                  x2={toNode.coordinates.x}
                  y2={toNode.coordinates.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  filter={filter}
                  strokeDasharray={isShortestEdge ? 'none' : !road.bidirectional ? '6,4' : undefined}
                  markerEnd={!road.bidirectional ? (isShortestEdge ? 'url(#road-arrow-active)' : 'url(#road-arrow)') : undefined}
                />

                {/* Animated dash flow along shortest route */}
                {isShortestEdge && (
                  <line
                    x1={fromNode.coordinates.x}
                    y1={fromNode.coordinates.y}
                    x2={toNode.coordinates.x}
                    y2={toNode.coordinates.y}
                    stroke="#ecfdf5"
                    strokeWidth={2}
                    strokeDasharray="8,8"
                    className="animate-pulse"
                    opacity={0.8}
                  />
                )}

                {/* Distance Badge on Road */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  className="interactive-road-badge cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRoadClick) onRoadClick(road);
                  }}
                >
                  <rect
                    x={-24}
                    y={-12}
                    width={48}
                    height={24}
                    rx={12}
                    fill={isShortestEdge ? '#064e3b' : isCurrentEdgeInspected ? '#581c87' : '#1e293b'}
                    stroke={isShortestEdge ? '#34d399' : isCurrentEdgeInspected ? '#c084fc' : '#475569'}
                    strokeWidth={1.5}
                    className="hover:stroke-blue-400 transition"
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill={isShortestEdge ? '#6ee7b7' : '#cbd5e1'}
                    fontSize={11}
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {road.distance} km
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. Dispatch Vehicle Simulation */}
          {vehiclePos && (
            <g
              transform={`translate(${vehiclePos.x}, ${vehiclePos.y}) rotate(${vehicleAngle})`}
              className="pointer-events-none"
            >
              <circle r={14} fill="#10b981" fillOpacity={0.25} className="animate-ping" />
              <rect x={-10} y={-7} width={20} height={14} rx={3} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
              {/* Emergency light */}
              <circle cx={-1} cy={0} r={2.5} fill="#ef4444" className="animate-pulse" />
            </g>
          )}

          {/* 3. Nodes */}
          {nodes.map(node => {
            const isSource = node.id === sourceId;
            const isDestination = node.id === destinationId;
            const isOnShortestPath = shortestPath.includes(node.id);

            // Step status
            const isCurrentStepNode = activeStep?.currentNode === node.id;
            const isNeighborStepNode = activeStep?.neighborNode === node.id;
            const isFinalizedStepNode = activeStep?.visitedSnapshot.includes(node.id);

            // Visual Styling based on type and status
            let fillColor = '#1e293b';
            let strokeColor = '#475569';
            let textColor = '#ffffff';

            if (node.type === 'warehouse') {
              fillColor = '#2563eb'; // blue-600
              strokeColor = '#60a5fa';
            } else if (node.type === 'hospital') {
              fillColor = '#e11d48'; // rose-600
              strokeColor = '#fda4af';
            } else {
              fillColor = '#334155'; // slate-700
              strokeColor = '#94a3b8';
            }

            if (isCurrentStepNode) {
              fillColor = '#ea580c'; // orange-600 current active
              strokeColor = '#fed7aa';
            } else if (isNeighborStepNode) {
              fillColor = '#9333ea'; // purple neighbor
              strokeColor = '#e9d5ff';
            } else if (isOnShortestPath) {
              strokeColor = '#34d399'; // emerald border
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.coordinates.x}, ${node.coordinates.y})`}
                className="interactive-node cursor-grab active:cursor-grabbing"
                onMouseDown={e => handleNodeDragStart(e, node)}
                onClick={() => onNodeClick && onNodeClick(node)}
              >
                {/* Selection Rings */}
                {isSource && (
                  <circle
                    r={32}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="4,3"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}
                {isDestination && (
                  <circle
                    r={32}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={3}
                    className="animate-pulse"
                  />
                )}
                {isCurrentStepNode && (
                  <circle
                    r={34}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={3}
                    className="animate-ping"
                  />
                )}

                {/* Node Shape */}
                {node.type === 'warehouse' ? (
                  // Distinct Hexagon for Warehouse
                  <polygon
                    points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={3}
                    filter={isOnShortestPath ? 'url(#node-glow)' : undefined}
                    className="transition-colors duration-200"
                  />
                ) : node.type === 'hospital' ? (
                  // Rounded square for Hospitals
                  <rect
                    x={-22}
                    y={-22}
                    width={44}
                    height={44}
                    rx={10}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={3}
                    filter={isOnShortestPath ? 'url(#node-glow)' : undefined}
                    className="transition-colors duration-200"
                  />
                ) : (
                  // Circle for Junctions
                  <circle
                    r={18}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    filter={isOnShortestPath ? 'url(#node-glow)' : undefined}
                    className="transition-colors duration-200"
                  />
                )}

                {/* Node ID / Icon inside */}
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={node.type === 'junction' ? 12 : 14}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  pointerEvents="none"
                >
                  {node.id}
                </text>

                {/* Urgency indicator badge for hospitals */}
                {node.type === 'hospital' && node.urgency === 'Critical' && (
                  <circle cx={16} cy={-16} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                )}

                {/* Label below node */}
                <g transform="translate(0, 36)" pointerEvents="none">
                  <rect
                    x={-60}
                    y={-10}
                    width={120}
                    height={20}
                    rx={6}
                    fill="#0f172a"
                    fillOpacity={0.85}
                    stroke="#334155"
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={11}
                    fontWeight="600"
                  >
                    {node.name.length > 18 ? node.name.slice(0, 16) + '...' : node.name}
                  </text>
                </g>

                {/* Dijkstra visualizer step cost overlay */}
                {activeStep && activeStep.distancesSnapshot[node.id] !== undefined && (
                  <g transform="translate(0, -32)" pointerEvents="none">
                    <rect
                      x={-26}
                      y={-10}
                      width={52}
                      height={20}
                      rx={10}
                      fill={activeStep.distancesSnapshot[node.id] === Infinity ? '#334155' : '#065f46'}
                      stroke={activeStep.distancesSnapshot[node.id] === Infinity ? '#64748b' : '#34d399'}
                      strokeWidth={1.5}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {activeStep.distancesSnapshot[node.id] === Infinity
                        ? '∞'
                        : `${activeStep.distancesSnapshot[node.id]} km`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
