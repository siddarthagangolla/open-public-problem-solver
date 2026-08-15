import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminReports, getAdminStats, updateReportStatus } from "../api";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");
  const adminName = localStorage.getItem("admin_name");
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        getAdminReports(token),
        getAdminStats(token)
      ]);
      setReports(reportsRes.data.data || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      toast.error("Session expired! Please login again.");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, status, comment = "") => {
    setUpdating(reportId);
    try {
      await updateReportStatus(reportId, { status, admin_comment: comment }, token);
      toast.success("Status updated to " + status);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status!");
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    navigate("/admin");
  };

  const filteredReports = filter === "All"
    ? reports
    : reports.filter(r => r.status === filter);

  const getBadge = (status) => {
    const classes = {
      "Pending": "badge badge-pending",
      "Verified": "badge badge-verified",
      "Fake": "badge badge-fake",
      "In Progress": "badge badge-progress",
      "Resolved": "badge badge-resolved"
    };
    return classes[status] || "badge badge-pending";
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#0d1f3c" }}>
            Admin Dashboard
          </h2>
          <p style={{ color: "#64748b" }}>Welcome, {adminName}</p>
        </div>
        <button onClick={handleLogout} className="btn-primary"
          style={{ background: "#dc2626" }}>
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: "Total", value: stats.total || 0, color: "#0d1f3c" },
          { label: "Pending", value: stats.pending || 0, color: "#f59e0b" },
          { label: "Verified", value: stats.verified || 0, color: "#16a34a" },
          { label: "In Progress", value: stats.in_progress || 0, color: "#0891b2" },
          { label: "Resolved", value: stats.resolved || 0, color: "#16a34a" },
          { label: "Fake", value: stats.fake || 0, color: "#dc2626" },
        ].map((s, i) => (
          <div key={i} className="admin-stat">
            <h3 style={{ color: s.color }}>{s.value}</h3>
            <p>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["All","Pending","Verified","Fake","In Progress","Resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 1rem", borderRadius: "20px", border: "2px solid #e2e8f0",
              background: filter === f ? "#0d1f3c" : "white",
              color: filter === f ? "white" : "#64748b",
              cursor: "pointer", fontWeight: "600"
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No reports found
                </td>
              </tr>
            ) : (
              filteredReports.map(report => (
                <tr key={report.id}>
                  <td style={{ fontWeight: "600", color: "#0891b2" }}>{report.ticket_id}</td>
                  <td>{report.title}</td>
                  <td>{report.category}</td>
                  <td>{report.address || `${report.latitude?.toFixed(3)}, ${report.longitude?.toFixed(3)}`}</td>
                  <td>
                    <span style={{ color: "#16a34a" }}>✅ {report.confirm_count}</span>
                    {" | "}
                    <span style={{ color: "#dc2626" }}>🚩 {report.fake_count}</span>
                  </td>
                  <td><span className={getBadge(report.status)}>{report.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {["Verified","In Progress","Resolved","Fake"].map(s => (
                        <button key={s}
                          onClick={() => handleStatusUpdate(report.id, s)}
                          disabled={updating === report.id || report.status === s}
                          style={{
                            padding: "0.25rem 0.5rem", fontSize: "0.75rem",
                            borderRadius: "4px", border: "none", cursor: "pointer",
                            background: s === "Fake" ? "#fee2e2" :
                                        s === "Resolved" ? "#d1fae5" :
                                        s === "Verified" ? "#dbeafe" : "#fef3c7",
                            color: s === "Fake" ? "#991b1b" :
                                   s === "Resolved" ? "#065f46" :
                                   s === "Verified" ? "#1e40af" : "#92400e",
                            fontWeight: "600",
                            opacity: report.status === s ? 0.5 : 1
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;