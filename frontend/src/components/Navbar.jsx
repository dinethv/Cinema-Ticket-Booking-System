import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Film, Settings, Calendar, Home, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, isLoggedIn, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const initial = (user?.email || "U").charAt(0).toUpperCase();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <nav
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "1rem 0"
      }}
    >
      <div
        className="main-content"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem" }}
      >
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}
        >
          <Film size={28} />
          <span>Ruhunu Cinema</span>
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <NavLink to="/" icon={<Home size={20} />} label="Home" active={isActive("/")} />
          <NavLink to="/bookings" icon={<Calendar size={20} />} label="My Bookings" active={isActive("/bookings")} />
          {isAdmin ? <NavLink to="/admin" icon={<Settings size={20} />} label="Admin" active={isActive("/admin")} /> : null}
          {isLoggedIn ? (
            <div className="profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="profile-icon-trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={user?.email || "Profile"}
              >
                <span className="profile-avatar profile-avatar-large">{initial}</span>
              </button>
              {menuOpen ? (
                <div className="profile-dropdown" role="menu">
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="profile-icon-trigger profile-icon-link" aria-label="Login">
              <UserRound size={25} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        color: active ? "var(--color-primary)" : "var(--color-text-muted)",
        fontWeight: active ? "600" : "400",
        transition: "color 0.2s"
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
