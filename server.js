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
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Admin users (keep in memory for now)
const users = [{ id: 'admin', username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' }];

// Static files (serve the existing frontend)
app.use('/images', express.static(imagesDir));
app.use(express.static(path.join(__dirname)));

// API: products
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.products.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, category, price, unit, img } = req.body;
        const product = { id: uuidv4(), name, category, price: Number(price), unit, img };
        await db.products.add(product);
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.products.delete(id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// API: gallery
app.get('/api/gallery', async (req, res) => {
    try {
        const items = await db.gallery.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

app.post('/api/gallery', async (req, res) => {
    try {
        const { src, caption } = req.body;
        const item = { id: uuidv4(), src, caption };
        await db.gallery.add(item);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create gallery item' });
    }
});

app.post('/api/gallery/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const src = `/images/${req.file.filename}`;
        const item = { id: uuidv4(), src, caption: req.body.caption || '' };
        await db.gallery.add(item);
        res.status(201).json(item);
    } catch (err) {
        console.error('Gallery upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload endpoint for product images
app.post('/api/products/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            console.warn('Product upload: no file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log('Product image uploaded:', req.file.filename);
        const src = `/images/${req.file.filename}`;
        res.json({ src });
    } catch (err) {
        console.error('Product upload error:', err);
        res.status(500).json({ error: 'Upload failed', detail: err.message });
    }
});

app.delete('/api/gallery/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // First, get the item details
        const items = await db.gallery.getAll();
        const item = items.find(g => g.id === id);
        
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        try {
            // Delete the image file if it exists
            if (item.src) {
                const imagePath = path.join(imagesDir, path.basename(item.src));
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        } catch (fileErr) {
            console.error('Error deleting image file:', fileErr);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        await db.gallery.delete(id);
        res.status(204).end();
    } catch (err) {
        console.error('Gallery deletion error:', err);
        res.status(500).json({ error: 'Failed to delete gallery item', details: err.message });
    }
});

// Admin auth
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username };
    res.json({ ok: true });
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

function requireAdmin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Admin APIs to manage products and gallery (protected)
app.get('/admin/api/products', requireAdmin, async (req, res) => {
    try {
        const products = await db.products.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/admin/api/gallery', requireAdmin, async (req, res) => {
    try {
        const items = await db.gallery.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Serve admin UI
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
