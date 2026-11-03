import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Route,
  Navigation,
  Clock,
  Truck,
  PlayCircle,
  ThermometerSnowflake,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { DijkstraResult, GraphNode, GraphRoad, MedicalCargo } from '../types/graph';

interface RouteResultsProps {
  result: DijkstraResult | null;
  nodes: GraphNode[];
  roads: GraphRoad[];
  selectedCargo: MedicalCargo;
  onStartStepAnimation: () => void;
  onDispatchVehicle: () => void;
  isVehicleAnimating: boolean;
}

export const RouteResults: React.FC<RouteResultsProps> = ({
  result,
  nodes,
  roads,
  selectedCargo,
  onStartStepAnimation,
  onDispatchVehicle,
  isVehicleAnimating,
}) => {
  const nodeMap = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Lookup for roads to obtain road name and verify distance
  const roadLookup = React.useMemo(() => {
    const map = new Map<string, { distance: number; name?: string; roadType?: string }>();
    for (const r of roads) {
      map.set(`${r.from}->${r.to}`, { distance: r.distance, name: r.name, roadType: r.roadType });
      if (r.bidirectional) {
        map.set(`${r.to}->${r.from}`, { distance: r.distance, name: r.name, roadType: r.roadType });
      }
    }
    return map;
  }, [roads]);

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center h-full min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Route className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Route Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
          Select a destination hospital in the control panel and click{' '}
          <span className="font-semibold text-blue-600">"Find Shortest Route"</span> to calculate
          the optimal delivery route using Dijkstra’s Algorithm.
        </p>
      </div>
    );
  }

  const destinationNode = nodeMap.get(result.destinationId);
  const sourceNode = nodeMap.get(result.sourceId);

  // If unreachable
  if (!result.reachable || result.distance === Infinity) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-xs h-full">
        <div className="flex items-center space-x-3 pb-4 border-b border-red-100">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
              Destination Unreachable
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {destinationNode?.name || result.destinationId}
            </h3>
          </div>
        </div>

        <div className="py-6 text-center space-y-3">
          <p className="text-xs sm:text-sm text-red-600 font-medium leading-relaxed bg-red-50 p-4 rounded-xl border border-red-200">
            No route exists between the{' '}
            <span className="font-bold">{sourceNode?.name || 'Medical Warehouse'}</span> and the
            selected hospital (<span className="font-bold">{destinationNode?.name || result.destinationId}</span>).
            Please add or update road connections.
          </p>
          <div className="text-xs text-slate-500 text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700 mb-1 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Algorithm Diagnostic:
            </div>
            Dijkstra's priority queue exhausted all accessible graph components without encountering{' '}
            {destinationNode?.name || result.destinationId}. Final tentative distance remained ∞.
          </div>
        </div>
      </div>
    );
  }

  // Calculate detailed segment breakdowns
  const segments: Array<{
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    distance: number;
    roadName?: string;
    cumulative: number;
  }> = [];

  let runningDistance = 0;
  for (let i = 0; i < result.path.length - 1; i++) {
    const u = result.path[i];
    const v = result.path[i + 1];
    const uNode = nodeMap.get(u);
    const vNode = nodeMap.get(v);
    const roadInfo = roadLookup.get(`${u}->${v}`) || { distance: 0 };
    runningDistance += roadInfo.distance;

    segments.push({
      fromId: u,
      fromName: uNode?.name || u,
      toId: v,
      toName: vNode?.name || v,
      distance: roadInfo.distance,
      roadName: roadInfo.name,
      cumulative: runningDistance,
    });
  }

  // Logistics calculations
  const averageSpeedKmH = 45; // average transit speed with sirens/priority lanes
  const travelTimeMinutes = Math.round((result.distance / averageSpeedKmH) * 60);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header Result Status */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              Optimal Route Verified
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {result.executionTimeMs} ms
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {destinationNode?.name || result.destinationId}
          </h3>
          <p className="text-xs text-slate-500">
            {destinationNode?.type === 'hospital' ? `${destinationNode.urgency || 'Standard'} Care Priority` : 'Waypoint Destination'}
          </p>
        </div>

        {/* Shortest Distance Hero Badge */}
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {result.distance}{' '}
            <span className="text-sm font-semibold text-slate-500">km</span>
          </div>
          <span className="text-[11px] text-slate-400">Total Shortest Distance</span>
        </div>
      </div>

      {/* Ordered Route Breadcrumbs */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Ordered Route Sequence ({result.path.length} Nodes • {segments.length} Roads)
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {result.path.map((nodeId, idx) => {
            const node = nodeMap.get(nodeId);
            const isWarehouse = node?.type === 'warehouse';
            const isHospital = node?.type === 'hospital';

            return (
              <React.Fragment key={nodeId}>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs ${
                    idx === 0
                      ? 'bg-blue-600 text-white'
                      : idx === result.path.length - 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="mr-1 opacity-75">{nodeId}</span>
                  <span>{node?.name || nodeId}</span>
                </span>
                {idx < result.path.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Cargo Logistics & ETA Banner */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
        <div>
          <span className="text-slate-500 flex items-center font-medium">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Estimated Transit Time
          </span>
          <p className="text-slate-900 font-bold text-sm mt-0.5">
            ~{travelTimeMinutes} mins{' '}
            <span className="text-[11px] font-normal text-slate-500">(@45 km/h)</span>
          </p>
        </div>
        <div>
          <span className="text-slate-500 flex items-center font-medium">
            <ThermometerSnowflake className="w-3.5 h-3.5 mr-1 text-cyan-600" />
            Payload Security
          </span>
          <p className="text-slate-900 font-bold text-sm mt-0.5 truncate">
            {selectedCargo.category}{' '}
            <span className="text-[11px] font-normal text-slate-500">({selectedCargo.weightKg} kg)</span>
          </p>
        </div>
      </div>

      {/* Distance Breakdown Table */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Road-by-Road Distance Breakdown
        </label>
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3">Segment</th>
                <th className="py-2 px-3">Road Name</th>
                <th className="py-2 px-3 text-right">Distance</th>
                <th className="py-2 px-3 text-right">Cumul.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((seg, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition">
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {seg.fromName} → {seg.toName}
                  </td>
                  <td className="py-2 px-3 text-slate-500">
                    {seg.roadName || 'Connecting Road'}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {seg.distance} km
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 font-mono">
                    {seg.cumulative} km
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/40 font-bold text-slate-900 border-t border-emerald-100">
                <td className="py-2.5 px-3" colSpan={2}>
                  Total Shortest Distance
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 text-sm" colSpan={2}>
                  {result.distance} km
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onStartStepAnimation}
          className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 border border-indigo-200"
        >
          <PlayCircle className="w-4 h-4 text-indigo-600" />
          <span>Step-by-Step Visualizer</span>
        </button>

        <button
          onClick={onDispatchVehicle}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${
            isVehicleAnimating
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{isVehicleAnimating ? 'Simulation Running...' : 'Dispatch Medical Cargo'}</span>
        </button>
      </div>
    </div>
  );
};
