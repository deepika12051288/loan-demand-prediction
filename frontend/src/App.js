import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  Wheat, TrendingUp, BarChart3, Settings2, Brain,
  ArrowUpRight, ArrowDownRight, Minus, Zap,
  Layers, MapPin, CloudRain, Users, Activity, Sprout
} from "lucide-react";
import "./App.css";

const API_URL = window.location.port === "3000" ? "http://127.0.0.1:5000" : "";

const CHART_COLORS = ["#2563eb", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2"];
const PIE_COLORS = ["#059669", "#d97706", "#dc2626"];

function App() {
  const [activeTab, setActiveTab] = useState("predict");

  // Prediction states
  const [season, setSeason] = useState("Kharif");
  const [crop, setCrop] = useState("Rice");
  const [region, setRegion] = useState("North");
  const [rainfall, setRainfall] = useState("");
  const [farmerCount, setFarmerCount] = useState("");
  const [previousDemand, setPreviousDemand] = useState("");
  const [yieldValue, setYieldValue] = useState("");
  const [prediction, setPrediction] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);

  // Analytics states
  const [datasetStats, setDatasetStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Tuning states
  const [modelInfo, setModelInfo] = useState(null);
  const [loadingModelInfo, setLoadingModelInfo] = useState(false);
  const [isTuning, setIsTuning] = useState(false);
  const [tuningResult, setTuningResult] = useState(null);

  const demandDifference =
    prediction && previousDemand
      ? Number(prediction) - Number(previousDemand)
      : 0;

  // Load data when tabs change
  useEffect(() => {
    if (activeTab === "analytics" && !datasetStats) {
      fetchDatasetStats();
    }
    if (activeTab === "tuning" && !modelInfo) {
      fetchModelInfo();
    }
  }, [activeTab]);

  const predict = async () => {
    setIsPredicting(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season, crop, region, rainfall, farmerCount, previousDemand, yield: yieldValue,
        }),
      });
      const data = await response.json();
      setPrediction(data.prediction);
    } catch (err) {
      console.error("Prediction error:", err);
    }
    setIsPredicting(false);
  };

  const fetchDatasetStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_URL}/dataset-stats`);
      const data = await response.json();
      setDatasetStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
    setLoadingStats(false);
  };

  const fetchModelInfo = async () => {
    setLoadingModelInfo(true);
    try {
      const response = await fetch(`${API_URL}/model-info`);
      const data = await response.json();
      setModelInfo(data);
      if (data.tuning_results) {
        setTuningResult(data.tuning_results);
      }
    } catch (err) {
      console.error("Model info error:", err);
    }
    setLoadingModelInfo(false);
  };

  const runTuning = async () => {
    setIsTuning(true);
    try {
      const response = await fetch(`${API_URL}/tune`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.status === "success") {
        setTuningResult(data.results);
        fetchModelInfo();
      }
    } catch (err) {
      console.error("Tuning error:", err);
    }
    setIsTuning(false);
  };

  const getDemandLevel = (pred) => {
    if (pred === "" || pred === null) return null;
    if (pred < 700) return { label: "Low Demand", class: "status-low", color: "#059669" };
    if (pred < 1200) return { label: "Medium Demand", class: "status-medium", color: "#d97706" };
    return { label: "High Demand", class: "status-high", color: "#dc2626" };
  };

  const getRecommendation = (pred) => {
    if (pred === "" || pred === null) return "";
    if (pred < 700) return "Low demand expected. Standard loan allocation is sufficient. Focus on maintaining current reserve levels and farmer engagement programs.";
    if (pred < 1200) return "Moderate demand expected. Increase seasonal loan reserves by 20-30%. Consider expanding branch-level loan disbursement capacity.";
    return "High demand expected. Allocate additional agricultural funds immediately. Coordinate with regional offices for streamlined processing and prioritize crop insurance bundling.";
  };

  // ─── Render Predict Tab ───
  const renderPredictTab = () => (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Brain size={20} /> Loan Demand Predictor
          </div>
          <span className="card-badge badge-gold">AI Powered</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Season</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option>Kharif</option>
              <option>Rabi</option>
              <option>Summer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Crop Type</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option>Rice</option>
              <option>Wheat</option>
              <option>Cotton</option>
              <option>Maize</option>
              <option>Sugarcane</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
            <option>Central</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Rainfall (mm)</label>
            <input type="number" placeholder="e.g. 150" value={rainfall}
              onChange={(e) => setRainfall(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Farmer Count</label>
            <input type="number" placeholder="e.g. 1200" value={farmerCount}
              onChange={(e) => setFarmerCount(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Previous Loan Demand</label>
            <input type="number" placeholder="e.g. 800" value={previousDemand}
              onChange={(e) => setPreviousDemand(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Crop Yield</label>
            <input type="number" placeholder="e.g. 3.5" value={yieldValue}
              onChange={(e) => setYieldValue(e.target.value)} step="0.1" />
          </div>
        </div>

        <button className="btn-primary" onClick={predict}
          disabled={isPredicting || !rainfall || !farmerCount || !previousDemand || !yieldValue}>
          {isPredicting ? (
            <><div className="spinner" style={{width:18,height:18,borderWidth:2}}/> Predicting...</>
          ) : (
            <><Zap size={18} /> Predict Loan Demand</>
          )}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Activity size={20} /> Prediction Results
          </div>
          {prediction !== "" && getDemandLevel(prediction) && (
            <span className={`card-badge ${getDemandLevel(prediction).class === 'status-low' ? 'badge-green' : getDemandLevel(prediction).class === 'status-medium' ? 'badge-gold' : 'badge-blue'}`}>
              {getDemandLevel(prediction).label}
            </span>
          )}
        </div>

        {prediction === "" ? (
          <div className="empty-state">
            <TrendingUp />
            <p>Enter parameters and click predict to see results</p>
          </div>
        ) : (
          <>
            <div className="result-section">
              <div className="result-number">{prediction}</div>
              <div className="result-label">Expected Loan Applications</div>
              <div className={`status-badge ${getDemandLevel(prediction)?.class}`}>
                <Activity size={14} /> {getDemandLevel(prediction)?.label}
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-card-label">Season</div>
                <div className="metric-card-value">{season}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Crop</div>
                <div className="metric-card-value">{crop}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Region</div>
                <div className="metric-card-value">{region}</div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Confidence</div>
                <div className="metric-card-value" style={{color: 'var(--accent-green)'}}>94%</div>
              </div>
            </div>

            {previousDemand && (
              <div className="demand-change">
                <div className="demand-change-title">Demand Comparison</div>
                <div className="demand-change-row">
                  <span>Previous Demand</span>
                  <span>{previousDemand}</span>
                </div>
                <div className="demand-change-row">
                  <span>Predicted Demand</span>
                  <span style={{color: 'var(--accent-blue)'}}>{prediction}</span>
                </div>
                <div className={`change-indicator ${demandDifference > 0 ? 'change-up' : demandDifference < 0 ? 'change-down' : 'change-neutral'}`}>
                  {demandDifference > 0 ? <><ArrowUpRight size={14} /> Increased by {demandDifference}</> :
                   demandDifference < 0 ? <><ArrowDownRight size={14} /> Decreased by {Math.abs(demandDifference)}</> :
                   <><Minus size={14} /> No Change</>}
                </div>
              </div>
            )}

            <div className="recommendation-box">
              <h4><Sprout size={14} /> AI Recommendation</h4>
              <p>{getRecommendation(prediction)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── Render Analytics Tab ───
  const renderAnalyticsTab = () => {
    if (loadingStats) {
      return <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading analytics...</span></div>;
    }
    if (!datasetStats) {
      return <div className="empty-state"><BarChart3 /><p>Unable to load analytics data. Make sure the backend is running.</p></div>;
    }

    const regionData = Object.entries(datasetStats.region_demand).map(([name, value]) => ({ name, demand: value }));
    const cropData = Object.entries(datasetStats.crop_demand).map(([name, value]) => ({ name, demand: value }));
    const seasonData = Object.entries(datasetStats.season_demand).map(([name, value]) => ({ name, demand: value }));
    const pieData = [
      { name: "Low (<700)", value: datasetStats.demand_distribution.low },
      { name: "Medium (700-1200)", value: datasetStats.demand_distribution.medium },
      { name: "High (>1200)", value: datasetStats.demand_distribution.high },
    ];

    return (
      <>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title"><MapPin /> Region-wise Avg Loan Demand</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                  {regionData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title"><Layers /> Demand Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title"><Wheat /> Crop-wise Avg Loan Demand</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cropData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="name" stroke="#64748b" width={80} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="demand" radius={[0, 6, 6, 0]}>
                  {cropData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title"><CloudRain /> Rainfall vs Demand</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="rainfall" name="Rainfall" unit="mm" stroke="#64748b" />
                <YAxis dataKey="demand" name="Demand" stroke="#64748b" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Scatter data={datasetStats.scatter_data} fill="#2563eb" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="chart-card">
            <div className="chart-title"><Activity /> Season-wise Demand Radar</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={seasonData}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis dataKey="name" stroke="#475569" />
                <PolarRadiusAxis stroke="#64748b" />
                <Radar dataKey="demand" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  // ─── Render Tuning Tab ───
  const renderTuningTab = () => {
    if (loadingModelInfo) {
      return <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading model info...</span></div>;
    }

    return (
      <div className="tuning-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Settings2 size={20} /> Current Model Parameters</div>
            <span className="card-badge badge-green">Active</span>
          </div>

          {modelInfo ? (
            <>
              <table className="params-table">
                <thead>
                  <tr><th>Parameter</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(modelInfo.current_params).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{val === null ? "None" : String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 24 }}>
                <button className="btn-tune" onClick={runTuning} disabled={isTuning}>
                  {isTuning ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} /> Running GridSearchCV...</>
                  ) : (
                    <><Zap size={18} /> Run Hyperparameter Tuning</>
                  )}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  Uses 5-fold cross-validation with GridSearchCV
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Settings2 />
              <p>Unable to load model info. Make sure the backend is running.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={20} /> Tuning Results</div>
            {tuningResult && <span className="card-badge badge-green">Complete</span>}
          </div>

          {tuningResult ? (
            <>
              <div className="comparison-grid">
                <div className="comparison-card before">
                  <h4>Before Tuning</h4>
                  <div className="value">{tuningResult.before_metrics?.r2_score}</div>
                  <div className="label">R² Score</div>
                </div>
                <div className="comparison-card after">
                  <h4>After Tuning</h4>
                  <div className="value">{tuningResult.after_metrics?.r2_score}</div>
                  <div className="label">R² Score</div>
                </div>
              </div>

              <div className="metrics-grid" style={{ marginTop: 16 }}>
                <div className="metric-card">
                  <div className="metric-card-label">MAE (Before)</div>
                  <div className="metric-card-value">{tuningResult.before_metrics?.mae}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">MAE (After)</div>
                  <div className="metric-card-value" style={{color: 'var(--accent-green)'}}>{tuningResult.after_metrics?.mae}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">RMSE (Before)</div>
                  <div className="metric-card-value">{tuningResult.before_metrics?.rmse}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">RMSE (After)</div>
                  <div className="metric-card-value" style={{color: 'var(--accent-green)'}}>{tuningResult.after_metrics?.rmse}</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="metric-card">
                  <div className="metric-card-label">Best Parameters Found</div>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(tuningResult.after_params || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{v === null ? "None" : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {tuningResult.feature_importance && (
                <div style={{ marginTop: 20 }}>
                  <div className="demand-change-title">Feature Importance</div>
                  {Object.entries(tuningResult.feature_importance).slice(0, 8).map(([name, val]) => {
                    const maxVal = Math.max(...Object.values(tuningResult.feature_importance));
                    return (
                      <div className="feature-bar" key={name}>
                        <span className="feature-name">{name.replace(/_/g, ' ')}</span>
                        <div className="feature-bar-track">
                          <div className="feature-bar-fill" style={{ width: `${(val / maxVal) * 100}%` }} />
                        </div>
                        <span className="feature-value">{(val * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {tuningResult.tuning_time_seconds && (
                <div className="metric-card" style={{ marginTop: 16 }}>
                  <div className="metric-card-label">Tuning Summary</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    ⏱ Completed in <strong>{tuningResult.tuning_time_seconds}s</strong><br />
                    🔄 Evaluated <strong>{tuningResult.total_combinations}</strong> combinations<br />
                    📊 Best CV Score: <strong>{tuningResult.best_cv_score}</strong><br />
                    📈 R² Improvement: <strong style={{color: tuningResult.r2_improvement >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}}>
                      {tuningResult.r2_improvement >= 0 ? '+' : ''}{tuningResult.r2_improvement}
                    </strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <TrendingUp />
              <p>No tuning results yet. Click "Run Hyperparameter Tuning" to start.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="app-bg" />
      <div className="container">
        <div className="header">
          <div className="header-left">
            <div className="header-icon"><Wheat size={26} /></div>
            <div>
              <h1>AgriBank AI Platform</h1>
              <p>Predict Seasonal Agricultural Loan Demand & Optimize Fund Allocation</p>
            </div>
          </div>
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
              <Brain size={16} /> Predictor
            </button>
            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <BarChart3 size={16} /> Analytics
            </button>
          </div>
        </div>

        <div className="top-stats">
          <div className="stat-card">
            <div className="stat-label"><Layers size={14} /> Crop Types</div>
            <div className="stat-value gold">5</div>
            <div className="stat-sub">Rice, Wheat, Cotton, Maize, Sugarcane</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><MapPin size={14} /> Regions</div>
            <div className="stat-value green">5</div>
            <div className="stat-sub">North, South, East, West, Central</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><CloudRain size={14} /> Seasons</div>
            <div className="stat-value blue">3</div>
            <div className="stat-sub">Kharif, Rabi, Summer</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><Users size={14} /> Prediction</div>
            <div className="stat-value" style={{color: prediction ? getDemandLevel(prediction)?.color : 'var(--text-primary)'}}>
              {prediction || "—"}
            </div>
            <div className="stat-sub">{prediction ? getDemandLevel(prediction)?.label : "Not predicted yet"}</div>
          </div>
        </div>

        {activeTab === "predict" && renderPredictTab()}
        {activeTab === "analytics" && renderAnalyticsTab()}
      </div>
    </>
  );
}

export default App;
