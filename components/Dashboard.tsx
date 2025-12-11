import React, { useState, useEffect, useRef } from 'react';

interface DashboardProps {
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate live logs
  useEffect(() => {
    const actions = ['Inference request', 'Audio chunk received', 'TTS generation', 'Database sync', 'Session created', 'Health check'];
    const components = ['API-Gateway', 'Model-Worker-01', 'Model-Worker-02', 'DB-Shard-01'];
    
    const interval = setInterval(() => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const component = components[Math.floor(Math.random() * components.length)];
      const latency = Math.floor(Math.random() * 200) + 20;
      const msg = `[${new Date().toLocaleTimeString()}] [${component}] ${action} (${latency}ms)`;
      
      setLogs(prev => {
        const newLogs = [...prev, msg];
        if (newLogs.length > 8) newLogs.shift();
        return newLogs;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Mock Data for Charts
  const chartDataMap = {
    '1h': [30, 45, 35, 60, 50, 75, 65, 85],
    '24h': [120, 132, 101, 134, 90, 230, 210, 245],
    '7d': [820, 932, 901, 934, 1290, 1330, 1320, 1400]
  };

  const data = chartDataMap[timeRange];
  const max = Math.max(...data);
  const min = 0;
  
  // Create SVG path for line chart
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} 100,100 0,100`;

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:shadow text-slate-600 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
                <p className="text-sm text-slate-500">Real-time monitoring and configuration</p>
            </div>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            {(['1h', '24h', '7d'] as const).map((r) => (
                <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === r ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {r.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
            { label: 'Total Sessions', value: '1,284', change: '+12%', color: 'text-blue-600' },
            { label: 'Active Users', value: '42', change: '+5%', color: 'text-teal-600' },
            { label: 'Avg Latency', value: '342ms', change: '-18ms', color: 'text-purple-600' },
            { label: 'Model Accuracy', value: '94.2%', change: '+0.4%', color: 'text-green-600' }
        ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                    <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{stat.change}</span>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Traffic Overview</h3>
            <div className="h-64 w-full relative group">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#gradient)" />
                    <polyline
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="2"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                        className="transition-all duration-500 ease-in-out"
                    />
                    {/* Hover Dots */}
                     {data.map((val, i) => {
                         const x = (i / (data.length - 1)) * 100;
                         const y = 100 - ((val - min) / (max - min)) * 100;
                         return (
                             <circle 
                                key={i} 
                                cx={x} 
                                cy={y} 
                                r="1.5" 
                                fill="white" 
                                stroke="#0d9488" 
                                strokeWidth="0.5"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                             />
                         );
                     })}
                </svg>
                {/* Y-Axis Labels Mock */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 -ml-6 py-2">
                    <span>{max}</span>
                    <span>{Math.round(max/2)}</span>
                    <span>0</span>
                </div>
            </div>
        </div>

        {/* Top Diseases & Config */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Top Diagnoses</h3>
                <div className="space-y-3">
                    {[
                        { name: 'Viral Fever', percent: 35, color: 'bg-teal-500' },
                        { name: 'Migraine', percent: 24, color: 'bg-blue-500' },
                        { name: 'Allergic Rhinitis', percent: 18, color: 'bg-purple-500' },
                        { name: 'Gastritis', percent: 12, color: 'bg-orange-500' }
                    ].map((d) => (
                        <div key={d.name}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">{d.name}</span>
                                <span className="font-semibold text-slate-800">{d.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.percent}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-4">Model Configuration</h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-sm mb-2">
                             <span className="text-slate-600">Confidence Threshold</span>
                             <span className="font-mono font-bold text-teal-600">{confidenceThreshold}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                         />
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Model Version</span>
                        <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-bold">v2.5-flash-quantized</span>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Terminal / Logs */}
      <div className="bg-slate-900 rounded-xl p-6 shadow-lg overflow-hidden border border-slate-800">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live System Logs
        </h3>
        <div className="font-mono text-xs space-y-2 h-32 overflow-y-auto scrollbar-hide">
            {logs.map((log, i) => (
                <div key={i} className="text-slate-300 border-l-2 border-slate-700 pl-3">
                    {log}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};