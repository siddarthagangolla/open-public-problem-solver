import React, { useState } from "react";
import { toast } from "react-toastify";
import { getReportByTicket, getReportsByEmail, voteOnReport } from "../api";

function TrackReport() {
  const [activeTab, setActiveTab] = useState("ticket");
  const [ticketId, setTicketId] = useState("");
  const [email, setEmail] = useState("");
  const [report, setReport] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voterEmail, setVoterEmail] = useState("");
  const [voting, setVoting] = useState(false);

  const handleSearchTicket = async e => {
    e.preventDefault();
    if (!ticketId.trim()) { toast.error("Please enter a ticket ID!"); return; }
    setLoading(true);
    try {
      const res = await getReportByTicket(ticketId.trim());
      setReport(res.data.data);
      setRewards(res.data.rewards || []);
      toast.success("Report found! ✅");
    } catch (err) {
      toast.error("Report not found! Check your ticket ID.");
      setReport(null);
    } finally { setLoading(false); }
  };

  const handleSearchEmail = async e => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email!"); return; }
    setLoading(true);
    try {
      const res = await getReportsByEmail(email.trim());
      setMyReports(res.data.data || []);
      setRewards(res.data.rewards || []);
      setTotalPoints(res.data.total_points || 0);
      toast.success(`Found ${res.data.data.length} reports!`);
    } catch (err) {
      toast.error("No reports found for this email.");
    } finally { setLoading(false); }
  };

  const handleVote = async (voteType) => {
    if (!voterEmail) { toast.error("Please enter your email to vote!"); return; }
    setVoting(true);
    try {
      await voteOnReport({ report_id: report.id, voter_email: voterEmail, vote: voteType });
      toast.success(voteType === "confirm" ? "✅ You confirmed this report!" : "🚩 You flagged this as fake!");
      const res = await getReportByTicket(ticketId);
      setReport(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Already voted on this report!");
    } finally { setVoting(false); }
  };

  const getBadgeClass = (status) => {
    const classes = {
      "Pending": "badge badge-pending",
      "Verified": "badge badge-verified",
      "Fake": "badge badge-fake",
      "In Progress": "badge badge-progress",
      "Resolved": "badge badge-resolved"
    };
    return classes[status] || "badge badge-pending";
  };

  const getBadgeColor = (badge) => {
    const colors = {
      "Bronze":   { bg: "#FEF3C7", color: "#92400E" },
      "Silver":   { bg: "#F1F5F9", color: "#475569" },
      "Gold":     { bg: "#FEF9C3", color: "#854D0E" },
      "Platinum": { bg: "#F0FDF4", color: "#166534" }
    };
    return colors[badge] || colors["Bronze"];
  };

  return (
    <div className="tracker-container">
      <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0d1f3c", marginBottom: "0.4rem" }}>
        🎫 Track Your Report
      </h2>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Track by Ticket ID or view all your reports by email
      </p>

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "ticket", label: "🎫 Track by Ticket ID" },
          { id: "email",  label: "📧 My Reports by Email" }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setReport(null); setMyReports([]); }}
            style={{
              padding: "0.6rem 1.2rem", borderRadius: "10px", border: "2px solid",
              borderColor: activeTab === tab.id ? "#0d1f3c" : "#e2e8f0",
              background: activeTab === tab.id ? "#0d1f3c" : "white",
              color: activeTab === tab.id ? "white" : "#64748b",
              fontWeight: "700", cursor: "pointer", fontSize: "0.9rem"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TICKET SEARCH ── */}
      {activeTab === "ticket" && (
        <>
          <form onSubmit={handleSearchTicket} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <input value={ticketId} onChange={e => setTicketId(e.target.value)}
              placeholder="e.g. OPPS-20261010-ABC123"
              style={{ flex: 1, padding: "0.75rem", border: "2px solid #e2e8f0",
                borderRadius: "10px", fontSize: "1rem", outline: "none" }} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "⏳" : "Search"}
            </button>
          </form>

          {report && (
            <div className="ticket-result">
              {/* Before & After Photos */}
              {(report.photo_url || report.after_photo_url) && (
                <div style={{ display: "grid", gridTemplateColumns: report.after_photo_url ? "1fr 1fr" : "1fr",
                  gap: "1rem", marginBottom: "1.5rem" }}>
                  {report.photo_url && (
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b",
                        marginBottom: "0.4rem", textTransform: "uppercase" }}>
                        📸 Before (Problem)
                      </div>
                      <img src={report.photo_url} alt="Before"
                        style={{ width: "100%", borderRadius: "10px", objectFit: "cover",
                          height: "180px", border: "2px solid #fee2e2" }} />
                    </div>
                  )}
                  {report.after_photo_url && (
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b",
                        marginBottom: "0.4rem", textTransform: "uppercase" }}>
                        ✅ After (Fixed)
                      </div>
                      <img src={report.after_photo_url} alt="After"
                        style={{ width: "100%", borderRadius: "10px", objectFit: "cover",
                          height: "180px", border: "2px solid #d1fae5" }} />
                    </div>
                  )}
                </div>
              )}

              <h3>{report.title}</h3>

              {/* AI Detection Badge */}
              {report.ai_detected_category && (
                <div style={{ background: "#EFF8FB", border: "1px solid #0891B2",
                  borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1rem",
                  fontSize: "0.85rem", color: "#0891B2" }}>
                  🤖 AI Detected: <strong>{report.ai_detected_category}</strong>
                  {report.ai_confidence > 0 && ` (${report.ai_confidence}% confidence)`}
                </div>
              )}

              <div className="ticket-info">
                {[
                  ["🎫 Ticket ID",       report.ticket_id],
                  ["📂 Category",        report.category],
                  ["📊 Status",          <span className={getBadgeClass(report.status)}>{report.status}</span>],
                  ["📍 Location",        report.address || `${report.latitude?.toFixed(3)}, ${report.longitude?.toFixed(3)}`],
                  ["✅ Confirmations",   report.confirm_count],
                  ["🚩 Fake Flags",      report.fake_count],
                  ["📅 Reported On",     new Date(report.created_at).toLocaleDateString("en-IN")],
                  report.resolved_at && ["🏁 Resolved On", new Date(report.resolved_at).toLocaleDateString("en-IN")],
                  report.admin_comment && ["💬 Admin Comment", report.admin_comment],
                ].filter(Boolean).map(([label, value], i) => (
                  <div key={i} className="ticket-info-row">
                    <label>{label}</label>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              {/* Reward Section */}
              {rewards.length > 0 && (
                <div style={{ background: "linear-gradient(135deg, #FEF9C3, #FEF3C7)",
                  border: "2px solid #F59E0B", borderRadius: "12px",
                  padding: "1.2rem", marginTop: "1.5rem" }}>
                  <h4 style={{ color: "#92400E", marginBottom: "0.8rem" }}>🏆 Reward Earned!</h4>
                  {rewards.map((reward, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <span style={{
                          background: getBadgeColor(reward.badge).bg,
                          color: getBadgeColor(reward.badge).color,
                          padding: "0.3rem 0.8rem", borderRadius: "20px",
                          fontWeight: "700", fontSize: "0.9rem", marginRight: "0.5rem"
                        }}>
                          🏅 {reward.badge} Badge
                        </span>
                        <span style={{ fontWeight: "700", color: "#92400E" }}>
                          +{reward.points} Points
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        Awarded: {new Date(reward.awarded_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vote Section */}
              <div style={{ marginTop: "1.5rem", padding: "1rem",
                background: "#f8fafc", borderRadius: "12px" }}>
                <h4 style={{ marginBottom: "0.8rem", color: "#0d1f3c" }}>
                  👥 Community Verification
                </h4>
                <input value={voterEmail} onChange={e => setVoterEmail(e.target.value)}
                  placeholder="Enter your email to vote"
                  style={{ width: "100%", padding: "0.6rem", border: "2px solid #e2e8f0",
                    borderRadius: "8px", marginBottom: "0.8rem", fontSize: "0.95rem", outline: "none" }} />
                <div className="vote-buttons">
                  <button className="vote-btn-confirm"
                    onClick={() => handleVote("confirm")} disabled={voting}>
                    ✅ I Can Confirm This
                  </button>
                  <button className="vote-btn-fake"
                    onClick={() => handleVote("fake")} disabled={voting}>
                    🚩 Report as Fake
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── EMAIL SEARCH ── */}
      {activeTab === "email" && (
        <>
          <form onSubmit={handleSearchEmail} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              type="email"
              style={{ flex: 1, padding: "0.75rem", border: "2px solid #e2e8f0",
                borderRadius: "10px", fontSize: "1rem", outline: "none" }} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "⏳" : "Search"}
            </button>
          </form>

          {/* Total Points & Badge */}
          {myReports.length > 0 && (
            <>
              <div style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)",
                borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem",
                color: "white", display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#a8bfdf", marginBottom: "0.3rem" }}>
                    TOTAL CIVIC POINTS
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "#F59E0B" }}>
                    {totalPoints} pts
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", color: "#a8bfdf", marginBottom: "0.3rem" }}>
                    YOUR REPORTS
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: "900" }}>
                    {myReports.length}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", color: "#a8bfdf", marginBottom: "0.3rem" }}>
                    RESOLVED
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "#16a34a" }}>
                    {myReports.filter(r => r.status === "Resolved").length}
                  </div>
                </div>
              </div>

              {/* Rewards */}
              {rewards.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ fontWeight: "700", color: "#0d1f3c", marginBottom: "0.8rem" }}>
                    🏆 Your Rewards
                  </h4>
                  <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                    {rewards.map((reward, i) => (
                      <div key={i} style={{
                        background: getBadgeColor(reward.badge).bg,
                        border: `2px solid ${getBadgeColor(reward.badge).color}`,
                        borderRadius: "12px", padding: "1rem", textAlign: "center", minWidth: "120px"
                      }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>
                          {reward.badge === "Platinum" ? "💎" :
                           reward.badge === "Gold" ? "🥇" :
                           reward.badge === "Silver" ? "🥈" : "🥉"}
                        </div>
                        <div style={{ fontWeight: "700", color: getBadgeColor(reward.badge).color }}>
                          {reward.badge}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          +{reward.points} pts
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                          {reward.ticket_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Reports List */}
              <h4 style={{ fontWeight: "700", color: "#0d1f3c", marginBottom: "0.8rem" }}>
                📋 My Reports
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {myReports.map(r => (
                  <div key={r.id} style={{ background: "white", borderRadius: "12px",
                    padding: "1.2rem", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: "700", color: "#0d1f3c", marginBottom: "0.3rem" }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#0891b2", fontWeight: "600" }}>
                          🎫 {r.ticket_id}
                        </div>
                      </div>
                      <span className={getBadgeClass(r.status)}>{r.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.8rem",
                      fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
                      <span>📂 {r.category}</span>
                      <span>✅ {r.confirm_count} confirmed</span>
                      <span>📅 {new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                      {r.status === "Resolved" && (
                        <span style={{ color: "#16a34a", fontWeight: "700" }}>🏆 Reward Earned!</span>
                      )}
                    </div>
                    {/* Before & After mini */}
                    {(r.photo_url || r.after_photo_url) && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
                        {r.photo_url && (
                          <img src={r.photo_url} alt="Before"
                            style={{ width: "80px", height: "60px", objectFit: "cover",
                              borderRadius: "6px", border: "2px solid #fee2e2" }} />
                        )}
                        {r.after_photo_url && (
                          <img src={r.after_photo_url} alt="After"
                            style={{ width: "80px", height: "60px", objectFit: "cover",
                              borderRadius: "6px", border: "2px solid #d1fae5" }} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TrackReport;