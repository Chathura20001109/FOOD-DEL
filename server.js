import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import https from 'https';

import userRouter from './routes/userRoute.js';
import promoRouter from './routes/promoRoute.js';
import paymentRouter from './routes/paymentRoute.js';

// ────────────────────────────────────────────────────────────
// 0. Load ENV
// ────────────────────────────────────────────────────────────
dotenv.config();

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
];
const missing = requiredEnvVars.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing ENV vars:', missing.join(', '));
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// 1. App + middleware
// ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(
  cors({
    origin: [
      'https://localhost:5173',
      'https://localhost:5174',
      'https://localhost:5175',
      'https://localhost:5176',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.url}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ────────────────────────────────────────────────────────────
// 2. Routes
// ────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.send('Welcome to the Food Delivery API!'));

app.get('/api/test', (_, res) =>
  res.json({
    message: 'Server is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
);

app.get('/api/health', (_, res) =>
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
);

// Sub‑routers
app.use('/api/user',   userRouter);
app.use('/api/promo',  promoRouter);
app.use('/api/payment', paymentRouter);

// ────────────────────────────────────────────────────────────
// 3. File upload (Multer)
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/images/';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, GIF allowed'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// ────────────────────────────────────────────────────────────
// 4. Food model + endpoints
// ────────────────────────────────────────────────────────────
const foodSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    category:    { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    image:       { type: String, required: true },
  },
  { timestamps: true }
);
const Food = mongoose.model('Food', foodSchema);

app.get('/api/food/list', async (_, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch food items' });
  }
});

app.post('/api/food', (req, res) => {
  upload(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Image required' });

    const { name, category, price, description } = req.body;
    if (!name || !category || !price || !description)
      return res.status(400).json({ error: 'All fields required' });

    try {
      const food = await Food.create({
        name,
        category,
        price: Number(price),
        description,
        image: req.file.filename,
      });
      res.status(201).json(food);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to add food item' });
    }
  });
});

app.delete('/api/food/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const imgPath = path.join(__dirname, 'public/images', food.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    await food.deleteOne();
    res.json({ message: 'Food deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error deleting food' });
  }
});

// ────────────────────────────────────────────────────────────
// 5. Error handlers
// ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ────────────────────────────────────────────────────────────
// 6. HTTPS server (optional in dev)
// ────────────────────────────────────────────────────────────
const server = https.createServer(
  {
    key:  fs.readFileSync(path.join(__dirname, 'ssl/cert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.crt')),
    ca:   fs.readFileSync(path.join(__dirname, 'ssl/ca.crt')),
  },
  app
);

// ────────────────────────────────────────────────────────────
// 7. MongoDB → then start server
// ────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () =>
      console.log(`🚀  HTTPS server at https://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use`);
  } else {
    console.error('Server error:', err);
  }
});
