import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllReports } from "../api";
import ReportCard from "../components/ReportCard";
import MapView from "../components/MapView";

function Home() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res = await getAllReports();
      const data = res.data.data || [];
      setReports(data);
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === "Pending").length,
        verified: data.filter(r => r.status === "Verified").length,
        resolved: data.filter(r => r.status === "Resolved").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = filter === "All" ? reports : reports.filter(r => r.status === filter);

  return (
    <div>
      <div className="hero">
        <h1>Open Public <span>Problem Solver</span></h1>
        <p>Report civic problems in your area. Let the community verify. Hold the government accountable.</p>
        <div className="hero-buttons">
          <Link to="/report" className="btn-primary">Report a Problem</Link>
          <Link to="/track" className="btn-secondary">Track My Report</Link>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card"><h2>{stats.total}</h2><p>Total Reports</p></div>
        <div className="stat-card"><h2>{stats.pending}</h2><p>Pending</p></div>
        <div className="stat-card"><h2>{stats.verified}</h2><p>Verified</p></div>
        <div className="stat-card"><h2>{stats.resolved}</h2><p>Resolved</p></div>
      </div>

      <div className="reports-section">
        <h2>Problems Near You</h2>
        <MapView reports={reports} />
      </div>

      <div className="reports-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>All Reports</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "2px solid #e2e8f0" }}>
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="loading">No reports found. Be the first to report!</div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;