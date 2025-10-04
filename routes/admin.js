const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to require admin authentication
function requireAdmin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Admin login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = [{ id: 'admin', username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' }];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username };
    res.json({ ok: true });
});

// Admin logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});

// Protected admin routes
router.get('/api/products', requireAdmin, async (req, res) => {
    try {
        const products = await db.products.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.get('/api/gallery', requireAdmin, async (req, res) => {
    try {
        const items = await db.gallery.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

module.exports = { router, requireAdmin };