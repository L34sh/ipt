const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { getConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const logoutRoute = require('./routes/logout');

const app = express();

// Initialize database connection
const initializeDatabase = async () => {
    try {
        await getConnection();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error.message);
        process.exit(1);
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', contactRoutes);

// Admin routes - both API and views
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Logout route
app.use('/logout', logoutRoute);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Role-based routes with authentication
app.get('/member/overview', (req, res) => {
    if (req.session.user && req.session.user.role === 'member') {
        res.render('member/layout', { 
            page: 'overview',
            title: 'Member Dashboard',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/member/membership', (req, res) => {
    if (req.session.user && req.session.user.role === 'member') {
        res.render('member/layout', { 
            page: 'membership',
            title: 'Membership',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/member/track_attendance', (req, res) => {
    if (req.session.user && req.session.user.role === 'member') {
        res.render('member/layout', { 
            page: 'track_attendance',
            title: 'Track Attendance',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/member/profile', (req, res) => {
    if (req.session.user && req.session.user.role === 'member') {
        res.render('member/layout', { 
            page: 'profile',
            title: 'Profile',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/overview', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'overview',
            title: 'Clerk Dashboard',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/manage_customers', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'manage_customers',
            title: 'Manage Customers',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/monitor_attendance', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'monitor_attendance',
            title: 'Monitor Attendance',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/products', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'products',
            title: 'Products',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/sales', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'sales',
            title: 'Sales',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/clerk/profile', (req, res) => {
    if (req.session.user && req.session.user.role === 'clerk') {
        res.render('clerk/layout', { 
            page: 'profile',
            title: 'Profile',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/admin/overview', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin/overview/index', { 
            page: 'overview',
            title: 'Admin Dashboard',
            user: req.session.user 
        });
    } else {
        res.redirect('/login');
    }
});

const PORT = process.env.PORT || 3000;

// Initialize database before starting server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});