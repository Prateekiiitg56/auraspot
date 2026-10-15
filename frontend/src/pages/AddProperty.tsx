import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Circle, ImagePlus, X } from "lucide-react";
import { apiFetch, formatINR, readError } from "../services/api";
import MapPicker from "../components/MapPicker";
import { toast } from "../components/Feedback";

const STEPS = ["Basics", "Location", "Photos & amenities", "Price & details", "Review"];

const AMENITIES = [
  "Wi-Fi",
  "Air Conditioning",
  "Power Backup",
  "Parking",
  "Water Supply",
  "Security / CCTV",
  "Lift",
  "Gym",
  "Balcony",
  "Washing Machine",
  "Meals",
  "Housekeeping"
];

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Form = {
  title: string;
  type: string;
  purpose: string;
  price: string;
  city: string;
  area: string;
  latitude: string;
  longitude: string;
  description: string;
  bhk: string;
  sqft: string;
  furnishing: string;
};

const INITIAL: Form = {
  title: "",
  type: "FLAT",
  purpose: "RENT",
  price: "",
  city: "",
  area: "",
  latitude: "",
  longitude: "",
  description: "",
  bhk: "",
  sqft: "",
  furnishing: "Unfurnished"
};

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className="inline-error-text" role="alert">{message}</p> : null;

