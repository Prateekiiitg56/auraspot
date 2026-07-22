import { useState, useRef } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import MapPicker from "../components/MapPicker";

const STEPS = [
  { id: 1, name: "Basics" },
  { id: 2, name: "Location" },
  { id: 3, name: "Photos & Features" },
  { id: 4, name: "Pricing" },
  { id: 5, name: "Review & Audit" }
];

const COMMON_AMENITIES = [
  "Power Backup",
  "Wi-Fi",
  "Covered Parking",
  "Water Supply",
  "Security / CCTV",
  "Balcony",
  "Air Conditioning",
  "Gym / Lift"
];

const AddProperty = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    type: "FLAT",
    purpose: "RENT",
    price: "",
    city: "Guwahati",
    area: "",
    latitude: "26.18",
    longitude: "91.75",
    amenities: "",
    description: ""
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  // Dynamic Live AI Score Calculation
  const calculateLiveScore = () => {
    let score = 65;
    if (form.title.trim().length >= 10) score += 6;
    if (form.type && form.purpose) score += 4;
    if (form.city.trim() && form.area.trim()) score += 6;
    if (form.latitude && form.longitude) score += 4;
    if (images.length > 0) score += 5;
    if (images.length >= 3) score += 4;
    if (selectedAmenities.length > 0) score += 3;
    if (selectedAmenities.length >= 3) score += 3;
    if (form.description.trim().length >= 30) score += 4;
    return Math.min(score, 98);
  };

  const liveScore = calculateLiveScore();

  // Image Upload Handling
  const handleFiles = (files: File[]) => {
    if (files.length + images.length > 5) {
      alert("You can upload maximum 5 images");
      return;
    }
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    URL.revokeObjectURL(imagePreviews[index]);
    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const toggleAmenity = (item: string) => {
    let updated: string[];
    if (selectedAmenities.includes(item)) {
      updated = selectedAmenities.filter(a => a !== item);
    } else {
      updated = [...selectedAmenities, item];
    }
    setSelectedAmenities(updated);
    setForm({ ...form, amenities: updated.join(", ") });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  // Step Validation
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.title.trim() || form.title.trim().length < 5) {
        newErrors.title = "Enter a descriptive title with at least 5 characters.";
      }
      if (!form.type) newErrors.type = "Select property type.";
      if (!form.purpose) newErrors.purpose = "Select property purpose.";
    } else if (step === 2) {
      if (!form.city.trim()) newErrors.city = "City is required.";
      if (!form.area.trim()) newErrors.area = "Area or neighborhood locality is required.";
    } else if (step === 4) {
      if (!form.price || Number(form.price) < 500) {
        newErrors.price = "Enter a valid price greater than ₹500.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Final Form Submission
  const submit = async () => {
    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("type", form.type);
      formData.append("purpose", form.purpose);
      formData.append("price", form.price);
      formData.append("city", form.city);
      formData.append("area", form.area);
      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);
      formData.append("amenities", form.amenities);
      formData.append("description", form.description);

      images.forEach(img => formData.append("images", img));

      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API}/properties`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        navigate("/explore");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add property");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap" style={{ padding: "40px 32px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "32px", borderBottom: "1px solid var(--color-border)", paddingBottom: "20px" }}>
        <h1 style={{ marginBottom: "6px" }}>Post a Verified Property</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "15px" }}>
          AuraSpot audits your property signals live to ensure maximum visibility & trust.
        </p>
      </div>

      {/* Progress Wizard Bar */}
      <div className="wizard-progress-bar">
        {STEPS.map(step => (
          <div
            key={step.id}
            className={`wizard-step-item ${currentStep === step.id ? "active" : ""} ${currentStep > step.id ? "completed" : ""}`}
          >
            <div className="step-circle">
              {currentStep > step.id ? "✓" : step.id}
            </div>
            <span>{step.name}</span>
          </div>
        ))}
      </div>

      {/* 2-Column Wizard Layout: Form Steps (Left) + Live AI Score Preview (Right) */}
      <div className="wizard-container">
        {/* Left Side: Active Form Step */}
        <div className="card" style={{ padding: "32px" }}>
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Step 1: Property Basics</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Basic property information for tenant discovery.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label>Property Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. 2BHK Riverside Flat with Balcony"
                  value={form.title}
                  onChange={handleChange}
                />
                {errors.title && <div className="inline-error-text">⚠️ {errors.title}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label>Property Type *</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="FLAT">Flat / Apartment</option>
                    <option value="PG">PG / Hostel</option>
                    <option value="HOME">Independent House</option>
                  </select>
                </div>
                <div>
                  <label>Listing Purpose *</label>
                  <select name="purpose" value={form.purpose} onChange={handleChange}>
                    <option value="RENT">For Rent</option>
                    <option value="SALE">For Sale</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Step 2: Location Details</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Specify city, locality, and pin point location on the map.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Guwahati"
                    value={form.city}
                    onChange={handleChange}
                  />
                  {errors.city && <div className="inline-error-text">⚠️ {errors.city}</div>}
                </div>
                <div>
                  <label>Area / Locality *</label>
                  <input
                    type="text"
                    name="area"
                    placeholder="e.g. Uzan Bazar"
                    value={form.area}
                    onChange={handleChange}
                  />
                  {errors.area && <div className="inline-error-text">⚠️ {errors.area}</div>}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label>Pinpoint Location on Map *</label>
                <div style={{ height: "260px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <MapPicker
                    lat={Number(form.latitude)}
                    lng={Number(form.longitude)}
                    onChange={(lat, lng) => setForm({ ...form, latitude: String(lat), longitude: String(lng) })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS & AMENITIES */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Step 3: Photos & Amenities</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Listings with 3+ real photos receive 40% higher AuraScores.
              </p>

              {/* Styled Drag-and-Drop Photo Dropzone */}
              <div style={{ marginBottom: "24px" }}>
                <label>Upload Property Photos (Max 5)</label>
                <div
                  className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files) {
                      handleFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📷</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>
                    Drag & Drop photos here, or <span style={{ color: "var(--color-primary)" }}>Browse</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-caption)", marginTop: "4px" }}>
                    PNG, JPG or WEBP up to 5MB each ({images.length}/5 uploaded)
                  </div>
                </div>

                {/* Photo Thumbnail Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="dropzone-preview-grid">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="dropzone-thumb-container">
                        <img src={src} className="dropzone-thumb-img" alt={`Upload ${i}`} />
                        <button
                          type="button"
                          className="dropzone-thumb-remove"
                          onClick={() => removeImage(i)}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities Selection Chips */}
              <div>
                <label style={{ marginBottom: "10px" }}>Key Amenities</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {COMMON_AMENITIES.map(item => {
                    const selected = selectedAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`tag ${selected ? "tag-green" : ""}`}
                        style={{
                          cursor: "pointer",
                          padding: "6px 12px",
                          fontSize: "12.5px",
                          background: selected ? "var(--color-success-bg)" : "var(--color-bg-subtle)",
                          borderColor: selected ? "var(--color-success-border)" : "var(--color-border)",
                          color: selected ? "var(--color-success)" : "var(--color-text-muted)"
                        }}
                        onClick={() => toggleAmenity(item)}
                      >
                        {selected ? "✓ " : "+ "}{item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING & TERMS */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Step 4: Pricing & Description</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Transparent pricing and accurate details help AuraSpot audit fair market rent.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label>Monthly Rent / Sale Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="e.g. 18500"
                  value={form.price}
                  onChange={handleChange}
                />
                {errors.price && <div className="inline-error-text">⚠️ {errors.price}</div>}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label>Property Description</label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe lease terms, deposit details, furnishings, and tenant preferences..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & AUDIT */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Step 5: Review & Audit</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Verify details before submitting your property for AI scoring.
              </p>

              <div style={{
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                  <span style={{ fontWeight: 600 }}>{form.title || "Untitled Property"}</span>
                  <span className="mono" style={{ color: "var(--color-primary)", fontWeight: 600 }}>₹{Number(form.price || 0).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div>Type: <b>{form.type} ({form.purpose})</b></div>
                  <div>Location: <b>{form.area}, {form.city}</b></div>
                  <div>Photos: <b>{images.length} uploaded</b></div>
                  <div>Amenities: <b>{selectedAmenities.join(", ") || "None specified"}</b></div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div style={{
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-border)"
          }}>
            {currentStep > 1 ? (
              <button type="button" className="btn btn-outline" onClick={prevStep}>
                ← Back
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button type="button" className="btn btn-solid" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-solid"
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Auditing & Publishing..." : "🚀 Publish Property"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Live AI Score Preview Card */}
        <div className="live-ai-preview-card">
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Live AI Audit Preview
          </div>
          <div style={{ fontSize: "16px", fontWeight: 650, fontFamily: "var(--font-serif)", marginBottom: "16px" }}>
            Estimated AuraScore
          </div>

          <div className="score-ring" style={{ margin: "0 auto 16px" }}>
            <div className="score-ring-inner">
              <div className="num">{liveScore}</div>
              <div className="lbl">Aura Score</div>
            </div>
          </div>

          <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", textAlign: "center", marginBottom: "20px" }}>
            {liveScore >= 85 ? (
              <span style={{ color: "var(--color-success)", fontWeight: 600 }}>🟢 Excellent listing signals! High tenant interest expected.</span>
            ) : (
              <span>Add 3+ photos and detailed description to reach 85+ score.</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Photos Uploaded ({images.length}/5)</span>
              <span className="mono" style={{ color: images.length >= 3 ? "var(--color-success)" : "var(--color-text-caption)" }}>
                {images.length >= 3 ? "+9 pts" : "+0 pts"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Location Specified</span>
              <span className="mono" style={{ color: form.area ? "var(--color-success)" : "var(--color-text-caption)" }}>
                {form.area ? "+10 pts" : "+0 pts"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Key Amenities ({selectedAmenities.length})</span>
              <span className="mono" style={{ color: selectedAmenities.length > 0 ? "var(--color-success)" : "var(--color-text-caption)" }}>
                {selectedAmenities.length > 0 ? "+6 pts" : "+0 pts"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
