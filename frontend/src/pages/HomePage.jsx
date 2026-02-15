import { Link } from "react-router-dom";
import { useCinema } from "../context/CinemaContext";
import { Clock, Tag } from "lucide-react";
import { mediaUrl } from "../utils/api";

export default function HomePage() {
    const { movies, loading } = useCinema();

    if (loading) return <div className="text-center p-8">Loading movies...</div>;

    return (
        <div>
            <section className="hero" style={{
                marginBottom: '3rem',
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'linear-gradient(to right, #0f172a, #1e293b)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)'
            }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Experience Cinema Like Never Before
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Book tickets for the latest blockbusters from the comfort of your home.
                </p>
            </section>

            <h2 style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)', paddingLeft: '1rem' }}>Now Showing</h2>

            <div className="grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {movies.map(movie => (
                    <MovieCard key={movie._id} movie={movie} />
                ))}
            </div>
        </div>
    );
}

function MovieCard({ movie }) {
    const posterUrl = mediaUrl(movie.photos?.[0] || "");

    return (
        <article className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
                height: '300px',
                backgroundColor: '#334155',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                backgroundImage: posterUrl ? `url(${posterUrl})` : undefined,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
            }}>
                {!posterUrl && <span>No Poster</span>}
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{movie.title}</h3>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={16} /> {movie.durationMinutes} min
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Tag size={16} /> {movie.genre}
                </span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                {movie.synopsis ? `${movie.synopsis.slice(0, 120)}${movie.synopsis.length > 120 ? "..." : ""}` : "No synopsis available."}
            </p>

            <div style={{ marginTop: 'auto' }}>
                <Link to={`/movie/${movie._id}`} className="btn" style={{ width: '100%', textAlign: 'center' }}>
                    Get Tickets
                </Link>
            </div>
        </article>
    );
}
