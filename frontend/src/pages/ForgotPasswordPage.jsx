import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [tempOtp, setTempOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidMobile(value) {
    return /^[0-9]{10,15}$/.test(String(value || "").trim());
  }

  async function requestOtp() {
    setError("");
    setSuccess("");
    setOtpVerified(false);
    setTempOtp("");
    setOtpInput("");

    if (!isValidMobile(mobileNumber)) {
      setError("Enter a valid mobile number (10-15 digits).");
      return;
    }

    setLoading(true);
    try {
      const data = await api("/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ mobileNumber })
      });
      setTempOtp(data.tempOtp || "");
      setSuccess("OTP generated. Use the temporary OTP below to verify.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function verifyOtp() {
    setError("");
    setSuccess("");
    if (!tempOtp) {
      setError("Please generate OTP first.");
      return;
    }
    if (String(otpInput).trim() !== String(tempOtp).trim()) {
      setOtpVerified(false);
      setError("Invalid OTP. Please check the temporary OTP below.");
      return;
    }
    setOtpVerified(true);
    setSuccess("Mobile number verified. You can reset your password now.");
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidMobile(mobileNumber)) {
      setError("Enter a valid mobile number (10-15 digits).");
      return;
    }
    if (!otpVerified) {
      setError("Please verify OTP first.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({ mobileNumber, otp: otpInput, newPassword })
      });
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "460px", margin: "2rem auto" }}>
      <section className="card">
        <h1>Forgot Password</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Verify your mobile number with OTP and set a new password.
        </p>

        {error ? <p style={{ color: "var(--color-danger)" }}>{error}</p> : null}
        {success ? <p style={{ color: "var(--color-success)" }}>{success}</p> : null}

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
            <button type="button" className="btn btn-secondary otp-btn" onClick={requestOtp} disabled={loading}>
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
            <button type="button" className="btn btn-secondary otp-btn" onClick={verifyOtp} disabled={loading}>
              Verify
            </button>
          </div>
          {otpVerified ? <p className="otp-success">Mobile number verified.</p> : null}
        </div>

        <form onSubmit={resetPassword}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Processing..." : "Reset Password"}
          </button>
        </form>

        <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--color-text-muted)" }}>
            Back to login
          </Link>
        </div>
      </section>
    </div>
  );
}

