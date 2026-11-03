import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  GitCommit,
  ListOrdered,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { DijkstraStep, GraphNode } from '../types/graph';

interface AlgorithmVisualizerProps {
  steps: DijkstraStep[];
  nodes: GraphNode[];
  currentStepIndex: number;
  onStepChange: React.Dispatch<React.SetStateAction<number>>;
  sourceId: string;
  destinationId: string;
}

export const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
  steps,
  nodes,
  currentStepIndex,
  onStepChange,
  sourceId,
  destinationId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nodeMap = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const activeStep: DijkstraStep | undefined = steps[currentStepIndex];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const baseDelay = 1200; // 1.2s base delay
    const delay = baseDelay / speedMultiplier;

    timerRef.current = setInterval(() => {
      onStepChange((prev: number) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, steps.length, onStepChange]);

  const handlePlayPause = () => {
    if (currentStepIndex >= steps.length - 1) {
      onStepChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  if (!steps || steps.length === 0) {
    return null;
  }

  const currentNode = activeStep ? nodeMap.get(activeStep.currentNode) : null;
  const neighborNode = activeStep?.neighborNode ? nodeMap.get(activeStep.neighborNode) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Visualizer Header & Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
              How Dijkstra Works — Execution Inspector
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time step-by-step relaxation and priority-queue extraction
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            title="Previous Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{currentStepIndex >= steps.length - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStepIndex >= steps.length - 1}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-2 border border-slate-300 rounded-lg p-0.5 bg-slate-50 text-[11px] font-semibold text-slate-600">
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 rounded transition ${
                  speedMultiplier === s ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-200"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Current Step Description Card */}
      {activeStep && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            activeStep.updated
              ? 'bg-purple-50/70 border-purple-200'
              : activeStep.type === 'destination-reached'
              ? 'bg-emerald-50/70 border-emerald-200'
              : activeStep.type === 'unreachable'
              ? 'bg-red-50/70 border-red-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  activeStep.updated
                    ? 'bg-purple-200 text-purple-900'
                    : activeStep.type === 'destination-reached'
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {activeStep.type.replace('-', ' ')}
              </span>
              {activeStep.updated && (
                <span className="flex items-center text-xs text-purple-700 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  Shorter Path Discovered!
                </span>
              )}
            </div>

            <span className="text-xs font-mono text-slate-400">
              Step #{activeStep.stepIndex}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 mt-2 leading-relaxed">
            {activeStep.description}
          </p>

          {/* Relaxation Equation if applicable */}
          {activeStep.neighborNode && activeStep.edgeDistance !== undefined && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Node</span>
                <span className="font-semibold text-slate-800">{currentNode?.name || activeStep.currentNode}</span>
                <span className="text-slate-500 block text-[11px] font-mono">dist: {activeStep.currentDistance} km</span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Examined Neighbor</span>
                <span className="font-semibold text-slate-800">{neighborNode?.name || activeStep.neighborNode}</span>
                <span className="text-slate-500 block text-[11px] font-mono">road: +{activeStep.edgeDistance} km</span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Distance</span>
                <span className="font-bold text-slate-900 font-mono">
                  {activeStep.currentDistance} + {activeStep.edgeDistance} = {activeStep.candidateDistance} km
                </span>
              </div>

              <div
                className={`p-2 rounded-lg border font-mono ${
                  activeStep.updated
                    ? 'bg-purple-100/80 border-purple-300 text-purple-950 font-bold'
                    : 'bg-white/80 border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance Updated?</span>
                <span>
                  {activeStep.updated
                    ? `${activeStep.previousDistance === Infinity ? '∞' : activeStep.previousDistance + ' km'} → ${activeStep.newDistance} km`
                    : `Kept ${activeStep.previousDistance} km`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Snapshot State Grid: Tentative Distances & Visited Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Tentative Distances Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center">
              <ListOrdered className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Tentative Distance Table (at Step #{currentStepIndex + 1})
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Source: {sourceId}
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="py-1.5 px-3">Node</th>
                  <th className="py-1.5 px-3">Tentative Dist</th>
                  <th className="py-1.5 px-3">Predecessor</th>
                  <th className="py-1.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {nodes.map(n => {
                  const dist = activeStep?.distancesSnapshot[n.id];
                  const pred = activeStep?.predecessorsSnapshot[n.id];
                  const isVisited = activeStep?.visitedSnapshot.includes(n.id);
                  const isCurrent = activeStep?.currentNode === n.id;
                  const isNeighbor = activeStep?.neighborNode === n.id;

                  return (
                    <tr
                      key={n.id}
                      className={
                        isCurrent
                          ? 'bg-amber-50/70 font-bold'
                          : isNeighbor
                          ? 'bg-purple-50/70'
                          : isVisited
                          ? 'bg-slate-50/40 text-slate-400'
                          : ''
                      }
                    >
                      <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">
                        {n.id}{' '}
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          ({n.name})
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-900 font-semibold">
                        {dist === undefined || dist === Infinity ? '∞' : `${dist} km`}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500">
                        {pred ? `${pred}` : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right font-sans">
                        {isCurrent ? (
                          <span className="text-amber-600 font-bold text-[10px] uppercase">
                            Processing
                          </span>
                        ) : isVisited ? (
                          <span className="text-emerald-600 font-semibold text-[10px] uppercase">
                            Finalized
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] uppercase">Tentative</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Queue Min-Heap Snapshot */}
        <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center">
              <GitCommit className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Min-Priority Queue (Deterministic Order)
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              {activeStep?.queueSnapshot?.length || 0} items
            </span>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-center">
            {activeStep && activeStep.queueSnapshot && activeStep.queueSnapshot.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeStep.queueSnapshot.map((item, idx) => {
                  const node = nodeMap.get(item.id);
                  return (
                    <div
                      key={item.id + idx}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center space-x-2 shadow-2xs ${
                        idx === 0
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="font-mono text-slate-500">#{idx + 1}</span>
                      <span className="font-semibold">{node?.name || item.id}</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-800">
                        {item.dist === Infinity ? '∞' : `${item.dist} km`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                Priority queue is empty (all reachable nodes processed or destination reached)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
