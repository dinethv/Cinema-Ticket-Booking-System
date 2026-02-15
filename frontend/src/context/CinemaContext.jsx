import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";

const CinemaContext = createContext();

export function CinemaProvider({ children }) {
    const [movies, setMovies] = useState([]);
    const [shows, setShows] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const refreshAll = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [moviesData, showsData] = await Promise.all([
                api("/movies"),
                api("/shows")
            ]);
            const token = localStorage.getItem("cinema_token");
            let bookingsData = [];
            if (token) {
                try {
                    bookingsData = await api("/bookings");
                } catch (_err) {
                    bookingsData = [];
                }
            }
            setMovies(moviesData);
            setShows(showsData);
            setBookings(bookingsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const value = {
        movies,
        shows,
        bookings,
        loading,
        error,
        refreshAll,
        setError,
    };

    return <CinemaContext.Provider value={value}>{children}</CinemaContext.Provider>;
}

export function useCinema() {
    return useContext(CinemaContext);
}
