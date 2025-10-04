const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const admin = require('./admin');
const requireAdmin = admin.requireAdmin;
const uploadMiddleware = require('../middleware/upload');
const upload = uploadMiddleware.upload;

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await db.products.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create product
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, category, price, unit, img } = req.body;
        const product = { id: uuidv4(), name, category, price: Number(price), unit, img };
        await db.products.add(product);
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Delete product
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.products.delete(id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Upload product image
router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
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

module.exports = router;
