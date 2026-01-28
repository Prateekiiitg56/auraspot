import { useEffect, useState } from "react";
import { API } from "../services/api";
import PropertyCard from "../components/PropertyCard";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
};

const Home = () => {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch(`${API}/properties`)
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(err => console.error("Failed to fetch properties", err));
  }, []);

  return (
    <div className="page">
      <h2>Available Properties</h2>

      {properties.length === 0 && (
        <p className="empty-text">No properties found</p>
      )}

      <div className="property-grid">
        {properties.map(p => (
          <PropertyCard key={p._id} property={p} />
        ))}
      </div>

    </div>
  );
};

export default Home;
