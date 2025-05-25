const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gymdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

let isConnected = false;

const getConnection = async () => {
    if (!isConnected) {
        try {
            const connection = await pool.getConnection();
            console.log('Database connection established successfully');
            connection.release();
            isConnected = true;
        } catch (err) {
            console.error('Error connecting to the database:', err.message);
            throw new Error('Unable to connect to the database. Please ensure MySQL is running.');
        }
    }
    return pool;
};

module.exports = { pool, getConnection };