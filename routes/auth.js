const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Get database connection
        const db = await getConnection();

        // First check in account table to determine role
        const [accounts] = await db.query('SELECT * FROM account WHERE email = ?', [email]);
        
        if (!accounts || !accounts.length) {
            return res.status(401).json({ 
                success: false, 
                message: 'No account found with this email address' 
            });
        }

        const account = accounts[0];
        
        // Check if password is hashed (temporary solution during transition)
        let isPasswordValid = false;
        if (account.password.startsWith('$2')) {
            // Password is hashed with bcrypt
            isPasswordValid = await bcrypt.compare(password, account.password);
        } else {
            // Plain text password (temporary for test accounts)
            isPasswordValid = password === account.password;
        }

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid password' 
            });
        }        // Get additional user details based on role
        let userDetails;
        let redirectUrl;
        
        switch(account.type) {
            case 'admin':
                userDetails = {
                    admin_id: account.account_id,
                    email: account.email,
                    role: account.type
                };
                redirectUrl = '/admin/overview';
                break;
            case 'clerk':
                const [clerkDetails] = await db.query('SELECT * FROM clerk WHERE email = ?', [email]);
                userDetails = {
                    ...clerkDetails[0],
                    role: account.type
                };
                redirectUrl = '/clerk/overview';
                break;
            case 'member':
                const [memberDetails] = await db.query('SELECT * FROM member WHERE email = ?', [email]);
                userDetails = {
                    ...memberDetails[0],
                    role: account.type
                };
                redirectUrl = '/member/overview';
                break;
            default:
                return res.status(401).json({
                    success: false,
                    message: 'Invalid account type'
                });
        }

        if (!userDetails) {
            return res.status(401).json({
                success: false,
                message: 'User details not found'
            });
        }

        const token = jwt.sign(
            { id: account.account_id, role: account.type },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );        // Store user info in session
        req.session.user = userDetails;
        req.session.admin_id = account.type === 'admin' ? account.account_id : null;
        
        res.json({ 
            success: true, 
            token,
            redirectUrl,
            user: {
                ...userDetails,
                role: account.type
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while logging in. Please try again.' 
        });
    }
});

// Middleware to verify admin authentication
const verifyAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware to verify clerk authentication
const verifyClerk = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware to verify member authentication
const verifyMember = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'member') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Export the middleware functions
module.exports = {
    ...module.exports,
    verifyAdmin,
    verifyClerk,
    verifyMember
};

// Middleware to verify admin/clerk authentication
const verifyAdminClerk = (req, res, next) => {
    if (req.user && (req.user.type === 'admin' || req.user.type === 'clerk')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin/Clerk access required.' });
    }
};

