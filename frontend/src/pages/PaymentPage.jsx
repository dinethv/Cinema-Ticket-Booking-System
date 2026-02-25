import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCinema } from "../context/CinemaContext";
import { api } from "../utils/api";

export default function PaymentPage() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { shows, refreshAll, setError } = useCinema();

  const state = location.state || null;

  const show = useMemo(() => shows.find((s) => s._id === showId), [shows, showId]);
  const movie = show?.movieId;

  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function luhnCheck(number) {
    const digits = digitsOnly(number);
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = Number(digits[i]);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return digits.length >= 13 && digits.length <= 19 && sum % 10 === 0;
  }

  function detectCardBrand(number) {
    const d = digitsOnly(number);
    if (d.startsWith("4")) return "Visa";
    if (/^(5[1-5])/.test(d) || /^(222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(d)) return "Mastercard";
    if (/^(34|37)/.test(d)) return "Amex";
    if (/^(6011|65|64[4-9])/.test(d)) return "Discover";
    return "Card";
  }

  function formatCardNumber(value) {
    const digits = digitsOnly(value).slice(0, 19);
    if (/^(34|37)/.test(digits)) {
      const p1 = digits.slice(0, 4);
      const p2 = digits.slice(4, 10);
      const p3 = digits.slice(10, 15);
      return [p1, p2, p3].filter(Boolean).join(" ");
    }
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value) {
    const digits = digitsOnly(value).slice(0, 4);
    const mm = digits.slice(0, 2);
    const yy = digits.slice(2, 4);
    if (!yy) return mm;
    return `${mm}/${yy}`;
  }

  function parseExpiry(value) {
    const raw = String(value || "").trim();
    const m = raw.match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);
    if (!m) return null;
    const month = Number(m[1]);
    let year = Number(m[2]);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;
    if (String(m[2]).length === 2) year += 2000;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
    const expiresAt = new Date(year, month, 0, 23, 59, 59, 999);
    return { month, year, expiresAt };
  }

  const selectedSeats = Array.isArray(state?.selectedSeats) ? state.selectedSeats : [];
  const customerName = state?.customerName || "";
  const mobileNumber = state?.mobileNumber || "";
  const nicNumber = state?.nicNumber || "";
  const promoCode = state?.promoCode || "";
  const discountAmount = Number(state?.discountAmount || 0);

  const seatTotal = show ? selectedSeats.length * show.ticketPrice : 0;
  const payableTotal = Math.max(0, seatTotal - discountAmount);

  const brand = detectCardBrand(cardNumber);
  const cvcLen = brand === "Amex" ? 4 : 3;

  function validate() {
    const errors = {};

    if (!show) errors._page = "Show not found.";
    if (selectedSeats.length === 0) errors._page = "Missing seats. Please go back and select seats.";
    if (!String(customerName).trim()) errors._page = "Missing customer name. Please go back and fill details.";
    if (!String(mobileNumber).trim()) errors._page = "Missing mobile number. Please go back and fill details.";
    if (!String(nicNumber).trim()) errors._page = "Missing NIC number. Please go back and fill details.";

    if (!String(cardName || "").trim()) errors.cardName = "Cardholder name is required.";
    if (!luhnCheck(cardNumber)) errors.cardNumber = "Enter a valid card number.";

    const expiryParsed = parseExpiry(cardExpiry);
    if (!expiryParsed) errors.cardExpiry = "Use MM/YY (example: 08/28).";
    else if (expiryParsed.expiresAt.getTime() < Date.now()) errors.cardExpiry = "Card is expired.";

    const cvcDigits = digitsOnly(cardCvc);
    if (cvcDigits.length !== cvcLen) errors.cardCvc = `CVC must be ${cvcLen} digits.`;

    return errors;
  }

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  async function handlePay(event) {
    event.preventDefault();
    setTouched(true);
    setFormError("");

    if (!isValid) {
      setFormError(errors._page || "Please fix the highlighted fields and try again.");
      return;
    }

    setProcessing(true);
    try {
      const cardDigits = digitsOnly(cardNumber);
      const last4 = cardDigits.slice(-4);
      const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const booking = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          showId,
          customerName,
          mobileNumber,
          nicNumber,
          promoCode,
          seats: selectedSeats,
          payment: {
            method: "card",
            cardBrand: brand,
            cardLast4: last4,
            reference: paymentRef
          }
        })
      });

      await refreshAll();
      navigate("/booking-success", {
        state: {
          bookingId: booking?._id,
          showId,
          movieTitle: movie?.title || "",
          hallName: show?.hallName || "",
          showTime: show?.startTime || "",
          seats: selectedSeats,
          customerName,
          mobileNumber,
          nicNumber,
          totalAmount: payableTotal,
          paymentReference: paymentRef,
          cardBrand: brand,
          cardLast4: last4
        }
      });
    } catch (err) {
      setFormError(err.message);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (!show) return <div className="p-8">Show not found</div>;

  if (!state) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <section className="card">
          <h2>Payment</h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Payment details were not found. Please start from the booking page.
          </p>
          <Link className="btn" to={`/booking/${showId}`}>
            Back to Booking
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Payment</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          {movie?.title} • {show.hallName} • {new Date(show.startTime).toLocaleString()}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) 1fr", gap: "1.5rem" }}>
        <section className="card" style={{ height: "fit-content" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Order Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Seats</span>
              <strong>{selectedSeats.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ticket Price</span>
              <strong>${show.ticketPrice}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <strong>${seatTotal.toFixed(2)}</strong>
            </div>
            {discountAmount > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success)" }}>
                <span>Discount</span>
                <strong>- ${discountAmount.toFixed(2)}</strong>
              </div>
            ) : null}
            <div
              style={{
                borderTop: "1px solid var(--color-border)",
                paddingTop: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.15rem",
                fontWeight: 700
              }}
            >
              <span>Total</span>
              <span style={{ color: "var(--color-success)" }}>${payableTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", margin: "1rem 0" }}></div>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Customer: <strong style={{ color: "var(--color-text)" }}>{customerName}</strong>
          </p>
          <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)" }}>
            Mobile: <strong style={{ color: "var(--color-text)" }}>{mobileNumber}</strong>
          </p>
          <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)" }}>
            NIC: <strong style={{ color: "var(--color-text)" }}>{nicNumber}</strong>
          </p>
        </section>

        <section className="card">
          <h3 style={{ marginBottom: "0.75rem" }}>Card Payment</h3>
          <form onSubmit={handlePay}>
            {formError ? <div className="form-alert form-alert-error">{formError}</div> : null}
            <div className="input-group">
              <label>Cardholder Name</label>
              <input
                placeholder="Name on card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className={touched && errors.cardName ? "input-error" : ""}
                aria-invalid={Boolean(touched && errors.cardName)}
                required
              />
              {touched && errors.cardName ? <p className="field-error">{errors.cardName}</p> : null}
            </div>
            <div className="input-group">
              <label>Card Number</label>
              <input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className={touched && errors.cardNumber ? "input-error" : ""}
                aria-invalid={Boolean(touched && errors.cardNumber)}
                required
              />
              <p style={{ margin: "0.4rem 0 0", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Payment method: {brand}
              </p>
              {touched && errors.cardNumber ? <p className="field-error">{errors.cardNumber}</p> : null}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Expiry (MM/YY)</label>
                <input
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  className={touched && errors.cardExpiry ? "input-error" : ""}
                  aria-invalid={Boolean(touched && errors.cardExpiry)}
                  required
                />
                {touched && errors.cardExpiry ? <p className="field-error">{errors.cardExpiry}</p> : null}
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>CVC</label>
                <input
                  inputMode="numeric"
                  placeholder="CVC"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(digitsOnly(e.target.value).slice(0, cvcLen))}
                  className={touched && errors.cardCvc ? "input-error" : ""}
                  aria-invalid={Boolean(touched && errors.cardCvc)}
                  required
                />
                {touched && errors.cardCvc ? <p className="field-error">{errors.cardCvc}</p> : null}
              </div>
            </div>

            <button
              className="btn"
              type="submit"
              style={{ width: "100%", marginTop: "1rem" }}
              disabled={processing || !isValid}
              title={!isValid ? "Complete card details to proceed" : ""}
            >
              {processing ? "Processing..." : `Pay $${payableTotal.toFixed(2)}`}
            </button>

            <Link
              to={`/booking/${showId}`}
              state={state}
              style={{ display: "block", marginTop: "0.75rem", textAlign: "center", color: "var(--color-text-muted)" }}
            >
              Back to Booking
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
}
