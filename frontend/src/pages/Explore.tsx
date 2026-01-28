import { useEffect, useState } from "react";
import { API } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import { Link } from "react-router-dom";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
  image?: string;
};

const Explore = () => {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch(`${API}/properties`)
      .then(res => res.json())
      .then(setProperties);
  }, []);

  const Section = ({ title, list }: { title: string; list: Property[] }) => {
    if (list.length === 0) return null;

    return (
      <div style={{ marginBottom: 40 }}>
        <h2>{title}</h2>

        <div className="property-grid">
          {list.slice(0, 6).map(p => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30
        }}
      >
        <h2>Explore Properties</h2>

        <Link to="/add">
          <button>Add Property</button>
        </Link>
      </div>

      <Section
        title="PG & Hostels"
        list={properties.filter(
          p => p.type === "PG" || p.type === "HOSTEL"
        )}
      />

      <Section
        title="Flats"
        list={properties.filter(p => p.type === "FLAT")}
      />

      <Section
        title="Homes"
        list={properties.filter(p => p.type === "HOME")}
      />

      <Section
        title="For Rent"
        list={properties.filter(p => p.purpose === "RENT")}
      />

      <Section
        title="For Sale"
        list={properties.filter(p => p.purpose === "SALE")}
      />
    </div>
  );
};

export default Explore;
