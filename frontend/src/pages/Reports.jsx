import { Download, FileText, BarChart2, Filter, Calendar } from 'lucide-react';

export default function Reports() {
  // Mock historical data for the compliance view
  const complianceReports = [
    { id: 'REP-2026-03', month: 'March 2026', type: 'CBK Anti-Money Laundering (AML)', status: 'Generated', date: 'Mar 31, 2026' },
    { id: 'REP-2026-02', month: 'February 2026', type: 'CBK Anti-Money Laundering (AML)', status: 'Archived', date: 'Feb 28, 2026' },
    { id: 'REP-2026-01', month: 'January 2026', type: 'CBK Anti-Money Laundering (AML)', status: 'Archived', date: 'Jan 31, 2026' },
  ];

  const handleDownload = (id) => {
    // For a thesis defense, a simple browser alert proves the concept of the button working
    alert(`Generating encrypted PDF for ${id}. This would normally trigger a secure download for regulatory compliance.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System & Compliance Reports</h1>
          <p className="text-gray-500">Generate regulatory ledgers and historical model performance</p>
        </div>
        <button 
          onClick={() => handleDownload('CURRENT_MONTH')}
          className="flex items-center gap-2 bg-brandPrimary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download size={18} /> Export Current Month
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Model Drift Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BarChart2 size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">Model Accuracy</h3>
            <p className="text-sm text-gray-500 mt-1">Hybrid-GNN is maintaining 96.4% accuracy across all nodes.</p>
            <p className="text-xs font-bold text-green-600 mt-2">No data drift detected</p>
          </div>
        </div>

        {/* Regulatory Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">Compliance Status</h3>
            <p className="text-sm text-gray-500 mt-1">All Tier-3 analyst resolutions have been successfully logged to the immutable ledger.</p>
            <p className="text-xs font-bold text-purple-600 mt-2">Audit Ready</p>
          </div>
        </div>

        {/* System Uptime Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Filter size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900">API Gateway</h3>
            <p className="text-sm text-gray-500 mt-1">FastAPI and Neo4j graph queries are resolving within expected latency parameters.</p>
            <p className="text-xs font-bold text-green-600 mt-2">Uptime: 99.99%</p>
          </div>
        </div>
      </div>

      {/* Regulatory Archives */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800">Regulatory Report Archives</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-400 uppercase text-xs font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Filing Period</th>
                <th className="px-6 py-4">Report Type</th>
                <th className="px-6 py-4">Generation Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complianceReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{report.id}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400"/> {report.month}
                  </td>
                  <td className="px-6 py-4">{report.type}</td>
                  <td className="px-6 py-4 text-gray-500">{report.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDownload(report.id)}
                      className="text-brandPrimary hover:text-indigo-800 font-medium text-sm"
                    >
                      Download PDF
                    </button>
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