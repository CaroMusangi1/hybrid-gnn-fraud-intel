import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';
const MODEL_CACHE_KEY = 'modelComparison:cache';
const MODEL_RUN_OUTPUT_KEY = 'modelComparison:runOutputs';
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
  const [runOutputs, setRunOutputs] = useState(() => readJson(MODEL_RUN_OUTPUT_KEY, {}));
  const [metrics, setMetrics] = useState(() => readJson(MODEL_CACHE_KEY, {})[localStorage.getItem(SELECTED_MODEL_KEY) || 'stacked_hybrid']?.metrics || null);
  const [loading, setLoading] = useState(false);
  const [runningSuite, setRunningSuite] = useState(false);
  const [error, setError] = useState(null);

  const persistCache = (nextCache) => {
    setCache(nextCache);
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(nextCache));
  };

  const persistRunOutputs = (nextOutputs) => {
    setRunOutputs(nextOutputs);
    localStorage.setItem(MODEL_RUN_OUTPUT_KEY, JSON.stringify(nextOutputs));
  };

  const fetchModelMetrics = async (modelKey) => {
    setLoading(true);
    setError(null);
    try {
      const metricsRes = await axios.get(`${API_BASE}/api/models/baseline-metrics?model=${modelKey}`);
      setMetrics(metricsRes.data);
      const nextCache = {
        ...cache,
        [modelKey]: {
          metrics: metricsRes.data,
          source: 'baseline-metrics',
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
      return;
    }
    fetchModelMetrics(selectedModel);
  }, [selectedModel]);

  const handleRunAllBaselineModels = async () => {
    setRunningSuite(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/api/models/run-baseline-suite`);
      const models = response.data?.models || {};

      const nextCache = { ...cache };
      const nextOutputs = { ...runOutputs };

      ['xgboost', 'gnn', 'stacked_hybrid'].forEach((modelKey) => {
        if (models[modelKey]?.metrics) {
          nextCache[modelKey] = {
            metrics: models[modelKey].metrics,
            source: 'run-baseline-suite',
          };
        }
        if (models[modelKey]) {
          nextOutputs[modelKey] = {
            ...models[modelKey],
            ran_at: response.data?.ran_at,
          };
        }
      });

      persistCache(nextCache);
      persistRunOutputs(nextOutputs);

      if (nextCache[selectedModel]?.metrics) {
        setMetrics(nextCache[selectedModel].metrics);
      }
    } catch (err) {
      console.error('Error running baseline suite:', err);
      setError('Failed to run baseline model scripts from the UI. Please check backend logs.');
    } finally {
      setRunningSuite(false);
    }
  };

  if (loading && !metrics) {
    return <div className="p-4 text-center text-gray-500">Loading metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="p-4 text-center text-gray-500">No baseline metrics are available for this model.</div>
      </div>
    );
  }

  const overall = metrics.overall_metrics || metrics;
  const casesCaught = metrics.cases_caught || [];
  const casesMissed = metrics.cases_missed || [];
  const breakdown = metrics.per_case_breakdown || [];
  const selectedOutput = runOutputs[selectedModel];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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

      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleRunAllBaselineModels}
          disabled={runningSuite}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          <RefreshCw size={16} className={runningSuite ? 'animate-spin' : ''} />
          {runningSuite ? 'Running All Models...' : 'Run All Baseline Models'}
        </button>
        <span className="text-xs text-gray-500">Runs baseline_xgboost.py, evaluate_gnn.py, and stacked_hybrid.py from the UI</span>
      </div>

      {selectedOutput && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-slate-800">Script status: {selectedOutput.script_status || 'n/a'}</span>
            {selectedOutput.ran_at && <span className="text-slate-600">Last run: {selectedOutput.ran_at}</span>}
          </div>
          <p className="mb-2 text-xs text-slate-600">Command: {selectedOutput.expected_cli_command}</p>
          <pre className="max-h-56 overflow-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800 whitespace-pre-wrap">
            {selectedOutput.cli_output || selectedOutput.output_preview || 'No CLI output captured yet for this model.'}
          </pre>
        </div>
      )}

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
