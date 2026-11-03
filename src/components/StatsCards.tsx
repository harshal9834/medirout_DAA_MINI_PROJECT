import React from 'react';
import { Hospital, Route, Navigation, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface StatsCardsProps {
  totalHospitals: number;
  totalRoads: number;
  reachableHospitals: number;
  selectedRouteDistance: number | null;
  selectedDestinationName?: string;
  isReachable?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalHospitals,
  totalRoads,
  reachableHospitals,
  selectedRouteDistance,
  selectedDestinationName,
  isReachable,
}) => {
  const isDisconnected = selectedRouteDistance === Infinity || (isReachable === false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Hospitals */}
      <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Hospitals
          </span>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Hospital className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">{totalHospitals}</span>
          <span className="ml-2 text-xs text-slate-500 font-medium">facility nodes</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Trauma centers, general, & pediatric hubs
        </p>
      </div>

      {/* 2. Total Roads */}
      <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Roads
          </span>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Route className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">{totalRoads}</span>
          <span className="ml-2 text-xs text-slate-500 font-medium">graph edges</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Weighted road segments & corridors
        </p>
      </div>

      {/* 3. Reachable Hospitals */}
      <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reachable Hospitals
          </span>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              reachableHospitals === totalHospitals
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">
            {reachableHospitals}
            <span className="text-base font-normal text-slate-400">/{totalHospitals}</span>
          </span>
          <span
            className={`ml-2 text-xs font-semibold ${
              reachableHospitals === totalHospitals ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {totalHospitals > 0
              ? `${Math.round((reachableHospitals / totalHospitals) * 100)}% online`
              : '0%'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {reachableHospitals === totalHospitals
            ? 'All medical centers reachable from warehouse'
            : `${totalHospitals - reachableHospitals} hospital(s) isolated without road link`}
        </p>
      </div>

      {/* 4. Selected Route Distance */}
      <div
        className={`bg-white rounded-xl border p-4.5 shadow-xs hover:shadow-md transition-all ${
          isDisconnected
            ? 'border-red-200 bg-red-50/20'
            : selectedRouteDistance !== null
            ? 'border-emerald-200 bg-emerald-50/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Route Distance
          </span>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDisconnected
                ? 'bg-red-50 text-red-600'
                : selectedRouteDistance !== null
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isDisconnected ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline">
          {isDisconnected ? (
            <span className="text-2xl font-bold text-red-600">Unreachable</span>
          ) : selectedRouteDistance !== null ? (
            <>
              <span className="text-2xl font-bold text-slate-900">{selectedRouteDistance}</span>
              <span className="ml-1 text-sm font-semibold text-emerald-600">km</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-slate-400">—</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500 truncate flex items-center">
          {selectedDestinationName ? (
            <>
              <span className="truncate">To {selectedDestinationName}</span>
              <ArrowRight className="w-3 h-3 ml-1 shrink-0 text-slate-400" />
            </>
          ) : (
            'Select a destination hospital below'
          )}
        </p>
      </div>
    </div>
  );
};
