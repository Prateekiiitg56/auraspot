import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "./services/firebase";
import { ThemeProvider } from "./context/ThemeContext";
import { API } from "./services/api";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Lazy load all page components for faster initial load
const Home = lazy(() => import("./pages/home"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const Explore = lazy(() => import("./pages/Explore"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MyDeals = lazy(() => import("./pages/MyDeals"));
const Chat = lazy(() => import("./pages/Chat"));
const AIMatch = lazy(() => import("./pages/AIMatch"));
const RentManager = lazy(() => import("./pages/RentManager"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Analytics = lazy(() => import("./pages/Analytics"));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "12px"
  }}>
    <div className="ai-loading-spinner" />
    <span style={{ color: "#94a3b8", fontSize: "15px" }}>Loading...</span>
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async currentUser => {
    if (currentUser) {
      try {
        await fetch(`${API}/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0],
            email: currentUser.email
          })
        });
      } catch (err) {
        // Silent fail - user sync is non-critical
      }
    }

    setUser(currentUser);
  });

  return () => unsub();
}, []);


  return (
    <ThemeProvider>
      <Router>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar user={user} />

          <div style={{ flex: 1 }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/add" element={<AddProperty />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/user/:email" element={<UserProfile />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-deals" element={<MyDeals />} />
                <Route path="/chat/:propertyId" element={<Chat />} />
                <Route path="/ai-match" element={<AIMatch />} />
                <Route path="/rent-manager" element={<RentManager />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/analytics" element={<Analytics />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </Suspense>
          </div>

          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
