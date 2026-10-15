import "./App.css";
import "./ui.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FeedbackHost } from "./components/Feedback";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
const Saved = lazy(() => import("./pages/Saved"));
const Chat = lazy(() => import("./pages/Chat"));
const AIMatch = lazy(() => import("./pages/AIMatch"));
const RentManager = lazy(() => import("./pages/RentManager"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Analytics = lazy(() => import("./pages/Analytics"));

const PageLoader = () => (
  <div className="page-loader" role="status">
    <div className="ai-loading-spinner" />
    <span>Loading…</span>
  </div>
);

/** Waits for Firebase to restore the session, then redirects anonymous users to /login. */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
};

/** Sends signed-in users away from /login and /signup. */
const GuestOnly = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from || "/explore"} replace />;
  }
  return <>{children}</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const NotFound = () => (
  <div className="wrap empty-state" style={{ minHeight: "60vh" }}>
    <p className="eyebrow">404</p>
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist or has moved.</p>
    <Link to="/" className="btn btn-solid">Back to home</Link>
  </div>
);

const protectedRoute = (element: ReactNode) => <RequireAuth>{element}</RequireAuth>;

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <a href="#main" className="skip-link">Skip to content</a>
          <div className="app-shell">
            <Navbar />
            <main id="main" className="app-main">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/property/:id" element={<PropertyDetails />} />
                  <Route path="/user/:email" element={<UserProfile />} />
                  <Route path="/ai-match" element={<AIMatch />} />

                  <Route path="/add" element={protectedRoute(<AddProperty />)} />
                  <Route path="/profile" element={protectedRoute(<Profile />)} />
                  <Route path="/notifications" element={protectedRoute(<Notifications />)} />
                  <Route path="/my-deals" element={protectedRoute(<MyDeals />)} />
                  <Route path="/saved" element={protectedRoute(<Saved />)} />
                  <Route path="/messages" element={protectedRoute(<Chat />)} />
                  <Route path="/chat/:propertyId" element={protectedRoute(<Chat />)} />
                  <Route path="/rent-manager" element={protectedRoute(<RentManager />)} />
                  <Route path="/maintenance" element={protectedRoute(<Maintenance />)} />
                  <Route path="/analytics" element={protectedRoute(<Analytics />)} />

                  <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                  <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
          <FeedbackHost />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