const AddProperty = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Release preview URLs on unmount
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const set = (name: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(e.target.name as keyof Form, e.target.value);

  const addFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_BYTES);
    if (valid.length < files.length) toast.error("Only images up to 5MB each can be uploaded.");
    const room = MAX_IMAGES - images.length;
    if (valid.length > room) toast.error(`You can add up to ${MAX_IMAGES} photos.`);
    const added = valid.slice(0, Math.max(room, 0)).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImages((list) => [...list, ...added]);
  };

  const removeImage = (index: number) => {
    setImages((list) => {
      URL.revokeObjectURL(list[index].url);
      return list.filter((_, i) => i !== index);
    });
  };

  const toggleAmenity = (item: string) =>
    setAmenities((list) => (list.includes(item) ? list.filter((a) => a !== item) : [...list, item]));

  const validate = (s: number) => {
    const next: Partial<Record<keyof Form, string>> = {};
    if (s === 0 && form.title.trim().length < 5) next.title = "Enter a descriptive title (at least 5 characters).";
    if (s === 1) {
      if (!form.city.trim()) next.city = "City is required.";
      if (!form.area.trim()) next.area = "Locality is required.";
    }
    if (s === 3) {
      if (!form.price || Number(form.price) < 500) next.price = "Enter a price of at least ₹500.";
      if (form.bhk && (Number(form.bhk) < 1 || Number(form.bhk) > 20)) next.bhk = "Enter a valid number of bedrooms.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => validate(step) && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    for (const s of [0, 1, 3]) {
      if (!validate(s)) {
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      (Object.keys(form) as (keyof Form)[]).forEach((key) => {
        if (form[key] !== "") data.append(key, form[key].trim());
      });
      data.append("amenities", JSON.stringify(amenities));
      images.forEach((img) => data.append("images", img.file));

      const res = await apiFetch("/properties", { method: "POST", body: data });
      if (!res.ok) throw new Error(await readError(res, "Could not publish the listing"));
      const created = await res.json();
      toast.success("Listing published. AI insights will be ready in a minute.");
      navigate(`/property/${created._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish the listing");
    } finally {
      setSubmitting(false);
    }
  };

  const checklist = [
    { label: "Descriptive title", done: form.title.trim().length >= 10 },
    { label: "Locality and map pin", done: !!form.area.trim() && !!form.latitude },
    { label: "At least 3 photos", done: images.length >= 3 },
    { label: "3 or more amenities", done: amenities.length >= 3 },
    { label: "Size and furnishing", done: !!form.sqft || !!form.bhk },
    { label: "Description of 50+ characters", done: form.description.trim().length >= 50 }
  ];
  const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const isResidential = form.type === "FLAT" || form.type === "HOME";

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">New listing</p>
          <h1>List your property</h1>
          <p>Complete listings rank higher and receive more serious enquiries.</p>
        </div>
      </div>

      <ol className="wizard-progress-bar" aria-label="Progress">
        {STEPS.map((name, i) => (
          <li
            key={name}
            className={`wizard-step-item ${step === i ? "active" : ""} ${step > i ? "completed" : ""}`}
            aria-current={step === i ? "step" : undefined}
          >
            <span className="step-circle">{step > i ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
            <span>{name}</span>
          </li>
        ))}
      </ol>

      <div className="wizard-container">
        <form className="card wizard-card" onSubmit={(e) => e.preventDefault()} noValidate>
          {step === 0 && (
            <fieldset>
              <legend className="wizard-legend">Property basics</legend>
              <div className="field">
                <label htmlFor="title">Listing title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Sunny 2BHK flat with balcony near Zoo Road"
                  value={form.title}
                  onChange={onChange}
                  aria-invalid={!!errors.title}
                  aria-describedby="title-error"
                />
                <FieldError id="title-error" message={errors.title} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="type">Property type</label>
                  <select id="type" name="type" value={form.type} onChange={onChange}>
                    <option value="FLAT">Flat / Apartment</option>
                    <option value="HOME">Independent house</option>
                    <option value="ROOM">Room</option>
                    <option value="PG">PG</option>
                    <option value="HOSTEL">Hostel</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="purpose">Listing for</label>
                  <select id="purpose" name="purpose" value={form.purpose} onChange={onChange}>
                    <option value="RENT">Rent</option>
                    <option value="SALE">Sale</option>
                  </select>
                </div>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="wizard-legend">Location</legend>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" name="city" type="text" maxLength={80} placeholder="e.g. Guwahati" value={form.city} onChange={onChange} aria-invalid={!!errors.city} aria-describedby="city-error" />
                  <FieldError id="city-error" message={errors.city} />
                </div>
                <div className="field">
                  <label htmlFor="area">Locality</label>
                  <input id="area" name="area" type="text" maxLength={120} placeholder="e.g. Uzan Bazar" value={form.area} onChange={onChange} aria-invalid={!!errors.area} aria-describedby="area-error" />
                  <FieldError id="area-error" message={errors.area} />
                </div>
              </div>
              <MapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onLocationChange={(lat, lng) => setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))}
              />
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="wizard-legend">Photos & amenities</legend>
              <label id="photos-label">Photos ({images.length}/{MAX_IMAGES})</label>
              <div
                className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
                role="button"
                tabIndex={0}
                aria-labelledby="photos-label"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  addFiles(Array.from(e.dataTransfer.files));
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files || []));
                    e.target.value = "";
                  }}
                />
                <ImagePlus size={28} aria-hidden="true" />
                <strong>Drag photos here or <span className="text-link">browse</span></strong>
                <span className="muted">JPG, PNG or WEBP · up to 5MB each · first photo is the cover</span>
              </div>

              {images.length > 0 && (
                <div className="dropzone-preview-grid">
                  {images.map((img, i) => (
                    <div key={img.url} className="dropzone-thumb-container">
                      <img src={img.url} className="dropzone-thumb-img" alt={`Photo ${i + 1}`} />
                      {i === 0 && <span className="thumb-cover">Cover</span>}
                      <button type="button" className="dropzone-thumb-remove" onClick={() => removeImage(i)} aria-label={`Remove photo ${i + 1}`}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <fieldset className="chip-group">
                <legend>Amenities</legend>
                <div className="chip-list">
                  {AMENITIES.map((item) => {
                    const selected = amenities.includes(item);
                    return (
                      <button key={item} type="button" className={`chip ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => toggleAmenity(item)}>
                        {selected && <Check size={13} aria-hidden="true" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="wizard-legend">Price & details</legend>
              <div className="field">
                <label htmlFor="price">{form.purpose === "RENT" ? "Monthly rent (₹)" : "Sale price (₹)"}</label>
                <input id="price" name="price" type="number" min={500} inputMode="numeric" placeholder={form.purpose === "RENT" ? "e.g. 18500" : "e.g. 4500000"} value={form.price} onChange={onChange} aria-invalid={!!errors.price} aria-describedby="price-error" />
                <FieldError id="price-error" message={errors.price} />
              </div>
              <div className="form-row form-row-3">
                {isResidential && (
                  <div className="field">
                    <label htmlFor="bhk">Bedrooms (BHK)</label>
                    <input id="bhk" name="bhk" type="number" min={1} max={20} value={form.bhk} onChange={onChange} aria-invalid={!!errors.bhk} aria-describedby="bhk-error" />
                    <FieldError id="bhk-error" message={errors.bhk} />
                  </div>
                )}
                <div className="field">
                  <label htmlFor="sqft">Area (sq ft)</label>
                  <input id="sqft" name="sqft" type="number" min={1} value={form.sqft} onChange={onChange} />
                </div>
                <div className="field">
                  <label htmlFor="furnishing">Furnishing</label>
                  <select id="furnishing" name="furnishing" value={form.furnishing} onChange={onChange}>
                    <option>Unfurnished</option>
                    <option>Semi-Furnished</option>
                    <option>Furnished</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  maxLength={3000}
                  placeholder="Deposit, lease terms, nearby landmarks, who the place suits…"
                  value={form.description}
                  onChange={onChange}
                />
                <p className="field-hint">{form.description.length}/3000</p>
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <section aria-labelledby="review-title">
              <h2 id="review-title" className="wizard-legend">Review your listing</h2>
              <dl className="review-list">
                <div><dt>Title</dt><dd>{form.title}</dd></div>
                <div><dt>Type</dt><dd>{form.type} for {form.purpose === "RENT" ? "rent" : "sale"}</dd></div>
                <div><dt>Location</dt><dd>{[form.area, form.city].filter(Boolean).join(", ")}{form.latitude ? " · pinned on map" : ""}</dd></div>
                <div><dt>Price</dt><dd className="mono">{formatINR(Number(form.price))}{form.purpose === "RENT" ? " / month" : ""}</dd></div>
                <div><dt>Details</dt><dd>{[form.bhk && `${form.bhk} BHK`, form.sqft && `${form.sqft} sq ft`, form.furnishing].filter(Boolean).join(" · ")}</dd></div>
                <div><dt>Photos</dt><dd>{images.length}</dd></div>
                <div><dt>Amenities</dt><dd>{amenities.join(", ") || "None"}</dd></div>
              </dl>
            </section>
          )}

          <div className="wizard-actions">
            {step > 0 ? (
              <button type="button" className="btn btn-outline" onClick={goBack}>
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-solid" onClick={goNext}>
                Continue <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="btn btn-solid" onClick={submit} disabled={submitting}>
                {submitting ? "Publishing…" : "Publish listing"}
              </button>
            )}
          </div>
        </form>

        <aside className="live-ai-preview-card" aria-label="Listing completeness">
          <p className="eyebrow">Listing quality</p>
          <div className="completeness">
            <span className="mono">{completeness}%</span>
            <span className="muted">complete</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${completeness}%` }} />
          </div>
          <ul className="checklist">
            {checklist.map((c) => (
              <li key={c.label} className={c.done ? "done" : ""}>
                {c.done ? <Check size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}
                {c.label}
              </li>
            ))}
          </ul>
          <p className="field-hint">After publishing, AuraSpot’s AI scores price fairness and fraud risk automatically.</p>
        </aside>
      </div>
    </div>
  );
};

export default AddProperty;
