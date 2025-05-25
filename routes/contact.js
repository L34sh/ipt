const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Insert contact message into database
        await db.query(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );

        res.json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;