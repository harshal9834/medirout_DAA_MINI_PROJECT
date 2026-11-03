import { SAMPLE_NODES, SAMPLE_ROADS } from '../data/sampleNetwork';
import { GraphNode, GraphRoad } from '../types/graph';
import { validateGraphStructure } from './graphValidation';

const STORAGE_KEY = 'mediroute_graph_data_v1';

export interface StoredGraphData {
  version: number;
  updatedAt: string;
  nodes: GraphNode[];
  roads: GraphRoad[];
}

export function loadSavedNetwork(): { nodes: GraphNode[]; roads: GraphRoad[]; isDefault: boolean; error?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { nodes: SAMPLE_NODES, roads: SAMPLE_ROADS, isDefault: true };
    }

    const parsed: StoredGraphData = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.roads)) {
      console.warn('Invalid graph structure in LocalStorage, falling back to default sample network.');
      return { nodes: SAMPLE_NODES, roads: SAMPLE_ROADS, isDefault: true };
    }

    const issues = validateGraphStructure(parsed.nodes, parsed.roads);
    const fatalErrors = issues.filter(i => i.type === 'error');
    if (fatalErrors.length > 0) {
      console.warn('LocalStorage graph contains fatal validation errors:', fatalErrors);
      return {
        nodes: SAMPLE_NODES,
        roads: SAMPLE_ROADS,
        isDefault: true,
        error: `Stored data had errors (${fatalErrors[0].message}), restored sample network.`,
      };
    }

    return { nodes: parsed.nodes, roads: parsed.roads, isDefault: false };
  } catch (err: unknown) {
    console.error('Failed to parse stored graph from LocalStorage:', err);
    return { nodes: SAMPLE_NODES, roads: SAMPLE_ROADS, isDefault: true };
  }
}

export function saveNetwork(nodes: GraphNode[], roads: GraphRoad[]): boolean {
  try {
    const payload: StoredGraphData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      nodes,
      roads,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to save network to LocalStorage:', err);
    return false;
  }
}

export function resetToSampleNetwork(): { nodes: GraphNode[]; roads: GraphRoad[] } {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear LocalStorage:', err);
  }
  return { nodes: SAMPLE_NODES, roads: SAMPLE_ROADS };
}

export function exportNetworkAsJSON(nodes: GraphNode[], roads: GraphRoad[]): void {
  const data = {
    appName: 'MediRoute AI',
    exportedAt: new Date().toISOString(),
    nodes,
    roads,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mediroute-network-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(jsonString: string): { nodes: GraphNode[]; roads: GraphRoad[]; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.roads)) {
      return { nodes: [], roads: [], error: 'Invalid JSON file: Must contain "nodes" and "roads" arrays.' };
    }

    const issues = validateGraphStructure(data.nodes, data.roads);
    const fatal = issues.filter(i => i.type === 'error');
    if (fatal.length > 0) {
      return { nodes: [], roads: [], error: fatal.map(f => f.message).join(' | ') };
    }

    return { nodes: data.nodes, roads: data.roads };
  } catch (err: unknown) {
    return { nodes: [], roads: [], error: `JSON Parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
