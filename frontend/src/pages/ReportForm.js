import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createReport } from "../api";
import MapView from "../components/MapView";

const CATEGORIES = ["Pothole","Waterlogging","Broken Road","Streetlight","Garbage","Drain Overflow","Other"];

function ReportForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
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
    toast.info("Location selected!");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Please fill in all required fields!");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (photo) formData.append("photo", photo);
      const res = await createReport(formData);
      toast.success("Report submitted! Ticket: " + res.data.ticket_id);
      setTimeout(() => navigate("/track"), 2000);
    } catch (err) {
      toast.error("Failed to submit. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Report a Problem</h2>
      <form onSubmit={handleSubmit}>
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
            placeholder="Describe the problem..." required />
        </div>
        <div className="form-group">
          <label>Pin Location on Map (click to select)</label>
          <MapView onLocationSelect={handleLocationSelect}
            selectedLat={form.latitude} selectedLng={form.longitude} />
          <small>Selected: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</small>
        </div>
        <div className="form-group">
          <label>Address / Landmark</label>
          <input name="address" value={form.address} onChange={handleChange}
            placeholder="e.g. Near Kazipet Junction, NH-163" />
        </div>
        <div className="form-group">
          <label>Upload Photo</label>
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
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
              <label>Your Email</label>
              <input type="email" name="reporter_email" value={form.reporter_email}
                onChange={handleChange} placeholder="your@email.com" />
            </div>
          </>
        )}
        <button type="submit" className="btn-primary" disabled={loading}
          style={{ width: "100%", padding: "1rem" }}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}

export default ReportForm;