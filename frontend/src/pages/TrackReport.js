import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { adminLogin } from "../api";

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(form);
      localStorage.setItem("admin_token", res.data.access_token);
      localStorage.setItem("admin_name", res.data.admin.full_name);
      toast.success("Welcome Admin! 🛡️");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error("Invalid email or password!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="form-container" style={{ width: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem" }}>🛡️</div>
          <h2>Admin Login</h2>
          <p style={{ color: "#64748b" }}>Open Public Problem Solver</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@opps.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "1rem" }}
          >
            {loading ? "Logging in... ⏳" : "Login 🔐"}
          </button>
        </form>

        <div style={{
          marginTop: "1.5rem", padding: "1rem",
          background: "#f8fafc", borderRadius: "8px",
          fontSize: "0.85rem", color: "#64748b"
        }}>
          <strong>Demo credentials:</strong><br />
          Email: admin@opps.com<br />
          Password: Admin@2025#
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;