import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit3, Save, AlertCircle, MapPin, Route } from 'lucide-react';
import { GraphNode, GraphRoad } from '../types/graph';

interface EditNodeRoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: GraphNode | null;
  selectedRoad: GraphRoad | null;
  onUpdateNode: (node: GraphNode) => void;
  onDeleteNode: (id: string) => void;
  onUpdateRoad: (road: GraphRoad) => void;
  onDeleteRoad: (id: string) => void;
  onSelectAsDestination?: (id: string) => void;
}

export const EditNodeRoadModal: React.FC<EditNodeRoadModalProps> = ({
  isOpen,
  onClose,
  selectedNode,
  selectedRoad,
  onUpdateNode,
  onDeleteNode,
  onUpdateRoad,
  onDeleteRoad,
  onSelectAsDestination,
}) => {
  // Node edit state
  const [nodeName, setNodeName] = useState('');
  const [nodeBeds, setNodeBeds] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');

  // Road edit state
  const [roadDistance, setRoadDistance] = useState('');
  const [roadName, setRoadName] = useState('');
  const [roadBidirectional, setRoadBidirectional] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.name);
      setNodeBeds(selectedNode.beds?.toString() || '');
      setNodeDescription(selectedNode.description || '');
    }
    if (selectedRoad) {
      setRoadDistance(selectedRoad.distance.toString());
      setRoadName(selectedRoad.name || '');
      setRoadBidirectional(selectedRoad.bidirectional);
    }
    setError(null);
  }, [selectedNode, selectedRoad]);

  if (!isOpen || (!selectedNode && !selectedRoad)) return null;

  const handleSaveNode = () => {
    if (!selectedNode) return;
    if (!nodeName.trim()) {
      setError('Facility name cannot be empty.');
      return;
    }
    onUpdateNode({
      ...selectedNode,
      name: nodeName.trim(),
      beds: nodeBeds ? parseInt(nodeBeds, 10) : undefined,
      description: nodeDescription.trim() || undefined,
    });
    onClose();
  };

  const handleSaveRoad = () => {
    if (!selectedRoad) return;
    const distNum = parseFloat(roadDistance);
    if (isNaN(distNum) || distNum <= 0) {
      setError('Distance must be a valid positive number (> 0 km).');
      return;
    }
    onUpdateRoad({
      ...selectedRoad,
      distance: Math.round(distNum * 10) / 10,
      name: roadName.trim() || undefined,
      bidirectional: roadBidirectional,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              {selectedNode ? <MapPin className="w-4 h-4" /> : <Route className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedNode
                  ? `Inspect Node (${selectedNode.id})`
                  : `Inspect Road (${selectedRoad?.from} ↔ ${selectedRoad?.to})`}
              </h3>
              <p className="text-xs text-slate-500">View or modify graph attributes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Node Edit Form */}
          {selectedNode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={e => setNodeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {selectedNode.type === 'hospital' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beds Capacity
                  </label>
                  <input
                    type="number"
                    value={nodeBeds}
                    onChange={e => setNodeBeds(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Description
                </label>
                <textarea
                  rows={2}
                  value={nodeDescription}
                  onChange={e => setNodeDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {selectedNode.type === 'hospital' && onSelectAsDestination && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectAsDestination(selectedNode.id);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs border border-blue-200 transition"
                >
                  Set {selectedNode.name} as Delivery Destination
                </button>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete node "${selectedNode.name}" and all connected roads?`)) {
                      onDeleteNode(selectedNode.id);
                      onClose();
                    }
                  }}
                  disabled={selectedNode.type === 'warehouse'}
                  className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Node</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNode}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Road Edit Form */}
          {selectedRoad && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road Distance (km) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={roadDistance}
                    onChange={e => setRoadDistance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    km
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road Name
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={e => setRoadName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roadBidirectional}
                    onChange={e => setRoadBidirectional(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Bidirectional Road (Two-Way)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this road connection?')) {
                      onDeleteRoad(selectedRoad.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Road</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoad}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Road</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
