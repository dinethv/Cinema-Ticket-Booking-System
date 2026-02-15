import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [tempOtp, setTempOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidMobile(value) {
    return /^[0-9]{10,15}$/.test(String(value || "").trim());
  }

  function sendTemporaryOtp() {
    if (!isValidMobile(mobileNumber)) {
      setError("Enter a valid mobile number (10-15 digits) before requesting OTP.");
      return;
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setTempOtp(otp);
    setOtpInput("");
    setOtpVerified(false);
    setError("");
  }

  function verifyOtp() {
    if (!tempOtp) {
      setError("Please generate OTP first.");
      return;
    }
    if (String(otpInput).trim() !== tempOtp) {
      setOtpVerified(false);
      setError("Invalid OTP. Please check the temporary OTP below.");
      return;
    }
    setOtpVerified(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === "register") {
      if (!isValidMobile(mobileNumber)) {
        setError("Enter a valid mobile number (10-15 digits).");
        return;
      }
      if (!otpVerified) {
        setError("Please verify your mobile number with OTP before creating account.");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const user =
        mode === "register"
          ? await register(fullName, email, password, mobileNumber)
          : await login(email, password);
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "460px", margin: "2rem auto" }}>
      <section className="card">
        <h1>{mode === "login" ? "Login" : "Create Account"}</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          {mode === "login"
            ? "Sign in to view your bookings and access checkout."
            : "Create your customer account to book tickets."}
        </p>
        {error ? <p style={{ color: "var(--color-danger)" }}>{error}</p> : null}
        <form onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="input-group">
                <label>Mobile Number</label>
                <div className="input-with-action">
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      setOtpVerified(false);
                    }}
                    placeholder="0771234567"
                    required
                  />
                  <button type="button" className="btn btn-secondary otp-btn" onClick={sendTemporaryOtp}>
                    Send OTP
                  </button>
                </div>
                {tempOtp ? <p className="otp-note">Temporary OTP: {tempOtp}</p> : null}
              </div>
              <div className="input-group">
                <label>OTP</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                  <button type="button" className="btn btn-secondary otp-btn" onClick={verifyOtp}>
                    Verify
                  </button>
                </div>
                {otpVerified ? <p className="otp-success">Mobile number verified.</p> : null}
              </div>
            </>
          ) : null}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        {mode === "login" ? (
          <div style={{ marginTop: "0.75rem", textAlign: "right" }}>
            <Link to="/forgot-password" style={{ color: "var(--color-text-muted)" }}>
              Forgot password?
            </Link>
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: "0.75rem" }}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setFullName("");
            setMobileNumber("");
            setOtpInput("");
            setTempOtp("");
            setOtpVerified(false);
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
      </section>
    </div>
  );
}
