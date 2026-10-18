import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createReport, analyzePhoto } from "../api";
import MapView from "../components/MapView";

const CATEGORIES = ["Pothole","Waterlogging","Broken Road","Streetlight","Garbage","Drain Overflow","Other"];

function ReportForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [captureMode, setCaptureMode] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "Pothole",
    latitude: 17.9784, longitude: 79.5941,
    address: "", is_anonymous: false,
    reporter_name: "", reporter_email: ""
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleLocationSelect = (lat, lng) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
    toast.info(`📍 Location pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // Handle photo upload and AI analysis
  const handlePhotoChange = async (file) => {
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    await analyzeWithAI(file);
  };

  const analyzeWithAI = async (file) => {
    setAnalyzing(true);
    toast.info("🤖 AI is analyzing your photo...");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await analyzePhoto(formData);
      const analysis = res.data.analysis;
      setAiAnalysis(analysis);

      // Auto-fill form with AI results
      if (analysis.category) {
        setForm(prev => ({
          ...prev,
          category:    analysis.category || prev.category,
          title:       analysis.title || prev.title,
          description: analysis.description || prev.description,
        }));
        toast.success(`✅ AI detected: ${analysis.category} (${analysis.confidence}% confidence)`);
      } else {
        toast.info("AI could not detect the problem type. Please fill manually.");
      }
    } catch (err) {
      toast.error("AI analysis failed. Please fill the form manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setCaptureMode(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      toast.error("Camera not available. Please upload a photo instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      stopCamera();
      await handlePhotoChange(file);
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCaptureMode(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (!photo) {
      toast.error("Please upload or capture a photo of the problem!");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append("photo", photo);
      if (aiAnalysis) {
        formData.append("ai_detected_category", aiAnalysis.category || "");
        formData.append("ai_confidence", aiAnalysis.confidence || 0);
        formData.append("ai_description", aiAnalysis.description || "");
      }
      const res = await createReport(formData);
      toast.success(`✅ Report submitted! Ticket: ${res.data.ticket_id}`);
      setTimeout(() => navigate("/track"), 2000);
    } catch (err) {
      toast.error("Failed to submit. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>📸 Report a Problem</h2>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Take a photo or upload one — our AI will automatically detect the problem!
      </p>

      <form onSubmit={handleSubmit}>

        {/* ── PHOTO SECTION ── */}
        <div className="form-group">
          <label>📷 Photo of Problem * (Required)</label>

          {/* Camera / Upload buttons */}
          {!captureMode && !photoPreview && (
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <button type="button" onClick={startCamera}
                style={{
                  flex: 1, padding: "1.2rem", border: "2px dashed #0891B2",
                  borderRadius: "12px", background: "#EFF8FB", cursor: "pointer",
                  fontSize: "1rem", fontWeight: "600", color: "#0891B2"
                }}>
                📷 Open Camera
              </button>
              <label style={{
                flex: 1, padding: "1.2rem", border: "2px dashed #F97316",
                borderRadius: "12px", background: "#FFF7ED", cursor: "pointer",
                fontSize: "1rem", fontWeight: "600", color: "#F97316",
                textAlign: "center", display: "flex", alignItems: "center",
                justifyContent: "center"
              }}>
                📁 Upload Photo
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => handlePhotoChange(e.target.files[0])} />
              </label>
            </div>
          )}

          {/* Camera view */}
          {captureMode && (
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem" }}>
              <video ref={videoRef} autoPlay playsInline
                style={{ width: "100%", borderRadius: "12px", maxHeight: "300px", objectFit: "cover" }} />
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={capturePhoto} className="btn-primary" style={{ flex: 1 }}>
                  📸 Capture Photo
                </button>
                <button type="button" onClick={stopCamera}
                  style={{ flex: 1, padding: "0.8rem", background: "#fee2e2", border: "none",
                    borderRadius: "8px", color: "#dc2626", fontWeight: "700", cursor: "pointer" }}>
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          {/* Photo preview */}
          {photoPreview && (
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <img src={photoPreview} alt="Preview"
                style={{ width: "100%", borderRadius: "12px", maxHeight: "300px",
                  objectFit: "cover", border: "2px solid #e2e8f0" }} />
              <button type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); setAiAnalysis(null); }}
                style={{ position: "absolute", top: "8px", right: "8px", background: "#dc2626",
                  color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px",
                  cursor: "pointer", fontWeight: "700", fontSize: "1rem" }}>
                ✕
              </button>
            </div>
          )}

          {/* AI Analysis Result */}
          {analyzing && (
            <div style={{ background: "#EFF8FB", border: "2px solid #0891B2", borderRadius: "12px",
              padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🤖</div>
              <p style={{ color: "#0891B2", fontWeight: "600" }}>AI is analyzing your photo...</p>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Detecting problem type, severity and location</p>
            </div>
          )}

          {aiAnalysis && !analyzing && (
            <div style={{ background: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "12px",
              padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🤖</span>
                <strong style={{ color: "#16a34a" }}>AI Analysis Complete!</strong>
                <span style={{ background: "#16a34a", color: "white", padding: "0.2rem 0.6rem",
                  borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", marginLeft: "auto" }}>
                  {aiAnalysis.confidence}% confidence
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
                <div><strong>Category:</strong> {aiAnalysis.category}</div>
                <div><strong>Severity:</strong>
                  <span style={{
                    color: aiAnalysis.severity === "Critical" ? "#dc2626" :
                           aiAnalysis.severity === "High" ? "#f97316" :
                           aiAnalysis.severity === "Medium" ? "#f59e0b" : "#16a34a",
                    fontWeight: "700", marginLeft: "0.3rem"
                  }}>
                    {aiAnalysis.severity}
                  </span>
                </div>
              </div>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                ✅ Form auto-filled with AI results. You can edit below.
              </p>
            </div>
          )}
        </div>

        {/* ── FORM FIELDS ── */}
        <div className="form-group">
          <label>Problem Title *</label>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="e.g. Deep pothole on Somidi Road" required />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Describe the problem in detail..." required />
        </div>

        <div className="form-group">
          <label>📍 Pin Location on Map (click to select)</label>
          <MapView onLocationSelect={handleLocationSelect}
            selectedLat={form.latitude} selectedLng={form.longitude} />
          <small style={{ color: "#64748b" }}>
            Selected: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
          </small>
        </div>

        <div className="form-group">
          <label>Address / Landmark</label>
          <input name="address" value={form.address} onChange={handleChange}
            placeholder="e.g. Near Kazipet Junction, NH-163" />
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" name="is_anonymous" checked={form.is_anonymous}
              onChange={handleChange} style={{ width: "auto", marginRight: "0.5rem" }} />
            Report Anonymously
          </label>
        </div>

        {!form.is_anonymous && (
          <>
            <div className="form-group">
              <label>Your Name</label>
              <input name="reporter_name" value={form.reporter_name}
                onChange={handleChange} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Your Email (to receive reward notifications)</label>
              <input type="email" name="reporter_email" value={form.reporter_email}
                onChange={handleChange} placeholder="your@email.com" />
            </div>
          </>
        )}

        <button type="submit" className="btn-primary" disabled={loading || analyzing}
          style={{ width: "100%", padding: "1rem", fontSize: "1.05rem" }}>
          {loading ? "Submitting... ⏳" : analyzing ? "AI Analyzing... 🤖" : "Submit Report 🚀"}
        </button>
      </form>
    </div>
  );
}

export default ReportForm;