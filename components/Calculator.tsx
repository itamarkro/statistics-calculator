"use client";

import { useState } from "react";
import { Calculator as CalculatorIcon, Info, Calendar, Activity } from "lucide-react";
import { estimateGestationalAge, getHcPercentile, MIN_VALID_HC, MAX_VALID_HC } from "../model/logic";

type Mode = 'dating' | 'percentile';

export default function Calculator() {
  const [mode, setMode] = useState<Mode>('percentile');

  // State for Dating Mode
  const [hcInput, setHcInput] = useState<string>("");
  const [datingResult, setDatingResult] = useState<{
    age: { weeks: number; days: number } | string | null;
    range: {
      min: { weeks: number; days: number } | null;
      max: { weeks: number; days: number } | null;
    };
  } | null>(null);

  // State for Percentile Mode
  const [percWeeks, setPercWeeks] = useState<string>("");
  const [percDays, setPercDays] = useState<string>("");
  const [percHc, setPercHc] = useState<string>("");
  const [percentileResult, setPercentileResult] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---

  const resetState = () => {
    setError(null);
    setDatingResult(null);
    setPercentileResult(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    resetState();
    // Clear inputs
    setHcInput("");
    setPercWeeks("");
    setPercDays("");
    setPercHc("");
  };

  const calculateDating = () => {
    resetState();
    const val = parseFloat(hcInput);
    if (isNaN(val)) {
      setError("Please enter a numeric value");
      return;
    }

    if (val < MIN_VALID_HC) {
      setError(`Measurement value must be at least ${MIN_VALID_HC.toFixed(1)}mm`);
      return;
    }

    if (val > MAX_VALID_HC) {
      setError(`Measurement value must be at most ${MAX_VALID_HC.toFixed(1)}mm`);
      return;
    }

    const estimation = estimateGestationalAge(val);

    if (!estimation.estimatedAge) {
      setError("Measurement value out of range (Week 14-40)");
      return;
    }

    setDatingResult({
      age: estimation.estimatedAge,
      range: estimation.confidenceInterval,
    });
  };

  const calculatePercentile = () => {
    resetState();
    const w = parseInt(percWeeks);
    const d = parseInt(percDays) || 0;
    const h = parseFloat(percHc);

    if (isNaN(w) || isNaN(h)) {
      setError("Please enter week and head circumference");
      return;
    }
    if (w < 14 || w > 40) {
      setError("Week must be between 14-40");
      return;
    }
    if (d < 0 || d > 6) {
      setError("Days must be between 0-6");
      return;
    }

    if (h < MIN_VALID_HC) {
      setError(`Measurement value must be at least ${MIN_VALID_HC.toFixed(1)}mm`);
      return;
    }

    if (h > MAX_VALID_HC) {
      setError(`Measurement value must be at most ${MAX_VALID_HC.toFixed(1)}mm`);
      return;
    }

    const result = getHcPercentile(w, d, h);
    if (result === null) {
      setError("Cannot calculate percentile (Data missing for input)");
      return;
    }
    setPercentileResult(result);
  };

  // --- Render Helpers ---

  const formatAgeShort = (age: { weeks: number; days: number } | null) => {
    if (!age) return "-";
    return `${age.weeks}w & ${age.days}d`;
  };

  return (
    <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-3xl" dir="ltr">

      {/* Header */}
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white transform transition hover:scale-105 duration-300">
          <CalculatorIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Fetal Growth Calculator
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Tool for tracking fetal development</p>
        </div>
      </div>

      {/* Mode Toggles */}
      <div className="flex p-1 bg-gray-100/80 rounded-xl">
        <button
          onClick={() => handleModeChange('percentile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === 'percentile'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Activity size={16} />
          Percentile
        </button>
        <button
          onClick={() => handleModeChange('dating')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${mode === 'dating'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Calendar size={16} />
          Est. Age
        </button>
      </div>

      <div className="min-h-[430px]">

        {/* Content */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* --- Percentile Mode Form --- */}
          {mode === 'percentile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500">Weeks</label>
                  <input
                    type="number"
                    min="14" max="40"
                    value={percWeeks}
                    onChange={(e) => setPercWeeks(e.target.value)}
                    placeholder="14-40"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-center text-gray-700 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500">Days</label>
                  <input
                    type="number"
                    min="0" max="6"
                    value={percDays}
                    onChange={(e) => setPercDays(e.target.value)}
                    placeholder="0-6"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-center text-gray-700 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500">Head Circumference (HC) in mm</label>
                <input
                  type="number"
                  value={percHc}
                  onChange={(e) => setPercHc(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-left text-gray-700 font-medium"
                />
              </div>

              <button
                onClick={calculatePercentile}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Calculate Percentile
              </button>
            </div>
          )}

          {/* --- Dating Mode Form --- */}
          {mode === 'dating' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500">Head Circumference (HC) in mm</label>
                <input
                  type="number"
                  value={hcInput}
                  onChange={(e) => setHcInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && calculateDating()}
                  placeholder="e.g. 250"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-left text-gray-700 font-medium"
                />
              </div>

              <button
                onClick={calculateDating}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Calculate Gestational Age
              </button>
            </div>
          )}

          {/* --- Errors --- */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg text-center animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          {/* --- Percentile Result --- */}
          {mode === 'percentile' && percentileResult !== null && (
            <div className="mt-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-center animate-in fade-in slide-in-from-bottom-2">
              <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wide">Estimated Percentile</span>
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mt-2 mb-1">
                {percentileResult}%
              </div>
            </div>
          )}

          {/* --- Dating Result --- */}
          {mode === 'dating' && datingResult && datingResult.age && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex flex-col items-center text-center">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Estimated Gestational Age</span>
                <span className="text-3xl font-extrabold text-indigo-900 tracking-tight">
                  {typeof datingResult.age === 'string'
                    ? datingResult.age
                    : `${datingResult.age.weeks} weeks & ${datingResult.age.days} days`
                  }
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-gray-100 rounded-xl text-center shadow-sm">
                  <span className="block text-gray-400 mb-1 font-medium">Lower Bound</span>
                  <span className="text-gray-700 font-bold text-lg">
                    {datingResult.range.min && datingResult.range.min.weeks >= 14 && datingResult.range.min.weeks <= 40
                      ? formatAgeShort(datingResult.range.min)
                      : "-"}
                  </span>
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-xl text-center shadow-sm">
                  <span className="block text-gray-400 mb-1 font-medium">Upper Bound</span>
                  <span className="text-gray-700 font-bold text-lg">
                    {datingResult.range.max && datingResult.range.max.weeks <= 40 && datingResult.range.max.weeks >= 14
                      ? formatAgeShort(datingResult.range.max)
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50/50 text-blue-700 text-xs rounded-xl mt-2 border border-blue-100 text-left">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {(datingResult.range.min && datingResult.range.min.weeks < 14) || (datingResult.range.max && datingResult.range.max.weeks > 40)
                    ? "Lower/Upper bound for the 95% confidence interval cannot be provided due to data restrictions (Week 14-40)."
                    : "The displayed range represents the 95% confidence interval (±2 SD). The central value is the population mean."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
