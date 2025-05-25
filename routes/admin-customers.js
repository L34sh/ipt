const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// Get customers by membership type
router.get('/', async (req, res) => {
    try {
        const { type, search } = req.query;
        const db = await getConnection();
        
        let query = `
            SELECT 
                c.id,
                c.name,
                c.email,
                c.phone,
                c.address,
                m.membership_type,
                m.start_date,
                m.expiry_date,
                m.status
            FROM customers c
            LEFT JOIN memberships m ON c.id = m.customer_id
            WHERE m.membership_type = ?
        `;

        const params = [type];

        if (search) {
            query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ` ORDER BY c.name ASC`;

        const customers = await db.query(query, params);

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new customer
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, membershipType } = req.body;
        const db = await getConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Insert customer
            const customerResult = await db.query(
                'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
                [name, email, phone, address]
            );

            const customerId = customerResult.insertId;

            // Calculate membership dates
            const startDate = new Date();
            let expiryDate = new Date();
            
            switch (membershipType) {
                case 'day-pass':
                    expiryDate.setDate(startDate.getDate() + 1);
                    break;
                case 'monthly':
                    expiryDate.setMonth(startDate.getMonth() + 1);
                    break;
                case 'annually':
                    expiryDate.setFullYear(startDate.getFullYear() + 1);
                    break;
            }

            // Insert membership
            await db.query(
                'INSERT INTO memberships (customer_id, membership_type, start_date, expiry_date, status) VALUES (?, ?, ?, ?, ?)',
                [customerId, membershipType, startDate, expiryDate, 'active']
            );

            await db.commit();

            res.status(201).json({
                message: 'Customer added successfully',
                customerId
            });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, membershipType } = req.body;
        const db = await getConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Update customer
            await db.query(
                'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
                [name, email, phone, address, id]
            );

            // Update membership type if changed
            await db.query(
                'UPDATE memberships SET membership_type = ? WHERE customer_id = ?',
                [membershipType, id]
            );

            await db.commit();

            res.json({ message: 'Customer updated successfully' });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Delete membership first (foreign key constraint)
            await db.query('DELETE FROM memberships WHERE customer_id = ?', [id]);

            // Delete customer
            await db.query('DELETE FROM customers WHERE id = ?', [id]);

            await db.commit();

            res.json({ message: 'Customer deleted successfully' });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
