import { dijkstra } from './dijkstra';
import { SAMPLE_NODES, SAMPLE_ROADS } from '../data/sampleNetwork';
import { GraphNode, GraphRoad } from '../types/graph';

export interface TestCaseResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: string;
  durationMs: number;
}

export function runAllTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Helper
  const record = (
    id: number,
    name: string,
    category: string,
    fn: () => { passed: boolean; message: string; details?: string }
  ) => {
    const t0 = performance.now();
    try {
      const res = fn();
      const duration = Math.round((performance.now() - t0) * 100) / 100;
      results.push({
        id,
        name,
        category,
        passed: res.passed,
        message: res.message,
        details: res.details,
        durationMs: duration,
      });
    } catch (err: unknown) {
      const duration = Math.round((performance.now() - t0) * 100) / 100;
      results.push({
        id,
        name,
        category,
        passed: false,
        message: `Unexpected test failure: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: duration,
      });
    }
  };

  // Test 1: Simple graph with one route
  record(1, 'Simple Linear Graph (One Route)', 'Basic Paths', () => {
    const nodes: GraphNode[] = [
      { id: '1', name: 'N1', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: '2', name: 'N2', type: 'hospital', coordinates: { x: 10, y: 0 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R1', from: '1', to: '2', distance: 7, bidirectional: true },
    ];
    const res = dijkstra(nodes, roads, '1', '2');
    const passed = res.reachable && res.distance === 7 && res.path.join('->') === '1->2';
    return {
      passed,
      message: passed ? 'Calculated single road distance 7 km accurately.' : 'Failed single route calculation.',
      details: `Computed distance: ${res.distance} km, path: [${res.path.join(', ')}]`,
    };
  });

  // Test 2: Direct route is longer than indirect route
  record(2, 'Indirect Route Shorter than Direct', 'Optimization', () => {
    const nodes: GraphNode[] = [
      { id: 'A', name: 'A', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'B', name: 'B', type: 'junction', coordinates: { x: 5, y: 5 } },
      { id: 'C', name: 'C', type: 'hospital', coordinates: { x: 10, y: 0 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R1', from: 'A', to: 'C', distance: 15, bidirectional: true }, // Direct: 15
      { id: 'R2', from: 'A', to: 'B', distance: 4, bidirectional: true },
      { id: 'R3', from: 'B', to: 'C', distance: 3, bidirectional: true }, // Indirect: 4 + 3 = 7
    ];
    const res = dijkstra(nodes, roads, 'A', 'C');
    const passed = res.distance === 7 && res.path.join('->') === 'A->B->C';
    return {
      passed,
      message: passed ? 'Correctly preferred indirect path (7 km) over direct highway (15 km).' : 'Failed indirect preference.',
      details: `Selected distance: ${res.distance} km (Path: ${res.path.join(' -> ')})`,
    };
  });

  // Test 3: Graph with multiple possible routes
  record(3, 'Multi-Path Diamond Graph', 'Routing', () => {
    const nodes: GraphNode[] = [
      { id: 'S', name: 'Start', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'X', name: 'Upper', type: 'junction', coordinates: { x: 5, y: -5 } },
      { id: 'Y', name: 'Lower', type: 'junction', coordinates: { x: 5, y: 5 } },
      { id: 'D', name: 'Dest', type: 'hospital', coordinates: { x: 10, y: 0 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R1', from: 'S', to: 'X', distance: 5, bidirectional: true },
      { id: 'R2', from: 'X', to: 'D', distance: 6, bidirectional: true }, // Top: 11
      { id: 'R3', from: 'S', to: 'Y', distance: 2, bidirectional: true },
      { id: 'R4', from: 'Y', to: 'D', distance: 4, bidirectional: true }, // Bottom: 6
    ];
    const res = dijkstra(nodes, roads, 'S', 'D');
    const passed = res.distance === 6 && res.path.join('->') === 'S->Y->D';
    return {
      passed,
      message: passed ? 'Found lowest cost path of 6 km among multiple alternative options.' : 'Multi-path selection failed.',
      details: `Selected: ${res.path.join(' -> ')} with distance ${res.distance} km`,
    };
  });

  // Test 4: Disconnected destination
  record(4, 'Disconnected Destination (Unreachable)', 'Edge Cases', () => {
    const nodes: GraphNode[] = [
      { id: 'W', name: 'Warehouse', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'H_ISOLATED', name: 'Remote Island Clinic', type: 'hospital', coordinates: { x: 50, y: 50 } },
    ];
    const roads: GraphRoad[] = []; // No road
    const res = dijkstra(nodes, roads, 'W', 'H_ISOLATED');
    const passed = !res.reachable && res.distance === Infinity && res.path.length === 0;
    return {
      passed,
      message: passed ? 'Correctly flagged disconnected destination as unreachable with Infinity distance.' : 'Failed unreachable check.',
      details: `Reachable: ${res.reachable}, Distance: ${res.distance}`,
    };
  });

  // Test 5: Source equals destination
  record(5, 'Source Identical to Destination', 'Edge Cases', () => {
    const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', 'W');
    const passed = res.reachable && res.distance === 0 && res.path.length === 1 && res.path[0] === 'W';
    return {
      passed,
      message: passed ? 'Returned 0 km and single-node path for source == destination.' : 'Failed source==destination check.',
      details: `Distance: ${res.distance} km, path: [${res.path.join(', ')}]`,
    };
  });

  // Test 6: Graph with cycles
  record(6, 'Graph with Cycles and Loops', 'Graph Traversal', () => {
    const nodes: GraphNode[] = [
      { id: 'A', name: 'A', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'B', name: 'B', type: 'junction', coordinates: { x: 10, y: 0 } },
      { id: 'C', name: 'C', type: 'junction', coordinates: { x: 10, y: 10 } },
      { id: 'D', name: 'D', type: 'hospital', coordinates: { x: 20, y: 10 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R1', from: 'A', to: 'B', distance: 3, bidirectional: true },
      { id: 'R2', from: 'B', to: 'C', distance: 2, bidirectional: true },
      { id: 'R3', from: 'C', to: 'A', distance: 4, bidirectional: true }, // Triangle cycle
      { id: 'R4', from: 'C', to: 'D', distance: 1, bidirectional: true },
    ];
    const res = dijkstra(nodes, roads, 'A', 'D');
    // Path A -> C -> D = 4 + 1 = 5 vs A -> B -> C -> D = 3 + 2 + 1 = 6
    const passed = res.distance === 5 && res.path.join('->') === 'A->C->D';
    return {
      passed,
      message: passed ? 'Properly resolved cycle, avoided loops, and identified optimal 5 km route.' : 'Failed cycle traversal.',
      details: `Computed distance: ${res.distance} km (Path: ${res.path.join(' -> ')})`,
    };
  });

  // Test 7: Multiple equally short paths (deterministic tie-breaking)
  record(7, 'Multiple Equally Short Paths (Deterministic)', 'Tie-Breaking', () => {
    const nodes: GraphNode[] = [
      { id: 'S', name: 'Start', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'M1', name: 'Path 1', type: 'junction', coordinates: { x: 5, y: -5 } },
      { id: 'M2', name: 'Path 2', type: 'junction', coordinates: { x: 5, y: 5 } },
      { id: 'E', name: 'End', type: 'hospital', coordinates: { x: 10, y: 0 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R1', from: 'S', to: 'M1', distance: 5, bidirectional: true },
      { id: 'R2', from: 'M1', to: 'E', distance: 5, bidirectional: true },
      { id: 'R3', from: 'S', to: 'M2', distance: 5, bidirectional: true },
      { id: 'R4', from: 'M2', to: 'E', distance: 5, bidirectional: true },
    ];
    const run1 = dijkstra(nodes, roads, 'S', 'E');
    const run2 = dijkstra(nodes, roads, 'S', 'E');
    const passed = run1.distance === 10 && run1.path.join('->') === run2.path.join('->');
    return {
      passed,
      message: passed ? 'Deterministic tie-breaking generated identical reproducible results.' : 'Tie-breaking was non-deterministic.',
      details: `Chosen path: ${run1.path.join(' -> ')} (10 km)`,
    };
  });

  // Test 8: Invalid negative distance rejection
  record(8, 'Validation: Reject Negative Distances', 'Validation', () => {
    const nodes: GraphNode[] = [
      { id: 'A', name: 'A', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'B', name: 'B', type: 'hospital', coordinates: { x: 10, y: 0 } },
    ];
    const roads: GraphRoad[] = [
      { id: 'R_NEG', from: 'A', to: 'B', distance: -5, bidirectional: true },
    ];
    let threw = false;
    let errorMessage = '';
    try {
      dijkstra(nodes, roads, 'A', 'B');
    } catch (e: unknown) {
      threw = true;
      errorMessage = e instanceof Error ? e.message : String(e);
    }
    const passed = threw && errorMessage.includes('negative');
    return {
      passed,
      message: passed ? 'Correctly threw validation error rejecting negative edge weight.' : 'Failed to reject negative distance.',
      details: errorMessage,
    };
  });

  // Test 9: Single-node graph
  record(9, 'Single Node Isolated Graph', 'Edge Cases', () => {
    const nodes: GraphNode[] = [
      { id: 'SOLO', name: 'Solo Warehouse', type: 'warehouse', coordinates: { x: 0, y: 0 } },
    ];
    const res = dijkstra(nodes, [], 'SOLO', 'SOLO');
    const passed = res.reachable && res.distance === 0 && res.path.length === 1;
    return {
      passed,
      message: passed ? 'Handled single-node graph gracefully (distance 0 km).' : 'Failed single-node test.',
      details: `Distance: ${res.distance} km`,
    };
  });

  // Test 10: Graph changes after adding/deleting road
  record(10, 'Dynamic Graph Mutation (Add & Remove Road)', 'Dynamic Updates', () => {
    const nodes: GraphNode[] = [
      { id: 'W', name: 'Warehouse', type: 'warehouse', coordinates: { x: 0, y: 0 } },
      { id: 'A', name: 'Junction A', type: 'junction', coordinates: { x: 10, y: 0 } },
      { id: 'H', name: 'Hospital', type: 'hospital', coordinates: { x: 20, y: 0 } },
    ];
    const baseRoads: GraphRoad[] = [
      { id: 'R1', from: 'W', to: 'A', distance: 10, bidirectional: true },
      { id: 'R2', from: 'A', to: 'H', distance: 10, bidirectional: true },
    ];
    const resBefore = dijkstra(nodes, baseRoads, 'W', 'H'); // 20 km

    // Add direct expressway
    const roadsWithExpressway: GraphRoad[] = [
      ...baseRoads,
      { id: 'R_EXP', from: 'W', to: 'H', distance: 8, bidirectional: true },
    ];
    const resAfterAdd = dijkstra(nodes, roadsWithExpressway, 'W', 'H'); // 8 km

    // Delete base roads
    const roadsOnlyExpressway = roadsWithExpressway.filter(r => r.id === 'R_EXP');
    const resOnlyExp = dijkstra(nodes, roadsOnlyExpressway, 'W', 'H');

    const passed = resBefore.distance === 20 && resAfterAdd.distance === 8 && resOnlyExp.distance === 8;
    return {
      passed,
      message: passed ? 'Dynamic route recalculation immediately adapts to road additions and deletions.' : 'Dynamic adaptation failed.',
      details: `Before: ${resBefore.distance} km -> Added shortcut: ${resAfterAdd.distance} km`,
    };
  });

  // Test 11-14: Sample Network Exact Verifications (Requirement 6 & 16)
  record(11, 'Sample Network: W → City Hospital (H1)', 'Benchmark Verification', () => {
    const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', 'H1');
    const expectedDist = 10;
    const expectedPath = 'W->B->A->C->H1';
    const actualPath = res.path.join('->');
    const passed = res.distance === expectedDist && actualPath === expectedPath;
    return {
      passed,
      message: passed
        ? `Verified: W → H1 is exactly ${expectedDist} km via W → B → A → C → H1.`
        : `Expected ${expectedDist} km (${expectedPath}), got ${res.distance} km (${actualPath}).`,
      details: `Calculated path: ${res.path.join(' → ')}, Distance: ${res.distance} km`,
    };
  });

  record(12, 'Sample Network: W → General Hospital (H2)', 'Benchmark Verification', () => {
    const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', 'H2');
    const expectedDist = 13;
    const expectedPath = 'W->B->A->C->H1->H2';
    const actualPath = res.path.join('->');
    const passed = res.distance === expectedDist && actualPath === expectedPath;
    return {
      passed,
      message: passed
        ? `Verified: W → H2 is exactly ${expectedDist} km via W → B → A → C → H1 → H2.`
        : `Expected ${expectedDist} km (${expectedPath}), got ${res.distance} km (${actualPath}).`,
      details: `Calculated path: ${res.path.join(' → ')}, Distance: ${res.distance} km`,
    };
  });

  record(13, 'Sample Network: W → Emergency Hospital (H3)', 'Benchmark Verification', () => {
    const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', 'H3');
    const expectedDist = 14;
    const expectedPath = 'W->B->A->C->H1->H3';
    const actualPath = res.path.join('->');
    const passed = res.distance === expectedDist && actualPath === expectedPath;
    return {
      passed,
      message: passed
        ? `Verified: W → H3 is exactly ${expectedDist} km via W → B → A → C → H1 → H3.`
        : `Expected ${expectedDist} km (${expectedPath}), got ${res.distance} km (${actualPath}).`,
      details: `Calculated path: ${res.path.join(' → ')}, Distance: ${res.distance} km`,
    };
  });

  record(14, 'Sample Network: W → Children\'s Hospital (H4)', 'Benchmark Verification', () => {
    const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', 'H4');
    const expectedDist = 15;
    const expectedPath = 'W->B->A->C->H1->H2->H4';
    const actualPath = res.path.join('->');
    const passed = res.distance === expectedDist && actualPath === expectedPath;
    return {
      passed,
      message: passed
        ? `Verified: W → H4 is exactly ${expectedDist} km via W → B → A → C → H1 → H2 → H4.`
        : `Expected ${expectedDist} km (${expectedPath}), got ${res.distance} km (${actualPath}).`,
      details: `Calculated path: ${res.path.join(' → ')}, Distance: ${res.distance} km`,
    };
  });

  // Test 15: Visualized route distance equals sum of edge weights
  record(15, 'Visualized Distance Equals Sum of Edge Weights', 'Mathematical Integrity', () => {
    const destinations = ['H1', 'H2', 'H3', 'H4'];
    let allMatch = true;
    const explanations: string[] = [];

    const roadMap = new Map<string, number>();
    for (const r of SAMPLE_ROADS) {
      roadMap.set(`${r.from}->${r.to}`, r.distance);
      if (r.bidirectional) {
        roadMap.set(`${r.to}->${r.from}`, r.distance);
      }
    }

    for (const d of destinations) {
      const res = dijkstra(SAMPLE_NODES, SAMPLE_ROADS, 'W', d);
      let sumOfWeights = 0;
      for (let i = 0; i < res.path.length - 1; i++) {
        const u = res.path[i];
        const v = res.path[i + 1];
        const w = roadMap.get(`${u}->${v}`) ?? 0;
        sumOfWeights += w;
      }
      if (sumOfWeights !== res.distance) {
        allMatch = false;
      }
      explanations.push(`${d}: ${sumOfWeights} km == ${res.distance} km`);
    }

    return {
      passed: allMatch,
      message: allMatch
        ? 'All path distances rigorously match the sum of individual road edge weights.'
        : 'Discrepancy detected between path distance and edge weight sum.',
      details: explanations.join('; '),
    };
  });

  return results;
}
