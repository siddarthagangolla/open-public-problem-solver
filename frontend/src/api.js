import axios from "axios";
import config from "./config";

const API = axios.create({
  baseURL: config.BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

// Reports
export const getAllReports = () => API.get("/api/reports/");
export const getReportByTicket = (ticketId) => API.get(`/api/reports/${ticketId}`);
export const getReportsByEmail = (email) => API.get(`/api/reports/by-email/${email}`);
export const createReport = (formData) => API.post("/api/reports/", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const analyzePhoto = (formData) => API.post("/api/reports/analyze-photo", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const getReportsByCategory = (category) => API.get(`/api/reports/category/${category}`);
export const getReportsByStatus = (status) => API.get(`/api/reports/status/${status}`);

// Verify
export const voteOnReport = (voteData) => API.post("/api/verify/", voteData);

// Admin
export const adminLogin = (credentials) => API.post("/api/auth/admin/login", credentials);
export const getAdminReports = (token) => API.get("/api/admin/reports", {
  headers: { Authorization: `Bearer ${token}` }
});
export const updateReportStatus = (reportId, formData, token) =>
  API.put(`/api/admin/reports/${reportId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  });
export const getAdminStats = (token) => API.get("/api/admin/stats", {
  headers: { Authorization: `Bearer ${token}` }
});
export const deleteReport = (reportId, token) =>
  API.delete(`/api/admin/reports/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export default API;