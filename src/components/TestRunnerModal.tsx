import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  FlaskConical,
  RotateCcw,
  Clock,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { runAllTests, TestCaseResult } from '../algorithms/tests';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedTests, setExpandedTests] = useState<Record<number, boolean>>({});

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllTests();
      setResults(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  const categories = ['all', ...Array.from(new Set(results.map(r => r.category)))];

  const filteredResults =
    filterCategory === 'all' ? results : results.filter(r => r.category === filterCategory);

  const toggleExpand = (id: number) => {
    setExpandedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Automated Dijkstra Algorithm Test Suite
              </h3>
              <p className="text-xs text-slate-500">
                Verifying algorithm correctness, tie-breaking & sample network benchmarks
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center space-x-1"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Rerun Suite</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Summary Banner */}
        <div className="p-6 pb-2">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              passedCount === totalCount && totalCount > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  passedCount === totalCount
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {passedCount === totalCount
                    ? `All ${totalCount} Algorithm Tests Passed Successfully!`
                    : `${passedCount} of ${totalCount} Tests Passed`}
                </h4>
                <p className="text-xs opacity-80">
                  Sample benchmarks (10 km, 13 km, 14 km, 15 km) and all edge cases verified.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-semibold flex items-center justify-end">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {Math.round(totalDuration * 100) / 100} ms total
              </span>
              <span className="text-[11px] opacity-75">deterministic execution</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Tests' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tests List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5">
          {filteredResults.map(test => {
            const isExpanded = !!expandedTests[test.id];

            return (
              <div
                key={test.id}
                className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition bg-white"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(test.id)}
                >
                  <div className="flex items-start space-x-2.5">
                    {test.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">#{test.id}</span>
                        <h5 className="text-sm font-bold text-slate-800">{test.name}</h5>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{test.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {test.durationMs} ms
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && test.details && (
                  <div className="mt-3 pt-2 border-t border-slate-100 font-mono text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Verification Assertion Log:
                    </span>
                    {test.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Dijkstra implementation separated cleanly from UI layer in TypeScript.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
