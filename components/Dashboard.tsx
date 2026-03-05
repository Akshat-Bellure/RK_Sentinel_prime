import React, { useEffect, useRef, useState } from 'react';
import { View, Tender } from '../types';
import PWinGauge from './PWinGauge';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenders, setTenders] = useState<Tender[]>([]);
  
  // Filters & Map Layers
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterState, setFilterState] = useState<string>('All');
  const [showUnverified, setShowUnverified] = useState<boolean>(true);
  const [showRiskOnly, setShowRiskOnly] = useState<boolean>(false);

  // Load Data
  useEffect(() => {
      // 1. Static Demo Data
      const demoData: Tender[] = [
        { 
          id: '1', 
          ref: 'GEM/2025/B/4829', 
          title: 'Surveillance System for Nagpur Smart City', 
          due: '12 Days', 
          value: '₹25 Cr',
          valueNum: 25,
          tag: 'RISK DETECTED', 
          tagColor: 'bg-red-500/10 text-red-400 border-red-500/20',
          risk: true,
          category: 'Goods',
          state: 'Maharashtra',
          isVerified: true,
          location: { lat: 21.1458, lng: 79.0882 },
          pwin: 45
        },
        { 
          id: '2', 
          ref: 'CPPP/2025/DL/992', 
          title: 'Ruggedized Tablets for Border Roads Org', 
          due: '18 Days', 
          value: '₹8 Cr', 
          valueNum: 8,
          tag: 'HIGH FIT', 
          tagColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          category: 'Goods',
          state: 'Delhi',
          isVerified: true,
          location: { lat: 28.6139, lng: 77.2090 },
          pwin: 82
        },
        { 
          id: '3', 
          ref: 'GEM/2025/B/5510', 
          title: 'Data Center Hardware Refresh - NIC', 
          due: '5 Days', 
          value: '₹45 Cr', 
          valueNum: 45,
          tag: 'AMENDMENT', 
          tagColor: 'bg-gov-warning/10 text-gov-warning border-gov-warning/20',
          category: 'Services',
          state: 'Karnataka',
          isVerified: true,
          location: { lat: 12.9716, lng: 77.5946 },
          pwin: 60
        },
        { 
          id: '4', 
          ref: 'GEM/2025/B/1029', 
          title: 'Tactical Comms Upgrade', 
          due: '24 Days', 
          value: '₹110 Cr', 
          valueNum: 110,
          tag: 'REVIEWED', 
          tagColor: 'bg-slate-600/10 text-slate-400 border-slate-500/20',
          category: 'Goods',
          state: 'Maharashtra',
          isVerified: true,
          location: { lat: 19.0760, lng: 72.8777 },
          pwin: 75
        }
      ];

      // 2. Load Persisted Data from IngestStation (LocalStorage)
      const persisted = localStorage.getItem('sentinel_tenders');
      let localData: Tender[] = [];
      if (persisted) {
          try {
              localData = JSON.parse(persisted);
          } catch(e) {
              console.error("Failed to parse local tenders", e);
          }
      }

      // Merge: Local items first
      setTenders([...localData, ...demoData]);

  }, []);

  // Filter Logic
  const filteredTenders = tenders.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(term) || 
                          t.ref.toLowerCase().includes(term) ||
                          t.id.includes(term) ||
                          t.tag.toLowerCase().includes(term);
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesState = filterState === 'All' || t.state === filterState;
    const matchesVerified = showUnverified ? true : t.isVerified;
    const matchesRisk = showRiskOnly ? (t.risk || !t.isVerified) : true;

    return matchesSearch && matchesCategory && matchesState && matchesVerified && matchesRisk;
  });

  // Calculate Avg P-Win
  const avgPWin = Math.round(filteredTenders.reduce((acc, t) => acc + t.pwin, 0) / (filteredTenders.length || 1));

  useEffect(() => {
    // Check if Leaflet is loaded
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      // Center on India
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([22.5937, 78.9629], 5);

      mapInstanceRef.current = map;

      // Layer 1: Google Maps Hybrid (Satellite + Roads)
      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Google Maps',
        maxZoom: 20
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
    }
    
    // Update Markers whenever filteredTenders changes
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    const createIcon = (color: string, isVerified: boolean, risk: boolean) => {
        const opacity = isVerified ? '1' : '0.7';
        const border = isVerified ? '2px solid #fff' : '2px dashed #eab308'; // Solid white vs Dashed Yellow
        const pulse = risk ? 'box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.4);' : 'box-shadow: 0 0 5px rgba(0,0,0,0.5);';
        
        return L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: ${border}; opacity: ${opacity}; ${pulse}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -10]
        });
    };

    filteredTenders.forEach(t => {
        let color = '#0FB7B3'; // Default Teal
        if (t.risk) color = '#EF4444'; // Red
        else if (t.category === 'Services') color = '#A855F7'; // Purple
        else if (!t.isVerified) color = '#64748B'; // Slate

        const marker = L.marker([t.location.lat, t.location.lng], { 
            icon: createIcon(color, t.isVerified, t.risk || false) 
        }).addTo(map);

        const popupContent = `
          <div class="text-xs min-w-[200px]">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white">${t.state}</span>
                ${!t.isVerified ? '<span class="text-[10px] text-yellow-500 font-bold border border-yellow-500/50 px-1 rounded">UNVERIFIED</span>' : '<span class="text-[10px] text-green-400 font-bold">VERIFIED</span>'}
            </div>
            <p class="text-slate-300 font-medium mb-1 line-clamp-2">${t.title}</p>
            <div class="flex justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-700 pt-1">
                <span>Val: ${t.value}</span>
                <span>P-Win: ${t.pwin}%</span>
            </div>
            <button onclick="window.navigateToView('analyzer')" class="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-teal-400 py-1 rounded text-center font-bold">
              Analyze Tender
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
    });

  }, [filteredTenders, showUnverified, showRiskOnly]);

  return (
    <div className="space-y-4 fade-in h-full flex flex-col text-slate-200">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-none">
        <div className="glass-panel p-4 rounded border-l-4 border-teal-500 relative overflow-hidden group">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Active Bids</p>
          <h2 className="text-3xl font-mono font-bold text-white">{filteredTenders.length}</h2>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-400 font-medium">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>+2 this week</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded border-l-4 border-gov-warning relative overflow-hidden group">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Critical Alerts</p>
          <h2 className="text-3xl font-mono font-bold text-white">03</h2>
          <p className="text-xs text-slate-500 mt-2 font-medium">Requires immediate attention</p>
        </div>

        <div className="glass-panel p-4 rounded border-l-4 border-purple-500 relative overflow-hidden group flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Avg. P-Win</p>
            <h2 className="text-3xl font-mono font-bold text-white">{avgPWin}%</h2>
            <p className="text-[10px] text-slate-500 mt-1">Conservative Est.</p>
          </div>
          <div className="pr-2">
             <PWinGauge score={avgPWin} confidence={5} size={70} />
          </div>
        </div>

        <div className="glass-panel p-4 rounded border-l-4 border-green-500 relative overflow-hidden group">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Compliance</p>
          <h2 className="text-3xl font-mono font-bold text-white">98%</h2>
          <p className="text-xs text-slate-500 mt-2 font-medium">Audit Trail Validated</p>
        </div>
      </div>

      {/* Command Bar: Filters & Adapters */}
      <div className="glass-panel p-3 rounded flex flex-wrap items-center gap-4 border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ingest Adapters</span>
             <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="GeM API: Connected"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" title="CPPP XML: Connected"></div>
                 <div className="w-2 h-2 rounded-full bg-slate-600" title="Manual: Idle"></div>
             </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
             <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-teal-500 outline-none"
             >
                 <option value="All">All Categories</option>
                 <option value="Goods">Goods</option>
                 <option value="Services">Services</option>
                 <option value="Works">Works</option>
             </select>

             <select 
                value={filterState} 
                onChange={e => setFilterState(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-teal-500 outline-none"
             >
                 <option value="All">All States</option>
                 <option value="Maharashtra">Maharashtra</option>
                 <option value="Delhi">Delhi</option>
                 <option value="Karnataka">Karnataka</option>
                 <option value="Uttar Pradesh">Uttar Pradesh</option>
             </select>
          </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Map Section */}
        <div className="lg:col-span-2 glass-panel rounded overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-navy-900">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400">public</span>
              Live Tender Map
            </h3>
            
            {/* Map Layer Controls */}
            <div className="flex gap-4 items-center bg-slate-800 px-3 py-1 rounded border border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                       type="checkbox" 
                       checked={showUnverified} 
                       onChange={e => setShowUnverified(e.target.checked)}
                       className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-slate-300 font-bold">Unverified Layer</span>
                </label>
                <div className="w-px h-3 bg-slate-600"></div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                       type="checkbox" 
                       checked={showRiskOnly} 
                       onChange={e => setShowRiskOnly(e.target.checked)}
                       className="accent-red-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-slate-300 font-bold">High Risk Only</span>
                </label>
            </div>

            <div className="flex gap-2">
              <button 
                className="px-3 py-1 bg-slate-800 text-xs rounded hover:bg-slate-700 text-slate-300 border border-slate-700"
                onClick={() => {
                   if(mapInstanceRef.current) mapInstanceRef.current.flyTo([22.5937, 78.9629], 5);
                }}
              >
                Reset View
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full relative bg-slate-900">
             <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
             {/* Map Legend Overlay */}
             <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-[10px] text-slate-300 space-y-1">
                 <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400 border border-white"></span> Goods</div>
                 <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500 border border-white"></span> Services</div>
                 <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 border border-white shadow-[0_0_5px_red]"></span> High Risk</div>
                 <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500 border-2 border-dashed border-yellow-500"></span> Unverified</div>
             </div>
          </div>
        </div>

        {/* Tender Feed */}
        <div className="glass-panel rounded overflow-hidden flex flex-col h-full max-h-[calc(100vh-250px)]">
          <div className="p-4 border-b border-slate-700 bg-navy-900 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">Priority Feed</h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{filteredTenders.length} Found</span>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search ID, Title, or Tags..." 
                className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-500 text-sm">search</span>
              {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-500 hover:text-white transition-colors"
                  >
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredTenders.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-xs">
                No tenders found matching criteria.
              </div>
            ) : (
              filteredTenders.map(tender => (
                <div 
                  key={tender.id}
                  className={`p-3 bg-slate-800 rounded border transition-colors cursor-pointer group relative ${tender.isVerified ? 'border-slate-700 hover:border-teal-500' : 'border-slate-700 border-dashed hover:border-yellow-500'}`}
                  onClick={() => onViewChange(View.ANALYZER)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-teal-500 font-semibold">{tender.ref}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${tender.tagColor}`}>
                      {tender.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-teal-400">{tender.title}</h4>
                  <div className="flex justify-between items-end mt-2">
                      <p className="text-xs text-slate-400 font-medium">Due: {tender.due} • Value: {tender.value}</p>
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">P-Win</span>
                          <span className={`text-xs font-bold font-mono ${tender.pwin > 70 ? 'text-green-400' : tender.pwin > 40 ? 'text-yellow-500' : 'text-red-400'}`}>{tender.pwin}%</span>
                      </div>
                  </div>
                  
                  {!tender.isVerified && (
                      <div className="absolute top-2 right-2 opacity-10 text-yellow-500">
                          <span className="material-symbols-outlined text-4xl">warning</span>
                      </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;