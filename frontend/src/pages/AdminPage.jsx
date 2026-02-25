import { useEffect, useState } from "react";
import { useCinema } from "../context/CinemaContext";
import { api, mediaUrl } from "../utils/api";
import {
  PlusCircle,
  Film,
  Calendar,
  Trash2,
  Pencil,
  Save,
  X,
  Users,
  Search,
  LayoutDashboard
} from "lucide-react";

const defaultMovieForm = {
  title: "",
  durationMinutes: 120,
  genre: "General",
  language: "English",
  rating: "PG-13",
  releaseDate: "",
  synopsis: "",
  trailerUrl: "",
  photosText: ""
};

const featureCardStyle = {
  border: "1px solid rgba(99, 102, 241, 0.28)",
  borderRadius: "16px",
  background:
    "linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(30, 41, 59, 0.78) 55%, rgba(56, 189, 248, 0.06))",
  boxShadow: "0 20px 40px rgba(2, 6, 23, 0.38)"
};

function parsePhotosText(text) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadPhotos(files) {
  if (!files || files.length === 0) return [];
  const formData = new FormData();
  for (const file of files) formData.append("photos", file);
  const data = await api("/uploads/photos", { method: "POST", body: formData });
  return data.urls || [];
}

async function uploadVideo(file) {
  if (!file) return "";
  const formData = new FormData();
  formData.append("video", file);
  const data = await api("/uploads/video", { method: "POST", body: formData });
  return data.url || "";
}

export default function AdminPage() {
  const [activePanel, setActivePanel] = useState("add-movie");
  const menuItems = [
    { key: "add-movie", label: "Add New Movie", icon: <PlusCircle size={16} /> },
    { key: "edit-movie", label: "Edit or Delete Movie", icon: <Film size={16} /> },
    { key: "schedule-show", label: "Schedule Show", icon: <Calendar size={16} /> },
    { key: "bookings", label: "Customer Bookings", icon: <Users size={16} /> },
    { key: "entry-check", label: "Entry Verification", icon: <Search size={16} /> }
  ];

  return (
    <div style={{ maxWidth: "1420px", margin: "0 auto", paddingLeft: "0.4rem", paddingRight: "1rem" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Manage movies, media, and showtimes</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: "1.25rem", alignItems: "start" }}>
        <aside
          style={{
            height: "calc(100vh - 130px)",
            position: "sticky",
            top: "1rem",
            marginLeft: "-0.45rem",
            border: "1px solid rgba(51, 65, 85, 0.95)",
            borderRadius: "16px",
            background:
              "linear-gradient(180deg, rgba(8, 15, 34, 0.98), rgba(10, 19, 40, 0.97) 55%, rgba(9, 14, 30, 0.95))",
            boxShadow: "0 20px 45px rgba(2, 6, 23, 0.5)",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "1rem 1rem 0.8rem", borderBottom: "1px solid rgba(51, 65, 85, 0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                  color: "white"
                }}
              >
                <LayoutDashboard size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>Ruhunu Cinema</p>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>Admin Console</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.4rem", padding: "0.85rem" }}>
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePanel(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  width: "100%",
                  borderRadius: "10px",
                  padding: "0.7rem 0.75rem",
                  cursor: "pointer",
                  border:
                    activePanel === item.key
                      ? "1px solid rgba(96, 165, 250, 0.5)"
                      : "1px solid transparent",
                  background:
                    activePanel === item.key
                      ? "linear-gradient(90deg, rgba(37, 99, 235, 0.25), rgba(30, 64, 175, 0.1))"
                      : "transparent",
                  color: activePanel === item.key ? "#dbeafe" : "#93c5fd",
                  textAlign: "left",
                  fontSize: "0.96rem",
                  fontWeight: 500
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <section style={{ display: "grid", gap: "2rem" }}>
          {activePanel === "add-movie" ? <CreateMovieForm /> : null}
          {activePanel === "edit-movie" ? <ManageMoviesSection /> : null}
          {activePanel === "schedule-show" ? (
            <>
              <CreateShowForm />
              <PromoCodeSection />
            </>
          ) : null}
          {activePanel === "bookings" ? <AdminBookingsSection /> : null}
          {activePanel === "entry-check" ? <EntryVerificationSection /> : null}
        </section>
      </div>
    </div>
  );
}

function CreateMovieForm() {
  const { refreshAll, setError } = useCinema();
  const [form, setForm] = useState(defaultMovieForm);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const uploadedPhotos = await uploadPhotos(photoFiles);
      const uploadedVideo = await uploadVideo(videoFile);
      const manualPhotos = parsePhotosText(form.photosText);

      await api("/movies", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          durationMinutes: Number(form.durationMinutes),
          genre: form.genre,
          language: form.language,
          rating: form.rating,
          releaseDate: form.releaseDate || undefined,
          synopsis: form.synopsis,
          trailerUrl: form.trailerUrl,
          trailerVideoUrl: uploadedVideo,
          photos: [...manualPhotos, ...uploadedPhotos]
        })
      });

      setForm(defaultMovieForm);
      setPhotoFiles([]);
      setVideoFile(null);
      await refreshAll();
      alert("Movie created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={featureCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.55rem", margin: 0 }}>
          <Film size={24} color="var(--color-primary)" />
          Add New Movie
        </h2>
        <span
          style={{
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(15, 23, 42, 0.5)",
            color: "var(--color-text-muted)",
            borderRadius: "999px",
            padding: "0.2rem 0.65rem",
            fontSize: "0.8rem"
          }}
        >
          Media + Details
        </span>
      </div>
      <p style={{ marginTop: 0, marginBottom: "1.2rem", color: "var(--color-text-muted)" }}>
        Create a movie with rich metadata, photos, and trailer assets.
      </p>
      <form onSubmit={handleSubmit}>
        <MovieFormFields
          form={form}
          setForm={setForm}
          photoFiles={photoFiles}
          setPhotoFiles={setPhotoFiles}
          videoFile={videoFile}
          setVideoFile={setVideoFile}
        />

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ paddingInline: "1.5rem", boxShadow: "0 10px 22px rgba(79, 70, 229, 0.35)" }}
        >
          <PlusCircle size={18} />
          {loading ? "Creating..." : "Create Movie"}
        </button>
      </form>
    </section>
  );
}

