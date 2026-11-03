import React from 'react';
import {
  Navigation2,
  XCircle,
  PlusCircle,
  GitFork,
  RotateCcw,
  Package,
  Layers,
  Map,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GraphNode, MedicalCargo } from '../types/graph';

interface RouteControlsProps {
  nodes: GraphNode[];
  sourceId: string;
  destinationId: string;
  selectedCargo: MedicalCargo;
  cargos: MedicalCargo[];
  activeView: 'graph' | 'map';
  isCalculating: boolean;
  onSourceChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  onCargoChange: (cargo: MedicalCargo) => void;
  onViewChange: (view: 'graph' | 'map') => void;
  onFindRoute: () => void;
  onClearRoute: () => void;
  onOpenAddHospital: () => void;
  onOpenAddRoad: () => void;
  onResetNetwork: () => void;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  nodes,
  sourceId,
  destinationId,
  selectedCargo,
  cargos,
  activeView,
  isCalculating,
  onSourceChange,
  onDestinationChange,
  onCargoChange,
  onViewChange,
  onFindRoute,
  onClearRoute,
  onOpenAddHospital,
  onOpenAddRoad,
  onResetNetwork,
}) => {
  const warehouses = nodes.filter(n => n.type === 'warehouse');
  const hospitals = nodes.filter(n => n.type === 'hospital');
  const junctions = nodes.filter(n => n.type === 'junction');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Title & View Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Navigation2 className="w-4 h-4 mr-1.5 text-blue-600" />
            Route Dispatch Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure source, destination & payload</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => onViewChange('graph')}
            className={`flex items-center px-2.5 py-1 rounded-md transition ${
              activeView === 'graph'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Interactive Dijkstra Topology Graph"
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            Graph
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`flex items-center px-2.5 py-1 rounded-md transition ${
              activeView === 'map'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Geographic Logistics Map (Leaflet / OpenStreetMap)"
          >
            <Map className="w-3.5 h-3.5 mr-1" />
            Geo Map
          </button>
        </div>
      </div>

      {/* Source Location Dropdown */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          1. Origin Location
        </label>
        <div className="relative">
          <select
            value={sourceId}
            onChange={e => onSourceChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
          >
            <optgroup label="Central Distribution Warehouses">
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.id}) — Hub
                </option>
              ))}
            </optgroup>
            {hospitals.length > 0 && (
              <optgroup label="Inter-Hospital Transfers">
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.id})
                  </option>
                ))}
              </optgroup>
            )}
            {junctions.length > 0 && (
              <optgroup label="Junction Points">
                {junctions.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.id})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Destination Hospital Dropdown */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
          <span>2. Destination Hospital</span>
          <span className="text-[11px] text-blue-600 normal-case font-normal">
            {hospitals.length} destinations
          </span>
        </label>
        <div className="relative">
          <select
            value={destinationId}
            onChange={e => onDestinationChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
          >
            <option value="" disabled>
              -- Select Destination Hospital --
            </option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.id}) — {h.urgency ? `[${h.urgency}]` : ''} {h.beds ? `(${h.beds} beds)` : ''}
              </option>
            ))}
            {junctions.length > 0 && (
              <optgroup label="Other Waypoints">
                {junctions.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.id})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Medical Cargo / Supply Selector */}
      <div className="pt-1">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
          <span className="flex items-center">
            <Package className="w-3.5 h-3.5 mr-1 text-slate-500" />
            3. Medical Cargo Payload
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              selectedCargo.priority === 'Critical'
                ? 'bg-red-100 text-red-700'
                : selectedCargo.priority === 'Urgent'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {selectedCargo.priority} Priority
          </span>
        </label>
        <select
          value={selectedCargo.id}
          onChange={e => {
            const found = cargos.find(c => c.id === e.target.value);
            if (found) onCargoChange(found);
          }}
          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
        >
          {cargos.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.category} • {c.weightKg} kg)
            </option>
          ))}
        </select>
        {selectedCargo.temperatureControl && (
          <p className="mt-1 text-[11px] text-cyan-700 flex items-center">
            <Clock className="w-3 h-3 mr-1 shrink-0" />
            Active cold chain monitoring enabled (2°C - 8°C)
          </p>
        )}
      </div>

      {/* Action Buttons: Find Route & Clear Route */}
      <div className="pt-2 space-y-2">
        <button
          onClick={onFindRoute}
          disabled={!destinationId || isCalculating}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {isCalculating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running Dijkstra...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Find Shortest Route</span>
            </>
          )}
        </button>

        <button
          onClick={onClearRoute}
          className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 font-medium text-xs transition flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <XCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear Route Highlight</span>
        </button>
      </div>

      {/* Network Modification Actions */}
      <div className="pt-3 border-t border-slate-200">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Graph Editing
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAddHospital}
            className="py-2 px-2.5 rounded-lg border border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Add Hospital</span>
          </button>

          <button
            onClick={onOpenAddRoad}
            className="py-2 px-2.5 rounded-lg border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-xs"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Add Road</span>
          </button>
        </div>

        <button
          onClick={onResetNetwork}
          className="mt-2 w-full py-1.5 px-2 text-[11px] text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded transition flex items-center justify-center space-x-1"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset Demo Road Network</span>
        </button>
      </div>
    </div>
  );
};
