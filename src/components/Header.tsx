import React from 'react';
import {
  Activity,
  RotateCcw,
  FlaskConical,
  HelpCircle,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  GitBranch,
} from 'lucide-react';

interface HeaderProps {
  totalNodes: number;
  totalRoads: number;
  reachableCount: number;
  onResetNetwork: () => void;
  onOpenTests: () => void;
  onOpenHelp: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isCustomized: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalNodes,
  totalRoads,
  reachableCount,
  onResetNetwork,
  onOpenTests,
  onOpenHelp,
  onExport,
  onImport,
  isCustomized,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  MediRoute <span className="text-blue-600">AI</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Dijkstra Engine
                </span>
                {isCustomized && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Modified Graph
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Medical Supply & Vaccine Shortest Path Optimization
              </p>
            </div>
          </div>

          {/* Quick status & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Network pill */}
            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              <span className="flex items-center text-slate-700">
                <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                {totalNodes} Nodes
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center text-slate-700">
                <GitBranch className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {totalRoads} Roads
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {reachableCount} Reachable
              </span>
            </div>

            {/* Run Tests button */}
            <button
              onClick={onOpenTests}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-blue-600 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Run Automated Dijkstra Tests"
            >
              <FlaskConical className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="hidden sm:inline">Algorithm</span> Tests
            </button>

            {/* Export / Import */}
            <button
              onClick={onExport}
              className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs"
              title="Export Network JSON"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Export
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs"
              title="Import Network JSON"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Reset Network */}
            <button
              onClick={onResetNetwork}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-red-600 transition shadow-xs"
              title="Reset to Sample Road Network"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Reset
            </button>

            {/* Help / About */}
            <button
              onClick={onOpenHelp}
              className="inline-flex items-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="How to Use & Algorithm Documentation"
              aria-label="Documentation and Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
