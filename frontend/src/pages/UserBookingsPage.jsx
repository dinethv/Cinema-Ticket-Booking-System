import { useState } from "react";
import { useCinema } from "../context/CinemaContext";
import { Ticket } from "lucide-react";
import { api } from "../utils/api";

export default function UserBookingsPage() {
    const { bookings, loading, refreshAll, setError } = useCinema();

    if (loading) return <div>Loading bookings...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: "2rem" }}>My Bookings</h1>

            {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
                    <Ticket size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                    <p>No bookings found. Go book a movie!</p>
                </div>
            ) : (
                <div className="grid">
                    {bookings.map((booking) => (
                        <BookingCard key={booking._id} booking={booking} onDeleted={refreshAll} setError={setError} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BookingCard({ booking, onDeleted, setError }) {
    const show = booking.showId;
    const movie = show?.movieId;
    const [deleting, setDeleting] = useState(false);

    async function handleDeleteBooking() {
        if (!window.confirm("Cancel this booking?")) return;
        setDeleting(true);
        try {
            await api(`/bookings/${booking._id}`, { method: "DELETE" });
            await onDeleted();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <article className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
            <h3 style={{ marginBottom: "0.5rem" }}>{movie?.title || "Unknown Movie"}</h3>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", display: "grid", gap: "0.5rem" }}>
                <p><strong>Ref:</strong> {booking._id.slice(-6).toUpperCase()}</p>
                <p><strong>Customer:</strong> {booking.customerName}</p>
                <p><strong>Mobile:</strong> {booking.mobileNumber || "N/A"}</p>
                <p><strong>NIC:</strong> {booking.nicNumber || "N/A"}</p>
                <p><strong>Hall:</strong> {show?.hallName}</p>
                <p><strong>Time:</strong> {show ? new Date(show.startTime).toLocaleString() : "N/A"}</p>
                <p><strong>Seats:</strong> {booking.seats.join(", ")}</p>
                {booking.promoCode ? <p><strong>Promo:</strong> {booking.promoCode}</p> : null}
                {booking.discountAmount > 0 ? <p><strong>Discount:</strong> ${booking.discountAmount}</p> : null}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDeleteBooking}
                    disabled={deleting}
                    style={{ borderColor: "rgba(239, 68, 68, 0.45)", color: "#fecaca", background: "rgba(127, 29, 29, 0.35)" }}
                >
                    {deleting ? "Deleting..." : "Delete Booking"}
                </button>
            </div>
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Total Paid</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-success)" }}>
                    ${booking.totalAmount}
                </span>
            </div>
        </article>
    );
}
