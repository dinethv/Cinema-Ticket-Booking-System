import Navbar from "./Navbar";
import { useCinema } from "../context/CinemaContext";

export default function Layout({ children }) {
    const { error } = useCinema();

    return (
        <div className="app-container">
            <Navbar />
            <main className="main-content fade-in">
                {error && (
                    <div className="error-banner" style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-danger)',
                        color: 'var(--color-danger)',
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        marginBottom: '1.5rem'
                    }}>
                        {error}
                    </div>
                )}
                {children}
            </main>
            <footer style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--color-text-muted)',
                borderTop: '1px solid var(--color-border)',
                marginTop: 'auto'
            }}>
                <p>&copy; {new Date().getFullYear()} Ruhunu Cinema. All rights reserved.</p>
            </footer>
        </div>
    );
}
