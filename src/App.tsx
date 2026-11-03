/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { RouteControls } from './components/RouteControls';
import { NetworkGraph } from './components/NetworkGraph';
import { GeoLogisticsMap } from './components/GeoLogisticsMap';
import { RouteResults } from './components/RouteResults';
import { AlgorithmVisualizer } from './components/AlgorithmVisualizer';
import { RouteComparison } from './components/RouteComparison';
import { AddHospitalModal } from './components/AddHospitalModal';
import { AddRoadModal } from './components/AddRoadModal';
import { EditNodeRoadModal } from './components/EditNodeRoadModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { HelpModal } from './components/HelpModal';

import { GraphNode, GraphRoad, DijkstraResult, AlternativeRoute, MedicalCargo } from './types/graph';
import { SAMPLE_NODES, SAMPLE_ROADS, SAMPLE_CARGOS } from './data/sampleNetwork';
import { dijkstra } from './algorithms/dijkstra';
import { findAlternativeRoutes } from './algorithms/alternativeRoutes';
import {
  loadSavedNetwork,
  saveNetwork,
  resetToSampleNetwork,
  exportNetworkAsJSON,
  parseImportedJSON,
} from './utils/storage';
import { AlertTriangle, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function App() {
  // Load initial graph from LocalStorage
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    const loaded = loadSavedNetwork();
    return loaded.nodes;
  });

  const [roads, setRoads] = useState<GraphRoad[]>(() => {
    const loaded = loadSavedNetwork();
    return loaded.roads;
  });

  const [isCustomized, setIsCustomized] = useState<boolean>(() => {
    const loaded = loadSavedNetwork();
    return !loaded.isDefault;
  });

  // Selection states
  const [sourceId, setSourceId] = useState<string>('W');
  const [destinationId, setDestinationId] = useState<string>('H1');
  const [selectedCargo, setSelectedCargo] = useState<MedicalCargo>(SAMPLE_CARGOS[0]);
  const [activeView, setActiveView] = useState<'graph' | 'map'>('graph');

  // Algorithm states
  const [dijkstraResult, setDijkstraResult] = useState<DijkstraResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showVisualizer, setShowVisualizer] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isVehicleAnimating, setIsVehicleAnimating] = useState<boolean>(false);

  // Modal states
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [isAddRoadOpen, setIsAddRoadOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<GraphNode | null>(null);
  const [selectedRoadForEdit, setSelectedRoadForEdit] = useState<GraphRoad | null>(null);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    saveNetwork(nodes, roads);
  }, [nodes, roads]);

  // Ensure source and destination exist in current nodes
  useEffect(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    if (!nodeIds.has(sourceId)) {
      const warehouse = nodes.find(n => n.type === 'warehouse');
      if (warehouse) setSourceId(warehouse.id);
      else if (nodes.length > 0) setSourceId(nodes[0].id);
    }
    if (destinationId && !nodeIds.has(destinationId)) {
      const firstHospital = nodes.find(n => n.type === 'hospital');
      setDestinationId(firstHospital ? firstHospital.id : '');
    }
  }, [nodes, sourceId, destinationId]);

  // Calculate shortest path
  const computeRoute = useCallback(
    (src: string, dest: string) => {
      if (!src || !dest) {
        setDijkstraResult(null);
        setAlternativeRoutes([]);
        setHighlightedPath([]);
        return;
      }

      try {
        setIsCalculating(true);
        const result = dijkstra(nodes, roads, src, dest);
        setDijkstraResult(result);
        setHighlightedPath(result.path);
        setActiveStepIndex(0);

        if (result.reachable && result.distance !== Infinity) {
          const alts = findAlternativeRoutes(
            nodes,
            roads,
            src,
            dest,
            result.distance,
            result.path,
            3
          );
          setAlternativeRoutes(alts);
        } else {
          setAlternativeRoutes([]);
        }
      } catch (err: unknown) {
        console.error('Error running Dijkstra Algorithm:', err);
        showToast(err instanceof Error ? err.message : 'Error computing route');
      } finally {
        setIsCalculating(false);
      }
    },
    [nodes, roads, showToast]
  );

  // Initial calculation on load
  useEffect(() => {
    if (sourceId && destinationId) {
      computeRoute(sourceId, destinationId);
    }
  }, [sourceId, destinationId, computeRoute]);

  // Calculate Reachable Hospitals count dynamically
  const reachableHospitalsCount = useMemo(() => {
    if (!sourceId) return 0;
    const hospitalNodes = nodes.filter(n => n.type === 'hospital');
    try {
      let reachable = 0;
      for (const h of hospitalNodes) {
        const res = dijkstra(nodes, roads, sourceId, h.id);
        if (res.reachable && res.distance !== Infinity) {
          reachable++;
        }
      }
      return reachable;
    } catch {
      return 0;
    }
  }, [nodes, roads, sourceId]);

  // Handle Find Shortest Route action
  const handleFindRoute = () => {
    computeRoute(sourceId, destinationId);
    showToast('Shortest route calculated using Dijkstra’s Algorithm');
  };

  // Clear route highlight
  const handleClearRoute = () => {
    setDijkstraResult(null);
    setAlternativeRoutes([]);
    setHighlightedPath([]);
    setShowVisualizer(false);
    setIsVehicleAnimating(false);
    showToast('Route cleared');
  };

  // Node position update (from drag)
  const handleUpdateNodeCoordinates = (id: string, x: number, y: number) => {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, coordinates: { x, y } } : n))
    );
  };

  // Add hospital
  const handleAddNode = (newNode: GraphNode) => {
    setNodes(prev => [...prev, newNode]);
    setIsCustomized(true);
    showToast(`Added ${newNode.name} (${newNode.id})`);
  };

  // Add road
  const handleAddRoad = (newRoad: GraphRoad) => {
    setRoads(prev => [...prev, newRoad]);
    setIsCustomized(true);
    showToast(`Added road connection between ${newRoad.from} and ${newRoad.to}`);
  };

  // Inspect / Edit node
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNodeForEdit(node);
    setSelectedRoadForEdit(null);
    setIsEditModalOpen(true);
  };

  // Inspect / Edit road
  const handleRoadClick = (road: GraphRoad) => {
    setSelectedRoadForEdit(road);
    setSelectedNodeForEdit(null);
    setIsEditModalOpen(true);
  };

  // Update existing node
  const handleUpdateNode = (updated: GraphNode) => {
    setNodes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
    setIsCustomized(true);
    showToast(`Updated ${updated.name}`);
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setRoads(prev => prev.filter(r => r.from !== id && r.to !== id));
    setIsCustomized(true);
    showToast(`Deleted node ${id} and connected roads`);
  };

  // Update existing road
  const handleUpdateRoad = (updated: GraphRoad) => {
    setRoads(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    setIsCustomized(true);
    showToast(`Updated road (${updated.distance} km)`);
  };

  // Delete road
  const handleDeleteRoad = (id: string) => {
    setRoads(prev => prev.filter(r => r.id !== id));
    setIsCustomized(true);
    showToast('Deleted road connection');
  };

  // Reset to default sample network
  const handleConfirmReset = () => {
    const { nodes: sampleN, roads: sampleR } = resetToSampleNetwork();
    setNodes(sampleN);
    setRoads(sampleR);
    setSourceId('W');
    setDestinationId('H1');
    setIsCustomized(false);
    setIsResetConfirmOpen(false);
    showToast('Restored default sample road network');
  };

  // Import JSON
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      const parsed = parseImportedJSON(content);
      if (parsed.error) {
        showToast(`Import Error: ${parsed.error}`);
      } else {
        setNodes(parsed.nodes);
        setRoads(parsed.roads);
        setIsCustomized(true);
        showToast('Successfully imported road network');
      }
    };
    reader.readAsText(file);
  };

  // Export JSON
  const handleExportJSON = () => {
    exportNetworkAsJSON(nodes, roads);
    showToast('Exported network as JSON file');
  };

  const selectedDestinationNode = nodes.find(n => n.id === destinationId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        totalNodes={nodes.length}
        totalRoads={roads.length}
        reachableCount={reachableHospitalsCount}
        onResetNetwork={() => setIsResetConfirmOpen(true)}
        onOpenTests={() => setIsTestRunnerOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        isCustomized={isCustomized}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <StatsCards
          totalHospitals={nodes.filter(n => n.type === 'hospital').length}
          totalRoads={roads.length}
          reachableHospitals={reachableHospitalsCount}
          selectedRouteDistance={dijkstraResult ? dijkstraResult.distance : null}
          selectedDestinationName={selectedDestinationNode?.name}
          isReachable={dijkstraResult ? dijkstraResult.reachable : undefined}
        />

        {/* Primary 3-Section Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Route Controls (4 cols on lg, 3 on xl) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <RouteControls
              nodes={nodes}
              sourceId={sourceId}
              destinationId={destinationId}
              selectedCargo={selectedCargo}
              cargos={SAMPLE_CARGOS}
              activeView={activeView}
              isCalculating={isCalculating}
              onSourceChange={setSourceId}
              onDestinationChange={setDestinationId}
              onCargoChange={setSelectedCargo}
              onViewChange={setActiveView}
              onFindRoute={handleFindRoute}
              onClearRoute={handleClearRoute}
              onOpenAddHospital={() => setIsAddHospitalOpen(true)}
              onOpenAddRoad={() => setIsAddRoadOpen(true)}
              onResetNetwork={() => setIsResetConfirmOpen(true)}
            />
          </div>

          {/* Center Panel: Network Visualization (8 cols on lg, 5 on xl) */}
          <div className="lg:col-span-8 xl:col-span-5 space-y-6">
            {activeView === 'graph' ? (
              <NetworkGraph
                nodes={nodes}
                roads={roads}
                sourceId={sourceId}
                destinationId={destinationId}
                shortestPath={highlightedPath}
                activeStep={
                  showVisualizer && dijkstraResult
                    ? dijkstraResult.steps[activeStepIndex]
                    : null
                }
                animatingVehicle={isVehicleAnimating}
                onNodeClick={handleNodeClick}
                onRoadClick={handleRoadClick}
                onUpdateNodeCoordinates={handleUpdateNodeCoordinates}
              />
            ) : (
              <GeoLogisticsMap
                nodes={nodes}
                roads={roads}
                sourceId={sourceId}
                destinationId={destinationId}
                shortestPath={highlightedPath}
                onSelectDestination={id => {
                  setDestinationId(id);
                  setActiveView('graph');
                }}
              />
            )}

            {/* Step-by-Step Algorithm Visualizer Section */}
            {showVisualizer && dijkstraResult && (
              <AlgorithmVisualizer
                steps={dijkstraResult.steps}
                nodes={nodes}
                currentStepIndex={activeStepIndex}
                onStepChange={setActiveStepIndex}
                sourceId={sourceId}
                destinationId={destinationId}
              />
            )}
          </div>

          {/* Right Panel: Route Results & Route Comparison (12 cols on lg, 4 on xl) */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <RouteResults
              result={dijkstraResult}
              nodes={nodes}
              roads={roads}
              selectedCargo={selectedCargo}
              onStartStepAnimation={() => {
                setShowVisualizer(true);
                setActiveStepIndex(0);
                setActiveView('graph');
              }}
              onDispatchVehicle={() => {
                setIsVehicleAnimating(!isVehicleAnimating);
                setActiveView('graph');
              }}
              isVehicleAnimating={isVehicleAnimating}
            />

            {/* Route Comparison Section */}
            {dijkstraResult && dijkstraResult.reachable && (
              <RouteComparison
                shortestDistance={dijkstraResult.distance}
                shortestPath={dijkstraResult.path}
                alternatives={alternativeRoutes}
                nodes={nodes}
                onSelectPathToHighlight={setHighlightedPath}
                highlightedPath={highlightedPath}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>MediRoute AI</strong> — Medical Supply Shortest Path Finder using Dijkstra’s
            Algorithm. Designed for healthcare logistics resilience.
          </p>
          <p className="font-mono text-slate-400">
            TypeScript Dijkstra • Priority Queue • Graph Visualizer
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AddHospitalModal
        isOpen={isAddHospitalOpen}
        onClose={() => setIsAddHospitalOpen(false)}
        onAddNode={handleAddNode}
        existingNodes={nodes}
      />

      <AddRoadModal
        isOpen={isAddRoadOpen}
        onClose={() => setIsAddRoadOpen(false)}
        onAddRoad={handleAddRoad}
        nodes={nodes}
        existingRoads={roads}
      />

      <EditNodeRoadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNodeForEdit(null);
          setSelectedRoadForEdit(null);
        }}
        selectedNode={selectedNodeForEdit}
        selectedRoad={selectedRoadForEdit}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onUpdateRoad={handleUpdateRoad}
        onDeleteRoad={handleDeleteRoad}
        onSelectAsDestination={id => {
          setDestinationId(id);
          showToast(`Destination set to ${id}`);
        }}
      />

      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Reset Demo Network?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This will restore the original benchmark road network with 8 locations and 12 roads.
              Any custom hospitals or roads you added will be discarded.
            </p>
            <div className="flex items-center justify-end space-x-2.5 mt-6">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Reset Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
