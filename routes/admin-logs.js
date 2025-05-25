const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all logs by type
router.get('/:type', async (req, res) => {
    const { type } = req.params;
    const validTypes = ['access', 'inventory', 'membership', 'transaction'];
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid log type' });
    }
    
    try {
        const logs = await db.query(`SELECT * FROM ${type}_logs ORDER BY created_at DESC LIMIT 100`);
        res.json(logs);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export routes
module.exports = router;
