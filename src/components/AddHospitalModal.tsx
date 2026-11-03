import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, Building2, Hospital } from 'lucide-react';
import { GraphNode, HospitalUrgency, NodeType } from '../types/graph';

interface AddHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (node: GraphNode) => void;
  existingNodes: GraphNode[];
}

export const AddHospitalModal: React.FC<AddHospitalModalProps> = ({
  isOpen,
  onClose,
  onAddNode,
  existingNodes,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('hospital');
  const [beds, setBeds] = useState('350');
  const [urgency, setUrgency] = useState<HospitalUrgency>('Urgent');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = id.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedId) {
      setError('Please provide a unique ID (e.g. H5, J1).');
      return;
    }

    if (existingNodes.some(n => n.id.toUpperCase() === trimmedId)) {
      setError(`Node ID "${trimmedId}" already exists. Please pick a unique identifier.`);
      return;
    }

    if (!trimmedName) {
      setError('Please provide a location / hospital name.');
      return;
    }

    // Auto-generate canvas coordinates nicely offset from center
    const count = existingNodes.length;
    const x = 350 + (count % 3) * 160 + (Math.random() * 40 - 20);
    const y = 180 + Math.floor(count / 3) * 140 + (Math.random() * 40 - 20);

    const newNode: GraphNode = {
      id: trimmedId,
      name: trimmedName,
      type,
      beds: type === 'hospital' ? parseInt(beds, 10) || 200 : undefined,
      urgency: type === 'hospital' ? urgency : undefined,
      description: description.trim() || undefined,
      coordinates: { x: Math.round(x), y: Math.round(y) },
      geoCoordinates: {
        lat: 37.77 + (Math.random() * 0.04 - 0.02),
        lng: -122.42 + (Math.random() * 0.06 - 0.03),
      },
    };

    onAddNode(newNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Hospital className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Destination Facility</h3>
              <p className="text-xs text-slate-500">Insert a hospital or transit junction into graph</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Node ID *
              </label>
              <input
                type="text"
                placeholder="e.g. H5 or J1"
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Facility Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as NodeType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="hospital">Hospital Facility</option>
                <option value="junction">Transit Junction</option>
                <option value="warehouse">Secondary Depot</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility / Hospital Name *
            </label>
            <input
              type="text"
              placeholder="e.g. St. Jude Specialty Medical Center"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {type === 'hospital' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bed Capacity
                </label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={beds}
                  onChange={e => setBeds(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as HospitalUrgency)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Standard">Standard Routine</option>
                  <option value="Urgent">Urgent Needed</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location Description / Specialty
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Specialty pediatric oncology and ICU units"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Note: New facilities are initially isolated until connected via "Add Road".
          </p>

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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Facility</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
