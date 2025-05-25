const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// API endpoints for plans management

// API endpoint to get all plans
router.get('/', async (req, res) => {
    try {
        const db = await getConnection();
        const [plans] = await db.query('SELECT * FROM membership_plan');
        
        // Parse perks for each plan
        plans.forEach(plan => {
            try {
                plan.plan_perks = JSON.parse(plan.plan_perks || '[]');
            } catch (parseError) {
                console.error('Error parsing perks for plan:', plan.plan_id, parseError);
                plan.plan_perks = [];
            }
        });
        
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single plan
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getConnection();
        const [plan] = await db.query('SELECT * FROM membership_plan WHERE plan_id = ?', [id]);

        if (!plan.length) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Ensure plan_perks is always an array of strings
        let perks = [];
        if (plan[0].plan_perks) {
            try {
                perks = JSON.parse(plan[0].plan_perks);
                if (!Array.isArray(perks)) {
                    perks = [];
                }
            } catch (parseError) {
                console.error('Error parsing perks for plan:', id, parseError);
            }
        }
        plan[0].plan_perks = perks;
        
        res.json(plan[0]);
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new plan
router.post('/', async (req, res) => {
    try {
        const { planName, planDescription, planDuration, planPrice, planPerks } = req.body;
        const db = await getConnection();

        const [result] = await db.query(
            'INSERT INTO membership_plan (plan_name, plan_description, plan_duration, plan_price, plan_perks) VALUES (?, ?, ?, ?, ?)',
            [planName, planDescription, planDuration, planPrice, planPerks]
        );

        res.status(201).json({
            message: 'Plan created successfully',
            planId: result.insertId
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a plan
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { planName, planDescription, planDuration, planPrice, planPerks } = req.body;
        const db = await getConnection();

        // Validate and ensure planPerks is a proper JSON string of array
        let perksString = '[]';
        try {
            const perksArray = JSON.parse(planPerks);
            if (Array.isArray(perksArray)) {
                perksString = JSON.stringify(perksArray);
            }
        } catch (error) {
            console.error('Error parsing perks:', error);
        }

        await db.query(
            'UPDATE membership_plan SET plan_name = ?, plan_description = ?, plan_duration = ?, plan_price = ?, plan_perks = ? WHERE plan_id = ?',
            [planName, planDescription, planDuration, planPrice, perksString, id]
        );

        res.json({ message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a plan
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getConnection();

        await db.query('DELETE FROM membership_plan WHERE plan_id = ?', [id]);
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public endpoint to get active membership plans
router.get('/public', async (req, res) => {
    try {
        const db = await getConnection();
        const [plans] = await db.query('SELECT plan_id, plan_name, plan_description, plan_duration, plan_price FROM membership_plan');
        res.json(plans);
    } catch (error) {
        console.error('Error fetching public plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
