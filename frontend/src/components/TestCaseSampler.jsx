import { useState, useEffect } from 'react';
import { Beaker, BarChart3, Database } from 'lucide-react';
import axios from 'axios';

export default function TestCaseSampler({ onCaseSelect }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('stacked_hybrid');

  // Fetch test cases
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/fraud-test-cases')
      .then(res => {
        setCases(res.data.cases);
        if (res.data.cases.length > 0) {
          setSelectedCase(res.data.cases[0].id);
        }
      })
      .catch(err => console.error('Error fetching test cases:', err));
  }, []);

  // Fetch predictions when case or model changes
  useEffect(() => {
    if (!selectedCase) return;

    setLoading(true);
    axios.post(`http://127.0.0.1:8000/predict-on-case?case_id=${selectedCase}&model=${model}`)
      .then(res => {
        setPredictions(prev => ({
          ...prev,
          [selectedCase + model]: res.data
        }));
      })
      .catch(err => console.error('Error fetching prediction:', err))
      .finally(() => setLoading(false));
  }, [selectedCase, model]);

  const currentCase = cases.find(c => c.id === selectedCase);
  const currentPrediction = predictions[selectedCase + model];

  const getCaseColor = (fraudType) => {
    if (fraudType.includes('Network')) return 'border-purple-200 bg-purple-50';
    if (fraudType.includes('Tabular')) return 'border-orange-200 bg-orange-50';
    return 'border-green-200 bg-green-50';
  };

  const getFraudTypeLabel = (fraudType) => {
    if (fraudType.includes('Network')) return 'Network Fraud';
    if (fraudType.includes('Tabular')) return 'Tabular Fraud';
    return 'Legitimate';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Beaker className="text-brandPrimary" size={24} />
          Test Case Sampler
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Simulate different fraud scenarios and see which models catch them
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Model to Test
          </label>
          <div className="flex gap-2">
            {['xgboost', 'gnn', 'stacked_hybrid'].map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  model === m
                    ? 'bg-brandPrimary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m === 'xgboost' ? 'XGBoost' : m === 'gnn' ? 'GNN' : 'Hybrid'}
              </button>
            ))}
          </div>
        </div>

        {/* Case Selection Grid */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Test Case ({cases.length} available)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {cases.map((caseItem) => (
              <button
                key={caseItem.id}
                onClick={() => setSelectedCase(caseItem.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCase === caseItem.id
                    ? 'border-brandPrimary bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${getCaseColor(caseItem.description)}`}
              >
                <div className="font-bold text-gray-900">{caseItem.name}</div>
                <div className="text-xs text-gray-600 mt-1">{caseItem.id}</div>
                <div className="text-xs text-gray-500 mt-1">{caseItem.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Case Details */}
        {currentCase && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Database size={18} />
              Case Data: {currentCase.name}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {Object.entries(currentCase.data).map(([key, value]) => (
                <div key={key} className="bg-white p-2 rounded border border-gray-200">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-semibold text-gray-900 ml-1">{value}</span>
                </div>
              ))}
            </div>

            {/* Prediction Result */}
            {currentPrediction && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  currentPrediction.predicted === currentPrediction.true_label
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">
                    Prediction: {currentPrediction.predicted === 1 ? 'FRAUD' : 'LEGITIMATE'}
                  </span>
                  <span className="text-sm font-semibold">
                    Confidence: {(currentPrediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {currentPrediction.explanation}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  True Label: {currentPrediction.true_label === 1 ? 'FRAUD' : 'LEGITIMATE'} •{' '}
                  {currentPrediction.correct ? '✓ Correct' : '✗ Incorrect'}
                </div>
              </div>
            )}

            {loading && <div className="text-center text-gray-500 text-sm">Loading prediction...</div>}
          </div>
        )}

        {/* Case Info Badge */}
        {currentCase && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Fraud Indicators:</p>
              <ul className="space-y-1">
                {currentCase.network_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Network-based indicator present
                  </li>
                )}
                {currentCase.tabular_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Tabular-based indicator present
                  </li>
                )}
                {!currentCase.network_indicator && !currentCase.tabular_indicator && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    No fraud indicators (Legitimate)
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
