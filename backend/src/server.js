const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cinema";
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cinema.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    genre: { type: String, default: "General" },
    language: { type: String, default: "English" },
    rating: { type: String, default: "PG-13" },
    releaseDate: { type: Date },
    synopsis: { type: String, default: "" },
    trailerUrl: { type: String, default: "" },
    trailerVideoUrl: { type: String, default: "" },
    photos: { type: [String], default: [] }
  },
  { timestamps: true }
);

const showSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    hallName: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    ticketPrice: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1, default: 60 },
    bookedSeats: { type: [Number], default: [] }
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    showId: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    nicNumber: { type: String, required: true, trim: true },
    promoCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0, min: 0 },
    seats: { type: [Number], required: true },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
const Show = mongoose.model("Show", showSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const User = mongoose.model("User", userSchema);
const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
const passwordResetOtpStore = new Map();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, safeName);
    }
  }),
  limits: {
    fileSize: 80 * 1024 * 1024
  }
});

function parsePhotos(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function buildMoviePayload(input) {
  const payload = {
    title: input.title,
    durationMinutes: input.durationMinutes,
    genre: input.genre,
    language: input.language,
    rating: input.rating,
    releaseDate: input.releaseDate || undefined,
    synopsis: input.synopsis || "",
    trailerUrl: input.trailerUrl || "",
    trailerVideoUrl: input.trailerVideoUrl || "",
    photos: parsePhotos(input.photos)
  };

  if (payload.durationMinutes !== undefined) {
    payload.durationMinutes = Number(payload.durationMinutes);
  }
  return payload;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    mobileNumber: user.mobileNumber || "",
    role: "user"
  };
}

function buildToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

function isValidMobileNumber(value) {
  return /^[0-9]{10,15}$/.test(String(value || "").trim());
}

async function getPromoDiscount({ code, baseAmount }) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return { promo: null, discountAmount: 0, normalizedCode: "" };

  const promo = await PromoCode.findOne({ code: normalizedCode });
  if (!promo) {
    throw new Error("Promo code not found");
  }
  if (!promo.active) {
    throw new Error("Promo code is inactive");
  }
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    throw new Error("Promo code has expired");
  }
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    throw new Error("Promo code usage limit reached");
  }

  let discountAmount = 0;
  if (promo.type === "percentage") {
    discountAmount = (baseAmount * promo.value) / 100;
  } else {
    discountAmount = promo.value;
  }
  discountAmount = Math.max(0, Math.min(baseAmount, Number(discountAmount.toFixed(2))));

  return { promo, discountAmount, normalizedCode };
}

