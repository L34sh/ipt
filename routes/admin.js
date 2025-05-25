const express = require('express');
const router = express.Router();
const dashboardRoutes = require('./admin-dashboard');
const customersRoutes = require('./admin-customers');
const plansRoutes = require('./admin-plans');
const logsRoutes = require('./admin-logs');
const productsRoutes = require('./admin-products');
const salesRoutes = require('./admin-sales');
const profileRoutes = require('./admin-profile');
const clerksRoutes = require('./admin-clerks');
const { getConnection } = require('../config/db');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.admin_id) {
        return res.redirect('/login');
    }
    next();
};

// API routes
router.use('/dashboard', isLoggedIn, dashboardRoutes);
router.use('/customers', isLoggedIn, customersRoutes);
router.use('/plans', isLoggedIn, plansRoutes);
router.use('/logs', isLoggedIn, logsRoutes);
router.use('/products', isLoggedIn, productsRoutes);
router.use('/sales', isLoggedIn, salesRoutes);
router.use('/profile', isLoggedIn, profileRoutes);
router.use('/clerks', isLoggedIn, clerksRoutes);

// Admin dashboard routes
router.get('/:page?', isLoggedIn, async (req, res) => {
    const page = req.params.page || 'overview';
    const validPages = [
        'overview',
        'manage_customers',
        'manage_plans',
        'monitor_attendance',
        'manage_clerk_accounts',
        'products',
        'sales',
        'logs',
        'profile'
    ];

    if (!validPages.includes(page)) {
        return res.redirect('/admin/overview');
    }

    // Fetch page-specific data
    let pageData = {};
    try {
        if (page === 'manage_plans') {
            const db = await getConnection();
            const [plans] = await db.query('SELECT * FROM membership_plan ORDER BY plan_price ASC');
            pageData = {
                plans: plans || [],
                activePlansCount: plans ? plans.length : 0
            };
        }
        // Add more page-specific data fetching here as needed
    } catch (error) {
        console.error(`Error fetching data for ${page}:`, error);
        return res.status(500).render('error', { message: 'Error loading page data' });
    }

    res.render('admin/layout', {
        page,
        user: req.session.user,
        title: 'JBC Fitness Gym - Admin Dashboard',
        ...pageData // Spread the page-specific data
    });
});

module.exports = router;
