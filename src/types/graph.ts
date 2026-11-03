export type NodeType = 'warehouse' | 'hospital' | 'junction';

export type HospitalUrgency = 'Standard' | 'Urgent' | 'Critical';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  coordinates: { x: number; y: number };
  geoCoordinates?: { lat: number; lng: number };
  beds?: number;
  urgency?: HospitalUrgency;
  contactNumber?: string;
}

export interface GraphRoad {
  id: string;
  from: string;
  to: string;
  distance: number; // in kilometers, strictly non-negative
  bidirectional: boolean;
  name?: string;
  roadType?: 'Highway' | 'Avenue' | 'Local' | 'Expressway';
}

export interface DijkstraStep {
  stepIndex: number;
  type: 'select-node' | 'examine-neighbor' | 'relax-edge' | 'skip-edge' | 'destination-reached' | 'unreachable';
  currentNode: string;
  currentDistance: number;
  neighborNode?: string;
  edgeDistance?: number;
  candidateDistance?: number;
  updated: boolean;
  previousDistance?: number;
  newDistance?: number;
  predecessor?: string | null;
  distancesSnapshot: Record<string, number>;
  predecessorsSnapshot: Record<string, string | null>;
  visitedSnapshot: string[];
  queueSnapshot: Array<{ id: string; dist: number }>;
  description: string;
}

export interface DijkstraResult {
  sourceId: string;
  destinationId: string;
  distance: number; // Infinity if unreachable
  path: string[];
  predecessors: Record<string, string | null>;
  distances: Record<string, number>;
  steps: DijkstraStep[];
  reachable: boolean;
  visitedOrder: string[];
  executionTimeMs: number;
}

export interface AlternativeRoute {
  path: string[];
  distance: number;
  extraKm: number;
  percentIncrease: number;
  roadsCount: number;
  breakdown: Array<{ from: string; to: string; distance: number; roadName?: string }>;
}

export interface MedicalCargo {
  id: string;
  name: string;
  category: 'Vaccines' | 'Blood & Plasma' | 'Emergency Kit' | 'Organ Transport' | 'Surgical Supplies';
  temperatureControl: boolean;
  priority: 'Critical' | 'Urgent' | 'High' | 'Routine';
  weightKg: number;
}
