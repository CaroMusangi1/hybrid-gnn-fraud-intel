import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';
const MODEL_CACHE_KEY = 'modelComparison:cache';
const CLEARED_MODELS_KEY = 'modelComparison:cleared';
const SELECTED_MODEL_KEY = 'modelComparison:selectedModel';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function ModelComparison() {
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(SELECTED_MODEL_KEY) || 'stacked_hybrid');
  const [cache, setCache] = useState(() => readJson(MODEL_CACHE_KEY, {}));
  const [clearedModels, setClearedModels] = useState(() => readJson(CLEARED_MODELS_KEY, {}));
  const [metrics, setMetrics] = useState(() => readJson(MODEL_CACHE_KEY, {})[localStorage.getItem(SELECTED_MODEL_KEY) || 'stacked_hybrid']?.metrics || null);
  const [loading, setLoading] = useState(false);
  const [runningModel, setRunningModel] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(() => readJson(MODEL_CACHE_KEY, {})[localStorage.getItem(SELECTED_MODEL_KEY) || 'stacked_hybrid']?.datasetInfo || null);
  const [error, setError] = useState(null);

  const persistCache = (nextCache) => {
    setCache(nextCache);
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(nextCache));
  };

  const persistClearedModels = (nextClearedModels) => {
    setClearedModels(nextClearedModels);
    localStorage.setItem(CLEARED_MODELS_KEY, JSON.stringify(nextClearedModels));
  };

  const fetchModelMetrics = async (modelKey) => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, datasetRes] = await Promise.all([
        axios.get(`${API_BASE}/model-metrics?model=${modelKey}`),
        axios.get(`${API_BASE}/dataset-status`),
      ]);
      setMetrics(metricsRes.data);
      setDatasetInfo(metricsRes.data?.dataset || datasetRes.data?.dataset || null);
      const nextCache = {
        ...cache,
        [modelKey]: {
          metrics: metricsRes.data,
          datasetInfo: metricsRes.data?.dataset || datasetRes.data?.dataset || null,
          source: 'backend-fetch',
        },
      };
      persistCache(nextCache);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Could not fetch model metrics from the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(SELECTED_MODEL_KEY, selectedModel);
    const cachedEntry = cache[selectedModel];
    if (cachedEntry) {
      setMetrics(cachedEntry.metrics);
      setDatasetInfo(cachedEntry.datasetInfo || cachedEntry.metrics?.dataset || null);
      return;
    }
    if (clearedModels[selectedModel]) {
      setMetrics(null);
      setDatasetInfo(null);
      return;
    }
    fetchModelMetrics(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const refresh = () => {
      const nextCleared = { ...clearedModels };
      delete nextCleared[selectedModel];
      persistClearedModels(nextCleared);
      fetchModelMetrics(selectedModel);
    };
    window.addEventListener('dataset-updated', refresh);
    return () => window.removeEventListener('dataset-updated', refresh);
  }, [selectedModel, cache, clearedModels]);

  const handleRunModel = async () => {
    setRunningModel(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/run-model-evaluation/${selectedModel}`);
      const nextMetrics = response.data.metrics || response.data;
      const nextDataset = response.data.dataset || response.data.metrics?.dataset || null;
      setMetrics(nextMetrics);
      setDatasetInfo(nextDataset);
      const nextCache = {
        ...cache,
        [selectedModel]: {
          metrics: nextMetrics,
          datasetInfo: nextDataset,
          source: 'run-model-evaluation',
          scriptStatus: response.data.script_status,
        },
      };
      persistCache(nextCache);
      const nextCleared = { ...clearedModels };
      delete nextCleared[selectedModel];
      persistClearedModels(nextCleared);
    } catch (err) {
      console.error('Error running model:', err);
      setError('Model evaluation failed. Check that the backend and model scripts are available.');
    } finally {
      setRunningModel(false);
    }
  };

  const handleClearResults = () => {
    const nextCache = { ...cache };
    delete nextCache[selectedModel];
    persistCache(nextCache);
    const nextCleared = { ...clearedModels, [selectedModel]: true };
    persistClearedModels(nextCleared);
    setMetrics(null);
    setDatasetInfo(null);
    setError(null);
  };

  if (loading && !metrics) {
    return <div className="p-4 text-center text-gray-500">Loading metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="p-4 text-center text-gray-500">No saved visuals for this model. Click "Run Real Model Evaluation" to populate them.</div>
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={handleRunModel}
            disabled={runningModel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300"
          >
            <RefreshCw size={16} className={runningModel ? 'animate-spin' : ''} />
            {runningModel ? 'Running Model Script...' : 'Run Real Model Evaluation'}
          </button>
        </div>
      </div>
    );
  }

  const overall = metrics.overall_metrics || metrics;
  const casesCaught = metrics.cases_caught || [];
  const casesMissed = metrics.cases_missed || [];
  const breakdown = metrics.per_case_breakdown || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {datasetInfo && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <strong>Active dataset:</strong> {datasetInfo.source_name || 'current upload'} • {datasetInfo.row_count || 0} rows
        </div>
      )}
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
            {model === 'xgboost' ? '🌳 XGBoost' : model === 'gnn' ? '🔗 GNN' : '⚡ Hybrid'}
          </button>
        ))}
      </div>

      {/* Run Real Model Button */}
      <div className="mb-6">
        <div className="flex gap-3">
          <button
            onClick={handleRunModel}
            disabled={runningModel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300"
          >
            <RefreshCw size={16} className={runningModel ? 'animate-spin' : ''} />
            {runningModel ? 'Running Model Script...' : 'Run Real Model Evaluation'}
          </button>
          <button
            onClick={handleClearResults}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Clear Visuals
          </button>
        </div>
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
          { label: 'Precision', value: (((overall.precision ?? 0) * 100).toFixed(1)), suffix: '%' },
          { label: 'Recall', value: (((overall.recall ?? 0) * 100).toFixed(1)), suffix: '%' },
          { label: 'F1 Score', value: (((overall.f1 ?? 0) * 100).toFixed(1)), suffix: '%' },
          { label: 'Accuracy', value: (((overall.accuracy ?? 0) * 100).toFixed(1)), suffix: '%' }
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
            <h3 className="font-bold text-gray-900">Cases Caught ({metrics.cases_caught_count ?? casesCaught.length})</h3>
          </div>
          <div className="space-y-2">
            {casesCaught.map((case_item) => (
              <div
                key={case_item.id}
                className="bg-white p-2 rounded border border-green-200 text-sm"
              >
                <p className="font-medium text-gray-900">{case_item.name}</p>
                <p className="text-xs text-gray-600">{case_item.summary || case_item.id}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cases Missed */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-bold text-gray-900">Cases Missed ({metrics.cases_missed_count ?? casesMissed.length})</h3>
          </div>
          <div className="space-y-2">
            {casesMissed.length > 0 ? (
              casesMissed.map((case_item) => (
                <div
                  key={case_item.id}
                  className="bg-white p-2 rounded border border-red-200 text-sm"
                >
                  <p className="font-medium text-gray-900">{case_item.name}</p>
                  <p className="text-xs text-gray-600">{case_item.summary || case_item.id}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-700 font-medium">Perfect detection!</p>
            )}
          </div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h4 className="font-bold text-gray-900 mb-3">Fraud Case Breakdown</h4>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded border px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="text-gray-600">Caught: {item.caught} • Missed: {item.missed} • Recall: {(item.recall * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Shortcomings */}
      <div className="grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={18} />
            Strengths
          </h4>
          <ul className="space-y-2">
            {metrics.strengths?.map((strength, idx) => (
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
            {metrics.shortcomings?.map((shortcoming, idx) => (
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
