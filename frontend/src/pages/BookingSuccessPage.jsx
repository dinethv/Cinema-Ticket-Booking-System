import { Link, useLocation } from "react-router-dom";

export default function BookingSuccessPage() {
  const location = useLocation();
  const data = location.state || null;

  if (!data) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <section className="card" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "0.75rem" }}>Booking Completed</h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Payment was processed, but this page was opened without booking details.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn" to="/bookings">
              View My Bookings
            </Link>
            <Link className="btn btn-secondary" to="/">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const {
    bookingId,
    showId,
    movieTitle,
    hallName,
    showTime,
    seats,
    customerName,
    mobileNumber,
    nicNumber,
    totalAmount,
    paymentReference,
    cardBrand,
    cardLast4
  } = data;

  const bookingRef = bookingId ? String(bookingId).slice(-6).toUpperCase() : "N/A";
  const qrPayload = JSON.stringify({
    type: "cinema-entry-pass",
    bookingId: bookingId || "",
    showId: showId || "",
    movieTitle: movieTitle || "",
    hallName: hallName || "",
    showTime: showTime || "",
    seats: Array.isArray(seats) ? seats : [],
    customerName: customerName || "",
    paymentReference: paymentReference || ""
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`;
  const seatText = Array.isArray(seats) && seats.length ? seats.join(", ") : "N/A";
  const showTimeText = showTime ? new Date(showTime).toLocaleString() : "N/A";
  const amountText = `$${Number(totalAmount || 0).toFixed(2)}`;
  const paidWithText = `${cardBrand || "Card"} **** ${cardLast4 || "----"}`;

  function downloadReceipt() {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const safeRef = (bookingRef || "receipt").replace(/[^a-zA-Z0-9-_]/g, "");
    const filename = `receipt-${safeRef}.html`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Receipt ${bookingRef}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
    .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 20px; max-width: 760px; }
    h1 { margin: 0 0 8px; }
    .muted { color: #4b5563; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .qr { margin-top: 18px; text-align: center; }
    .qr img { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; }
  </style>
</head>
<body>
  <section class="card">
    <h1>Cinema Booking Receipt</h1>
    <p class="muted">Show this receipt and QR code at the theater entrance.</p>
    <div class="grid">
      <div class="item"><div class="label">Booking Ref</div><div class="value">${escapeHtml(bookingRef)}</div></div>
      <div class="item"><div class="label">Payment Ref</div><div class="value">${escapeHtml(paymentReference || "N/A")}</div></div>
      <div class="item"><div class="label">Movie</div><div class="value">${escapeHtml(movieTitle || "N/A")}</div></div>
      <div class="item"><div class="label">Hall</div><div class="value">${escapeHtml(hallName || "N/A")}</div></div>
      <div class="item"><div class="label">Show Time</div><div class="value">${escapeHtml(showTimeText)}</div></div>
      <div class="item"><div class="label">Seats</div><div class="value">${escapeHtml(seatText)}</div></div>
      <div class="item"><div class="label">Customer</div><div class="value">${escapeHtml(customerName || "N/A")}</div></div>
      <div class="item"><div class="label">Mobile</div><div class="value">${escapeHtml(mobileNumber || "N/A")}</div></div>
      <div class="item"><div class="label">NIC</div><div class="value">${escapeHtml(nicNumber || "N/A")}</div></div>
      <div class="item"><div class="label">Paid Amount</div><div class="value">${escapeHtml(amountText)}</div></div>
      <div class="item"><div class="label">Paid With</div><div class="value">${escapeHtml(paidWithText)}</div></div>
    </div>
    <div class="qr">
      <img src="${qrUrl}" width="220" height="220" alt="Entry QR code" />
      <p>Entry QR Code</p>
    </div>
  </section>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <section className="card" style={{ borderLeft: "5px solid var(--color-success)" }}>
        <h1 style={{ marginBottom: "0.4rem" }}>Payment Successful</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.4rem" }}>
          Your booking is confirmed. Keep the reference details below.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
          <InfoRow label="Booking Ref" value={bookingRef} />
          <InfoRow label="Payment Ref" value={paymentReference || "N/A"} />
          <InfoRow label="Movie" value={movieTitle || "N/A"} />
          <InfoRow label="Hall" value={hallName || "N/A"} />
          <InfoRow label="Show Time" value={showTimeText} />
          <InfoRow label="Seats" value={seatText} />
          <InfoRow label="Paid Amount" value={amountText} />
          <InfoRow label="Paid With" value={paidWithText} />
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <img
            src={qrUrl}
            alt="QR code for theater entrance"
            width={220}
            height={220}
            style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "0.4rem" }}
          />
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)" }}>
            Show this QR code at the theater entrance.
          </p>
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}
        >
          <button type="button" className="btn" onClick={downloadReceipt}>
            Download Receipt
          </button>
          <button type="button" className="btn btn-secondary" onClick={printReceipt}>
            Print / Save PDF
          </button>
          <Link className="btn" to="/bookings">
            View My Bookings
          </Link>
          <Link className="btn btn-secondary" to="/">
            Book Another Movie
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ padding: "0.8rem", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
      <p style={{ marginBottom: "0.35rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{label}</p>
      <p style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
