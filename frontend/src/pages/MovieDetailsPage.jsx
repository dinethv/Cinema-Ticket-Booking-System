import { useParams, Link } from "react-router-dom";
import { useCinema } from "../context/CinemaContext";
import { Clock, Calendar, Ticket } from "lucide-react";
import { mediaUrl } from "../utils/api";

export default function MovieDetailsPage() {
    const { id } = useParams();
    const { movies, shows, loading } = useCinema();

    if (loading) return <div>Loading movie details...</div>;

    const movie = movies.find((m) => m._id === id);
    const movieShows = shows.filter((s) => s.movieId && s.movieId._id === id);
    const backdrop = mediaUrl(movie?.photos?.[0] || "");

    if (!movie) return <div className="text-center p-8">Movie not found</div>;

    return (
        <div className="movie-details">
            <div className="backdrop" style={{
                height: '300px',
                background: backdrop
                    ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.3), var(--color-background)), url(${backdrop})`
                    : 'linear-gradient(to right, #0f172a, #1e293b)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 'var(--radius)',
                marginBottom: '2rem',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '2rem'
            }}>
                <h1 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: '3rem', margin: 0 }}>{movie.title}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                <section>
                    <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Synopsis</h2>
                    <p style={{ lineHeight: '1.8', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        {movie.synopsis || "No synopsis available."}
                    </p>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
                        <div>
                            <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Genre</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>{movie.genre}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Duration</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '500' }}>
                                <Clock size={20} /> {movie.durationMinutes} min
                            </span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Language</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>{movie.language || "N/A"}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Rating</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>{movie.rating || "N/A"}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ marginBottom: "0.75rem" }}>Trailer</h3>
                        {movie.trailerVideoUrl ? (
                            <video
                                controls
                                style={{ width: "100%", maxHeight: "360px", borderRadius: "12px", border: "1px solid var(--color-border)" }}
                                src={mediaUrl(movie.trailerVideoUrl)}
                            />
                        ) : movie.trailerUrl ? (
                            <a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="btn">
                                Watch Trailer
                            </a>
                        ) : (
                            <p style={{ color: "var(--color-text-muted)" }}>Trailer not available.</p>
                        )}
                    </div>

                    <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ marginBottom: "0.75rem" }}>Photos</h3>
                        {movie.photos?.length ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                                {movie.photos.map((url, index) => (
                                    <img
                                        key={`${url}-${index}`}
                                        src={mediaUrl(url)}
                                        alt={`${movie.title} photo ${index + 1}`}
                                        style={{ width: "100%", height: "120px", objectFit: "cover", border: "1px solid var(--color-border)" }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "var(--color-text-muted)" }}>No photos uploaded.</p>
                        )}
                    </div>
                </section>

                <section className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} color="var(--color-secondary)" />
                        Showtimes
                    </h3>

                    {movieShows.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>No shows scheduled yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {movieShows.map(show => (
                                <div key={show._id} style={{
                                    padding: '1rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius)',
                                    backgroundColor: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600' }}>{show.hallName}</span>
                                        <span style={{ color: 'var(--color-success)' }}>${show.ticketPrice}</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        {new Date(show.startTime).toLocaleString()}
                                    </div>
                                    <Link to={`/booking/${show._id}`} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                                        <Ticket size={16} />
                                        Book Seats
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
