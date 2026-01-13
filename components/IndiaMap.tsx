
import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { INDIA_GEOJSON_URL, normalizeStateName } from '../constants';
import { StateSummary } from '../types';

interface Props {
  summaries: Record<string, StateSummary>;
  onStateSelect: (stateName: string) => void;
  selectedState: string | null;
  currentAggregates: Record<string, number>;
}

const IndiaMap: React.FC<Props> = ({ summaries, onStateSelect, selectedState, currentAggregates }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const maxFreq = useMemo(() => {
    const vals = Object.values(currentAggregates);
    return vals.length > 0 ? Math.max(...vals) : 1000;
  }, [currentAggregates]);

  const getColor = (stateName: string) => {
    const summary = summaries[stateName];
    const freq = currentAggregates[stateName] || 0;
    
    // Explicit Risk Highlight
    if (summary?.status === 'RED') return '#ef4444'; // Solid Red for Critical Zones
    
    if (!summary && freq === 0) return '#f8fafc';
    
    // Vibrant Frequency Gradient (Varying Greens)
    const ratio = Math.log1p(freq) / Math.log1p(maxFreq);
    if (ratio > 0.85) return '#064e3b'; // Peak Flow
    if (ratio > 0.70) return '#065f46';
    if (ratio > 0.55) return '#047857';
    if (ratio > 0.40) return '#059669';
    if (ratio > 0.25) return '#10b981';
    if (ratio > 0.10) return '#34d399';
    return '#a7f3d0'; // Baseline Flow
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        maxBounds: [[6, 60], [38, 100]],
        minZoom: 4,
        maxZoom: 7
      }).setView([22.5, 82], 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }

    const map = mapRef.current;

    fetch(INDIA_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        if (!map) return;
        if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);

        geoJsonLayerRef.current = L.geoJSON(data, {
          style: (feature) => {
            const rawName = feature?.properties?.ST_NM || feature?.properties?.state_name || feature?.properties?.NAME_1 || "";
            const normalized = normalizeStateName(rawName);
            const isSelected = selectedState === normalized;

            return {
              fillColor: getColor(normalized),
              weight: isSelected ? 3.5 : 0.8,
              opacity: 1,
              color: isSelected ? '#1e1b4b' : '#cbd5e1',
              fillOpacity: 1
            };
          },
          onEachFeature: (feature, layer) => {
            const rawName = feature?.properties?.ST_NM || feature?.properties?.state_name || feature?.properties?.NAME_1 || "";
            const normalized = normalizeStateName(rawName);
            const summary = summaries[normalized];
            const freq = currentAggregates[normalized] || 0;

            layer.on({
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onStateSelect(normalized);
                if (map) map.fitBounds((e.target as L.Polyline).getBounds(), { padding: [60, 60] });
              },
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({ weight: 2.5, color: '#6366f1' });
                l.bringToFront();
              },
              mouseout: (e) => {
                const l = e.target;
                l.setStyle({ 
                    weight: selectedState === normalized ? 3.5 : 0.8, 
                    color: selectedState === normalized ? '#1e1b4b' : '#cbd5e1' 
                });
              }
            });

            layer.bindTooltip(`
              <div class="p-3 font-sans leading-none min-w-[140px] shadow-2xl">
                <strong class="text-slate-900 uppercase text-xs block mb-2 border-b border-slate-100 pb-2">${normalized}</strong>
                ${(summary || freq > 0) ? `
                  <div class="space-y-2">
                    <div class="flex justify-between items-center gap-4">
                      <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest">Enrolments</span>
                      <span class="text-[11px] font-black text-slate-900">${freq.toLocaleString()}</span>
                    </div>
                    ${summary ? `
                    <div class="flex justify-between items-center gap-4">
                      <span class="text-[9px] text-slate-500 font-black uppercase tracking-widest">Zone Status</span>
                      <span class="text-[10px] font-black ${summary.status === 'RED' ? 'text-red-600' : 'text-emerald-600'} uppercase">
                        ${summary.status === 'RED' ? '● CRITICAL' : '● NOMINAL'}
                      </span>
                    </div>` : ''}
                  </div>
                ` : `<span class="text-[9px] text-slate-400 font-black uppercase italic">Out of Coverage</span>`}
              </div>
            `, { sticky: true, className: 'custom-tooltip' });
          }
        }).addTo(map);
      });
  }, [summaries, selectedState, currentAggregates]);

  return (
    <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden border border-slate-200 bg-slate-50 shadow-inner group">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-2xl text-[10px] space-y-4">
        <h4 className="font-black text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-[0.2em]">Surveillance Heatmap</h4>
        <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 bg-red-500 rounded-lg shadow-sm"></span> 
              <span className="font-black text-slate-700 uppercase tracking-tighter">Suspicious Anomaly</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 bg-emerald-900 rounded-lg shadow-sm"></span> 
              <span className="font-bold text-slate-600 uppercase tracking-tighter">Peak Frequency</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 bg-emerald-400 rounded-lg shadow-sm"></span> 
              <span className="font-bold text-slate-600 uppercase tracking-tighter">Healthy Traffic</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 bg-emerald-100 rounded-lg shadow-sm"></span> 
              <span className="font-bold text-slate-600 uppercase tracking-tighter">Low Activity</span>
            </div>
        </div>
      </div>

      <button 
        onClick={() => { if(mapRef.current) mapRef.current.setView([22.5, 82], 4); onStateSelect(null as any); }}
        className="absolute top-6 left-6 z-[1000] bg-white p-4 rounded-2xl shadow-xl border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
        title="Reset Map View"
      >
        <i className="fas fa-crosshairs text-lg"></i>
      </button>
    </div>
  );
};

export default IndiaMap;
