import { AlternativeRoute, GraphNode, GraphRoad } from '../types/graph';
import { buildAdjacencyList } from './dijkstra';

/**
 * Finds alternative simple paths between source and destination using
 * bounded depth-first exploration with cycle detection.
 * Returns paths sorted by total distance, excluding paths identical to the shortest path.
 */
export function findAlternativeRoutes(
  nodes: GraphNode[],
  roads: GraphRoad[],
  sourceId: string,
  destinationId: string,
  shortestDistance: number,
  shortestPath: string[],
  maxAlternatives: number = 4
): AlternativeRoute[] {
  if (shortestDistance === Infinity || sourceId === destinationId) {
    return [];
  }

  const adj = buildAdjacencyList(nodes, roads);
  const roadLookup = new Map<string, { distance: number; name?: string }>();

  for (const r of roads) {
    roadLookup.set(`${r.from}->${r.to}`, { distance: r.distance, name: r.name });
    if (r.bidirectional) {
      roadLookup.set(`${r.to}->${r.from}`, { distance: r.distance, name: r.name });
    }
  }

  const allPaths: Array<{ path: string[]; distance: number }> = [];
  const visited = new Set<string>();

  // Max search depth to keep computation bounded and fast in web browser
  const maxDepth = Math.max(nodes.length + 2, 12);

  function dfs(curr: string, currentPath: string[], currentDist: number) {
    if (currentPath.length > maxDepth) return;
    if (allPaths.length >= 50) return; // Cap raw search space

    if (curr === destinationId) {
      allPaths.push({ path: [...currentPath], distance: currentDist });
      return;
    }

    visited.add(curr);

    const neighbors = adj.get(curr) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.target)) {
        // Prune paths that are already drastically suboptimal (> 3.5x shortest distance)
        if (currentDist + edge.distance <= shortestDistance * 3.5 + 20) {
          currentPath.push(edge.target);
          dfs(edge.target, currentPath, currentDist + edge.distance);
          currentPath.pop();
        }
      }
    }

    visited.delete(curr);
  }

  visited.add(sourceId);
  dfs(sourceId, [sourceId], 0);

  // Filter out the exact shortest path
  const shortestPathKey = shortestPath.join('->');
  const filtered = allPaths.filter(p => p.path.join('->') !== shortestPathKey);

  // Sort ascending by distance
  filtered.sort((a, b) => a.distance - b.distance);

  // Take top K alternatives
  const selected = filtered.slice(0, maxAlternatives);

  return selected.map(item => {
    const breakdown: Array<{ from: string; to: string; distance: number; roadName?: string }> = [];
    for (let i = 0; i < item.path.length - 1; i++) {
      const u = item.path[i];
      const v = item.path[i + 1];
      const info = roadLookup.get(`${u}->${v}`) || { distance: 0 };
      breakdown.push({
        from: u,
        to: v,
        distance: info.distance,
        roadName: info.name,
      });
    }

    const extraKm = Math.round((item.distance - shortestDistance) * 10) / 10;
    const percentIncrease =
      shortestDistance > 0 ? Math.round(((item.distance - shortestDistance) / shortestDistance) * 1000) / 10 : 0;

    return {
      path: item.path,
      distance: item.distance,
      extraKm,
      percentIncrease,
      roadsCount: item.path.length - 1,
      breakdown,
    };
  });
}
