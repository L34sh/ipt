const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/staff'); // Save files to the 'images/staff' directory
    },
    filename: function (req, file, cb) {
        const uniqueName = 'clerk-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Initialize multer upload with file filter
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Helper function to validate clerk data
function validateClerkData(data, isUpdate = false) {
    const errors = [];
    console.log('Validating data:', data);

    if (!data.firstname?.trim()) errors.push('First name is required');
    if (!data.lastname?.trim()) errors.push('Last name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.contact?.trim()) errors.push('Contact number is required');
    if (!isUpdate && !data.datehired) errors.push('Date hired is required');
    if (!data.status?.trim()) errors.push('Status is required');

    return errors;
}

// API endpoints for clerks management

// API endpoint to get all clerks
router.get('/', async (req, res) => {
    try {
        const connection = await getConnection();
        const [clerks] = await connection.execute('SELECT * FROM clerk');
        res.json(clerks);
    } catch (error) {
        console.error('Error fetching clerks:', error);
        if (error instanceof SyntaxError) {
            res.status(400).json({ error: 'Invalid JSON input' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get a single clerk
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [clerk] = await connection.execute('SELECT * FROM clerk WHERE clerk_id = ?', [id]);

        if (!clerk.length) {
            return res.status(404).json({ error: 'Clerk not found' });
        }

        res.json(clerk[0]);
    } catch (error) {
        console.error('Error fetching clerk:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new clerk - combines file upload and database insertion
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        console.log('Received file:', req.file);

        const { firstname, middlename, lastname, email, password, contact, status, datehired } = req.body;
        const photo = req.file ? req.file.filename : null;

        // Set current date as date hired
        const formattedDateHired = new Date().toISOString().split('T')[0];

        // Validate clerk data
        const errors = validateClerkData({
            ...req.body,
            datehired: formattedDateHired
        });

        if (errors.length > 0) {
            console.error('Validation errors:', errors);
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const connection = await getConnection();
        console.log('Database connected');

        try {
            // Start transaction using query() instead of execute()
            await connection.query('START TRANSACTION');

            // Insert into account table using execute() for prepared statement
            const [accountResult] = await connection.execute(
                'INSERT INTO account (email, password) VALUES (?, ?)',

                [email, password]
            );
            console.log('Account created:', accountResult);

            const accountId = accountResult.insertId;

            // Insert into clerk table using execute() for prepared statement
            const [clerkResult] = await connection.execute(
                'INSERT INTO clerk (photo, first_name, middle_name, last_name, email, password, contact_number, date_hired, status, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [photo, firstname, middlename || null, lastname, email, password, contact, formattedDateHired, status, accountId]
            );
            console.log('Clerk created:', clerkResult);

            // Commit transaction using query() instead of execute()
            await connection.query('COMMIT');

            res.status(201).json({
                message: 'Clerk created successfully',
                clerkId: clerkResult.insertId
            });
        } catch (error) {
            // Rollback transaction using query() instead of execute()
            await connection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error creating clerk:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Update a clerk
router.put('/:id', upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { firstname, middlename, lastname, email, password, contact, status } = req.body;
        
        // Handle photo update - use null instead of undefined if no new photo
        const photo = req.file ? req.file.filename : null;
        
        console.log('Received form data:', req.body);
        console.log('Received file:', req.file);
        
        // Validate clerk data without date validation
        const errors = validateClerkData({
            firstname,
            lastname,
            email,
            contact,
            status
        }, true);
        
        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const connection = await getConnection();

        try {
            // Start transaction using query()
            await connection.query('START TRANSACTION');

            // Build the SQL query and parameters dynamically based on what's provided
            let updateFields = [
                'first_name = ?',
                'middle_name = ?',
                'last_name = ?',
                'email = ?',
                'contact_number = ?',
                'status = ?'
            ];
            let params = [
                firstname,
                middlename || null,
                lastname,
                email,
                contact,
                status
            ];

            // Add photo update if provided
            if (req.file) {
                updateFields.push('photo = ?');
                params.push(photo);
            }

            // Add password update if provided
            if (password) {
                updateFields.push('password = ?');
                params.push(password);
            }

            // Add the clerk_id to params
            params.push(id);

            // Update clerk details using execute() for prepared statement
            const query = `UPDATE clerk SET ${updateFields.join(', ')} WHERE clerk_id = ?`;
            await connection.execute(query, params);

            // Commit transaction using query()
            await connection.query('COMMIT');

            res.json({ 
                message: 'Clerk updated successfully',
                details: ['Clerk information has been updated']
            });
        } catch (error) {
            // Rollback transaction using query()
            await connection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error updating clerk:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: Array.isArray(error.details) ? error.details : [error.message]
        });
    }
});

// Delete a clerk
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        try {
            // Start transaction using query()
            await connection.query('START TRANSACTION');

            // First delete from clerk table using execute() for prepared statement
            await connection.execute('DELETE FROM clerk WHERE clerk_id = ?', [id]);

            // Delete from account table using execute() for prepared statement
            await connection.execute('DELETE FROM account WHERE account_id = (SELECT account_id FROM clerk WHERE clerk_id = ?)', [id]);

            // Commit transaction using query()
            await connection.query('COMMIT');

            res.json({ message: 'Clerk deleted successfully' });
        } catch (error) {
            // Rollback transaction using query()
            await connection.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error deleting clerk:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
