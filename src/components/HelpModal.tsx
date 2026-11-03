import React from 'react';
import {
  X,
  BookOpen,
  Route,
  Activity,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                MediRoute AI Project Documentation
              </h3>
              <p className="text-xs text-slate-500">
                Medical supply routing architecture & Dijkstra's Algorithm explained
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
          {/* Problem Statement */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-blue-600" />
              1. Healthcare Logistics Problem Statement
            </h4>
            <p className="text-xs text-slate-600">
              A central medical warehouse delivers time-critical supplies (vaccines, blood plasma,
              organ transport, emergency surgical kits) to metropolitan hospitals. Roads have varying
              lengths and traffic speeds. Delivering through suboptimal roads risks expiring cold chain
              buffers and delays critical patient care. Dijkstra’s Algorithm guarantees the shortest
              possible road route from warehouse to destination.
            </p>
          </section>

          {/* Mathematical formulation */}
          <section className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              <Route className="w-4 h-4 mr-1.5 text-indigo-600" />
              2. Dijkstra's Algorithm Formulation
            </h4>
            <p className="text-xs text-slate-600">
              Let <code className="bg-white px-1 rounded font-mono">G = (V, E)</code> be a directed or
              undirected weighted graph with non-negative edge weights <code className="bg-white px-1 rounded font-mono">w(u, v) &ge; 0</code>.
            </p>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Initialize <code className="font-mono">dist[source] = 0</code>, and <code className="font-mono">dist[v] = &infin;</code> for all other nodes.</li>
              <li>Insert <code className="font-mono">(source, 0)</code> into a Min-Priority Queue.</li>
              <li>Extract node <code className="font-mono">u</code> with the minimal tentative distance.</li>
              <li>For each adjacent neighbor <code className="font-mono">v</code>, perform relaxation:</li>
            </ol>
            <div className="bg-white p-2 rounded border border-slate-200 text-xs font-mono text-center text-indigo-950 font-bold">
              if dist[u] + w(u, v) &lt; dist[v] then dist[v] &larr; dist[u] + w(u, v), pred[v] &larr; u
            </div>
          </section>

          {/* Sample Network Benchmark Reference */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              <GitBranch className="w-4 h-4 mr-1.5 text-emerald-600" />
              3. Sample Network Verified Results
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
                <span className="font-bold text-slate-900 block">W &rarr; City Hospital (H1)</span>
                <span className="text-emerald-600 font-bold">10 km</span>
                <span className="text-slate-400 block text-[11px]">W &rarr; B &rarr; A &rarr; C &rarr; H1</span>
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
                <span className="font-bold text-slate-900 block">W &rarr; General Hospital (H2)</span>
                <span className="text-emerald-600 font-bold">13 km</span>
                <span className="text-slate-400 block text-[11px]">W &rarr; B &rarr; A &rarr; C &rarr; H1 &rarr; H2</span>
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
                <span className="font-bold text-slate-900 block">W &rarr; Emergency Hospital (H3)</span>
                <span className="text-emerald-600 font-bold">14 km</span>
                <span className="text-slate-400 block text-[11px]">W &rarr; B &rarr; A &rarr; C &rarr; H1 &rarr; H3</span>
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
                <span className="font-bold text-slate-900 block">W &rarr; Children's Hospital (H4)</span>
                <span className="text-emerald-600 font-bold">15 km</span>
                <span className="text-slate-400 block text-[11px]">W &rarr; B &rarr; A &rarr; C &rarr; H1 &rarr; H2 &rarr; H4</span>
              </div>
            </div>
          </section>

          {/* Key Application Features */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">4. Interactive Features Guide</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
              <li><strong>Interactive Canvas:</strong> Drag any node to reposition. Use mouse wheel or controls to zoom and pan. Click nodes or road labels to edit distances or delete.</li>
              <li><strong>Step-by-Step Visualizer:</strong> Play or step through Dijkstra’s exact relaxation steps with live priority queue inspection.</li>
              <li><strong>Medical Dispatch Simulation:</strong> Watch an animated emergency transport vehicle travel along the calculated shortest route.</li>
              <li><strong>Route Comparison:</strong> Evaluate resilience and alternative simple paths with distance overhead percentages.</li>
              <li><strong>Geographic Map:</strong> Toggle to OpenStreetMap view for GIS perspective.</li>
            </ul>
          </section>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
