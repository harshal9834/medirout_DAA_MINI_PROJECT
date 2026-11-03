import { DijkstraResult, DijkstraStep, GraphNode, GraphRoad } from '../types/graph';
import { MinPriorityQueue } from './priorityQueue';

export interface AdjacencyEdge {
  target: string;
  distance: number;
  roadId: string;
  roadName?: string;
}

/**
 * Builds an adjacency list from nodes and roads.
 * Throws an error if any road has a negative distance or references non-existent nodes.
 */
export function buildAdjacencyList(
  nodes: GraphNode[],
  roads: GraphRoad[]
): Map<string, AdjacencyEdge[]> {
  const nodeIds = new Set(nodes.map(n => n.id));
  const adj = new Map<string, AdjacencyEdge[]>();

  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const road of roads) {
    if (road.distance < 0) {
      throw new Error(`Invalid road distance: Road "${road.id}" has negative distance ${road.distance} km. Dijkstra's Algorithm requires non-negative weights.`);
    }
    if (!nodeIds.has(road.from)) {
      throw new Error(`Road "${road.id}" references non-existent starting location: "${road.from}"`);
    }
    if (!nodeIds.has(road.to)) {
      throw new Error(`Road "${road.id}" references non-existent destination: "${road.to}"`);
    }

    // Add forward edge
    adj.get(road.from)!.push({
      target: road.to,
      distance: road.distance,
      roadId: road.id,
      roadName: road.name,
    });

    // Add reverse edge if bidirectional
    if (road.bidirectional) {
      adj.get(road.to)!.push({
        target: road.from,
        distance: road.distance,
        roadId: road.id,
        roadName: road.name,
      });
    }
  }

  // Sort edges deterministically by target ID for consistent iteration
  for (const [, edges] of adj.entries()) {
    edges.sort((a, b) => a.target.localeCompare(b.target));
  }

  return adj;
}

/**
 * Executes Dijkstra's Algorithm with detailed step recording for the visualizer.
 */
