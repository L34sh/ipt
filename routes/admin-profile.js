const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

// Configure multer for profile image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images/staff'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Update profile
router.put('/', async (req, res) => {
    const { name, email, phone } = req.body;
    const admin_id = req.session.admin_id;

    try {
        await db.query(
            'UPDATE admin_accounts SET name = ?, email = ?, phone = ? WHERE admin_id = ?',
            [name, email, phone, admin_id]
        );

        req.session.user = {
            ...req.session.user,
            name,
            email,
            phone
        };

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const admin_id = req.session.admin_id;

    try {
        // Verify current password
        const [[admin]] = await db.query('SELECT password FROM admin_accounts WHERE admin_id = ?', [admin_id]);
        
        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE admin_accounts SET password = ? WHERE admin_id = ?', [hashedPassword, admin_id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update profile photo
router.put('/photo', upload.single('photo'), async (req, res) => {
    const admin_id = req.session.admin_id;
    const image = req.file ? `/images/staff/${req.file.filename}` : null;

    if (!image) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    try {
        await db.query('UPDATE admin_accounts SET image = ? WHERE admin_id = ?', [image, admin_id]);

        req.session.user = {
            ...req.session.user,
            image
        };

        res.json({ message: 'Profile photo updated successfully', image });
    } catch (err) {
        console.error('Error updating profile photo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export routes
module.exports = router;
