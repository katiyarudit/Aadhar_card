
import React, { useState } from 'react';
import { parseCSV, processAnalysis, generateMockCSV } from './utils/dataProcessor';
import { StateSummary, RiskAnalysis } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';

const App: React.FC = () => {
  const [summaries, setSummaries] = useState<Record<string, StateSummary>>({});
  const [risks, setRisks] = useState<RiskAnalysis[]>([]);
  const [monthlyStateData, setMonthlyStateData] = useState<Record<string, Record<string, number>>>({});
  const [months, setMonths] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      if (data.length === 0) {
        alert("Empty or Invalid dataset. Please use correct headers.");
        setIsProcessing(false);
        return;
      }
      const res = processAnalysis(data);
      setSummaries(res.stateSummaries);
      setRisks(res.risks);
      setMonthlyStateData(res.monthlyStateData);
      setMonths(res.months);
      setHasData(true);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockCSV = generateMockCSV();
      const data = parseCSV(mockCSV);
      const res = processAnalysis(data);
      setSummaries(res.stateSummaries);
      setRisks(res.risks);
      setMonthlyStateData(res.monthlyStateData);
      setMonths(res.months);
      setHasData(true);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-[2000] shadow-sm backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-200">
            <i className="fas fa-fingerprint text-2xl"></i>
          </div>
          <div>
            <h1 className="font-black text-slate-900 tracking-tighter leading-none uppercase text-xl">Aadhaar Border Intel</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                District Drill-down Active // v3.5
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-black text-slate-600 cursor-pointer transition-all border border-slate-200 shadow-sm">
                <i className="fas fa-sync-alt"></i> REFRESH DATA
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
             </label>
             <button onClick={() => setHasData(false)} className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><i className="fas fa-power-off"></i></button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-8">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
            <div className="w-full max-w-2xl text-center space-y-12">
              <div className="space-y-6">
                <div className="inline-flex p-6 bg-indigo-600 rounded-[2.5rem] shadow-2xl rotate-3">
                    <i className="fas fa-satellite-dish text-6xl text-white"></i>
                </div>
                <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-tight">
                    Tactical Border <br/>
                    <span className="text-indigo-600">Risk Surveillance</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto">
                  Automated spike detection and district-level enrolment audit for Indian frontier territories.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <label className="group bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center gap-5 cursor-pointer hover:border-indigo-400 transition-all shadow-sm hover:shadow-2xl">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <i className="fas fa-upload text-4xl"></i>
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-slate-800 text-xl tracking-tighter">SECURE UPLOAD</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 block">CSV Dataset</span>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                <button onClick={handleLoadDemo} className="group bg-indigo-600 rounded-[3rem] p-16 flex flex-col items-center gap-5 cursor-pointer hover:bg-slate-900 transition-all shadow-2xl">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white transition-all group-hover:rotate-12">
                    <i className="fas fa-bolt text-4xl"></i>
                  </div>
                  <div className="text-center text-white">
                    <span className="block font-black text-xl tracking-tighter">SIMULATE SOURCE</span>
                    <span className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mt-2 block">Frontier Logs</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
            <div className="w-20 h-20 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
                <p className="font-black text-slate-900 uppercase tracking-tighter text-3xl">Auditing Territories</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Processing District-Wise Enrolment Buffers...</p>
            </div>
          </div>
        ) : (
          <AnalysisDashboard summaries={summaries} risks={risks} monthlyStateData={monthlyStateData} months={months} />
        )}
      </main>

      <footer className="bg-white/50 py-8 px-12 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
        <p>&copy; 2024 Strategic Decision Support System // Confidential</p>
        <div className="flex gap-10 opacity-30 grayscale scale-110">
            <i className="fas fa-shield-cat"></i>
            <i className="fas fa-microchip"></i>
            <i className="fas fa-network-wired"></i>
        </div>
      </footer>
    </div>
  );
};

export default App;
