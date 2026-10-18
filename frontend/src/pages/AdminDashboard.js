import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminReports, getAdminStats, deleteReport } from "../api";
import config from "../config";
import axios from "axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");
  const adminName = localStorage.getItem("admin_name");
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [updating, setUpdating] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const afterPhotoRef = useRef();

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
    } finally { setLoading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error("Please select a status!"); return; }
    setUpdating(selectedReport.id);
    try {
      const formData = new FormData();
      formData.append("status", newStatus);
      formData.append("admin_comment", adminComment);
      if (afterPhoto) formData.append("after_photo", afterPhoto);

      await axios.put(
        `${config.BACKEND_URL}/api/admin/reports/${selectedReport.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success(`✅ Status updated to ${newStatus}!`);
      if (newStatus === "Resolved") {
        toast.success("🏆 Reward automatically sent to reporter!");
      }
      setSelectedReport(null);
      setAfterPhoto(null);
      setAdminComment("");
      setNewStatus("");
      fetchData();
    } catch (err) {
      toast.error("Failed to update status!");
    } finally { setUpdating(null); }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteReport(reportId, token);
      toast.success("Report deleted!");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete!");
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
      "Pending":     "badge badge-pending",
      "Verified":    "badge badge-verified",
      "Fake":        "badge badge-fake",
      "In Progress": "badge badge-progress",
      "Resolved":    "badge badge-resolved"
    };
    return classes[status] || "badge badge-pending";
  };

  if (loading) return <div className="loading">Loading dashboard... ⏳</div>;

  return (
    <div className="admin-container">

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0d1f3c" }}>
            🛡️ Admin Dashboard
          </h2>
          <p style={{ color: "#64748b" }}>Welcome, {adminName}</p>
        </div>
        <button onClick={handleLogout} className="btn-primary"
          style={{ background: "#dc2626" }}>
          Logout
        </button>
      </div>

      {/* ── STATS ── */}
      <div className="admin-stats">
        {[
          { label: "Total",       value: stats.total || 0,       color: "#0d1f3c" },
          { label: "Pending",     value: stats.pending || 0,     color: "#f59e0b" },
          { label: "Verified",    value: stats.verified || 0,    color: "#0891b2" },
          { label: "In Progress", value: stats.in_progress || 0, color: "#7c3aed" },
          { label: "Resolved",    value: stats.resolved || 0,    color: "#16a34a" },
          { label: "Fake",        value: stats.fake || 0,        color: "#dc2626" },
        ].map((s, i) => (
          <div key={i} className="admin-stat">
            <h3 style={{ color: s.color }}>{s.value}</h3>
            <p>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER BUTTONS ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {["All","Pending","Verified","Fake","In Progress","Resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "0.4rem 1rem", borderRadius: "20px",
            border: "2px solid #e2e8f0",
            background: filter === f ? "#0d1f3c" : "white",
            color: filter === f ? "white" : "#64748b",
            cursor: "pointer", fontWeight: "600", fontSize: "0.85rem"
          }}>
            {f} {f !== "All" && `(${reports.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* ── REPORTS TABLE ── */}
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Before Photo</th>
              <th>After Photo</th>
              <th>AI Detection</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No reports found
                </td>
              </tr>
            ) : filteredReports.map(report => (
              <tr key={report.id}>
                <td style={{ fontWeight: "700", color: "#0891b2", fontSize: "0.8rem" }}>
                  {report.ticket_id}
                </td>
                <td style={{ maxWidth: "150px" }}>
                  <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{report.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{report.address}</div>
                </td>
                <td>{report.category}</td>

                {/* Before Photo */}
                <td>
                  {report.photo_url ? (
                    <img src={report.photo_url} alt="Before"
                      style={{ width: "70px", height: "55px", objectFit: "cover",
                        borderRadius: "8px", border: "2px solid #fee2e2", cursor: "pointer" }}
                      onClick={() => window.open(report.photo_url, "_blank")} />
                  ) : <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>No photo</span>}
                </td>

                {/* After Photo */}
                <td>
                  {report.after_photo_url ? (
                    <img src={report.after_photo_url} alt="After"
                      style={{ width: "70px", height: "55px", objectFit: "cover",
                        borderRadius: "8px", border: "2px solid #d1fae5", cursor: "pointer" }}
                      onClick={() => window.open(report.after_photo_url, "_blank")} />
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      {report.status === "Resolved" ? "⚠️ Missing" : "Pending"}
                    </span>
                  )}
                </td>

                {/* AI Detection */}
                <td>
                  {report.ai_detected_category ? (
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#0891b2" }}>
                        🤖 {report.ai_detected_category}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {report.ai_confidence}% conf.
                      </div>
                    </div>
                  ) : <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>N/A</span>}
                </td>

                <td>
                  <span style={{ color: "#16a34a", fontWeight: "700" }}>✅ {report.confirm_count}</span>
                  {" | "}
                  <span style={{ color: "#dc2626", fontWeight: "700" }}>🚩 {report.fake_count}</span>
                </td>

                <td><span className={getBadge(report.status)}>{report.status}</span></td>

                <td style={{ fontSize: "0.8rem" }}>
                  <div>{report.reporter_name || "Anonymous"}</div>
                  <div style={{ color: "#64748b" }}>{report.reporter_email}</div>
                </td>

                <td>
                  <div style={{ display: "flex", gap: "0.3rem", flexDirection: "column" }}>
                    <button onClick={() => {
                        setSelectedReport(report);
                        setNewStatus(report.status);
                        setAdminComment(report.admin_comment || "");
                      }}
                      style={{ padding: "0.3rem 0.6rem", background: "#dbeafe",
                        border: "none", borderRadius: "6px", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: "700", color: "#1e40af" }}>
                      ✏️ Update
                    </button>
                    <button onClick={() => handleDelete(report.id)}
                      style={{ padding: "0.3rem 0.6rem", background: "#fee2e2",
                        border: "none", borderRadius: "6px", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: "700", color: "#dc2626" }}>
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── UPDATE MODAL ── */}
      {selectedReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "2rem",
            maxWidth: "550px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: "800", color: "#0d1f3c", marginBottom: "0.4rem" }}>
              ✏️ Update Report
            </h3>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {selectedReport.ticket_id} — {selectedReport.title}
            </p>

            {/* Before & After Photos Side by Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b",
                  marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  📸 Before (Problem)
                </div>
                {selectedReport.photo_url ? (
                  <img src={selectedReport.photo_url} alt="Before"
                    style={{ width: "100%", height: "140px", objectFit: "cover",
                      borderRadius: "10px", border: "2px solid #fee2e2" }} />
                ) : (
                  <div style={{ height: "140px", background: "#f1f5f9", borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#94a3b8", fontSize: "0.85rem" }}>No photo</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b",
                  marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  ✅ After (Fixed)
                </div>
                {selectedReport.after_photo_url ? (
                  <img src={selectedReport.after_photo_url} alt="After"
                    style={{ width: "100%", height: "140px", objectFit: "cover",
                      borderRadius: "10px", border: "2px solid #d1fae5" }} />
                ) : afterPhoto ? (
                  <img src={URL.createObjectURL(afterPhoto)} alt="After Preview"
                    style={{ width: "100%", height: "140px", objectFit: "cover",
                      borderRadius: "10px", border: "2px solid #d1fae5" }} />
                ) : (
                  <div onClick={() => afterPhotoRef.current?.click()}
                    style={{ height: "140px", background: "#f0fdf4", borderRadius: "10px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", cursor: "pointer",
                      border: "2px dashed #16a34a", color: "#16a34a" }}>
                    <span style={{ fontSize: "2rem" }}>📷</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Upload After Photo</span>
                  </div>
                )}
                <input type="file" ref={afterPhotoRef} accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => setAfterPhoto(e.target.files[0])} />
                {afterPhoto && (
                  <button onClick={() => setAfterPhoto(null)}
                    style={{ marginTop: "0.3rem", fontSize: "0.75rem", color: "#dc2626",
                      background: "none", border: "none", cursor: "pointer" }}>
                    ✕ Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "700",
                color: "#0d1f3c", marginBottom: "0.4rem" }}>
                Update Status *
              </label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", border: "2px solid #e2e8f0",
                  borderRadius: "10px", fontSize: "1rem", outline: "none" }}>
                <option value="">Select status...</option>
                <option value="Pending">Pending</option>
                <option value="Verified">✅ Verified</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Resolved">🏁 Resolved (auto-rewards reporter)</option>
                <option value="Fake">❌ Fake</option>
              </select>
            </div>

            {/* Admin Comment */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: "700",
                color: "#0d1f3c", marginBottom: "0.4rem" }}>
                Admin Comment
              </label>
              <textarea value={adminComment} onChange={e => setAdminComment(e.target.value)}
                placeholder="Add a comment for the reporter..."
                style={{ width: "100%", padding: "0.75rem", border: "2px solid #e2e8f0",
                  borderRadius: "10px", fontSize: "0.95rem", outline: "none",
                  resize: "vertical", minHeight: "80px", fontFamily: "inherit" }} />
            </div>

            {/* Reward Notice */}
            {newStatus === "Resolved" && (
              <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B",
                borderRadius: "10px", padding: "0.8rem 1rem", marginBottom: "1rem",
                fontSize: "0.85rem", color: "#92400E" }}>
                🏆 <strong>Auto-Reward:</strong> Reporter will automatically receive
                points and a badge when you mark this as Resolved!
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handleStatusUpdate}
                disabled={updating === selectedReport.id}
                className="btn-primary" style={{ flex: 1 }}>
                {updating === selectedReport.id ? "Updating... ⏳" : "✅ Update Report"}
              </button>
              <button onClick={() => {
                  setSelectedReport(null);
                  setAfterPhoto(null);
                  setAdminComment("");
                  setNewStatus("");
                }}
                style={{ flex: 1, padding: "0.8rem", background: "#f1f5f9",
                  border: "none", borderRadius: "10px", fontWeight: "700",
                  cursor: "pointer", color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;