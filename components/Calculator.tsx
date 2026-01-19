"use client";

import { useState } from "react";
import { Calculator as CalculatorIcon, Info } from "lucide-react";
import { estimateGestationalAge, getHcPercentile } from "../model/logic";

export default function Calculator() {
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<{
    age: { weeks: number; days: number } | null;
    range: {
      min: { weeks: number; days: number } | null;
      max: { weeks: number; days: number } | null;
    };
    percentile: number | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    const val = parseFloat(input);

    if (isNaN(val) || val <= 0) {
      setError("נא להזין ערך מספרי חיובי");
      return;
    }

    const estimation = estimateGestationalAge(val);

    if (!estimation.estimatedAge) {
      setError("ערך המדידה מחוץ לטווח הנתונים (שבוע 14-40)");
      return;
    }

    // We can also calculate percentile if we want to display it, 
    // though for "What is my week?" it's circular since percentile depends on week.
    // However, usually clinicians want to know: "If this is the HC, what is the age?" 
    // The percentile logic in logic.ts (getHcPercentile) takes (weeks, days, hc) -> percentile.
    // If we assume the estimated age is correct, the percentile is by definition 50th (Mean).
    // So distinct percentile calculation is more useful when the USER inputs Age + HC.
    // Here we just output the estimated age.

    setResult({
      age: estimation.estimatedAge,
      range: estimation.confidenceInterval,
      percentile: 50 // By definition of the estimation method (finding the Mean intersection)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const formatAge = (age: { weeks: number; days: number } | null) => {
    if (!age) return "-";
    return `${age.weeks}+${age.days}`;
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <CalculatorIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">מחשבון שבוע הריון</h1>
        <p className="text-gray-500 text-sm">הכניסי את היקף הראש (HC) במילימטרים</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="measurement" className="block text-sm font-medium text-gray-700 text-right">
            Head Circumference (HC)
          </label>
          <div className="relative">
            <input
              id="measurement"
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הכניסי ערך במ״מ..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-right placeholder-gray-400"
              dir="rtl"
            />
            <span className="absolute left-3 top-3.5 text-gray-400 text-sm">mm</span>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleCalculate}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          חשב גיל הריון
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">

          {/* Main Result Card */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl flex flex-col items-center text-center shadow-sm">
            <span className="text-sm text-indigo-600 font-medium mb-1">גיל הריון משוער</span>
            <span className="text-4xl font-extrabold text-indigo-900 tracking-tight">
              {formatAge(result.age)}
            </span>
            <span className="text-xs text-indigo-400 mt-1">שבועות + ימים</span>
          </div>

          {/* Details / Confidence Interval */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-gray-100 rounded-lg text-center shadow-sm">
              <span className="block text-gray-400 mb-1">טווח עליון (הכי קטן)</span>
              <span className="text-gray-700 font-semibold">{formatAge(result.range.min)}</span>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-lg text-center shadow-sm">
              <span className="block text-gray-400 mb-1">טווח תחתון (הכי גדול)</span>
              <span className="text-gray-700 font-semibold">{formatAge(result.range.max)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mt-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p className="leading-tight">
              הערכה זו מתבססת על ממוצע האוכלוסייה. הטווחים למטה מייצגים סטייה של 2 סטיות תקן.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
