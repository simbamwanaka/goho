require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'dev-secret', 
    resave: false, 
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Simple dev CORS (same origin in dev) and request logger
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Setup upload directories
const imagesDir = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'images') 
    : path.join(__dirname, 'images');

// Ensure the images directory exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// In production, we'll need to recreate the directory on startup
if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode, using temporary directory:', imagesDir);
}

// Admin users (keep in memory for now)
const users = [{ id: 'admin', username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' }];

// Static files (serve the existing frontend)
app.use('/images', express.static(imagesDir));
app.use(express.static(path.join(__dirname)));

// Import routes
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const galleryRoutes = require('./routes/gallery');

// Apply multer middleware to route handlers
const productUpload = upload.single('image');
const galleryUpload = upload.single('image');

// Use routes
app.use('/admin', adminRoutes.router);
app.use('/api/products', productRoutes);
app.use('/api/gallery', galleryRoutes);

// Add multer middleware to specific routes
app.use('/api/products/upload', productUpload);
app.use('/api/gallery/upload', galleryUpload);

// Serve admin UI
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
