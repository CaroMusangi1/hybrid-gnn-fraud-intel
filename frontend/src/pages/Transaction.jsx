import { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Activity, Search, Upload, BarChart3 } from 'lucide-react';

export default function Transactions() {
  // State to hold the form data
  const [formData, setFormData] = useState({
    transaction_id: 'TXN_' + Math.floor(Math.random() * 1000000),
    sender_id: 'USER_123',
    receiver_id: 'USER_999',
    amount: 500,
    transactions_last_24hr: 1,
    hour: 14
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // State to hold the predictions
  const [prediction, setPrediction] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/upload-transaction-file', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadedFile(file.name);
      setExtractedTransactions(response.data.transactions || []);
      setError(null);
    } catch (err) {
      setError('Failed to parse file. Ensure it\'s a valid CSV, PDF, or Word doc.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Send the transaction to FastAPI with comparison
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);
    setComparison(null);
    
    try {
      // Get stacked hybrid prediction
      const hybridResponse = await axios.post('http://127.0.0.1:8000/predict', {
        ...formData,
        amount: parseFloat(formData.amount),
        transactions_last_24hr: parseInt(formData.transactions_last_24hr),
        hour: parseInt(formData.hour)
      });
      setPrediction(hybridResponse.data);

      // Get model comparison
      const comparisonResponse = await axios.post('http://127.0.0.1:8000/run-transaction-comparison', {
        ...formData,
        amount: parseFloat(formData.amount),
        transactions_last_24hr: parseInt(formData.transactions_last_24hr),
        hour: parseInt(formData.hour)
      });
      setComparison(comparisonResponse.data);
      setShowComparison(true);
    } catch (err) {
      console.error(err);
      setError('Failed to process transaction. Is FastAPI running on port 8000?');
    }
    setLoading(false);
  };

  // Helper function to style the badge based on the AI's decision
  const getBadgeStyle = (decision) => {
    if (decision === 'AUTO_CLEARED_SAFE') return 'bg-green-100 text-green-800 border-green-200';
    if (decision === 'REQUIRE_HUMAN') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getModelColor = (score) => {
    if (score > 0.7) return 'text-red-600 bg-red-50';
    if (score > 0.4) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Transaction Monitor</h1>
        <p className="text-gray-600">Simulate transactions, extract from files, and compare all 3 models</p>
      </div>

      {/* FILE UPLOAD SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
          <Upload className="text-blue-600" size={20} /> 
          Extract Transaction Data from File
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.pdf,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            <Upload size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 font-medium">Upload CSV, PDF, or Word doc</p>
            <p className="text-sm text-gray-500 mt-1">Click to browse or drag and drop</p>
          </label>
        </div>

        {uploadedFile && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">✓ File uploaded: {uploadedFile}</p>
            <p className="text-sm text-blue-700">{extractedTransactions.length} records extracted</p>
          </div>
        )}
      </div>

      {/* TRANSACTION SIMULATOR & RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: The Simulator Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <Activity className="text-brandPrimary" size={20} /> 
            Simulate Transaction
          </h2>
          
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Ksh)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Velocity (Last 24h)</label>
                <input type="number" name="transactions_last_24hr" value={formData.transactions_last_24hr} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                <input type="text" name="sender_id" value={formData.sender_id} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver ID</label>
                <input type="text" name="receiver_id" value={formData.receiver_id} onChange={handleChange} required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hour of Day</label>
              <input type="number" name="hour" min="0" max="23" value={formData.hour} onChange={handleChange} required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none" />
            </div>
            
            <button type="submit" disabled={loading} 
              className="w-full mt-6 bg-brandPrimary hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-indigo-300">
              {loading ? 'Running Stacked Hybrid Engine...' : 'Process Transaction & Compare Models'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
        </div>

        {/* RIGHT COLUMN: The AI Results */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <Search className="text-brandPrimary" size={20} /> 
            Stacked Hybrid Result
          </h2>
          
          {!prediction && !loading && (
             <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8">
               <div className="text-center">
                 <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                 <p>Waiting for transaction input...</p>
                 <p className="text-xs text-gray-400 mt-2">Enter details and click "Process Transaction"</p>
               </div>
             </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-brandPrimary animate-pulse">
              <Activity size={48} className="mb-4" />
              <p className="font-medium">Running all models...</p>
            </div>
          )}

          {prediction && (
            <div className={`p-6 rounded-lg border-l-4 shadow-sm bg-gray-50 ${
              prediction.decision === 'AUTO_CLEARED_SAFE' ? 'border-l-green-500' : 
              prediction.decision === 'REQUIRE_HUMAN' ? 'border-l-yellow-500' : 'border-l-red-500'
            }`}>
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Fraud Risk Score</p>
                  <h3 className="text-3xl font-bold text-gray-900">{(prediction.risk_score * 100).toFixed(1)}%</h3>
                </div>
                {prediction.decision === 'AUTO_CLEARED_SAFE' ? (
                  <ShieldCheck className="text-green-500" size={48} />
                ) : (
                  <ShieldAlert className={prediction.decision === 'AUTO_FREEZE' ? 'text-red-500' : 'text-yellow-500'} size={48} />
                )}
              </div>
              
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <strong className="text-gray-700">System Action:</strong> 
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(prediction.decision)}`}>
                    {prediction.decision.replace(/_/g, ' ')}
                  </span>
                </p>
                <p><strong className="text-gray-700">AI Reasoning:</strong> <span className="text-gray-600">{prediction.reason}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODEL COMPARISON SECTION */}
      {comparison && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 border-b pb-4">
            <BarChart3 className="text-purple-600" size={20} />
            All 3 Models Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['xgboost', 'gnn', 'stacked_hybrid'].map(model => {
              const modelData = comparison.models[model];
              const riskScore = modelData.score;
              
              return (
                <div key={model} className={`p-6 rounded-lg border-2 ${getModelColor(riskScore).replace('text-', 'border-').replace('bg-', '')}`}>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{modelData.model_name}</p>
                  <div className="text-4xl font-bold mb-2" style={{
                    color: riskScore > 0.7 ? '#dc2626' : riskScore > 0.4 ? '#ea580c' : '#16a34a'
                  }}>
                    {(riskScore * 100).toFixed(1)}%
                  </div>
                  <p className={`text-sm font-bold ${riskScore > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                    {modelData.label}
                  </p>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        riskScore > 0.7 ? 'bg-red-600' : riskScore > 0.4 ? 'bg-orange-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${riskScore * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Consensus</p>
            <p className="text-lg font-bold text-blue-700">{comparison.consensus}</p>
            <p className="text-xs text-blue-600 mt-1">
              {comparison.consensus === 'FRAUD' 
                ? 'Transaction flagged as fraud by majority of models' 
                : 'Transaction appears legitimate across all models'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}