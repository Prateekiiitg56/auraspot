import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "./services/firebase";

import Navbar from "./components/Navbar";
import Home from "./pages/home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddProperty from "./pages/AddProperty";
import Explore from "./pages/Explore";
import PropertyDetails from "./pages/PropertyDetails";
import { API } from "./services/api";
import Notifications from "./pages/Notifications";


function App() {
  const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async currentUser => {
    if (currentUser) {
      await fetch(`${API}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email
        })
      });
    }

    setUser(currentUser);
  });

  return () => unsub();
}, []);


  return (
    <Router>
      <Navbar user={user} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/add" element={<AddProperty />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/notifications" element={<Notifications />} />


        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
