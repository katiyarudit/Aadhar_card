
import React, { useState, useMemo } from 'react';
import { StateSummary, RiskAnalysis, DistrictSummary } from '../types';
import IndiaMap from './IndiaMap';
import RiskInsightPanel from './RiskInsightPanel';
import ComparisonChart from './ComparisonChart';
import { 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

interface Props {
  summaries: Record<string, StateSummary>;
  risks: RiskAnalysis[];
  monthlyStateData: Record<string, Record<string, number>>;
  months: string[];
}

const AnalysisDashboard: React.FC<Props> = ({ summaries, risks, monthlyStateData, months }) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[months.length - 1] || '');
  const [comparisonStates, setComparisonStates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'FOCUS' | 'COMPARE'>('FOCUS');
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  const currentAggregates = useMemo(() => {
    return selectedMonth && monthlyStateData[selectedMonth] ? monthlyStateData[selectedMonth] : {};
  }, [selectedMonth, monthlyStateData]);

  const stateList = useMemo(() => {
    return Object.values(summaries).sort((a, b) => b.totalEnrolments - a.totalEnrolments);
  }, [summaries]);

  const selectedStateSummary = selectedState ? summaries[selectedState] : null;

  const districtList = useMemo(() => {
    if (!selectedStateSummary) return [];
    // Only show top 10 districts by volume
    return Object.values(selectedStateSummary.districts)
      .sort((a, b) => b.totalEnrolments - a.totalEnrolments)
      .slice(0, 10);
  }, [selectedStateSummary]);

  const toggleComparison = (s: string) => {
    setComparisonStates(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].slice(-5)
    );
  };

  const ageData = useMemo(() => {
    if (!selectedStateSummary) return [];
    const d = selectedStateSummary.ageDist;
    return [
      { name: '0-5 (Infants)', value: d.infants, color: '#6366f1' },
      { name: '5-17 (Students)', value: d.students, color: '#10b981' },
      { name: '18+ (Adults)', value: d.adults, color: '#f59e0b' }
    ];
  }, [selectedStateSummary]);

  const formatMonth = (m: string) => {
    if (!m) return "";
    const parts = m.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-160px)] animate-in fade-in duration-700">
      {/* LEFT: MAP HUB */}
      <div className="lg:w-7/12 flex flex-col gap-6">
        <div className="h-[550px] w-full bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl relative">
          <IndiaMap 
            summaries={summaries} 
            onStateSelect={(s) => {
              if (activeTab === 'COMPARE') toggleComparison(s);
              else setSelectedState(s);
            }} 
            selectedState={selectedState}
            currentAggregates={currentAggregates}
          />
          
          <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 items-end">
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xl flex gap-1">
              <button 
                onClick={() => setActiveTab('FOCUS')} 
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'FOCUS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Focus Drill-down
              </button>
              <button 
                onClick={() => setActiveTab('COMPARE')} 
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'COMPARE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Multi-State Compare
              </button>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3">
              <i className="fas fa-calendar-check text-indigo-500 text-xs"></i>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase text-slate-700 outline-none cursor-pointer"
              >
                {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Regional Volume</p>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">
              {Object.values(currentAggregates).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Critical Zones</p>
            <div className="text-4xl font-black text-red-600 tracking-tighter">{risks.length}</div>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Audit Status</p>
            <div className="text-xl font-black flex items-center gap-2">
                <i className="fas fa-shield-halved text-indigo-400"></i>
                Active Vigilance
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: ANALYTICS DRILL-DOWN */}
      <div className="lg:w-5/12 space-y-8 h-full flex flex-col">
        {activeTab === 'COMPARE' ? (
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col overflow-hidden">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Intelligence Comparison</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Correlating multi-regional frontier spikes</p>
            </div>

            {comparisonStates.length > 0 ? (
              <div className="space-y-6 flex-shrink-0">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                  <ComparisonChart selectedStates={comparisonStates.map(s => summaries[s]).filter(Boolean)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {comparisonStates.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10px] font-black rounded-xl flex items-center gap-2">
                      {s} <i onClick={() => toggleComparison(s)} className="fas fa-times-circle cursor-pointer opacity-40 hover:opacity-100 transition-opacity"></i>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-6 flex-shrink-0">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                  <i className="fas fa-chart-line text-4xl"></i>
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                    Select frontier states from the list below <br/> to perform comparative growth analysis.
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Comparison Features</h4>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-[11px] font-bold">
                        <i className="fas fa-check text-indigo-400"></i> Monthly Enrolment Trajectory
                    </li>
                    <li className="flex items-center gap-3 text-[11px] font-bold">
                        <i className="fas fa-check text-indigo-400"></i> Cross-Border Spike Correlation
                    </li>
                    <li className="flex items-center gap-3 text-[11px] font-bold">
                        <i className="fas fa-check text-indigo-400"></i> Multi-Point Risk Benchmarking
                    </li>
                 </ul>
              </div>

              <div className="pt-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">State Inventory</h4>
                <div className="grid grid-cols-1 gap-2">
                    {stateList.map(s => (
                    <div 
                        key={s.state} 
                        onClick={() => toggleComparison(s.state)}
                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${comparisonStates.includes(s.state) ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg scale-[1.02]' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${s.status === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}></span>
                            <span className="text-xs font-black uppercase tracking-tighter">{s.state}</span>
                        </div>
                        <i className={`fas ${comparisonStates.includes(s.state) ? 'fa-check-circle' : 'fa-plus-circle opacity-20'}`}></i>
                    </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : selectedStateSummary ? (
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-8 animate-in fade-in slide-in-from-right-8 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedState(null)} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest">
                <i className="fas fa-arrow-left mr-2"></i> National Overview
              </button>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${selectedStateSummary.status === 'RED' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    {selectedStateSummary.status} Audit
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">{selectedStateSummary.state}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">State-Specific Intelligence Drill</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-10">
              {/* Demographics */}
              <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                <h3 className="text-[10px] font-black text-slate-800 uppercase mb-4 flex items-center gap-2 tracking-widest">
                  <i className="fas fa-users-viewfinder text-indigo-500"></i> Age Segmentation
                </h3>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ageData} innerRadius={40} outerRadius={65} dataKey="value" stroke="none" paddingAngle={5}>
                        {ageData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {ageData.map(d => (
                    <div key={d.name} className="text-center p-2 bg-white rounded-xl border border-indigo-100/50 shadow-sm">
                      <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1.5">{d.name.split(' ')[0]}</div>
                      <div className="text-xs font-black text-slate-900 tracking-tighter">{d.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 10 Districts Breakdown */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex justify-between items-center">
                  Top 10 Districts by Flow
                  <span className="text-indigo-600 text-[9px] font-black bg-indigo-50 px-2 py-0.5 rounded-full">TACTICAL VIEW</span>
                </h3>
                <div className="space-y-3">
                  {districtList.map((dist, idx) => (
                    <div key={dist.district} className="bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-indigo-200">
                      <div 
                        onClick={() => setExpandedDistrict(expandedDistrict === dist.district ? null : dist.district)}
                        className="flex items-center justify-between p-5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors">#{idx + 1}</span>
                           <div>
                             <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{dist.district}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">{dist.totalEnrolments.toLocaleString()} Enrolments</p>
                           </div>
                        </div>
                        <i className={`fas fa-chevron-right text-[10px] text-slate-300 transition-all ${expandedDistrict === dist.district ? 'rotate-90 text-indigo-500' : ''}`}></i>
                      </div>
                      
                      {expandedDistrict === dist.district && (
                        <div className="bg-slate-50/50 p-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                           <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">0-5 Infants</p>
                                <p className="text-lg font-black text-indigo-600 tracking-tighter">{dist.ageDist.infants.toLocaleString()}</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">18+ Adults</p>
                                <p className="text-lg font-black text-slate-900 tracking-tighter">{dist.ageDist.adults.toLocaleString()}</p>
                              </div>
                           </div>
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest border-b border-slate-200 pb-2">Active Pincode Nodes</p>
                           <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {Object.entries(dist.pincodes).sort((a,b) => b[1] - a[1]).map(([pc, count]) => (
                                <div key={pc} className="flex justify-between items-center text-[10px] font-bold py-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-slate-500 tracking-widest">{pc}</span>
                                  <span className="text-slate-900 font-black">{count.toLocaleString()} <span className="text-[8px] opacity-40">VOL</span></span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights Section */}
              <div className="pt-10 border-t border-slate-100">
                {risks.filter(r => r.state === selectedState).length > 0 ? (
                  <div className="space-y-6">
                     <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <i className="fas fa-triangle-exclamation animate-pulse"></i> Counter-Spike Intelligence
                     </h3>
                     <RiskInsightPanel risk={risks.filter(r => r.state === selectedState)[0]} />
                  </div>
                ) : (
                  <div className="p-12 bg-emerald-50/20 rounded-[2.5rem] border-2 border-dashed border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-lg shadow-emerald-100/50">
                      <i className="fas fa-circle-check text-2xl"></i>
                    </div>
                    <p className="text-emerald-900 font-black text-sm uppercase tracking-[0.1em] leading-none">Security Status: NOMINAL</p>
                    <p className="text-emerald-600/70 text-[11px] font-bold uppercase mt-3 tracking-tight">
                        Standard verification traffic detected. <br/> No frontier anomalies identified.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col gap-8">
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl flex-1 flex flex-col items-center justify-center text-center group">
                <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-200 mb-10 shadow-inner group-hover:scale-105 transition-transform duration-700">
                    <i className="fas fa-satellite text-5xl"></i>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase">Frontier Surveillance</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                  Select a territory from the map or use comparison mode to correlate regional enrolment spikes across international borders.
                </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg">
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                   <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em]">
                        National Performance Hub
                    </h3>
                    <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md">LIVE</span>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                    {stateList.map(s => (
                        <div 
                            key={s.state} 
                            onClick={() => setSelectedState(s.state)} 
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all hover:scale-[1.03] cursor-pointer group ${s.status === 'RED' ? 'bg-red-50 border-red-100 hover:shadow-lg hover:shadow-red-100/50' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}></div>
                                <span className="text-[11px] font-black uppercase text-slate-800 tracking-tight">{s.state}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] font-mono font-black text-slate-900 block">{(currentAggregates[s.state] || 0).toLocaleString()}</span>
                                <span className="text-[8px] uppercase font-black text-slate-400">Monthly Volume</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
