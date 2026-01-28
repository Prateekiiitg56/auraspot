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
    <div className="page auth-box">
      <h2>Add Property</h2>

      <input name="title" placeholder="Title" onChange={handleChange} />

      <select name="type" onChange={handleChange}>
        <option value="">Type</option>
        <option value="ROOM">Room</option>
        <option value="PG">PG</option>
        <option value="HOSTEL">Hostel</option>
        <option value="FLAT">Flat</option>
        <option value="HOME">Home</option>
      </select>

      <select name="purpose" onChange={handleChange}>
        <option value="">Purpose</option>
        <option value="RENT">Rent</option>
        <option value="SALE">Buy</option>
      </select>

      <input name="price" placeholder="Price" type="number" onChange={handleChange} />
      <input name="city" placeholder="City" onChange={handleChange} />
      <input name="area" placeholder="Area" onChange={handleChange} />

      <input name="latitude" placeholder="Latitude" type="number" onChange={handleChange} />
      <input name="longitude" placeholder="Longitude" type="number" onChange={handleChange} />

      <input
        name="amenities"
        placeholder="Amenities (wifi, parking, food)"
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        onChange={handleChange}
      />

      <input
        type="file"
        accept="image/*"
        onChange={e => setImage(e.target.files?.[0] || null)}
      />

      <button onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "Save Property"}
      </button>
    </div>
  );
};

export default AddProperty;
