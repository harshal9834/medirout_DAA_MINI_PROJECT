import React from 'react';
import { GitCompare, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Navigation } from 'lucide-react';
import { AlternativeRoute, GraphNode } from '../types/graph';

interface RouteComparisonProps {
  shortestDistance: number;
  shortestPath: string[];
  alternatives: AlternativeRoute[];
  nodes: GraphNode[];
  onSelectPathToHighlight: (path: string[]) => void;
  highlightedPath: string[];
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  shortestDistance,
  shortestPath,
  alternatives,
  nodes,
  onSelectPathToHighlight,
  highlightedPath,
}) => {
  const nodeMap = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  if (shortestDistance === Infinity || shortestPath.length < 2) {
    return null;
  }

  const isShortestSelected = highlightedPath.join('->') === shortestPath.join('->');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <GitCompare className="w-4 h-4 mr-1.5 text-blue-600" />
            Route Comparison & Resilience Analysis
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare Dijkstra’s optimal route against available alternative road paths
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          {alternatives.length + 1} Paths Evaluated
        </span>
      </div>

      <div className="space-y-3">
        {/* 1. Optimal Route Card */}
        <div
          onClick={() => onSelectPathToHighlight(shortestPath)}
          className={`p-4 rounded-xl border-2 transition cursor-pointer ${
            isShortestSelected
              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
              : 'border-slate-200 hover:border-emerald-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                Rank #1 • Dijkstra Optimal
              </span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Shortest Available Road Path
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-emerald-600">{shortestDistance} km</span>
              <span className="block text-[10px] text-slate-400 font-medium">0 km extra (Baseline)</span>
            </div>
          </div>

          {/* Path Sequence */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {shortestPath.map((id, idx) => (
              <React.Fragment key={id + idx}>
                <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {nodeMap.get(id)?.name || id}
                </span>
                {idx < shortestPath.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-3">
            <span>Roads traversed: <strong>{shortestPath.length - 1}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Recommended for urgent ambulance & cold chain dispatch</span>
          </div>
        </div>

        {/* 2. Alternative Routes */}
        {alternatives.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
            No distinct alternative simple paths exist for this destination in the current network topology.
          </div>
        ) : (
          alternatives.map((alt, index) => {
            const isSelected = highlightedPath.join('->') === alt.path.join('->');

            return (
              <div
                key={index}
                onClick={() => onSelectPathToHighlight(alt.path)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      Alternative #{index + 1}
                    </span>
                    <span className="text-xs text-amber-600 font-medium flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      +{alt.extraKm} km (+{alt.percentIncrease}%)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-slate-800">{alt.distance} km</span>
                    <span className="block text-[10px] text-slate-400">
                      {alt.roadsCount} roads
                    </span>
                  </div>
                </div>

                {/* Path Sequence */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                  {alt.path.map((id, idx) => (
                    <React.Fragment key={id + idx}>
                      <span className="text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {nodeMap.get(id)?.name || id}
                      </span>
                      {idx < alt.path.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Useful if main highway suffers congestion or road closure.</span>
                  <span className="text-blue-600 hover:underline font-medium">
                    {isSelected ? 'Currently Viewing on Canvas' : 'Click to Inspect Path'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