app.get("/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({ ok: true, db: dbState });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
  if (isAdmin) {
    const token = buildToken({ email: normalizedEmail, role: "admin" });
    return res.json({ token, user: { email: normalizedEmail, role: "admin", fullName: "Administrator" } });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const safeUser = sanitizeUser(user);
  const token = buildToken({ userId: safeUser.id, email: safeUser.email, role: "user" });
  return res.json({ token, user: safeUser });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, mobileNumber } = req.body;
    if (!fullName || !email || !password || !mobileNumber) {
      return res.status(400).json({ error: "fullName, email, password, and mobileNumber are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!isValidMobileNumber(mobileNumber)) {
      return res.status(400).json({ error: "Invalid mobile number format" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedMobileNumber = String(mobileNumber).trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const existingMobile = await User.findOne({ mobileNumber: normalizedMobileNumber });
    if (existingMobile) {
      return res.status(409).json({ error: "Mobile number already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      passwordHash
    });
    const safeUser = sanitizeUser(user);
    const token = buildToken({ userId: safeUser.id, email: safeUser.email, role: "user" });
    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/auth/forgot-password/request-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ error: "mobileNumber is required" });
  }
  if (!isValidMobileNumber(mobileNumber)) {
    return res.status(400).json({ error: "Invalid mobile number format" });
  }

  const normalizedMobileNumber = String(mobileNumber).trim();
  const user = await User.findOne({ mobileNumber: normalizedMobileNumber });
  if (!user) {
    return res.status(404).json({ error: "No account found for this mobile number" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  passwordResetOtpStore.set(normalizedMobileNumber, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  return res.json({
    ok: true,
    message: "Temporary OTP generated",
    tempOtp: otp
  });
});

app.post("/auth/forgot-password/reset", async (req, res) => {
  const { mobileNumber, otp, newPassword } = req.body;
  if (!mobileNumber || !otp || !newPassword) {
    return res.status(400).json({ error: "mobileNumber, otp, and newPassword are required" });
  }
  if (!isValidMobileNumber(mobileNumber)) {
    return res.status(400).json({ error: "Invalid mobile number format" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const normalizedMobileNumber = String(mobileNumber).trim();
  const otpRecord = passwordResetOtpStore.get(normalizedMobileNumber);
  if (!otpRecord || otpRecord.expiresAt < Date.now()) {
    passwordResetOtpStore.delete(normalizedMobileNumber);
    return res.status(400).json({ error: "OTP expired or not found" });
  }
  if (String(otp).trim() !== otpRecord.otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  const user = await User.findOne({ mobileNumber: normalizedMobileNumber });
  if (!user) {
    return res.status(404).json({ error: "No account found for this mobile number" });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  passwordResetOtpStore.delete(normalizedMobileNumber);

  return res.json({ ok: true, message: "Password reset successful" });
});

app.get("/auth/me", requireAuth, async (req, res) => {
  if (req.user.role === "admin") {
    return res.json({ user: { email: req.user.email, role: "admin", fullName: "Administrator" } });
  }
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  return res.json({ user: sanitizeUser(user) });
});

app.post("/movies", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.create(buildMoviePayload(req.body));
    res.status(201).json(movie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/movies/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const payload = buildMoviePayload(req.body);
    const updated = await Movie.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/uploads/photos", requireAuth, requireAdmin, upload.array("photos", 12), async (req, res) => {
  const files = req.files || [];
  const urls = files.map((file) => `/uploads/${file.filename}`);
  return res.json({ urls });
});

app.post("/uploads/video", requireAuth, requireAdmin, upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Video file is required" });
  return res.json({ url: `/uploads/${req.file.filename}` });
});

app.get("/movies", async (_req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

app.delete("/movies/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const shows = await Show.find({ movieId: movie._id }, { _id: 1 });
    const showIds = shows.map((show) => show._id);

    if (showIds.length > 0) {
      await Booking.deleteMany({ showId: { $in: showIds } });
      await Show.deleteMany({ _id: { $in: showIds } });
    }

    await Movie.deleteOne({ _id: movie._id });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/shows", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movieExists = await Movie.exists({ _id: req.body.movieId });
    if (!movieExists) {
      return res.status(404).json({ error: "Movie not found" });
    }
    const show = await Show.create(req.body);
    return res.status(201).json(show);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/shows", async (_req, res) => {
  const shows = await Show.find()
    .populate("movieId")
    .sort({ startTime: 1 });
  res.json(shows);
});

app.post("/admin/promo-codes", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code, type, value, active, expiresAt, usageLimit } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: "code, type, and value are required" });
    }

    const promo = await PromoCode.create({
      code: String(code).trim().toUpperCase(),
      type,
      value: Number(value),
      active: active !== false,
      expiresAt: expiresAt || null,
      usageLimit: usageLimit ? Number(usageLimit) : null
    });
    return res.status(201).json(promo);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/admin/promo-codes", requireAuth, requireAdmin, async (_req, res) => {
  const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
  return res.json(promoCodes);
});

app.post("/promo-codes/validate", requireAuth, async (req, res) => {
  try {
    const { code, showId, seatCount } = req.body;
    if (!code || !showId || !seatCount) {
      return res.status(400).json({ error: "code, showId, and seatCount are required" });
    }
    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ error: "Show not found" });

    const seats = Number(seatCount);
    if (!Number.isInteger(seats) || seats < 1) {
      return res.status(400).json({ error: "seatCount must be a positive integer" });
    }

    const baseAmount = seats * show.ticketPrice;
    const { promo, discountAmount, normalizedCode } = await getPromoDiscount({ code, baseAmount });
    return res.json({
      valid: true,
      code: normalizedCode,
      type: promo.type,
      value: promo.value,
      baseAmount,
      discountAmount,
      finalAmount: Number((baseAmount - discountAmount).toFixed(2))
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/bookings", requireAuth, async (req, res) => {
  try {
    if (!req.user.userId) {
      return res.status(403).json({ error: "Only customer accounts can create bookings" });
    }
    const { showId, customerName, mobileNumber, nicNumber, seats, promoCode } = req.body;

    if (!showId || !customerName || !mobileNumber || !nicNumber || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ error: "showId, customerName, mobileNumber, nicNumber, and seats are required" });
    }

    const normalizedMobile = String(mobileNumber).trim();
    const normalizedNic = String(nicNumber).trim().toUpperCase();
    if (!/^[0-9+\-\s]{7,20}$/.test(normalizedMobile)) {
      return res.status(400).json({ error: "Invalid mobile number format" });
    }
    if (normalizedNic.length < 6 || normalizedNic.length > 20) {
      return res.status(400).json({ error: "NIC must be between 6 and 20 characters" });
    }

    const seatSet = new Set(seats);
    if (seatSet.size !== seats.length) {
      return res.status(400).json({ error: "Duplicate seat numbers are not allowed" });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ error: "Show not found" });
    }

    const invalidSeats = seats.filter((seat) => !Number.isInteger(seat) || seat < 1 || seat > show.totalSeats);
    if (invalidSeats.length > 0) {
      return res
        .status(400)
        .json({ error: `Seat numbers must be integers between 1 and ${show.totalSeats}` });
    }

    const baseAmount = seats.length * show.ticketPrice;
    let discountAmount = 0;
    let normalizedPromo = "";
    let promoId = null;
    if (promoCode) {
      const result = await getPromoDiscount({ code: promoCode, baseAmount });
      discountAmount = result.discountAmount;
      normalizedPromo = result.normalizedCode;
      promoId = result.promo._id;
    }

    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: showId,
        bookedSeats: { $not: { $elemMatch: { $in: seats } } }
      },
      {
        $addToSet: { bookedSeats: { $each: seats } }
      },
      { new: true }
    );

    if (!updatedShow) {
      return res.status(409).json({ error: "One or more seats are already booked" });
    }
    if (promoId) await PromoCode.updateOne({ _id: promoId }, { $inc: { usedCount: 1 } });

    const booking = await Booking.create({
      userId: req.user.userId,
      showId,
      customerName,
      mobileNumber: normalizedMobile,
      nicNumber: normalizedNic,
      promoCode: normalizedPromo,
      discountAmount,
      seats,
      totalAmount: Number((baseAmount - discountAmount).toFixed(2))
    });

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/bookings", requireAuth, async (req, res) => {
  const query = req.user.role === "admin" ? {} : { userId: req.user.userId };
  const bookings = await Booking.find(query)
    .populate({
      path: "showId",
      populate: { path: "movieId" }
    })
    .sort({ createdAt: -1 });
  res.json(bookings);
});

app.get("/admin/bookings", requireAuth, requireAdmin, async (_req, res) => {
  const bookings = await Booking.find()
    .populate({
      path: "showId",
      populate: { path: "movieId" }
    })
    .populate({ path: "userId", select: "fullName email" })
    .sort({ createdAt: -1 });
  return res.json(bookings);
});

app.delete("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (req.user.role !== "admin" && String(booking.userId) !== String(req.user.userId)) {
      return res.status(403).json({ error: "You can only delete your own bookings" });
    }

    await Show.updateOne({ _id: booking.showId }, { $pull: { bookedSeats: { $in: booking.seats } } });
    await Booking.deleteOne({ _id: booking._id });

    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

start();
