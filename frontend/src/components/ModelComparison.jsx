import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function ModelComparison() {
  const [selectedModel, setSelectedModel] = useState('stacked_hybrid');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch metrics for selected model
  useEffect(() => {
    setLoading(true);
    axios.get(`http://127.0.0.1:8000/model-metrics?model=${selectedModel}`)
      .then(res => setMetrics(res.data))
      .catch(err => console.error('Error fetching metrics:', err))
      .finally(() => setLoading(false));
  }, [selectedModel]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-center text-gray-500">No metrics available</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Model Selection Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {['xgboost', 'gnn', 'stacked_hybrid'].map((model) => (
          <button
            key={model}
            onClick={() => setSelectedModel(model)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedModel === model
                ? 'bg-brandPrimary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {model === 'xgboost' ? 'XGBoost' : model === 'gnn' ? 'GNN' : 'Stacked Hybrid'}
          </button>
        ))}
      </div>

      {/* Model Name & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-brandPrimary" size={24} />
          {metrics.model_name}
        </h2>
        <p className="text-gray-600 text-sm mt-1">{metrics.description}</p>
      </div>

      {/* Metrics Grid (Precision, Recall, F1, Accuracy) */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Precision', value: (metrics.precision * 100).toFixed(1), suffix: '%' },
          { label: 'Recall', value: (metrics.recall * 100).toFixed(1), suffix: '%' },
          { label: 'F1 Score', value: (metrics.f1 * 100).toFixed(1), suffix: '%' },
          { label: 'Accuracy', value: (metrics.accuracy * 100).toFixed(1), suffix: '%' }
        ].map((metric, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200"
          >
            <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-indigo-600">
              {metric.value}{metric.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Cases Caught vs Missed */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Cases Caught */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-green-600" size={20} />
            <h3 className="font-bold text-gray-900">Cases Caught ({metrics.cases_caught_count})</h3>
          </div>
          <div className="space-y-2">
            {metrics.cases_caught.map((case_item) => (
              <div
                key={case_item.id}
                className="bg-white p-2 rounded border border-green-200 text-sm"
              >
                <p className="font-medium text-gray-900">{case_item.name}</p>
                <p className="text-xs text-gray-600">{case_item.id}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cases Missed */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-bold text-gray-900">Cases Missed ({metrics.cases_missed_count})</h3>
          </div>
          <div className="space-y-2">
            {metrics.cases_missed.length > 0 ? (
              metrics.cases_missed.map((case_item) => (
                <div
                  key={case_item.id}
                  className="bg-white p-2 rounded border border-red-200 text-sm"
                >
                  <p className="font-medium text-gray-900">{case_item.name}</p>
                  <p className="text-xs text-gray-600">{case_item.id}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-700 font-medium">Perfect detection!</p>
            )}
          </div>
        </div>
      </div>

      {/* Strengths & Shortcomings */}
      <div className="grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={18} />
            Strengths
          </h4>
          <ul className="space-y-2">
            {metrics.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Shortcomings */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={18} />
            Shortcomings
          </h4>
          <ul className="space-y-2">
            {metrics.shortcomings.map((shortcoming, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex gap-2">
                <span className="text-orange-600 font-bold">•</span>
                {shortcoming}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
