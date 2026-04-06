import { 
  Activity, AlertTriangle, TrendingUp, Clock, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Home() {
  // MOCK DATA: 24-Hour Transaction Volume
  const areaData = [
    { time: '00:00', transactions: 250, fraud: 10 },
    { time: '04:00', transactions: 180, fraud: 5 },
    { time: '08:00', transactions: 600, fraud: 45 },
    { time: '12:00', transactions: 950, fraud: 80 },
    { time: '16:00', transactions: 850, fraud: 65 },
    { time: '20:00', transactions: 400, fraud: 25 },
    { time: '23:59', transactions: 300, fraud: 15 },
  ];

  // MOCK DATA: Risk Distribution Pie Chart
  const pieData = [
    { name: 'Low Risk', value: 1234, color: '#10b981' },    // Green
    { name: 'Medium Risk', value: 345, color: '#f59e0b' },  // Orange
    { name: 'High Risk', value: 89, color: '#ef4444' },     // Red
  ];

  // MOCK DATA: Recent Alerts Table
  const recentAlerts = [
    { id: 'TXN-98234', time: '2m ago', sender: 'USER_4521', receiver: 'AGENT_892', amount: 'Ksh 24,500', score: 94, status: 'High' },
    { id: 'TXN-98233', time: '5m ago', sender: 'USER_1289', receiver: 'USER_7634', amount: 'Ksh 8,900', score: 87, status: 'High' },
    { id: 'TXN-98232', time: '8m ago', sender: 'AGENT_234', receiver: 'USER_5621', amount: 'Ksh 12,000', score: 65, status: 'Medium' },
    { id: 'TXN-98231', time: '12m ago', sender: 'USER_9012', receiver: 'AGENT_445', amount: 'Ksh 31,000', score: 91, status: 'High' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500">Real-time Hybrid-GNN performance metrics</p>
      </div>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Transactions</p>
              <h3 className="text-3xl font-bold text-gray-900">2,458</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-brandPrimary"><Activity size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
            <ArrowUpRight size={16} className="mr-1" /> +12.5% <span className="text-gray-400 ml-2 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Fraud Detected</p>
              <h3 className="text-3xl font-bold text-gray-900">47</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600 font-medium">
            <ArrowDownRight size={16} className="mr-1" /> -8.2% <span className="text-gray-400 ml-2 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Detection Rate</p>
              <h3 className="text-3xl font-bold text-gray-900">98.9%</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-500"><TrendingUp size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
            <ArrowUpRight size={16} className="mr-1" /> +2.1% <span className="text-gray-400 ml-2 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-gray-900">87ms</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Clock size={20} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
            <ArrowDownRight size={16} className="mr-1" /> -15.3% <span className="text-gray-400 ml-2 font-normal">vs yesterday</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AREA CHART */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-6">Transaction Activity (24h)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTxns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="transactions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTxns)" />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-2">Risk Distribution</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">1.6k</span>
                <span className="text-xs text-gray-500">Alerts</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mt-4 space-y-2 px-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ALERTS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent High-Risk Alerts</h3>
          <button className="text-sm font-medium text-brandPrimary hover:text-indigo-800 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Sender &rarr; Receiver</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAlerts.map((alert, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{alert.id}</td>
                  <td className="px-6 py-4">{alert.time}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{alert.sender}</span>
                    <span className="mx-2 text-gray-400">&rarr;</span>
                    <span className="font-medium text-gray-800">{alert.receiver}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{alert.amount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${alert.score > 80 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                          style={{ width: `${alert.score}%` }}
                        ></div>
                      </div>
                      <span className={`font-bold ${alert.score > 80 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {alert.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      alert.status === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}