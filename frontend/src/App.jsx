import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CinemaProvider } from "./context/CinemaContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import BookingPage from "./pages/BookingPage";
import UserBookingsPage from "./pages/UserBookingsPage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// Placeholder components for routes we define but haven't implemented yet to avoid build errors
function Placeholder({ title }) {
  return <div style={{ padding: '2rem' }}><h1>{title}</h1><p>Coming Soon</p></div>;
}

export default function App() {
  return (
    <AuthProvider>
      <CinemaProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/movie/:id" element={<MovieDetailsPage />} />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <UserBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:showId"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              {/* Fallback */}
              <Route path="*" element={<Placeholder title="404 Not Found" />} />
            </Routes>
          </Layout>
        </Router>
      </CinemaProvider>
    </AuthProvider>
  );
}
