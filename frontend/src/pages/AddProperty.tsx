import { useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const AddProperty = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    type: "",
    purpose: "",
    price: "",
    city: "",
    area: "",
    latitude: "",
    longitude: "",
    amenities: "",
    description: ""
  });

  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    if (!form.type || !form.purpose) {
      alert("Select property type and purpose");
      return;
    }

    if (!image) {
      alert("Upload an image");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // clean amenities array
    formData.append(
      "amenities",
      JSON.stringify(
        form.amenities.split(",").map(a => a.trim()).filter(Boolean)
      )
    );

    // attach owner uid
    formData.append("ownerEmail", auth.currentUser.email!);
    formData.append("image", image);

    try {
      const res = await fetch(`${API}/properties`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Failed");

      alert("Property added successfully!");
      navigate("/explore");
    } catch (err) {
      alert("Failed to add property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div style={{
        marginBottom: "48px",
        paddingBottom: "32px",
        borderBottom: "1px solid rgba(226, 232, 240, 0.1)"
      }}>
        <h1 style={{
          fontSize: "40px",
          marginBottom: "8px"
        }}>
          🏠 Add Property
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "16px" }}>
          List your property and reach potential buyers or renters
        </p>
      </div>

      {/* Form Container */}
      <div style={{
        maxWidth: "600px",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "16px",
        padding: "40px",
        backdropFilter: "blur(8px)"
      }}>
        {/* Title */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
            Title
          </label>
          <input 
            name="title" 
            placeholder="e.g., Modern 2BHK in Downtown" 
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </div>

        {/* Type and Purpose */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              Property Type
            </label>
            <select name="type" onChange={handleChange}>
              <option value="">Select Type</option>
              <option value="ROOM">Room</option>
              <option value="PG">PG</option>
              <option value="HOSTEL">Hostel</option>
              <option value="FLAT">Flat</option>
              <option value="HOME">Home</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              Purpose
            </label>
            <select name="purpose" onChange={handleChange}>
              <option value="">Select Purpose</option>
              <option value="RENT">Rent</option>
              <option value="SALE">Buy</option>
            </select>
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
            Price (₹)
          </label>
          <input 
            name="price" 
            placeholder="e.g., 50000" 
            type="number" 
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </div>

        {/* Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              City
            </label>
            <input 
              name="city" 
              placeholder="e.g., Mumbai" 
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              Area
            </label>
            <input 
              name="area" 
              placeholder="e.g., Bandra" 
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Coordinates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              Latitude
            </label>
            <input 
              name="latitude" 
              placeholder="19.0760" 
              type="number" 
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
              Longitude
            </label>
            <input 
              name="longitude" 
              placeholder="72.8777" 
              type="number" 
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Amenities */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
            Amenities
          </label>
          <input
            name="amenities"
            placeholder="e.g., wifi, parking, food (comma-separated)"
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
            Description
          </label>
          <textarea
            name="description"
            placeholder="Describe your property in detail..."
            onChange={handleChange}
            style={{ 
              width: "100%",
              minHeight: "120px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: "600" }}>
            Property Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#cbd5e1",
              cursor: "pointer"
            }}
          />
          {image && <p style={{ color: "#667eea", fontSize: "14px", marginTop: "8px" }}>✓ {image.name}</p>}
        </div>

        {/* Submit Button */}
        <button 
          onClick={submit} 
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#64748b" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Saving..." : "🚀 Save Property"}
        </button>
      </div>
    </div>
  );
};

export default AddProperty;