export function dijkstra(
  nodes: GraphNode[],
  roads: GraphRoad[],
  sourceId: string,
  destinationId: string
): DijkstraResult {
  const startTime = performance.now();

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  if (!nodeMap.has(sourceId)) {
    throw new Error(`Source node "${sourceId}" does not exist in the graph.`);
  }
  if (!nodeMap.has(destinationId)) {
    throw new Error(`Destination node "${destinationId}" does not exist in the graph.`);
  }

  // Validate negative weights
  for (const road of roads) {
    if (road.distance < 0) {
      throw new Error(`Negative road distance detected (${road.distance} km). Dijkstra's Algorithm requires non-negative edge weights.`);
    }
  }

  const adj = buildAdjacencyList(nodes, roads);

  const distances: Record<string, number> = {};
  const predecessors: Record<string, string | null> = {};
  const visited = new Set<string>();
  const steps: DijkstraStep[] = [];
  const visitedOrder: string[] = [];

  for (const node of nodes) {
    distances[node.id] = Infinity;
    predecessors[node.id] = null;
  }

  distances[sourceId] = 0;

  const pq = new MinPriorityQueue<string>();
  pq.enqueue(sourceId, 0, sourceId);

  // Helper to snapshot queue
  const getQueueSnapshot = () =>
    pq.toSortedArray().map(item => ({ id: item.id, dist: item.priority }));

  // Initial step
  steps.push({
    stepIndex: steps.length + 1,
    type: 'select-node',
    currentNode: sourceId,
    currentDistance: 0,
    updated: false,
    distancesSnapshot: { ...distances },
    predecessorsSnapshot: { ...predecessors },
    visitedSnapshot: Array.from(visited),
    queueSnapshot: getQueueSnapshot(),
    description: `Initialized source node ${nodeMap.get(sourceId)?.name || sourceId} with distance 0 km. All other nodes initialized to ∞.`,
  });

  // Handle immediate case: source === destination
  if (sourceId === destinationId) {
    const elapsed = performance.now() - startTime;
    return {
      sourceId,
      destinationId,
      distance: 0,
      path: [sourceId],
      predecessors,
      distances,
      steps,
      reachable: true,
      visitedOrder: [sourceId],
      executionTimeMs: Math.round(elapsed * 100) / 100,
    };
  }

  while (!pq.isEmpty()) {
    const popped = pq.dequeue();
    if (!popped) break;

    const u = popped.element;
    const distU = popped.priority;

    // Skip if we already finalized a shorter distance to this node
    if (visited.has(u)) continue;

    visited.add(u);
    visitedOrder.push(u);

    const uName = nodeMap.get(u)?.name || u;

    // Step: Node selected from priority queue
    steps.push({
      stepIndex: steps.length + 1,
      type: 'select-node',
      currentNode: u,
      currentDistance: distU,
      updated: false,
      distancesSnapshot: { ...distances },
      predecessorsSnapshot: { ...predecessors },
      visitedSnapshot: Array.from(visited),
      queueSnapshot: getQueueSnapshot(),
      description: `Extracted ${uName} (${u}) from priority queue with minimum tentative distance ${distU === Infinity ? '∞' : distU + ' km'}. Marked as finalized/visited.`,
    });

    // If we reached the destination, we can finalize!
    if (u === destinationId) {
      steps.push({
        stepIndex: steps.length + 1,
        type: 'destination-reached',
        currentNode: u,
        currentDistance: distU,
        updated: false,
        distancesSnapshot: { ...distances },
        predecessorsSnapshot: { ...predecessors },
        visitedSnapshot: Array.from(visited),
        queueSnapshot: getQueueSnapshot(),
        description: `Target destination ${uName} reached! Optimal shortest path verified at ${distU} km.`,
      });
      break;
    }

    // If the smallest distance is infinity, remaining nodes are unreachable
    if (distU === Infinity) {
      break;
    }

    // Inspect neighbors
    const edges = adj.get(u) || [];
    for (const edge of edges) {
      const v = edge.target;
      const vName = nodeMap.get(v)?.name || v;
      const weight = edge.distance;

      if (visited.has(v)) {
        steps.push({
          stepIndex: steps.length + 1,
          type: 'skip-edge',
          currentNode: u,
          currentDistance: distU,
          neighborNode: v,
          edgeDistance: weight,
          updated: false,
          previousDistance: distances[v],
          distancesSnapshot: { ...distances },
          predecessorsSnapshot: { ...predecessors },
          visitedSnapshot: Array.from(visited),
          queueSnapshot: getQueueSnapshot(),
          description: `Examined neighbor ${vName} (${v}) via ${edge.roadName || 'Road'}. Skipped because ${vName} is already finalized.`,
        });
        continue;
      }

      const alt = distU + weight;
      const prevDist = distances[v];

      if (alt < prevDist) {
        distances[v] = alt;
        predecessors[v] = u;
        pq.enqueue(v, alt, v);

        steps.push({
          stepIndex: steps.length + 1,
          type: 'relax-edge',
          currentNode: u,
          currentDistance: distU,
          neighborNode: v,
          edgeDistance: weight,
          candidateDistance: alt,
          updated: true,
          previousDistance: prevDist,
          newDistance: alt,
          predecessor: u,
          distancesSnapshot: { ...distances },
          predecessorsSnapshot: { ...predecessors },
          visitedSnapshot: Array.from(visited),
          queueSnapshot: getQueueSnapshot(),
          description: `Relaxed edge (${u} → ${v}, ${weight} km): Found shorter route to ${vName}! Updated distance from ${prevDist === Infinity ? '∞' : prevDist + ' km'} to ${alt} km. Predecessor set to ${uName}.`,
        });
      } else {
        steps.push({
          stepIndex: steps.length + 1,
          type: 'examine-neighbor',
          currentNode: u,
          currentDistance: distU,
          neighborNode: v,
          edgeDistance: weight,
          candidateDistance: alt,
          updated: false,
          previousDistance: prevDist,
          distancesSnapshot: { ...distances },
          predecessorsSnapshot: { ...predecessors },
          visitedSnapshot: Array.from(visited),
          queueSnapshot: getQueueSnapshot(),
          description: `Examined edge (${u} → ${v}, ${weight} km): Candidate distance ${alt} km is not shorter than current tentative distance ${prevDist} km. No update.`,
        });
      }
    }
  }

  // Path reconstruction
  const finalDistance = distances[destinationId];
  const reachable = finalDistance !== Infinity;
  const path: string[] = [];

  if (reachable) {
    let curr: string | null = destinationId;
    while (curr !== null) {
      path.unshift(curr);
      curr = predecessors[curr];
    }
  } else {
    steps.push({
      stepIndex: steps.length + 1,
      type: 'unreachable',
      currentNode: destinationId,
      currentDistance: Infinity,
      updated: false,
      distancesSnapshot: { ...distances },
      predecessorsSnapshot: { ...predecessors },
      visitedSnapshot: Array.from(visited),
      queueSnapshot: [],
      description: `No route exists between ${nodeMap.get(sourceId)?.name || sourceId} and ${nodeMap.get(destinationId)?.name || destinationId}. Please add or update road connections.`,
    });
  }

  const elapsed = performance.now() - startTime;

  return {
    sourceId,
    destinationId,
    distance: reachable ? finalDistance : Infinity,
    path,
    predecessors,
    distances,
    steps,
    reachable,
    visitedOrder,
    executionTimeMs: Math.round(elapsed * 100) / 100,
  };
}
