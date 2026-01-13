
import React, { useState, useEffect } from 'react';
import { RiskAnalysis, InsightData } from '../types';
import { generateRiskInsight } from '../services/gemini';

interface Props {
  risk: RiskAnalysis;
}

const RiskInsightPanel: React.FC<Props> = ({ risk }) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const res = await generateRiskInsight(risk.state, risk.dailyTotal, risk.percentile95, risk.date);
      setInsight(res);
      setLoading(false);
    };
    fetchInsight();
  }, [risk]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-lg text-white">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3 className="font-bold text-red-900 leading-tight">Risk Detected: {risk.state}</h3>
            <p className="text-xs text-red-700 font-medium">Anomaly recorded on {risk.date}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider border border-red-200">
          Suspicious
        </span>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
            <i className="fas fa-search"></i> The Problem
          </h4>
          <p className="text-slate-600 leading-relaxed text-sm">
            {insight?.problem}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
            <i className="fas fa-chart-line"></i> Impact Assessment
          </h4>
          <p className="text-slate-600 leading-relaxed text-sm">
            {insight?.impact}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <i className="fas fa-tools"></i> Recommended Actions
          </h4>
          <ul className="space-y-2">
            {insight?.solution.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-600 items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-tight">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RiskInsightPanel;