// Get pending pre-registrations
router.get('/pending-registrations', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM pre_registration WHERE status = "pending"';
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve or reject pre-registration
router.post('/review-registration/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const approver_id = req.user.id;
    const approver_role = req.user.role;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await db.beginTransaction();
        
        // Update pre-registration status
        await db.query(
            'UPDATE pre_registration SET status = ?, approved_by = ? WHERE id = ?',
            [status, approver_id, id]
        );

        if (status === 'approved') {
            // Get pre-registration data
            const [preReg] = await db.query('SELECT * FROM pre_registration WHERE id = ?', [id]);
            
            if (!preReg.length) {
                await db.rollback();
                return res.status(404).json({ error: 'Pre-registration not found' });
            }

            // Insert into members table
            await db.query(
                'INSERT INTO members (email, first_name, last_name, gender, birthdate, contact_number, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    preReg[0].email,
                    preReg[0].first_name,
                    preReg[0].last_name,  
                    preReg[0].gender,
                    preReg[0].birthdate,
                    preReg[0].contact_number,
                    preReg[0].password
                ]
            );
        }

        await db.commit();
        res.json({ message: `Registration ${status}` });

    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration endpoint
router.post('/register', async (req, res) => {
    const db = await getConnection();
    
    try {        const { 
            email, 
            first_name, 
            middle_name,
            last_name, 
            password, 
            contact_number,
            membership_type
        } = req.body;

        // Input validation
        if (!email || !password || !first_name || !last_name || !contact_number || !membership_type) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Validate membership plan exists
        const [plan] = await db.query('SELECT plan_id FROM membership_plan WHERE plan_id = ?', [membership_type]);
        if (!plan.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid membership plan selected'
            });
        }

        // Email format validation
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Start transaction
        await db.beginTransaction();

        try {
            // Check if email already exists
            const [existingUsers] = await db.query(
                'SELECT * FROM account WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                await db.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into account table
            const [accountResult] = await db.query(
                'INSERT INTO account (email, password, type) VALUES (?, ?, "member")',
                [email, hashedPassword]
            );

            // Insert into member table with default membership type if not provided
            await db.query(
                `INSERT INTO member (
                    account_id, first_name, middle_name, last_name,
                    email, password, contact_number, membership_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    accountResult.insertId,
                    first_name,
                    middle_name || null,
                    last_name,
                    email,
                    hashedPassword,
                    contact_number,
                    membership_type || 'regular'
                ]
            );

            await db.commit();

            res.status(201).json({
                success: true,
                message: 'Registration successful! You can now log in.',
                redirectUrl: '/login'
            });
        } catch (error) {
            await db.rollback();
            console.error('Database transaction error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.code === 'ER_DUP_ENTRY' 
                ? 'This email address is already registered' 
                : 'An error occurred during registration. Please try again.'
        });
    }
});

// Pre-register a new member
router.post('/pre-register', async (req, res) => {
    try {
        const { email, firstName, lastName, gender, birthdate, contactNumber, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO pre_registration 
            (email, first_name, last_name, gender, birthdate, contact_number, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        await db.query(query, [email, firstName, lastName, gender, birthdate, contactNumber, hashedPassword]);
        res.json({ message: 'Pre-registration successful. Waiting for admin/clerk approval.' });
    } catch (error) {
        res.status(500).json({ error: 'Error during pre-registration' });
    }
});

// Get pending pre-registrations (admin/clerk only)
router.get('/pre-registrations', authenticateToken, verifyAdminClerk, async (req, res) => {
    try {
        const query = 'SELECT id, email, first_name, last_name, gender, birthdate, contact_number, status, created_at FROM pre_registration WHERE status = "pending"';
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching pre-registrations' });
    }
});

// Approve or reject pre-registration (admin/clerk only)
router.post('/pre-registration/:id/approve', authenticateToken, verifyAdminClerk, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'clerk') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    try {
        if (action === 'approve') {
            // Get pre-registration data
            const [preReg] = await db.query('SELECT * FROM pre_registration WHERE id = ?', [id]);
            if (!preReg.length) {
                return res.status(404).json({ message: 'Pre-registration not found' });
            }

            const member = preReg[0];

            // Insert into members table
            const insertQuery = `INSERT INTO members 
                (email, first_name, last_name, gender, birthdate, contact_number, password)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            await db.query(insertQuery, [
                member.email,
                member.first_name, 
                member.last_name,
                member.gender,
                member.birthdate,
                member.contact_number,
                member.password
            ]);

            // Update pre-registration status
            await db.query(
                'UPDATE pre_registration SET status = "approved", approved_by = ? WHERE id = ?',
                [req.user.id, id]
            );

        } else if (action === 'reject') {
            // Update status to rejected
            await db.query(
                'UPDATE pre_registration SET status = "rejected", approved_by = ? WHERE id = ?',
                [req.user.id, id]
            );
        }

        res.json({ message: `Pre-registration ${action}ed successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Error ${action}ing pre-registration` });
    }
});

// Approve or reject pre-registration (admin/clerk only)
router.post('/pre-registration/:id/review', authenticateToken, verifyAdminClerk, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const reviewerId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    try {
        await db.beginTransaction();

        const [preReg] = await db.query(
            'SELECT * FROM pre_registration WHERE id = ? AND status = "pending"',
            [id]
        );

        if (!preReg.length) {
            await db.rollback();
            return res.status(404).json({ success: false, message: 'Pre-registration not found or already processed' });
        }

        const registration = preReg[0];

        if (action === 'approve') {
            // Create account entry
            const [accountResult] = await db.query(
                'INSERT INTO account (email, password, type) VALUES (?, ?, "member")',
                [registration.email, registration.password]
            );

            // Create member entry
            await db.query(
                `INSERT INTO member (
                    account_id, first_name, last_name, gender,
                    email, password, contact_number, date_registered
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    accountResult.insertId,
                    registration.first_name,
                    registration.last_name,
                    registration.gender,
                    registration.email,
                    registration.password,
                    registration.contact_number
                ]
            );
        }

        // Update pre-registration status
        await db.query(
            'UPDATE pre_registration SET status = ?, approved_by = ? WHERE id = ?',
            [action === 'approve' ? 'approved' : 'rejected', reviewerId, id]
        );

        await db.commit();

        // Create notification for member
        if (action === 'approve') {
            await db.query(
                `INSERT INTO notification (
                    user_id, user_type, title, message, type
                ) VALUES (?, 'member', ?, ?, 'success')`,
                [
                    accountResult.insertId,
                    'Registration Approved',
                    'Your gym membership registration has been approved. Welcome to JBC Fitness Gym!'
                ]
            );
        }

        res.json({
            success: true,
            message: `Pre-registration ${action}ed successfully`
        });

    } catch (error) {
        await db.rollback();
        console.error('Error processing pre-registration:', error);
        res.status(500).json({ success: false, message: 'Error processing pre-registration' });
    }
});

// Get all pre-registrations
router.get('/pre-registrations', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM pre_registrations ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific pre-registration details
router.get('/pre-registration/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM pre_registrations WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pre-registration not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Review (approve/reject) pre-registration
router.post('/pre-registration/:id/review', authenticateToken, async (req, res) => {
    const { action } = req.body;
    const { id } = req.params;
    
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
        // Start transaction
        await db.beginTransaction();

        // Get pre-registration details
        const [preReg] = await db.query(
            'SELECT * FROM pre_registrations WHERE id = ?',
            [id]
        );

        if (preReg.length === 0) {
            await db.rollback();
            return res.status(404).json({ error: 'Pre-registration not found' });
        }

        if (action === 'approve') {
            // Generate member ID (format: JBC-YYYY-XXXX)
            const year = new Date().getFullYear();
            const [lastMember] = await db.query(
                'SELECT member_id FROM members WHERE member_id LIKE ? ORDER BY member_id DESC LIMIT 1',
                [`JBC-${year}-%`]
            );
            
            let sequence = 1;
            if (lastMember.length > 0) {
                sequence = parseInt(lastMember[0].member_id.split('-')[2]) + 1;
            }
            
            const memberId = `JBC-${year}-${String(sequence).padStart(4, '0')}`;

            // Insert into members table
            await db.query(
                `INSERT INTO members (member_id, first_name, last_name, email, password, contact_number, 
                gender, birthdate, membership_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    memberId,
                    preReg[0].first_name,
                    preReg[0].last_name,
                    preReg[0].email,
                    await bcrypt.hash(preReg[0].password, 10),
                    preReg[0].contact_number,
                    preReg[0].gender,
                    preReg[0].birthdate,
                    preReg[0].membership_type
                ]
            );
        }

        // Delete from pre_registrations
        await db.query('DELETE FROM pre_registrations WHERE id = ?', [id]);

        // Commit transaction
        await db.commit();
        
        res.json({ message: `Registration ${action}ed successfully` });
    } catch (error) {
        await db.rollback();
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all registered members
router.get('/members', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, member_id, first_name, last_name, email, created_at FROM members ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;