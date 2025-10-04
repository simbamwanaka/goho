const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const admin = require('./admin');
const requireAdmin = admin.requireAdmin;
const uploadMiddleware = require('../middleware/upload');
const upload = uploadMiddleware.upload;
const imagesDir = uploadMiddleware.imagesDir;

// Get all gallery items
router.get('/', async (req, res) => {
    try {
        const items = await db.gallery.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Upload gallery image
router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
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

// Delete gallery item
router.delete('/:id', requireAdmin, async (req, res) => {
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

module.exports = router;
