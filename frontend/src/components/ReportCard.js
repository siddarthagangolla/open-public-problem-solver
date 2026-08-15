import React from "react";

function getBadgeClass(status) {
  switch (status) {
    case "Pending":     return "badge badge-pending";
    case "Verified":    return "badge badge-verified";
    case "Fake":        return "badge badge-fake";
    case "In Progress": return "badge badge-progress";
    case "Resolved":    return "badge badge-resolved";
    default:            return "badge badge-pending";
  }
}

function getCategoryEmoji(category) {
  switch (category) {
    case "Pothole":       return "🕳️";
    case "Waterlogging":  return "🌊";
    case "Broken Road":   return "🛣️";
    case "Streetlight":   return "💡";
    case "Garbage":       return "🗑️";
    case "Drain Overflow":return "💧";
    default:              return "⚠️";
  }
}

function ReportCard({ report }) {
  const date = new Date(report.created_at).toLocaleDateString("en-IN");

  return (
    <div className="report-card">
      {report.photo_url ? (
        <img
          src={report.photo_url}
          alt={report.title}
          className="report-card-image"
        />
      ) : (
        <div className="report-card-image">
          {getCategoryEmoji(report.category)}
        </div>
      )}
      <div className="report-card-body">
        <div className="report-card-title">{report.title}</div>
        <div className="report-card-desc">{report.description}</div>
        <div className="report-card-footer">
          <span className={getBadgeClass(report.status)}>
            {report.status}
          </span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            📍 {report.address || "Location pinned"}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.8rem",
          fontSize: "0.85rem",
          color: "#64748b"
        }}>
          <span>✅ {report.confirm_count} confirmed</span>
          <span>🚩 {report.fake_count} flagged</span>
          <span>📅 {date}</span>
        </div>
        <div style={{
          marginTop: "0.5rem",
          fontSize: "0.8rem",
          color: "#0891b2",
          fontWeight: "600"
        }}>
          🎫 {report.ticket_id}
        </div>
      </div>
    </div>
  );
}

export default ReportCard;