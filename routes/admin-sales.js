const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get sales summary
router.get('/summary', async (req, res) => {
    try {
        const [totalSales] = await db.query('SELECT SUM(amount) as total FROM sales WHERE MONTH(created_at) = MONTH(CURRENT_DATE())');
        const [productsSold] = await db.query('SELECT COUNT(*) as count FROM sales_items WHERE MONTH(created_at) = MONTH(CURRENT_DATE())');
        const [newMembers] = await db.query('SELECT COUNT(*) as count FROM customers WHERE MONTH(created_at) = MONTH(CURRENT_DATE())');
        const [activePlans] = await db.query('SELECT COUNT(*) as count FROM customer_plans WHERE status = "active"');

        res.json({
            totalSales: totalSales.total || 0,
            productsSold: productsSold.count || 0,
            newMembers: newMembers.count || 0,
            activePlans: activePlans.count || 0
        });
    } catch (err) {
        console.error('Error fetching sales summary:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales history
router.get('/history', async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id';
        let countQuery = 'SELECT COUNT(*) as total FROM sales';
        let params = [];

        if (startDate && endDate) {
            query += ' WHERE s.created_at BETWEEN ? AND ?';
            countQuery += ' WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [sales] = await db.query(query, params);
        const [{ total }] = await db.query(countQuery, startDate && endDate ? [startDate, endDate] : []);

        res.json({
            sales,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Error fetching sales history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction details
router.get('/transaction/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [[transaction]] = await db.query(
            `SELECT s.*, c.name, c.email, c.phone 
             FROM sales s 
             LEFT JOIN customers c ON s.customer_id = c.id 
             WHERE s.id = ?`,
            [id]
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const [items] = await db.query(
            `SELECT si.*, p.name 
             FROM sales_items si 
             LEFT JOIN products p ON si.product_id = p.id 
             WHERE si.sale_id = ?`,
            [id]
        );

        res.json({ ...transaction, items });
    } catch (err) {
        console.error('Error fetching transaction details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export routes
module.exports = router;
