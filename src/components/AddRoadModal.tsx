import React, { useState } from 'react';
import { X, GitFork, AlertCircle, Check } from 'lucide-react';
import { GraphNode, GraphRoad } from '../types/graph';

interface AddRoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoad: (road: GraphRoad) => void;
  nodes: GraphNode[];
  existingRoads: GraphRoad[];
}

export const AddRoadModal: React.FC<AddRoadModalProps> = ({
  isOpen,
  onClose,
  onAddRoad,
  nodes,
  existingRoads,
}) => {
  const [from, setFrom] = useState(nodes[0]?.id || '');
  const [to, setTo] = useState(nodes[1]?.id || '');
  const [distance, setDistance] = useState('5');
  const [bidirectional, setBidirectional] = useState(true);
  const [name, setName] = useState('');
  const [roadType, setRoadType] = useState<'Highway' | 'Avenue' | 'Local' | 'Expressway'>('Avenue');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!from || !to) {
      setError('Please select both starting and destination locations.');
      return;
    }

    if (from === to) {
      setError('Starting location and destination cannot be the same node (no self-loops).');
      return;
    }

    const distNum = parseFloat(distance);
    if (isNaN(distNum) || !isFinite(distNum) || distNum <= 0) {
      setError('Distance must be a valid positive number greater than 0 km.');
      return;
    }

    // Check duplicate
    const isDuplicate = existingRoads.some(
      r =>
        (r.from === from && r.to === to) ||
        (bidirectional && r.from === to && r.to === from)
    );

    if (isDuplicate) {
      setError(`A road already connects "${from}" and "${to}". Please edit the existing road or remove it first.`);
      return;
    }

    const newRoadId = `R_${Date.now().toString().slice(-5)}`;
    const newRoad: GraphRoad = {
      id: newRoadId,
      from,
      to,
      distance: Math.round(distNum * 10) / 10,
      bidirectional,
      name: name.trim() || undefined,
      roadType,
    };

    onAddRoad(newRoad);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Road Connection</h3>
              <p className="text-xs text-slate-500">Create a weighted graph edge with distance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Endpoints */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Location *
              </label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Destination *
              </label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Distance and Road Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Road Distance (km) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  required
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                  km
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Road Class
              </label>
              <select
                value={roadType}
                onChange={e => setRoadType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Highway">Highway</option>
                <option value="Expressway">Expressway</option>
                <option value="Avenue">Avenue</option>
                <option value="Local">Local Street</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Road Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Skyline Medical Corridor"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Direction toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bidirectional}
                onChange={e => setBidirectional(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                Bidirectional Road (two-way traffic)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1 pl-6">
              {bidirectional
                ? 'Ambulances can travel in both directions (A ↔ B).'
                : 'One-way transit only (A → B).'}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add Road</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
