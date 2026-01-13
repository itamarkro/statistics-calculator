"use client";

import { useState } from "react";
import { Calculator as CalculatorIcon } from "lucide-react";

// Mock data table logic
// In reality, this would be a more complex lookup or regression formula.
// For now, we use a simple range lookup.
const getEstimatedWeek = (measurement: number): string | null => {
  if (isNaN(measurement) || measurement <= 0) return null;
  
  // Mock Logic: Measurement (mm) roughly correlates to weeks
  // This is PURELY MOCK data for the scaffolding phase.
  if (measurement < 10) return "5";
  if (measurement < 20) return "6";
  if (measurement < 30) return "7";
  if (measurement < 40) return "8";
  if (measurement < 50) return "9";
  if (measurement < 60) return "10";
  if (measurement < 70) return "11";
  if (measurement < 80) return "12";
  
  return "12+";
};

export default function Calculator() {
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);

  const handleCalculate = () => {
    const val = parseFloat(input);
    const week = getEstimatedWeek(val);
    setResult(week);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <CalculatorIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">מחשבון שבוע הריון</h1>
        <p className="text-gray-500 text-sm">הכניסי את גודל המדידה (מ״מ)</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="measurement" className="block text-sm font-medium text-gray-700 text-right">
            מדידה (Crown-Rump Length)
          </label>
          <input
            id="measurement"
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הכניסי ערך..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-right dir-rtl"
            dir="rtl"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          חשב שבוע הריון
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm text-indigo-600 font-medium">שבוע הריון משוער</span>
          <span className="text-3xl font-bold text-indigo-900">שבוע {result}</span>
        </div>
      )}
    </div>
  );
}
