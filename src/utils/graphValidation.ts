import { GraphNode, GraphRoad } from '../types/graph';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

export function validateGraphStructure(
  nodes: GraphNode[],
  roads: GraphRoad[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set<string>();

  // Validate nodes
  for (const node of nodes) {
    if (!node.id || node.id.trim() === '') {
      issues.push({ type: 'error', message: 'A node exists without a valid ID.' });
    } else if (nodeIds.has(node.id)) {
      issues.push({ type: 'error', message: `Duplicate node ID detected: "${node.id}".` });
    } else {
      nodeIds.add(node.id);
    }

    if (!node.name || node.name.trim() === '') {
      issues.push({ type: 'warning', message: `Node "${node.id}" has no display name.` });
    }
  }

  // Check if warehouse exists
  const hasWarehouse = nodes.some(n => n.type === 'warehouse');
  if (!hasWarehouse) {
    issues.push({ type: 'warning', message: 'No Medical Warehouse node found in the network.' });
  }

  // Validate roads
  const roadPairs = new Set<string>();

  for (const road of roads) {
    if (!nodeIds.has(road.from)) {
      issues.push({
        type: 'error',
        message: `Road "${road.id || 'unnamed'}" starting location "${road.from}" does not exist in nodes list.`,
      });
    }
    if (!nodeIds.has(road.to)) {
      issues.push({
        type: 'error',
        message: `Road "${road.id || 'unnamed'}" destination "${road.to}" does not exist in nodes list.`,
      });
    }
    if (road.from === road.to) {
      issues.push({
        type: 'error',
        message: `Road "${road.id}" is a self-loop on node "${road.from}". Self-loops are not valid roads.`,
      });
    }
    if (typeof road.distance !== 'number' || isNaN(road.distance)) {
      issues.push({
        type: 'error',
        message: `Road "${road.id}" has an invalid non-numeric distance.`,
      });
    } else if (road.distance < 0) {
      issues.push({
        type: 'error',
        message: `Road "${road.id}" has negative distance (${road.distance} km). Dijkstra's Algorithm requires non-negative weights.`,
      });
    } else if (road.distance === 0) {
      issues.push({
        type: 'warning',
        message: `Road "${road.id}" has 0 km distance.`,
      });
    }

    // Check duplicate roads
    const directKey = `${road.from}::${road.to}`;
    const reverseKey = `${road.to}::${road.from}`;

    if (roadPairs.has(directKey) || (road.bidirectional && roadPairs.has(reverseKey))) {
      issues.push({
        type: 'warning',
        message: `Parallel or duplicate road detected between "${road.from}" and "${road.to}".`,
      });
    } else {
      roadPairs.add(directKey);
      if (road.bidirectional) {
        roadPairs.add(reverseKey);
      }
    }
  }

  return issues;
}