function ManageMoviesSection() {
  const { movies, refreshAll, setError } = useCinema();
  const [deletingId, setDeletingId] = useState("");
  const [editingMovieId, setEditingMovieId] = useState("");

  async function handleDeleteMovie(movieId) {
    if (!window.confirm("Delete this movie and all related shows/bookings?")) return;
    setDeletingId(movieId);
    try {
      await api(`/movies/${movieId}`, { method: "DELETE" });
      if (editingMovieId === movieId) setEditingMovieId("");
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="card" style={featureCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        <h2 style={{ margin: 0 }}>Edit or Delete Movie</h2>
        <span
          style={{
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(15, 23, 42, 0.5)",
            color: "var(--color-text-muted)",
            borderRadius: "999px",
            padding: "0.2rem 0.65rem",
            fontSize: "0.8rem"
          }}
        >
          {movies.length} Movies
        </span>
      </div>
      {movies.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No movies available.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.95rem" }}>
          {movies.map((movie) => (
            <div
              key={movie._id}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.22)",
                borderRadius: "14px",
                padding: "0.9rem",
                background: "linear-gradient(140deg, rgba(15, 23, 42, 0.56), rgba(30, 41, 59, 0.45))"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {movie.photos?.[0] ? (
                    <img
                      src={mediaUrl(movie.photos[0])}
                      alt={movie.title}
                      style={{
                        width: "62px",
                        height: "62px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "1px solid rgba(148, 163, 184, 0.32)"
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "62px",
                        height: "62px",
                        borderRadius: "12px",
                        border: "1px dashed rgba(148, 163, 184, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-muted)"
                      }}
                    >
                      <Film size={18} />
                    </div>
                  )}
                  <div>
                    <strong style={{ fontSize: "1.02rem" }}>{movie.title}</strong>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                      {movie.genre} | {movie.durationMinutes} min
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingMovieId(editingMovieId === movie._id ? "" : movie._id)}
                    style={{
                      borderColor: "rgba(148, 163, 184, 0.28)",
                      background: "rgba(30, 41, 59, 0.65)"
                    }}
                  >
                    <Pencil size={16} />
                    {editingMovieId === movie._id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={deletingId === movie._id}
                    onClick={() => handleDeleteMovie(movie._id)}
                    style={{
                      borderColor: "rgba(239, 68, 68, 0.45)",
                      color: "#fecaca",
                      background: "rgba(127, 29, 29, 0.35)"
                    }}
                  >
                    <Trash2 size={16} />
                    {deletingId === movie._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {editingMovieId === movie._id ? (
                <EditMoviePanel
                  movie={movie}
                  onSaved={async () => {
                    setEditingMovieId("");
                    await refreshAll();
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditMoviePanel({ movie, onSaved }) {
  const { setError } = useCinema();
  const [form, setForm] = useState({
    title: movie.title || "",
    durationMinutes: movie.durationMinutes || 120,
    genre: movie.genre || "General",
    language: movie.language || "English",
    rating: movie.rating || "PG-13",
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().slice(0, 10) : "",
    synopsis: movie.synopsis || "",
    trailerUrl: movie.trailerUrl || "",
    trailerVideoUrl: movie.trailerVideoUrl || "",
    photosText: (movie.photos || []).join(", ")
  });
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const uploadedPhotos = await uploadPhotos(photoFiles);
      const uploadedVideo = await uploadVideo(videoFile);
      const manualPhotos = parsePhotosText(form.photosText);

      await api(`/movies/${movie._id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          durationMinutes: Number(form.durationMinutes),
          genre: form.genre,
          language: form.language,
          rating: form.rating,
          releaseDate: form.releaseDate || undefined,
          synopsis: form.synopsis,
          trailerUrl: form.trailerUrl,
          trailerVideoUrl: uploadedVideo || form.trailerVideoUrl || "",
          photos: [...manualPhotos, ...uploadedPhotos]
        })
      });

      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
      <MovieFormFields
        form={form}
        setForm={setForm}
        photoFiles={photoFiles}
        setPhotoFiles={setPhotoFiles}
        videoFile={videoFile}
        setVideoFile={setVideoFile}
      />

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="btn" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setPhotoFiles([]);
            setVideoFile(null);
          }}
        >
          <X size={16} />
          Clear Selected Files
        </button>
      </div>
    </div>
  );
}

function MovieFormFields({ form, setForm, photoFiles, setPhotoFiles, videoFile, setVideoFile }) {
  return (
    <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
      <div className="input-group">
        <label>Movie Title</label>
        <input
          placeholder="e.g. Inception"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="input-group">
          <label>Duration (min)</label>
          <input
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
        </div>
        <div className="input-group">
          <label>Genre</label>
          <input
            placeholder="e.g. Sci-Fi"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div className="input-group">
          <label>Language</label>
          <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Rating</label>
          <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Release Date</label>
          <input
            type="date"
            value={form.releaseDate}
            onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
          />
        </div>
      </div>

      <div className="input-group">
        <label>Synopsis</label>
        <textarea
          rows={4}
          placeholder="Short plot summary"
          value={form.synopsis}
          onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>Trailer URL (YouTube, etc.)</label>
        <input
          placeholder="https://youtube.com/watch?v=..."
          value={form.trailerUrl}
          onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>Current Uploaded Video Path</label>
        <input
          placeholder="/uploads/your-video.mp4"
          value={form.trailerVideoUrl || ""}
          onChange={(e) => setForm({ ...form, trailerVideoUrl: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>Photos (comma-separated URLs or /uploads paths)</label>
        <input
          placeholder="https://...jpg, /uploads/photo.jpg"
          value={form.photosText}
          onChange={(e) => setForm({ ...form, photosText: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>Upload Photos (local files)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
        />
        {photoFiles.length > 0 ? (
          <p style={{ color: "var(--color-text-muted)", margin: "0.4rem 0 0" }}>{photoFiles.length} photo(s) selected</p>
        ) : null}
      </div>

      <div className="input-group">
        <label>Upload Trailer Video (local file)</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile((e.target.files && e.target.files[0]) || null)}
        />
        {videoFile ? (
          <p style={{ color: "var(--color-text-muted)", margin: "0.4rem 0 0" }}>Selected: {videoFile.name}</p>
        ) : null}
      </div>
    </div>
  );
}

function CreateShowForm() {
  const { movies, refreshAll, setError } = useCinema();
  const [form, setForm] = useState({
    movieId: "",
    hallName: "Hall A",
    startTime: "",
    ticketPrice: 12,
    totalSeats: 60
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/shows", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          ticketPrice: Number(form.ticketPrice),
          totalSeats: Number(form.totalSeats)
        })
      });
      setForm((prev) => ({ ...prev, startTime: "" }));
      await refreshAll();
      alert("Show scheduled successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={24} color="var(--color-secondary)" />
        Schedule Show
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <div className="input-group">
          <label>Select Movie</label>
          <select
            value={form.movieId}
            onChange={(e) => setForm({ ...form, movieId: e.target.value })}
            required
          >
            <option value="">-- Choose a movie --</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label>Hall Name</label>
            <input
              value={form.hallName}
              onChange={(e) => setForm({ ...form, hallName: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label>Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ticketPrice}
              onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Total Seats</label>
            <input
              type="number"
              min="1"
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          <PlusCircle size={18} />
          {loading ? "Creating..." : "Create Show"}
        </button>
      </form>
    </section>
  );
}

function PromoCodeSection() {
  const { setError } = useCinema();
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    usageLimit: "",
    expiresAt: ""
  });

  async function loadPromoCodes() {
    setLoading(true);
    try {
      const data = await api("/admin/promo-codes");
      setPromoCodes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromoCodes();
  }, []);

  async function createPromoCode(event) {
    event.preventDefault();
    try {
      await api("/admin/promo-codes", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null
        })
      });
      setForm({ code: "", type: "percentage", value: 10, usageLimit: "", expiresAt: "" });
      await loadPromoCodes();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Promo Codes</h2>
        <button type="button" className="btn btn-secondary" onClick={loadPromoCodes} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <form onSubmit={createPromoCode} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.75rem" }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
              required
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Value</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Usage Limit (optional)</label>
            <input
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="100"
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Expires At (optional)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <button type="submit" className="btn">
            Create Code
          </button>
        </div>
      </form>

      {promoCodes.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No promo codes created yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.55rem" }}>
          {promoCodes.map((promo) => (
            <div
              key={promo._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.65rem 0.75rem"
              }}
            >
              <div>
                <strong>{promo.code}</strong>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  {promo.type === "percentage" ? `${promo.value}% off` : `$${promo.value} off`} | Used{" "}
                  {promo.usedCount}/{promo.usageLimit || "unlimited"}
                </p>
              </div>
              <span style={{ color: promo.active ? "var(--color-success)" : "var(--color-danger)" }}>
                {promo.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EntryVerificationSection() {
  const { setError } = useCinema();
  const [qrPayload, setQrPayload] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");

  async function verifyEntry(event) {
    event.preventDefault();
    const payload = qrPayload.trim();
    setFormError("");
    setResult(null);
    if (!payload) {
      setFormError("Paste scanned QR payload first.");
      return;
    }

    setVerifying(true);
    try {
      const data = await api("/admin/bookings/verify-entry", {
        method: "POST",
        body: JSON.stringify({ qrPayload: payload })
      });
      setResult(data);
    } catch (err) {
      setFormError(err.message);
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  const booking = result?.booking;
  const statusColor = result?.valid ? "var(--color-success)" : "var(--color-danger)";

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Entry Verification</h2>
      <p style={{ color: "var(--color-text-muted)", marginTop: 0 }}>
        Paste the scanned QR payload to validate the ticket and mark entry.
      </p>

      <form onSubmit={verifyEntry} style={{ display: "grid", gap: "0.8rem" }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Scanned QR Payload</label>
          <textarea
            rows={8}
            placeholder='{"type":"cinema-entry-pass","bookingId":"...","showId":"...","paymentReference":"..."}'
            value={qrPayload}
            onChange={(e) => setQrPayload(e.target.value)}
            required
          />
        </div>
        {formError ? <div className="form-alert form-alert-error">{formError}</div> : null}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button type="submit" className="btn" disabled={verifying}>
            {verifying ? "Verifying..." : "Verify and Check In"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQrPayload("");
              setResult(null);
              setFormError("");
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {result ? (
        <div
          style={{
            marginTop: "1rem",
            border: `1px solid ${result.valid ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)"}`,
            borderRadius: "10px",
            padding: "0.9rem",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <p style={{ marginTop: 0, marginBottom: "0.7rem", color: statusColor, fontWeight: 700 }}>
            {result.message}
          </p>
          {booking ? (
            <div style={{ display: "grid", gap: "0.35rem", color: "var(--color-text-muted)" }}>
              <p style={{ margin: 0 }}>
                <strong>Booking Ref:</strong> {String(booking.id || "").slice(-6).toUpperCase() || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Customer:</strong> {booking.customerName || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Mobile:</strong> {booking.mobileNumber || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Movie:</strong> {booking.movieTitle || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Hall:</strong> {booking.hallName || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Show Time:</strong> {booking.showTime ? new Date(booking.showTime).toLocaleString() : "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Seats:</strong> {(booking.seats || []).join(", ") || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Payment Ref:</strong> {booking.paymentReference || "N/A"}
              </p>
              {booking.checkedInAt ? (
                <p style={{ margin: 0 }}>
                  <strong>Checked In At:</strong> {new Date(booking.checkedInAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function AdminBookingsSection() {
  const { setError } = useCinema();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadAdminBookings() {
    setLoading(true);
    try {
      const data = await api("/admin/bookings");
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const target = [
      booking.customerName,
      booking.mobileNumber,
      booking.nicNumber,
      booking.showId?.movieId?.title,
      booking.showId?.hallName,
      (booking.seats || []).join(",")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return target.includes(searchQuery.trim().toLowerCase());
  });

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.8rem" }}>
        <h2 style={{ margin: 0 }}>Customer Bookings</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.45rem 0.65rem",
              minWidth: "360px",
              background: "rgba(15, 23, 42, 0.45)"
            }}
          >
            <Search size={16} color="var(--color-text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, mobile, NIC, movie, seat..."
              style={{ border: "none", background: "transparent", padding: 0 }}
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={loadAdminBookings} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {filteredBookings.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          {loading ? "Loading bookings..." : "No matching bookings found."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.8rem",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              <div style={{ display: "grid", gap: "0.35rem", color: "var(--color-text-muted)" }}>
                <p style={{ margin: 0 }}>
                  <strong>Movie:</strong> {booking.showId?.movieId?.title || "Unknown"}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Customer:</strong> {booking.customerName}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Mobile:</strong> {booking.mobileNumber || "N/A"}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>NIC:</strong> {booking.nicNumber || "N/A"}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Seats:</strong> {(booking.seats || []).join(", ")}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Show Time:</strong>{" "}
                  {booking.showId?.startTime ? new Date(booking.showId.startTime).toLocaleString() : "N/A"}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Total:</strong> ${booking.totalAmount}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
