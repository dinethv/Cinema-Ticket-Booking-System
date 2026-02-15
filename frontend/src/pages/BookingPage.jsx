import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCinema } from "../context/CinemaContext";
import { api } from "../utils/api";

export default function BookingPage() {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { shows, refreshAll, setError } = useCinema();

    const [selectedSeats, setSelectedSeats] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [nicNumber, setNicNumber] = useState("");
    const [promoCode, setPromoCode] = useState("");
    const [promoResult, setPromoResult] = useState(null);
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Find show
    const show = useMemo(() => shows.find(s => s._id === showId), [shows, showId]);

    if (!show) return <div className="p-8">Show not found</div>;

    const movie = show.movieId;
    const bookedSeats = show.bookedSeats || [];
    const totalSeats = show.totalSeats || 60; // fallback
    const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

    const toggleSeat = (seatNum) => {
        if (bookedSeats.includes(seatNum)) return;

        if (selectedSeats.includes(seatNum)) {
            setSelectedSeats(prev => prev.filter(s => s !== seatNum));
        } else {
            setSelectedSeats(prev => [...prev, seatNum]);
        }
        setPromoResult(null);
    };

    const seatTotal = selectedSeats.length * show.ticketPrice;
    const discountAmount = promoResult?.discountAmount || 0;
    const payableTotal = Math.max(0, seatTotal - discountAmount);

    async function handleValidatePromo() {
        if (!promoCode.trim()) return;
        if (selectedSeats.length === 0) return alert("Please select seats before applying a promo code");
        setValidatingPromo(true);
        try {
            const data = await api("/promo-codes/validate", {
                method: "POST",
                body: JSON.stringify({
                    code: promoCode,
                    showId,
                    seatCount: selectedSeats.length
                })
            });
            setPromoResult(data);
        } catch (err) {
            setPromoResult(null);
            setError(err.message);
        } finally {
            setValidatingPromo(false);
        }
    }

    async function handleBooking(e) {
        e.preventDefault();
        if (selectedSeats.length === 0) return alert("Please select at least one seat");

        setProcessing(true);
        try {
            await api("/bookings", {
                method: "POST",
                body: JSON.stringify({
                    showId,
                    customerName,
                    mobileNumber,
                    nicNumber,
                    promoCode: promoResult?.code || "",
                    seats: selectedSeats
                })
            });
            await refreshAll();
            alert("Booking confirmed!");
            navigate("/bookings");
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem' }}>{movie?.title}</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    {show.hallName} • {new Date(show.startTime).toLocaleString()}
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '2rem' }}>
                <section className="seat-selection">
                    <div className="screen" style={{
                        height: '40px',
                        backgroundColor: 'var(--color-text-muted)',
                        opacity: 0.2,
                        marginBottom: '3rem',
                        borderRadius: '50% 50% 0 0 / 20px 20px 0 0',
                        transform: 'perspective(500px) rotateX(-10deg)',
                        boxShadow: '0 20px 50px rgba(255,255,255,0.1)'
                    }}></div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '0.75rem',
                        justifyContent: 'center'
                    }}>
                        {seats.map(seatNum => {
                            const isBooked = bookedSeats.includes(seatNum);
                            const isSelected = selectedSeats.includes(seatNum);

                            return (
                                <button
                                    key={seatNum}
                                    onClick={() => toggleSeat(seatNum)}
                                    disabled={isBooked}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: isBooked
                                            ? '#334155' // dark slate for booked
                                            : isSelected
                                                ? 'var(--color-primary)'
                                                : 'var(--color-surface)',
                                        color: isSelected ? 'white' : 'var(--color-text-muted)',
                                        cursor: isBooked ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
                        <LegendItem color="var(--color-surface)" label="Available" />
                        <LegendItem color="var(--color-primary)" label="Selected" />
                        <LegendItem color="#334155" label="Booked" />
                    </div>
                </section>

                <section className="booking-summary card" style={{ height: 'fit-content' }}>
                    <h3>Booking Summary</h3>
                    <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Seats selected:</span>
                            <strong>{selectedSeats.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Price per ticket:</span>
                            <strong>${show.ticketPrice}</strong>
                        </div>
                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <span>Total:</span>
                            <span style={{ color: 'var(--color-success)' }}>${seatTotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                                <span>Promo Discount:</span>
                                <span>- ${discountAmount.toFixed(2)}</span>
                            </div>
                        ) : null}
                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <span>Payable:</span>
                            <span style={{ color: 'var(--color-success)' }}>${payableTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <form onSubmit={handleBooking}>
                        <div className="input-group">
                            <label>Your Name</label>
                            <input
                                placeholder="John Doe"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Mobile Number</label>
                            <input
                                placeholder="+94 77 123 4567"
                                value={mobileNumber}
                                onChange={e => setMobileNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>NIC Number</label>
                            <input
                                placeholder="NIC / ID number"
                                value={nicNumber}
                                onChange={e => setNicNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Promo Code</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="Enter promo code"
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleValidatePromo}
                                    disabled={validatingPromo || !promoCode.trim()}
                                >
                                    {validatingPromo ? "Checking..." : "Apply"}
                                </button>
                            </div>
                            {promoResult?.valid ? (
                                <p style={{ margin: '0.4rem 0 0', color: 'var(--color-success)' }}>
                                    Promo applied: {promoResult.code} (-${promoResult.discountAmount.toFixed(2)})
                                </p>
                            ) : null}
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }} disabled={processing || selectedSeats.length === 0}>
                            {processing ? "Processing..." : "Confirm Booking"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: color, border: '1px solid var(--color-border)' }}></div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{label}</span>
        </div>
    );
}
