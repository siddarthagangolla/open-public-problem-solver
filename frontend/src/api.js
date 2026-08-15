import axios from "axios";
import config from "./config";

const API = axios.create({
  baseURL: config.BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

export const getAllReports = () => API.get("/api/reports/");
export const getReportByTicket = (ticketId) => API.get(`/api/reports/${ticketId}`);
export const createReport = (formData) => API.post("/api/reports/", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const getReportsByCategory = (category) => API.get(`/api/reports/category/${category}`);
export const getReportsByStatus = (status) => API.get(`/api/reports/status/${status}`);
export const voteOnReport = (voteData) => API.post("/api/verify/", voteData);
export const adminLogin = (credentials) => API.post("/api/auth/admin/login", credentials);
export const getAdminReports = (token) => API.get("/api/admin/reports", {
  headers: { Authorization: `Bearer ${token}` }
});
export const updateReportStatus = (reportId, data, token) =>
  API.put(`/api/admin/reports/${reportId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
export const getAdminStats = (token) => API.get("/api/admin/stats", {
  headers: { Authorization: `Bearer ${token}` }
});

export default API;