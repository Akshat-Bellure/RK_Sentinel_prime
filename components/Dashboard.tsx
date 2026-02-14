import React, { useEffect, useRef, useState } from 'react';
import { View } from '../types';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

// Data Structure for Tenders matching new Schema
interface Tender {
  id: string;
  ref: string;
  title: string;
  due: string;
  value: string; // Display string
  valueNum: number; // For filtering
  tag: string;
  tagColor: string;
  risk?: boolean;
  category: 'Goods' | 'Services' | 'Works';
  state: string;
  isVerified: boolean;
  location: { lat: number; lng: number };
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterState, setFilterState] = useState<string>('All');
  const [showUnverified, setShowUnverified] = useState<boolean>(true);

  // Sample Data with Expanded Fields
  const tenders: Tender[] = [
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
      location: { lat: 21.1458, lng: 79.0882 }
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
      location: { lat: 28.6139, lng: 77.2090 }
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
      location: { lat: 12.9716, lng: 77.5946 }
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
      location: { lat: 19.0760, lng: 72.8777 }
    },
    {
      id: '5',
      ref: 'MANUAL/2025/UP/001',
      title: 'Lucknow Metro Signaling Audit',
      due: '30 Days',
      value: '₹5 Cr',
      valueNum: 5,
      tag: 'UNVERIFIED',
      tagColor: 'bg-slate-700 text-slate-400 border-dashed border-yellow-500/50',
      category: 'Services',
      state: 'Uttar Pradesh',
      isVerified: false,
      location: { lat: 26.8467, lng: 80.9462 }
    }
  ];

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

    return matchesSearch && matchesCategory && matchesState && matchesVerified;
  });

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

    const createIcon = (color: string, isVerified: boolean) => {
        const opacity = isVerified ? '1' : '0.5';
        const border = isVerified ? '2px solid #fff' : '2px dashed #eab308'; // Solid white vs Dashed Yellow
        return L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: ${border}; opacity: ${opacity}; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          popupAnchor: [0, -10]
        });
    };

    filteredTenders.forEach(t => {
        let color = '#0FB7B3'; // Default Teal
        if (t.risk) color = '#EF4444';
        else if (t.category === 'Services') color = '#A855F7';
        else if (!t.isVerified) color = '#64748B'; // Slate for unverified

        const marker = L.marker([t.location.lat, t.location.lng], { 
            icon: createIcon(color, t.isVerified) 
        }).addTo(map);

        const popupContent = `
          <div class="text-xs min-w-[200px]">
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white">${t.state}</span>
                ${!t.isVerified ? '<span class="text-[10px] text-yellow-500 font-bold border border-yellow-500/50 px-1 rounded">UNVERIFIED</span>' : ''}
            </div>
            <p class="text-slate-300 font-medium mb-1 line-clamp-2">${t.title}</p>
            <div class="flex justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-700 pt-1">
                <span>Value: ${t.value}</span>
                <span>Due: ${t.due}</span>
            </div>
            <button onclick="window.navigateToView('analyzer')" class="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-teal-400 py-1 rounded text-center font-bold">
              Analyze
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
    });

  }, [filteredTenders, showUnverified]);

  return (
    <div className="space-y-4 fade-in h-full flex flex-col text-slate-200">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-none">
        <div className="glass-panel p-4 rounded border-l-4 border-teal-500 relative overflow-hidden group">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Active Bids</p>
          <h2 className="text-3xl font-mono font-bold text-white">12</h2>
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

        <div className="glass-panel p-4 rounded border-l-4 border-purple-500 relative overflow-hidden group">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Avg. P-Win</p>
          <h2 className="text-3xl font-mono font-bold text-white">68%</h2>
          <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: '68%' }}></div>
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

             <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-2 py-1 rounded border border-slate-700">
                 <input 
                    type="checkbox" 
                    checked={showUnverified} 
                    onChange={e => setShowUnverified(e.target.checked)}
                    className="accent-teal-500"
                 />
                 <span className="text-xs text-slate-300">Show Unverified</span>
             </label>
          </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Map Section */}
        <div className="lg:col-span-2 glass-panel rounded overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-navy-900">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400">public</span>
              Verified Tenders (ap-south-1)
            </h3>
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
                  <p className="text-xs text-slate-400 mt-1 font-medium">Due: {tender.due} • Value: {tender.value}</p>
                  
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